import type { ComponentType, ForwardRefRenderFunction } from 'react';
import { Component, forwardRef, memo } from 'react';
import { observe, unobserve } from '../core/observable';
import { customDelayFunc } from './functionDebounceQueue';
import { useObserver } from './useObserver';
import { deepWatchChildrenProps, shallowCompare } from './util';

/**
 * React 组件类型（替代 mobx-react 的 IReactComponent，解除对 mobx-react 的依赖）
 */
export type IReactComponent<P = any>
  = | ComponentType<P>
    | ForwardRefRenderFunction<any, P>
    | ((props: P, context?: any) => any);

export function observer<T extends IReactComponent>(Comp: T, opts?: ConnectOptions): T {
  const displayName
    = opts?.name
      || (Comp as any).displayName
      || (Comp as any).name
      || (Comp as any).render?.displayName
      || (Comp as any).render?.name;
  (Comp as any).displayName = displayName;

  const isForward = isForwardRefComp(Comp);
  if (isForward) {
    Comp = (Comp as any).render;
  }
  if (isMemoComp(Comp)) {
    Comp = (Comp as any).type;
  }

  Comp = connect(Comp, { ...opts, noMemo: true }) as any;
  if (isForward) {
    Comp = forwardRef(Comp as any) as any;
  }

  if (opts?.noMemo !== true && opts?.memo !== false) {
    Comp = memo(Comp as any, typeof opts?.memo === 'function' ? opts?.memo : undefined) as any;
  }

  (Comp as any).displayName = `connect(${displayName})`;
  return Comp as T;
}

const hasSymbol = typeof Symbol === 'function' && Symbol.for;
const ReactForwardRefSymbol = hasSymbol
  ? Symbol.for('react.forward_ref')
  : typeof forwardRef === 'function' && (forwardRef((_props: any) => null) as any).$$typeof;
const ReactMemoSymbol = hasSymbol
  ? Symbol.for('react.memo')
  : typeof forwardRef === 'function' && (forwardRef((_props: any) => null) as any).$$typeof;

function isForwardRefComp(Comp: any): boolean {
  return ReactForwardRefSymbol && (Comp as any).$$typeof === ReactForwardRefSymbol;
}
function isMemoComp(Comp: any): boolean {
  return ReactMemoSymbol && (Comp as any).$$typeof === ReactMemoSymbol;
}

// 用于存储组件的响应式渲染函数和强制更新函数的私有属性
const reactiveRender = Symbol('power-di-reactive-render');
const reactiveForceUpdate = Symbol('power-di-reactive-forceUpdate');

export interface ConnectOptions {
  name?: string;
  /**
   * 更新延迟时间，可以是数字或函数
   * 如果为 false，则不启用延迟
   */
  delay?: number | Function | false;
  /**
   * 是否启用深度监视
   * 如果为 true，则会递归监视组件的子属性
   */
  deepMode?: boolean;
  /**
   * 不包裹 memo
   * @deprecated 请使用 memo
   */
  noMemo?: boolean;
  /**
   * memo 配置项
   * @default true
   *
   * 如果为 true，则使用 React.memo 包裹组件
   * 如果为 false，则不使用 React.memo 包裹组件
   * 如果为函数，则使用该函数作为自定义的比较函数
   */
  memo?: boolean | ((prevProps: any, nextProps: any) => boolean);
  /**
   * 是否启用调试模式
   * 如果为 true，则会在调试器中记录操作
   */
  debugger?: boolean;
}

/**
 * 连接 React 组件与可观察状态
 * @param UserComp 要连接的 React 组件
 * @param delay 更新延迟时间，可以是数字或函数
 */
export function connect(UserComp: any, opts?: ConnectOptions) {
  const isStateless = isStatelessComp(UserComp);
  const compName = opts?.name || UserComp.displayName || UserComp.name;

  // 处理函数组件 + Hooks
  if (isStateless) {
    const ReactiveComponent = function (...args: any[]) {
      return useObserver(UserComp, compName, opts, args) as any;
    };
    return opts?.noMemo ? ReactiveComponent : memo(ReactiveComponent);
  }

  // 处理类组件或包装函数组件为类组件
  if (isClassComponent(UserComp) || isStateless) {
    const BaseComp = isStateless ? Component : UserComp;

    class ReactiveComp extends BaseComp {
      constructor(props: any, context: any) {
        super(props, context);

        // 包装渲染函数
        const originalRender = wrapperRenderWithDeepWatch(
          isStateless ? () => UserComp(this.props, this.context) : this.render,
          opts?.deepMode,
        );

        // 创建响应式更新函数
        (this as any)[reactiveForceUpdate] = customDelayFunc(() => this.forceUpdate());

        // 创建响应式渲染函数
        (this as any)[reactiveRender] = observe(originalRender, {
          lazy: true,
          scheduler: (this as any)[reactiveForceUpdate],
        }).$reaction;

        // 替换渲染方法
        this.render = (this as any)[reactiveRender];

        // 保存原始的卸载方法
        const originalUnmount = this.componentWillUnmount
          ? this.componentWillUnmount.bind(this)
          : undefined;

        // 重写卸载方法，确保清理响应式连接
        this.componentWillUnmount = function (this: any) {
          if (originalUnmount)
            originalUnmount();
          if ((this as any)[reactiveForceUpdate].cancel)
            (this as any)[reactiveForceUpdate].cancel();
          unobserve((this as any)[reactiveRender]);
        };
      }

      // 优化性能，避免不必要的渲染
      shouldComponentUpdate(nextProps: any, nextState: any, nextContext: any) {
        if (super.shouldComponentUpdate) {
          return super.shouldComponentUpdate(nextProps, nextState, nextContext);
        }
        return shallowCompare(this as any, nextProps, nextState);
      }
    }

    // 保持原始组件的显示名称
    ReactiveComp.displayName = UserComp.displayName || UserComp.name;

    // 复制原始函数组件的静态属性
    if (isStateless) {
      for (const key of Object.keys(UserComp)) {
        ReactiveComp[key] = UserComp[key];
      }
    }

    return ReactiveComp;
  }
}

/**
 * 包装渲染函数，增加深度监视能力
 */
function wrapperRenderWithDeepWatch(originalRender: any, deepMode: boolean = false) {
  return function (this: any, ...args: any[]) {
    const html = originalRender.apply(this, args);
    if (deepMode) {
      deepWatchChildrenProps(html);
    }
    return html;
  };
}

/**
 * 检查组件是否为类组件
 */
export function isClassComponent(comp: any) {
  return comp.prototype && comp.prototype.isReactComponent;
}

/**
 * 检查组件是否为函数组件
 */
export function isStatelessComp(comp: any) {
  return !isClassComponent(comp);
}
