import { runInAction } from './core/action';
import { raw } from './core/coreData';
import { getDebugFlagData } from './core/debugFlag';
import { observe } from './core/observable';
import { debounce, deepWatch } from './core/util';

export * from './BaseViewModel';

export { deepWatch, observe };
export { runInAction } from './core/action';
export { InternalConfig, setMoConfig } from './core/config';

/**
 * 监听数据变化自动执行副作用
 *
 * @deprecated 不要使用该方法, 不应该监听数据变化，而是通过事件机制来串联业务逻辑
 */
export function autorun(
  this: any,
  ...args: Parameters<typeof observe>
): ReturnType<typeof observe> {
  return observe.apply(this, args);
}

/**
 * 监听数据变化自动执行副作用
 *
 * @deprecated 不要使用该方法, 不应该监听数据变化，而是通过事件机制来串联业务逻辑
 */
export function reaction<T>(
  fn: () => T,
  effect?: (r: T, actionName: string) => void,
  options?: { delay?: number; debugger?: (op: any) => void },
) {
  const effectFinal = effect && options?.delay ? debounce(effect, options.delay) : effect;
  return observe(fn, {
    scheduler: (r, actionName) => {
      const result = r();
      effectFinal?.(result, actionName);
    },
    debugger: options?.debugger,
  });
}

export function toJS(obj: any) {
  // obj 容错
  const rawData = raw(obj);
  // 不可序列化的条件：null、undefined、函数、Symbol
  if (
    rawData === null
    || rawData === undefined
    || typeof rawData === 'function'
    || typeof rawData === 'symbol'
  ) {
    return rawData;
  }
  return JSON.parse(JSON.stringify(rawData));
}

export { isObservable, raw } from './core/coreData';
export { setDebugFlagData } from './core/debugFlag';

/**
 * 在一个临时 action 中运行函数
 *
 * @deprecated 不要使用该方法, 请在 service 实现, 并使用 action 装饰器
 */
export const transaction = runInAction;

export { unobserve } from './core/observable';
export { action, actionAsync, computed, observable } from './decorator';

if (getDebugFlagData('mo')) {
  console.info('mo 在调试模式，会影响性能');
}
