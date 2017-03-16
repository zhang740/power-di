"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const React = require("react");
const react_test_renderer_1 = require("react-test-renderer");
const IocContext_1 = require("../IocContext");
const react_1 = require("../react");
ava_1.default('react only reactcomponent.', t => {
    const context = IocContext_1.IocContext.DefaultInstance;
    class NRServiceDI {
    }
    context.register(NRServiceDI);
    class TestComponent extends react_1.Component {
        componentWillMount() {
            t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI);
        }
        render() {
            return null;
        }
    }
    react_test_renderer_1.create(React.createElement(TestComponent, null));
});
ava_1.default('react IocProvider.', t => {
    const context = IocContext_1.IocContext.DefaultInstance;
    class NRServiceDI {
    }
    context.register(NRServiceDI);
    class TestComponent extends react_1.Component {
        componentWillMount() {
            t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI);
        }
        render() {
            return null;
        }
    }
    react_test_renderer_1.create(React.createElement(react_1.IocProvider, null,
        React.createElement(TestComponent, null)));
});
ava_1.default('react IocProvider with context.', t => {
    const context = new IocContext_1.IocContext;
    class NRService {
    }
    context.register(NRService);
    class TestComponent extends react_1.Component {
        componentWillMount() {
            t.true(this.GetComponent(NRService) instanceof NRService);
        }
        render() {
            return null;
        }
    }
    react_test_renderer_1.create(React.createElement(react_1.IocProvider, { context: context },
        React.createElement(TestComponent, null)));
});
//# sourceMappingURL=react.js.map