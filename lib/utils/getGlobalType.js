"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _uid = 0;
var _globalTypes = {};
function isClass(target) {
    return target instanceof Function && (target.toString().match(/\w+/g)[0] === 'class' || target.toString().match(/\w+/g)[0] === 'function');
    // If browser, maybe no class
}
exports.isClass = isClass;
/**
 * getGlobalType
 * @param classOrString class or string.
 * @param prefix the prefix of type.
 */
function getGlobalType(classOrString) {
    var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    if (!classOrString) throw new Error('no class or string.');
    if (typeof classOrString === 'string') {
        return classOrString;
    }
    if (classOrString.hasOwnProperty('__type')) {
        return classOrString['__type'];
    }
    var type = void 0;
    var info = classOrString.toString().match(/\w+/g);
    if (info[0] !== 'class' && !(info[0] === 'function' && info.length > 1)) {
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
    var superClasses = [];
    var tmpInfo = void 0;
    var tmpType = Object.getPrototypeOf(classType);
    while (isClass(tmpType)) {
        var type = getGlobalType(tmpType);
        superClasses.push({
            type: type,
            class: tmpType
        });
        tmpType = Object.getPrototypeOf(tmpType);
    }
    return superClasses;
}
exports.getSuperClassInfo = getSuperClassInfo;
function isExtendOf(classType, superClassType) {
    if (!isClass(classType) || !isClass(superClassType)) {
        throw new Error('classType and superClassType MUST be a class.');
    }
    var type = getGlobalType(superClassType);
    return !!getSuperClassInfo(classType).find(function (cls) {
        return cls.type === type;
    });
}
exports.isExtendOf = isExtendOf;
//# sourceMappingURL=getGlobalType.js.map