import { writeAbleCheck } from './action';
import { collectionHandlers } from './collections';
import { InternalConfig } from './config';
import { proxyToRaw, rawToProxy } from './coreData';
import { observable } from './observable';
import {
  hasRunningReaction,
  queueReactionsForOperation,
  registerRunningReactionForOperation,
} from './reaction';

const globalObj
  // eslint-disable-next-line
  = typeof window === 'object' ? window : Function('return this')();

// built-in object can not be wrapped by Proxies
// their methods expect the object instance as the 'this' instead of the Proxy wrapper
// complex objects are wrapped with a Proxy of instrumented methods
// which switch the proxy to the raw object and to add reactive wiring
const handlers = new Map<any, any>([
  [Map, collectionHandlers],
  [Set, collectionHandlers],
  [WeakMap, collectionHandlers],
  [WeakSet, collectionHandlers],
  [Object, false],
  [Array, false],
  [Int8Array, false],
  [Uint8Array, false],
  [Uint8ClampedArray, false],
  [Int16Array, false],
  [Uint16Array, false],
  [Int32Array, false],
  [Uint32Array, false],
  [Float32Array, false],
  [Float64Array, false],
]);

export function shouldInstrument({ constructor }) {
  const isBuiltIn
    = typeof constructor === 'function'
      && constructor.name in globalObj
      && globalObj[constructor.name] === constructor;
  return !isBuiltIn || handlers.has(constructor);
}

export function getHandlers(obj) {
  return handlers.get(obj.constructor);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
const wellKnownSymbols = new Set();

Object.getOwnPropertyNames(Symbol).forEach((key) => {
  try {
    const value = Symbol[key];
    if (typeof value === 'symbol') {
      wellKnownSymbols.add(value);
    }
  }
  catch (e) {
    console.error(e);
  }
});

// intercept get operations on observables to know which reaction uses their properties
function get(target, key, receiver) {
  const result = Reflect.get(target, key, receiver);
  // do not register (observable.prop -> reaction) pairs for well known symbols
  // these symbols are frequently retrieved in low level JavaScript under the hood
  if (typeof key === 'symbol' && wellKnownSymbols.has(key)) {
    return result;
  }
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, receiver, type: 'get' });
  // if we are inside a reaction and observable.prop is an object wrap it in an observable too
  // this is needed to intercept property access on that object too (dynamic observable tree)
  // 如果对象非可观察, 即使当前没有观察者也需要转换，否则深层对象可能有未预期赋值
  const observableResult = rawToProxy.get(result);
  const canObservable = typeof result === 'object' && result !== null;
  const needCheck = hasRunningReaction() || !observableResult;
  if (needCheck && canObservable) {
    if (observableResult) {
      return observableResult;
    }
    // do not violate the none-configurable none-writable prop get handler invariant
    // fall back to none reactive mode in this case, instead of letting the Proxy throw a TypeError
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (!descriptor || !(descriptor.writable === false && descriptor.configurable === false)) {
      return observable(result);
    }
  }
  // otherwise return the observable wrapper if it is already created and cached or the raw object
  return observableResult || result;
}

function has(target, key) {
  const result = Reflect.has(target, key);
  // register and save (observable.prop -> runningReaction)
  registerRunningReactionForOperation({ target, key, type: 'has' });
  return result;
}

function ownKeys(target) {
  registerRunningReactionForOperation({ target, type: 'iterate' });
  return Reflect.ownKeys(target);
}

// intercept set operations on observables to know when to trigger reactions
function set(target, key, value, receiver) {
  writeAbleCheck(target, key);
  // make sure to do not pollute the raw object with observables
  if (typeof value === 'object' && value !== null) {
    value = proxyToRaw.get(value) || value;
  }
  // save if the object had a descriptor for this key
  const hadKey = hasOwnProperty.call(target, key);
  // save if the value changed because of this set operation
  const oldValue = target[key];
  // execute the set operation before running any reaction
  const result = Reflect.set(target, key, value, receiver);

  // do not queue reactions if the target of the operation is not the raw receiver
  // (possible because of prototypal inheritance)
  if (target !== proxyToRaw.get(receiver)) {
    return result;
  }
  // queue a reaction if it's a new property or its value changed
  if (!hadKey) {
    queueReactionsForOperation({ target, key, value, receiver, type: 'add' });
  }
  else if (!InternalConfig.skipSameValueChange || value !== oldValue) {
    queueReactionsForOperation({
      target,
      key,
      value,
      oldValue,
      receiver,
      type: 'set',
    });
  }
  return result;
}

function deleteProperty(target, key) {
  writeAbleCheck(target, key);
  // save if the object had the key
  const hadKey = hasOwnProperty.call(target, key);
  const oldValue = target[key];
  // execute the delete operation before running any reaction
  const result = Reflect.deleteProperty(target, key);
  // only queue reactions for delete operations which resulted in an actual change
  if (hadKey) {
    queueReactionsForOperation({ target, key, oldValue, type: 'delete' });
  }
  return result;
}

export const baseHandlers = { get, has, ownKeys, set, deleteProperty };
