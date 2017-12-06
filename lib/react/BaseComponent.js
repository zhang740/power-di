"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const IocContext_1 = require("../IocContext");
class Component extends react_1.Component {
    constructor(props, context) {
        super(props, context);
        this.iocContext = (context && context.iocContext) || IocContext_1.IocContext.DefaultInstance;
    }
    GetComponent(type) {
        return this.iocContext && this.iocContext.get(type);
    }
}
Component.contextTypes = {
    iocContext: react_1.PropTypes.any
};
exports.Component = Component;
//# sourceMappingURL=BaseComponent.js.map