let _uid = 0

const _globalTypes: { [key: string]: boolean } = {}

/**
 * getGlobalType
 * @param thisConstructor thisConstructor class or string.
 * @param prefix the prefix of type.
 */
export const getGlobalType = function (classOrString: any, prefix: string = ''): string {
    if (!classOrString) throw new Error('no class or string.')
    if (typeof classOrString === 'string') {
        return classOrString
    }
    let type: string
    if (classOrString.hasOwnProperty('__type')) {
        type = classOrString['__type']
    }
    if (!type) {
        type = prefix + classOrString.toString().match(/\w+/g)[1]
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
    }
    return type
}

export interface TypeInfo {
    type: string
    class: Function
}

export function getSuperClassInfo(classType: Function) {
    const superClasses: TypeInfo[] = []
    let tmpInfo
    let tmpType = Object.getPrototypeOf(classType)
    while (tmpType) {
        const type = getGlobalType(tmpType)
        if (type === 'undefined' || type.startsWith('undefined_')) break
        superClasses.push({
            type,
            class: tmpType
        })
        tmpType = Object.getPrototypeOf(tmpType)
    }
    return superClasses
}