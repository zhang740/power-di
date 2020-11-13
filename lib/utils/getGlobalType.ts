import { getSuperClassInfo } from './getSuperClassInfo';

let _uid = 0;

const _globalTypes: { [key: string]: boolean } = {};

export function isClass(target: any): target is Function {
  return target instanceof Function
    && (target.toString().match(/\w+/g)[0] === 'class' || target.toString().match(/\w+/g)[0] === 'function');
  // If browser, maybe no class
  // getPrototypeOf a class, is not Function, not instanceof Function, but typeof 'function'
}

/**
 * getGlobalType
 * @param key class, string or symbol.
 * @param prefix the prefix of type.
 */
export function getGlobalType(key: any, prefix: string = ''): string | symbol {
  if (!key) throw new Error('no key.');
  if (['string', 'symbol'].includes(typeof key)) {
    return key;
  }
  if (key.hasOwnProperty('__type')) {
    return key['__type'];
  }
  let type: string;
  const info = key.toString().match(/\w+/g);
  if (!['class', 'function'].includes(info[0])) { // Only for compatible with es5 class
    throw new Error('data MUST be a class or string.');
  }
  type = prefix + info[1];
  if (_globalTypes[type]) {
    type = type + '_' + _uid++;
  }
  _globalTypes[type] = true;
  Object.defineProperty(key, '__type', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: type
  });
  return type;
}

export function isExtendOf(classType: Function, superClassType: Function) {
  if (!isClass(classType) || !isClass(superClassType)) {
    throw new Error('classType and superClassType MUST be a class.');
  }
  const type = getGlobalType(superClassType);
  return !!getSuperClassInfo(classType).find(cls => cls.type === type);
}

export function symbolString(key: string | symbol) {
  return typeof key === 'symbol' ? key.toString() : key;
}
