"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var IocContext_1 = require("../IocContext");
var utils_1 = require("../utils");

var Decorators = function () {
    function Decorators() {
        var ioc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : IocContext_1.IocContext.DefaultInstance;

        _classCallCheck(this, Decorators);

        this.context = ioc;
        this.register = this.register.bind(this);
        this.registerSubClass = this.registerSubClass.bind(this);
        this.append = this.append.bind(this);
        this.inject = this.inject.bind(this);
        this.lazyInject = this.lazyInject.bind(this);
        this.lazyInjectSubClass = this.lazyInjectSubClass.bind(this);
    }
    /**
     * register class
     * @param target need a class
     * @param options RegisterOptions
     */


    _createClass(Decorators, [{
        key: "register",
        value: function register(key, options) {
            var _this = this;

            return function (target) {
                _this.context.register(target, key, options);
            };
        }
        /**
         * register subClass, the abbreviation of register
         * @param target need a class
         * @param options RegisterOptions
         */

    }, {
        key: "registerSubClass",
        value: function registerSubClass(key, options) {
            var _this2 = this;

            return function (target) {
                _this2.context.register(target, key, Object.assign({}, options, { regInSuperClass: true }));
            };
        }
        /**
         * append class to subClass list by key
         * @param key class or string
         * @param options RegisterOptions
         */

    }, {
        key: "append",
        value: function append(key, options) {
            var _this3 = this;

            return function (target) {
                _this3.context.append(key, target, options);
            };
        }
        /**
         * inject
         * type: class or string
         * @param {{ type: any }} { type }
         * @returns
         * @memberof Decorators
         */

    }, {
        key: "inject",
        value: function inject() {
            var _this4 = this;

            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
                type = _ref.type;

            return function (target, key) {
                var t = Reflect.getMetadata('design:type', target, key);
                console.log(key + " type: " + t.name);
                var globalType = _this4.getGlobalType(type, target, key);
                target[key] = _this4.context.get(globalType);
                if (!target[key]) {
                    utils_1.logger.warn('Notfound:' + globalType);
                }
            };
        }
        /**
         * lazy inject
         * type: class or string
         * always: always read from context. default: false
         * subClass: getSubClasses. default: false
         * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
         * @returns
         * @memberof Decorators
         */

    }, {
        key: "lazyInject",
        value: function lazyInject() {
            var _this5 = this;

            var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
                type = _ref2.type,
                _ref2$always = _ref2.always,
                always = _ref2$always === undefined ? false : _ref2$always,
                _ref2$subClass = _ref2.subClass,
                subClass = _ref2$subClass === undefined ? false : _ref2$subClass;

            return function (target, key) {
                var globalType = _this5.getGlobalType(type, target, key);
                Object.defineProperty(target, key, {
                    configurable: !always,
                    get: function get() {
                        var data = subClass ? _this5.context.getSubClasses(globalType) : _this5.context.get(globalType);
                        if (!data) {
                            utils_1.logger.warn('Notfound:' + globalType);
                        } else if (!always) {
                            Object.defineProperty(target, key, {
                                value: data
                            });
                        }
                        return data;
                    }
                });
            };
        }
        /**
         * lazy inject subClass, the abbreviation of lazy inject
         * type: class or string
         * always: always read from context. default: false
         * @param {{ type: any, always: boolean }} { type, always = false }
         * @returns
         * @memberof Decorators
         */

    }, {
        key: "lazyInjectSubClass",
        value: function lazyInjectSubClass() {
            var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { type: undefined },
                type = _ref3.type,
                _ref3$always = _ref3.always,
                always = _ref3$always === undefined ? false : _ref3$always;

            return this.lazyInject({ type: type, always: always, subClass: true });
        }
    }, {
        key: "getGlobalType",
        value: function getGlobalType(type, target, key) {
            if (!type && Reflect && Reflect.getMetadata) {
                type = Reflect.getMetadata('design:type', target, key);
            }
            return utils_1.getGlobalType(type);
        }
    }]);

    return Decorators;
}();

exports.Decorators = Decorators;
function getDecorators() {
    var ioc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : IocContext_1.IocContext.DefaultInstance;

    return new Decorators(ioc);
}
exports.getDecorators = getDecorators;
//# sourceMappingURL=decorators.js.map