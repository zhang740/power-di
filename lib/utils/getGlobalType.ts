let _uid = 0

const _globalTypes: { [key: string]: boolean } = {}

export function isClass(target: any) {
  return target instanceof Function
    && (target.toString().match(/\w+/g)[0] === 'class' || target.toString().match(/\w+/g)[0] === 'function')
  // If browser, maybe no class
}

/**
 * getGlobalType
 * @param classOrString class or string.
 * @param prefix the prefix of type.
 */
export function getGlobalType(classOrString: any, prefix: string = ''): string {
  if (!classOrString) throw new Error('no class or string.')
  if (typeof classOrString === 'string') {
    return classOrString
  }
  if (classOrString.hasOwnProperty('__type')) {
    return classOrString['__type']
  }
  let type: string
  const info = classOrString.toString().match(/\w+/g)
  if (info[0] !== 'class' && !(info[0] === 'function' && info.length > 1)) { // Only for compatible with es5 class
    throw new Error('data MUST be a class or string.')
  }
  type = prefix + info[1]
  if (_globalTypes[type]) {
    type = type + '_' + _uid++
  }
  _globalTypes[type] = true
  Object.defineProperty(classOrString, '__type', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: type
  })
  return type
}

export interface TypeInfo {
  type: string
  class: Function
}

export function getSuperClassInfo(classType: Function) {
  if (!isClass(classType)) {
    throw new Error('need a classType.')
  }
  const superClasses: TypeInfo[] = []
  let tmpType = Object.getPrototypeOf(classType)
  while (isClass(tmpType)) {
    const type = getGlobalType(tmpType)
    superClasses.push({
      type,
      class: tmpType
    })
    tmpType = Object.getPrototypeOf(tmpType)
  }
  return superClasses
}

export function isExtendOf(classType: Function, superClassType: Function) {
  if (!isClass(classType) || !isClass(superClassType)) {
    throw new Error('classType and superClassType MUST be a class.')
  }
  const type = getGlobalType(superClassType)
  return !!getSuperClassInfo(classType).find(cls => cls.type === type)
}
