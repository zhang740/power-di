"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IocContext_1 = require("../IocContext");
const utils_1 = require("../utils");
const context = IocContext_1.IocContext.DefaultInstance;
/**
 * register class
 * @param target need a class
 */
function register(key, options) {
    return function (target) {
        context.register(target, key, options);
    };
}
exports.register = register;
/**
 * register class
 * @param target need a class
 */
function registerSubClass(key, options) {
    return function (target) {
        context.register(target, key, Object.assign({}, options, { regInSuperClass: true }));
    };
}
exports.registerSubClass = registerSubClass;
/**
 * inject
 * @param type class or string
 */
function inject(type) {
    const globalType = utils_1.getGlobalType(type);
    return function (target, key) {
        target[key] = context.get(globalType);
        if (!target[key]) {
            utils_1.logger.warn('Notfound:' + globalType);
        }
    };
}
exports.inject = inject;
/**
 * lazy inject
 * @param type class or string
 * @param always always read from context. default: false
 * @param subClass getSubClasses. default: false
 */
function lazyInject(type, always = false, subClass = false) {
    const globalType = utils_1.getGlobalType(type);
    return function (target, key) {
        Object.defineProperty(target, key, {
            configurable: !always,
            get: () => {
                const data = subClass ? context.getSubClasses(globalType) : context.get(globalType);
                if (!data) {
                    utils_1.logger.warn('Notfound:' + globalType);
                }
                else {
                    if (!always) {
                        Object.defineProperty(target, key, {
                            value: data
                        });
                    }
                }
                return data;
            }
        });
    };
}
exports.lazyInject = lazyInject;
//# sourceMappingURL=decorators.js.map