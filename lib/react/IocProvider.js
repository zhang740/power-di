"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const IocContext_1 = require("../IocContext");
class IocProvider extends react_1.Component {
    constructor(props, context) {
        super(props, context);
        this.iocContext = props.context || IocContext_1.IocContext.DefaultInstance;
    }
    getChildContext() {
        return { iocContext: this.iocContext };
    }
    render() {
        return react_1.Children.only(this.props.children);
    }
}
IocProvider.childContextTypes = {
    iocContext: react_1.PropTypes.any
};
exports.IocProvider = IocProvider;
//# sourceMappingURL=IocProvider.js.map