import { runInAction } from './action';
import { ObservableInfo } from './const';
import { isObservable } from './coreData';
import { getValueInfo } from './getValueInfo';
import { observable } from './observable';

export interface IDecoratorFactory {
  (value?: number | string | null | undefined | boolean): any;
  (target: object, key: string | symbol, baseDescriptor?: PropertyDescriptor): any;
  <T extends object>(
    value: T,
    decorators?: {
      [K in keyof T]?: Function;
    },
    options?: any
  ): any;
}

/**
 * 装饰器工厂，用于创建 action 和其他装饰器
 */
export function decoratorFactory<RT = IDecoratorFactory>(
  functionWrapperFn: {
    (...args: any[]): any;
  },
  propertyInitWrapperFn?: {
    (...args: any[]): any;
  },
  opts: { supportCustomParam?: boolean; isObservableValue?: boolean } = {},
): RT {
  return (function (
    target: { [x: PropertyKey]: any; name: any; constructor: { name: any } },
    propertyKey?: PropertyKey | undefined,
    descriptor?: { value: any; initializer: Function } & PropertyDescriptor,
  ) {
    // #region 一个参数：且直接当 function 使用
    if (propertyKey === undefined) {
      if (opts.supportCustomParam && (!target || target.constructor !== Function)) {
        return decoratorFactory(
          (...args) => functionWrapperFn(...args, ...arguments),
          propertyInitWrapperFn
            ? (...args) => propertyInitWrapperFn(...args, ...arguments)
            : undefined,
        );
      }
      // 不自定义 name 的
      return functionWrapperFn(target);
    }
    // #endregion

    const names = [
      // className
      target.constructor && target.constructor.name,
      // propertyName
      propertyKey,
    ];

    // #region 三个参数：当 MethodDecorator 使用
    if (descriptor && typeof descriptor.value === 'function') {
      let fn = functionWrapperFn(descriptor.value, names, ...arguments);
      let definingProperty = false;

      return {
        configurable: true,
        get() {
          if (
            definingProperty
            || this === target.prototype
            || this.hasOwnProperty(propertyKey)
            || typeof fn !== 'function'
          ) {
            return fn;
          }

          const boundFn = fn.bind(this);
          definingProperty = true;
          Object.defineProperty(this, propertyKey, {
            configurable: true,
            get() {
              return boundFn;
            },
            set(value) {
              fn = functionWrapperFn(value, names, ...arguments);
              delete this[propertyKey];
            },
          });
          definingProperty = false;
          return boundFn;
        },
        set(value) {
          fn = value;
        },
      };
    }
    // #endregion

    // #region 两个参数, 并且从入参 target 即原型链上能获取到，说明是当 Getter Setter Decorator 使用
    const v = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (v) {
      // 一定是 decorator 打在 class getter setter 属性
      if ('get' in v && v.get !== undefined) {
        target[ObservableInfo] = Object.assign({}, target[ObservableInfo], {
          [propertyKey]: true,
        });
        v.get = functionWrapperFn(v.get, names, ...arguments);
      }
      if ('set' in v && v.set !== undefined) {
        target[ObservableInfo] = Object.assign({}, target[ObservableInfo], {
          [propertyKey]: true,
        });
        v.set = functionWrapperFn(v.set, names, ...arguments);
      }
      // getOwnPropertyDescriptor 拿到的东西直接修改无用，这里 return 新的交给 ts decorator 帮我们替换
      return v;
    }
    // #endregion

    // #region 两个参数, 并且从入参 target 即原型链上不能获取到，说明是当 PropertyDecorator 使用
    if (!propertyInitWrapperFn) {
      throw new Error('本 decorator 不支持类成员属性');
    }

    const useObservable = !!opts.isObservableValue && !isObservable(target);

    const initPropertyValue = (inst: any) => {
      const valueInfo = getValueInfo(inst);

      if (!valueInfo[propertyKey]) {
        valueInfo[propertyKey] = useObservable ? observable({}) : {};
      }

      const initialValue = descriptor
        ? descriptor.initializer
          ? descriptor.initializer.call(inst)
          : descriptor.value
        : undefined;

      const oriValue = initialValue
        ? typeof initialValue === 'function'
          ? functionWrapperFn?.(initialValue)
          : propertyInitWrapperFn?.(initialValue)
        : initialValue;

      if (useObservable) {
        runInAction(
          () => {
            valueInfo[propertyKey]!.value = oriValue;
          },
          `#INIT__${target.constructor.name}_${String(propertyKey)}`,
        );
      }
      else {
        valueInfo[propertyKey]!.value = oriValue;
      }
    };

    const newDescriptor = {
      set(value) {
        const valueInfo = getValueInfo(this);
        const needInit = !valueInfo[propertyKey];
        if (needInit) {
          initPropertyValue(this);
        }

        const newValue
          = typeof value === 'function'
            ? functionWrapperFn(value, names, ...arguments).bind(this)
            : propertyInitWrapperFn(value, names, ...arguments);

        if (useObservable && needInit) {
          runInAction(
            () => {
              valueInfo[propertyKey]!.value = newValue;
            },
            `#INIT__${target.constructor.name}_${String(propertyKey)}`,
          );
        }
        else {
          valueInfo[propertyKey]!.value = newValue;
        }
      },
      get() {
        const valueInfo = getValueInfo(this);
        if (!valueInfo[propertyKey]) {
          initPropertyValue(this);
        }

        return valueInfo[propertyKey]?.value;
      },
      enumerable: descriptor?.enumerable ?? true,
      configurable: false,
    } as PropertyDescriptor;
    return newDescriptor;
  }) as RT;
  // #endregion
}
