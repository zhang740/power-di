"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
exports.DefaultRegisterOption = {
    singleton: true,
    autoNew: true,
    regInSuperClass: false
};

var IocContext = function () {
    function IocContext() {
        _classCallCheck(this, IocContext);

        this.components = new Map();
    }

    _createClass(IocContext, [{
        key: "remove",
        value: function remove(keyOrType) {
            return this.components.delete(utils_1.getGlobalType(keyOrType));
        }
    }, {
        key: "get",
        value: function get(keyOrType) {
            var data = this.components.get(utils_1.getGlobalType(keyOrType));
            if (!data) return;
            return this.returnValue(data);
        }
    }, {
        key: "getSubClasses",
        value: function getSubClasses(keyOrType) {
            var _this = this;

            var data = this.components.get(utils_1.getGlobalType(keyOrType));
            if (!data) return;
            return data.subClasses.map(function (sc) {
                return _this.returnValue(sc);
            });
        }
    }, {
        key: "replace",
        value: function replace(keyOrType, newData, options) {
            var key = utils_1.getGlobalType(keyOrType);
            var data = this.components.get(key);
            if (data) {
                data.inited = false;
                data.value = this.genValue(newData, options || data.options);
            } else {
                throw new Error("the key:[" + key + "] is not register.");
            }
        }
    }, {
        key: "append",
        value: function append(keyOrType, subData) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : exports.DefaultRegisterOption;

            if (!this.canBeKey(keyOrType)) {
                throw new Error('key require a string or a class.');
            }
            var store = void 0;
            if (utils_1.isClass(subData)) {
                this.register(subData, undefined, options);
                store = this.components.get(utils_1.getGlobalType(subData));
            } else {
                store = this.newStore(subData, options);
            }
            this.appendData(utils_1.getGlobalType(keyOrType), keyOrType, options, store);
        }
    }, {
        key: "register",
        value: function register(data, key) {
            var _this2 = this;

            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : exports.DefaultRegisterOption;

            if (key) {
                if (!this.canBeKey(key)) {
                    throw new Error('key require a string or a class.');
                }
            } else {
                if (!this.canBeKey(data)) {
                    throw new Error('when data is not a class or string, require a key.');
                }
            }
            var dataType = key && utils_1.getGlobalType(key) || data && utils_1.getGlobalType(data);
            if (this.components.has(dataType)) {
                throw new Error("the key:[" + dataType + "] is already register.");
            }
            options = Object.assign({}, exports.DefaultRegisterOption, options);
            var store = this.newStore(data, options);
            this.components.set(dataType, store);
            if (options.regInSuperClass) {
                if (!(data instanceof Function)) {
                    throw new Error('if need regInSuperClass, data MUST be a class.');
                }
                var newOptions = Object.assign({}, options, { regInSuperClass: false });
                var superClasses = utils_1.getSuperClassInfo(data);
                superClasses.forEach(function (sc) {
                    return _this2.appendData(sc.type, sc.class, newOptions, store);
                });
            }
        }
    }, {
        key: "appendData",
        value: function appendData(keyType, typeData, options, store) {
            var superClass = this.components.get(keyType);
            if (!superClass) {
                this.register(typeData, undefined, options);
                superClass = this.components.get(keyType);
            }
            superClass.subClasses.push(store);
        }
    }, {
        key: "newStore",
        value: function newStore(data, options) {
            return {
                inited: false,
                value: this.genValue(data, options),
                options: options,
                subClasses: []
            };
        }
    }, {
        key: "canBeKey",
        value: function canBeKey(obj) {
            return obj instanceof Function || typeof obj === 'string';
        }
    }, {
        key: "genValue",
        value: function genValue(data, options) {
            var _this3 = this;

            var dataIsFunction = data instanceof Function;
            var dataIsClass = dataIsFunction && utils_1.isClass(data);
            return function () {
                return dataIsFunction && options.autoNew ? dataIsClass ? new data(_this3) : data(_this3) : data;
            };
        }
    }, {
        key: "returnValue",
        value: function returnValue(data) {
            if (data.options.singleton) {
                return data.inited ? data.value : (data.inited = true, data.value = data.value(), data.value);
            } else {
                return data.value();
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