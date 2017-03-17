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
            const dataIsFunction = newData instanceof Function;
            data.inited = false;
            data.value = this.genValue(dataIsFunction, options || data.options, newData);
        }
        else {
            throw new Error(`the key:[${key}] is not register.`);
        }
    }
    register(data, key, options = exports.DefaultRegisterOption) {
        const dataIsFunction = data instanceof Function;
        if (!dataIsFunction && !key) {
            throw new Error('when data is not a class, require a key.');
        }
        const keyIsOK = !key || key instanceof Function || typeof key === 'string';
        if (!keyIsOK) {
            throw new Error('key require a string or a class.');
        }
        const dataType = (key && utils_1.getGlobalType(key)) || (data && utils_1.getGlobalType(data));
        if (this.components.has(dataType)) {
            throw new Error(`the key:[${dataType}] is already register.`);
        }
        options = Object.assign({}, exports.DefaultRegisterOption, options);
        const store = {
            inited: false,
            value: this.genValue(dataIsFunction, options, data),
            options,
            subClasses: []
        };
        if (options.regInSuperClass) {
            const newOptions = Object.assign({}, options, { regInSuperClass: false });
            const superClasses = utils_1.getSuperClassInfo(data);
            superClasses.forEach(sc => {
                let superClass = this.components.get(sc.type);
                if (!superClass) {
                    this.register(sc.class, undefined, newOptions);
                    superClass = this.components.get(sc.type);
                }
                superClass.subClasses.push(store);
            });
        }
        this.components.set(dataType, store);
    }
    genValue(dataIsFunction, options, data) {
        const genData = () => dataIsFunction && options.autoNew ? new data() : data;
        if (options.singleton) {
            return () => genData();
        }
        else {
            return genData;
        }
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