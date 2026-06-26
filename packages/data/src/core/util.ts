import { createLogger } from './logger';

export const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * 判断是否为 React 元素，但不依赖 `react` 包。
 *
 * React 元素带有 `$$typeof === Symbol.for('react.element' | 'react.transitional.element')`，
 * 这里直接检查该标记，使核心层保持零 react 依赖。
 * @internal
 */
const REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol.for;
const reactElementSymbols = REACT_ELEMENT_TYPE
  ? [Symbol.for('react.element'), Symbol.for('react.transitional.element')]
  : [];
function isReactElement(val: any): boolean {
  return (
    typeof val === 'object'
    && val !== null
    && reactElementSymbols.includes((val as any).$$typeof)
  );
}

export function is(
  x: number | { [x: string]: any } | null,
  y: number | { [x: string]: any } | null,
) {
  return x === y ? x !== 0 || y !== 0 || 1 / x === 1 / y : x !== x && y !== y;
}

export function shallowEqual(objA: { [x: string]: any } | null, objB: { [x: string]: any } | null) {
  if (is(objA, objB))
    return !0;
  if (typeof objA != 'object' || objA === null || typeof objB != 'object' || objB === null)
    return !1;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length)
    return !1;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]]))
      return !1;
  }
  return !0;
}

export function debounce(
  func: { apply: (arg0: any, arg1: any[]) => void },
  wait: number | undefined,
) {
  let timeout: string | number | NodeJS.Timeout | null | undefined;
  return function (this: any, ...args: any) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    clearTimeout(timeout as any);
    timeout = setTimeout(later, wait);
  };
}

export function deepWatch(
  val: any,
  visitedCollections: Set<any> = new Set(),
  skip?: (v: any) => boolean,
): any {
  if (!(skip && skip(val))) {
    let i: number, keys: string[];
    if (Array.isArray(val)) {
      if (visitedCollections.has(val))
        return val;
      visitedCollections.add(val);
      for (i = val.length - 1; i >= 0; i--) {
        deepWatch(val[i], visitedCollections, skip);
      }
    }
    else if (val !== null && typeof val === 'object') {
      if (visitedCollections.has(val) || isReactElement(val))
        return val;
      visitedCollections.add(val);
      keys = Object.keys(val);
      for (i = keys.length - 1; i >= 0; i--) {
        deepWatch(val[keys[i]], visitedCollections, skip);
      }
    }
    return val;
  }
}

export function isObjectLike(value: any) {
  return value != null && typeof value == 'object';
}

export function isPlainObject(value: any) {
  if (!isObjectLike(value) || Object.prototype.toString.call(value) != '[object Object]') {
    return false;
  }
  const proto = Object.getPrototypeOf(new Object(value));
  if (proto === null) {
    return true;
  }
  const Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor == 'function'
    && Ctor instanceof Ctor
    && Function.prototype.toString.call(Ctor) == Function.prototype.toString.call(Object)
  );
}

export function getMetadata<T>(target: any, key: symbol, defaultValue: () => T) {
  if (!target[key]) {
    Object.defineProperty(target, key, {
      value: defaultValue(),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  return Object.getOwnPropertyDescriptor(target, key)?.value as T;
}

export function deleteMetadata(target: any, key: symbol) {
  Object.defineProperty(target, key, {
    value: undefined,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

export const moLogger = createLogger('mo');
