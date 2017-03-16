"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getGlobalType_1 = require("./utils/getGlobalType");
exports.DefaultRegisterOption = {
    singleton: true,
    autoNew: true,
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
        return this.components.delete(getGlobalType_1.default(keyOrType));
    }
    get(keyOrType) {
        const data = this.components.get(getGlobalType_1.default(keyOrType));
        if (!data)
            return;
        if (data.options.singleton) {
            return data.value;
        }
        else {
            return data.value();
        }
    }
    replace(keyOrType, newData) {
        const key = getGlobalType_1.default(keyOrType);
        const data = this.components.get(key);
        if (data) {
            const dataIsFunction = newData instanceof Function;
            data.value = this.genValue(dataIsFunction, data.options, newData);
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
        const dataKey = getGlobalType_1.default(key) || getGlobalType_1.default(data);
        if (this.components.has(dataKey)) {
            throw new Error(`the key:[${dataKey}] is already register.`);
        }
        options = Object.assign({}, exports.DefaultRegisterOption, options);
        this.components.set(dataKey, {
            value: this.genValue(dataIsFunction, options, data),
            options
        });
    }
    genValue(dataIsFunction, options, data) {
        const genData = () => dataIsFunction && options.autoNew ? new data : data;
        if (options.singleton) {
            return genData();
        }
        else {
            return genData;
        }
    }
}
exports.IocContext = IocContext;
//# sourceMappingURL=IocContext.js.map