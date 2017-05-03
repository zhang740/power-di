"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _uid = 0;
const _globalTypes = {};
function isClass(target) {
    return target instanceof Function && target.toString().match(/\w+/g)[0] === 'class';
}
exports.isClass = isClass;
/**
 * getGlobalType
 * @param classOrString class or string.
 * @param prefix the prefix of type.
 */
function getGlobalType(classOrString, prefix = '') {
    if (!classOrString)
        throw new Error('no class or string.');
    if (typeof classOrString === 'string') {
        return classOrString;
    }
    if (classOrString.hasOwnProperty('__type')) {
        return classOrString['__type'];
    }
    let type;
    const info = classOrString.toString().match(/\w+/g);
    if (info[0] !== 'class') {
        throw new Error('data MUST be a class or string.');
    }
    type = prefix + info[1];
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
    return type;
}
exports.getGlobalType = getGlobalType;
function getSuperClassInfo(classType) {
    if (!isClass(classType)) {
        throw new Error('need a classType.');
    }
    const superClasses = [];
    let tmpInfo;
    let tmpType = Object.getPrototypeOf(classType);
    while (isClass(tmpType)) {
        const type = getGlobalType(tmpType);
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