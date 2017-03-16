"use strict";

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.defineProperty(exports, "__esModule", { value: true });
var IocContext_1 = require("../IocContext");
var utils_1 = require("../utils");
var context = IocContext_1.IocContext.DefaultInstance;
/**
 * register class
 * @param target need a class
 */
function registerDecorator(key, options) {
    return function (target) {
        context.register(target, key, options);
    };
}
exports.registerDecorator = registerDecorator;
/**
 * inject
 * @param type class or string
 */
function injectDecorator(type) {
    var globalType = utils_1.getGlobalType(type);
    return function (target, key) {
        target[key] = context.get(globalType);
        if (!target[key]) {
            utils_1.logger.warn('Notfound:' + globalType);
        }
    };
}
exports.injectDecorator = injectDecorator;
/**
 * lazy inject
 * @param type class or string
 * @param always always read from context default: false
 */
function lazyInjectDecorator(type) {
    var always = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var globalType = utils_1.getGlobalType(type);
    return function (target, key) {
        (0, _defineProperty2.default)(target, key, {
            configurable: !always,
            get: function get() {
                var data = context.get(globalType);
                if (!data) {
                    utils_1.logger.warn('Notfound:' + globalType);
                } else {
                    if (!always) {
                        (0, _defineProperty2.default)(target, key, {
                            value: data
                        });
                    }
                }
                return data;
            }
        });
    };
}
exports.lazyInjectDecorator = lazyInjectDecorator;
//# sourceMappingURL=decorators.js.map