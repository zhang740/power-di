"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
exports.DefaultRegisterOption = {
    singleton: true,
    autoNew: true,
    regInSuperClass: false,
};
class IocContext {
    constructor() {
        this.components = new Map();
    }
    static get DefaultInstance() {
        return this.defaultInstance ||
            (this.defaultInstance = new IocContext(), this.defaultInstance);
    }
    remove(keyOrType) {
        return this.components.delete(utils_1.getGlobalType(keyOrType));
    }
    get(keyOrType) {
        const data = this.components.get(utils_1.getGlobalType(keyOrType));
        if (!data)
            return;
        return this.returnValue(data);
    }
    getSubClasses(keyOrType) {
        const data = this.components.get(utils_1.getGlobalType(keyOrType));
        if (!data)
            return;
        return data.subClasses.map(sc => this.returnValue(sc));
    }
    replace(keyOrType, newData, options) {
        const key = utils_1.getGlobalType(keyOrType);
        const data = this.components.get(key);
        if (data) {
            data.inited = false;
            data.value = this.genValue(newData, options || data.options);
        }
        else {
            throw new Error(`the key:[${key}] is not register.`);
        }
    }
    append(keyOrType, subData, options = exports.DefaultRegisterOption) {
        if (!this.canBeKey(keyOrType)) {
            throw new Error('key require a string or a class.');
        }
        let store;
        if (utils_1.isClass(subData)) {
            this.register(subData, undefined, options);
            store = this.components.get(utils_1.getGlobalType(subData));
        }
        else {
            store = this.newStore(subData, options);
        }
        this.appendData(utils_1.getGlobalType(keyOrType), keyOrType, options, store);
    }
    register(data, key, options = exports.DefaultRegisterOption) {
        if (key) {
            if (!this.canBeKey(key)) {
                throw new Error('key require a string or a class.');
            }
        }
        else {
            if (!this.canBeKey(data)) {
                throw new Error('when data is not a class or string, require a key.');
            }
        }
        const dataType = (key && utils_1.getGlobalType(key)) || (data && utils_1.getGlobalType(data));
        if (this.components.has(dataType)) {
            throw new Error(`the key:[${dataType}] is already register.`);
        }
        options = Object.assign({}, exports.DefaultRegisterOption, options);
        const store = this.newStore(data, options);
        this.components.set(dataType, store);
        if (options.regInSuperClass) {
            if (!(data instanceof Function)) {
                throw new Error('if need regInSuperClass, data MUST be a class.');
            }
            const newOptions = Object.assign({}, options, { regInSuperClass: false });
            const superClasses = utils_1.getSuperClassInfo(data);
            superClasses.forEach(sc => this.appendData(sc.type, sc.class, newOptions, store));
        }
    }
    appendData(keyType, typeData, options, store) {
        let superClass = this.components.get(keyType);
        if (!superClass) {
            this.register(typeData, undefined, options);
            superClass = this.components.get(keyType);
        }
        superClass.subClasses.push(store);
    }
    newStore(data, options) {
        return {
            inited: false,
            value: this.genValue(data, options),
            options,
            subClasses: []
        };
    }
    canBeKey(obj) {
        return obj instanceof Function || typeof obj === 'string';
    }
    genValue(data, options) {
        const dataIsFunction = data instanceof Function;
        const dataIsClass = dataIsFunction && utils_1.isClass(data);
        return () => dataIsFunction && options.autoNew ?
            (dataIsClass ? new data() : data()) : data;
    }
    returnValue(data) {
        if (data.options.singleton) {
            return data.inited ? data.value :
                (data.inited = true,
                    data.value = data.value(),
                    data.value);
        }
        else {
            return data.value();
        }
    }
}
exports.IocContext = IocContext;
//# sourceMappingURL=IocContext.js.map