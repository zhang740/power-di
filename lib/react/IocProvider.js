"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var IocContext_1 = require("../IocContext");

var IocProvider = function (_react_1$Component) {
    _inherits(IocProvider, _react_1$Component);

    function IocProvider(props, context) {
        _classCallCheck(this, IocProvider);

        var _this = _possibleConstructorReturn(this, (IocProvider.__proto__ || Object.getPrototypeOf(IocProvider)).call(this, props, context));

        _this.iocContext = props.context || IocContext_1.IocContext.DefaultInstance;
        return _this;
    }

    _createClass(IocProvider, [{
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

IocProvider.childContextTypes = {
    iocContext: react_1.PropTypes.any
};
exports.IocProvider = IocProvider;
//# sourceMappingURL=IocProvider.js.map