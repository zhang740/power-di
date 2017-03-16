"use strict";

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var IocContext_1 = require("../IocContext");

var IocProvider = function (_react_1$Component) {
    (0, _inherits3.default)(IocProvider, _react_1$Component);

    function IocProvider(props, context) {
        (0, _classCallCheck3.default)(this, IocProvider);

        var _this = (0, _possibleConstructorReturn3.default)(this, (IocProvider.__proto__ || (0, _getPrototypeOf2.default)(IocProvider)).call(this, props, context));

        _this.iocContext = props.context || IocContext_1.IocContext.DefaultInstance;
        return _this;
    }

    (0, _createClass3.default)(IocProvider, [{
        key: "getChildContext",
        value: function getChildContext() {
            return { iocContext: this.iocContext };
        }
    }, {
        key: "render",
        value: function render() {
            return react_1.Children.only(this.props.children);
        }
    }]);
    return IocProvider;
}(react_1.Component);

IocProvider.childrenContextTypes = {
    iocContext: react_1.PropTypes.any
};
exports.IocProvider = IocProvider;
//# sourceMappingURL=IocProvider.js.map