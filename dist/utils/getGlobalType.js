"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _uid = 0;
const _globalTypes = {};
/**
 * getGlobalType
 * @param thisConstructor class or string
 * @param prefix the prefix of type
 */
exports.getGlobalType = function (thisConstructor, prefix = '') {
    if (!thisConstructor)
        return;
    if (typeof thisConstructor === 'string') {
        return thisConstructor;
    }
    let type;
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