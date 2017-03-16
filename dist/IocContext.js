"use strict";

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.defineProperty(exports, "__esModule", { value: true });
var getGlobalType_1 = require("./utils/getGlobalType");
exports.DefaultRegisterOption = {
    singleton: true,
    autoNew: true
};

var IocContext = function () {
    function IocContext() {
        (0, _classCallCheck3.default)(this, IocContext);

        this.components = new _map2.default();
    }

    (0, _createClass3.default)(IocContext, [{
        key: "remove",
        value: function remove(keyOrType) {
            return this.components.delete(getGlobalType_1.default(keyOrType));
        }
    }, {
        key: "get",
        value: function get(keyOrType) {
            var data = this.components.get(getGlobalType_1.default(keyOrType));
            if (!data) return;
            if (data.options.singleton) {
                return data.value;
            } else {
                return data.value();
            }
        }
    }, {
        key: "replace",
        value: function replace(keyOrType, newData) {
            var key = getGlobalType_1.default(keyOrType);
            var data = this.components.get(key);
            if (data) {
                var dataIsFunction = newData instanceof Function;
                data.value = this.genValue(dataIsFunction, data.options, newData);
            } else {
                throw new Error("the key:[" + key + "] is not register.");
            }
        }
    }, {
        key: "register",
        value: function register(data, key) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : exports.DefaultRegisterOption;

            var dataIsFunction = data instanceof Function;
            if (!dataIsFunction && !key) {
                throw new Error('when data is not a class, require a key.');
            }
            var keyIsOK = !key || key instanceof Function || typeof key === 'string';
            if (!keyIsOK) {
                throw new Error('key require a string or a class.');
            }
            var dataKey = getGlobalType_1.default(key) || getGlobalType_1.default(data);
            if (this.components.has(dataKey)) {
                throw new Error("the key:[" + dataKey + "] is already register.");
            }
            options = (0, _assign2.default)({}, exports.DefaultRegisterOption, options);
            this.components.set(dataKey, {
                value: this.genValue(dataIsFunction, options, data),
                options: options
            });
        }
    }, {
        key: "genValue",
        value: function genValue(dataIsFunction, options, data) {
            var genData = function genData() {
                return dataIsFunction && options.autoNew ? new data() : data;
            };
            if (options.singleton) {
                return genData();
            } else {
                return genData;
            }
        }
    }], [{
        key: "DefaultInstance",
        get: function get() {
            return this.defaultInstance || (this.defaultInstance = new IocContext(), this.defaultInstance);
        }
    }]);
    return IocContext;
}();

exports.IocContext = IocContext;
//# sourceMappingURL=IocContext.js.map