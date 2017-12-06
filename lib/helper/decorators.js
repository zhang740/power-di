"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IocContext_1 = require("../IocContext");
const utils_1 = require("../utils");
class Decorators {
    constructor(ioc = IocContext_1.IocContext.DefaultInstance) {
        this.context = ioc;
        this.register = this.register.bind(this);
        this.registerSubClass = this.registerSubClass.bind(this);
        this.append = this.append.bind(this);
        this.inject = this.inject.bind(this);
        this.lazyInject = this.lazyInject.bind(this);
        this.lazyInjectSubClass = this.lazyInjectSubClass.bind(this);
    }
    /**
     * register class
     * @param target need a class
     * @param options RegisterOptions
     */
    register(key, options) {
        return (target) => {
            this.context.register(target, key, options);
        };
    }
    /**
     * register subClass, the abbreviation of register
     * @param target need a class
     * @param options RegisterOptions
     */
    registerSubClass(key, options) {
        return (target) => {
            this.context.register(target, key, Object.assign({}, options, { regInSuperClass: true }));
        };
    }
    /**
     * append class to subClass list by key
     * @param key class or string
     * @param options RegisterOptions
     */
    append(key, options) {
        return (target) => {
            this.context.append(key, target, options);
        };
    }
    /**
     * inject
     * type: class or string
     * @param {{ type: any }} { type }
     * @returns
     * @memberof Decorators
     */
    inject({ type } = {}) {
        return (target, key) => {
            let t = Reflect.getMetadata('design:type', target, key);
            console.log(`${key} type: ${t.name}`);
            const globalType = this.getGlobalType(type, target, key);
            target[key] = this.context.get(globalType);
            if (!target[key]) {
                utils_1.logger.warn('Notfound:' + globalType);
            }
        };
    }
    /**
     * lazy inject
     * type: class or string
     * always: always read from context. default: false
     * subClass: getSubClasses. default: false
     * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
     * @returns
     * @memberof Decorators
     */
    lazyInject({ type, always = false, subClass = false } = {}) {
        return (target, key) => {
            const globalType = this.getGlobalType(type, target, key);
            Object.defineProperty(target, key, {
                configurable: !always,
                get: () => {
                    const data = subClass ? this.context.getSubClasses(globalType) : this.context.get(globalType);
                    if (!data) {
                        utils_1.logger.warn('Notfound:' + globalType);
                    }
                    else if (!always) {
                        Object.defineProperty(target, key, {
                            value: data
                        });
                    }
                    return data;
                }
            });
        };
    }
    /**
     * lazy inject subClass, the abbreviation of lazy inject
     * type: class or string
     * always: always read from context. default: false
     * @param {{ type: any, always: boolean }} { type, always = false }
     * @returns
     * @memberof Decorators
     */
    lazyInjectSubClass({ type, always = false } = { type: undefined }) {
        return this.lazyInject({ type, always, subClass: true });
    }
    getGlobalType(type, target, key) {
        if (!type && Reflect && Reflect.getMetadata) {
            type = Reflect.getMetadata('design:type', target, key);
        }
        return utils_1.getGlobalType(type);
    }
}
exports.Decorators = Decorators;
function getDecorators(ioc = IocContext_1.IocContext.DefaultInstance) {
    return new Decorators(ioc);
}
exports.getDecorators = getDecorators;
//# sourceMappingURL=decorators.js.map