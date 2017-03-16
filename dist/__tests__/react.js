"use strict";

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var React = require("react");
var react_test_renderer_1 = require("react-test-renderer");
var IocContext_1 = require("../IocContext");
var react_1 = require("../react");
ava_1.default('react only reactcomponent.', function (t) {
    var context = IocContext_1.IocContext.DefaultInstance;

    var NRServiceDI = function NRServiceDI() {
        (0, _classCallCheck3.default)(this, NRServiceDI);
    };

    context.register(NRServiceDI);

    var TestComponent = function (_react_1$Component) {
        (0, _inherits3.default)(TestComponent, _react_1$Component);

        function TestComponent() {
            (0, _classCallCheck3.default)(this, TestComponent);
            return (0, _possibleConstructorReturn3.default)(this, (TestComponent.__proto__ || (0, _getPrototypeOf2.default)(TestComponent)).apply(this, arguments));
        }

        (0, _createClass3.default)(TestComponent, [{
            key: "componentWillMount",
            value: function componentWillMount() {
                t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI);
            }
        }, {
            key: "render",
            value: function render() {
                return null;
            }
        }]);
        return TestComponent;
    }(react_1.Component);

    react_test_renderer_1.create(React.createElement(TestComponent, null));
});
ava_1.default('react IocProvider.', function (t) {
    var context = IocContext_1.IocContext.DefaultInstance;

    var NRServiceDI = function NRServiceDI() {
        (0, _classCallCheck3.default)(this, NRServiceDI);
    };

    context.register(NRServiceDI);

    var TestComponent = function (_react_1$Component2) {
        (0, _inherits3.default)(TestComponent, _react_1$Component2);

        function TestComponent() {
            (0, _classCallCheck3.default)(this, TestComponent);
            return (0, _possibleConstructorReturn3.default)(this, (TestComponent.__proto__ || (0, _getPrototypeOf2.default)(TestComponent)).apply(this, arguments));
        }

        (0, _createClass3.default)(TestComponent, [{
            key: "componentWillMount",
            value: function componentWillMount() {
                t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI);
            }
        }, {
            key: "render",
            value: function render() {
                return null;
            }
        }]);
        return TestComponent;
    }(react_1.Component);

    react_test_renderer_1.create(React.createElement(react_1.IocProvider, null, React.createElement(TestComponent, null)));
});
ava_1.default('react IocProvider with context.', function (t) {
    var context = new IocContext_1.IocContext();

    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };

    context.register(NRService);

    var TestComponent = function (_react_1$Component3) {
        (0, _inherits3.default)(TestComponent, _react_1$Component3);

        function TestComponent() {
            (0, _classCallCheck3.default)(this, TestComponent);
            return (0, _possibleConstructorReturn3.default)(this, (TestComponent.__proto__ || (0, _getPrototypeOf2.default)(TestComponent)).apply(this, arguments));
        }

        (0, _createClass3.default)(TestComponent, [{
            key: "componentWillMount",
            value: function componentWillMount() {
                t.true(this.GetComponent(NRService) instanceof NRService);
            }
        }, {
            key: "render",
            value: function render() {
                return null;
            }
        }]);
        return TestComponent;
    }(react_1.Component);

    react_test_renderer_1.create(React.createElement(react_1.IocProvider, { context: context }, React.createElement(TestComponent, null)));
});
//# sourceMappingURL=react.js.map