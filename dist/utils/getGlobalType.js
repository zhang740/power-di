"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _uid = 0;
var _globalTypes = {};
/**
 * getGlobalType
 * @param thisConstructor class or string
 * @param prefix the prefix of type
 */
exports.getGlobalType = function (thisConstructor) {
    var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    if (!thisConstructor) return;
    if (typeof thisConstructor === 'string') {
        return thisConstructor;
    }
    var type = void 0;
    if (thisConstructor.hasOwnProperty('__type')) {
        type = thisConstructor['__type'];
    }
    if (!type) {
        type = prefix + thisConstructor.toString().match(/\w+/g)[1];
        if (_globalTypes[type]) {
            type = type + '_' + _uid++;
        }
        _globalTypes[type] = true;
        Object.defineProperty(thisConstructor, '__type', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: type
        });
    }
    return type;
};
exports.default = exports.getGlobalType;
//# sourceMappingURL=getGlobalType.js.map