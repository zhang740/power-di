"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _uid = 0;
const _globalTypes = {};
/**
 * getGlobalType
 * @param thisConstructor thisConstructor class or string.
 * @param prefix the prefix of type.
 */
exports.getGlobalType = function (classOrString, prefix = '') {
    if (!classOrString)
        throw new Error('no class or string.');
    if (typeof classOrString === 'string') {
        return classOrString;
    }
    let type;
    if (classOrString.hasOwnProperty('__type')) {
        type = classOrString['__type'];
    }
    if (!type) {
        type = prefix + classOrString.toString().match(/\w+/g)[1];
        if (_globalTypes[type]) {
            type = type + '_' + _uid++;
        }
        _globalTypes[type] = true;
        Object.defineProperty(classOrString, '__type', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: type
        });
    }
    return type;
};
function getSuperClassInfo(classType) {
    const superClasses = [];
    let tmpInfo;
    let tmpType = Object.getPrototypeOf(classType);
    while (tmpType) {
        const type = exports.getGlobalType(tmpType);
        if (type === 'undefined' || type.startsWith('undefined_'))
            break;
        superClasses.push({
            type,
            class: tmpType
        });
        tmpType = Object.getPrototypeOf(tmpType);
    }
    return superClasses;
}
exports.getSuperClassInfo = getSuperClassInfo;
//# sourceMappingURL=getGlobalType.js.map