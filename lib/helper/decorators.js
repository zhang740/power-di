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
         * @param type class or string
         */

    }, {
        key: "inject",
        value: function inject(type) {
            var _this4 = this;

            var globalType = utils_1.getGlobalType(type);
            return function (target, key) {
                target[key] = _this4.context.get(globalType);
                if (!target[key]) {
                    utils_1.logger.warn('Notfound:' + globalType);
                }
            };
        }
        /**
         * lazy inject
         * @param type class or string
         * @param always always read from context. default: false
         * @param subClass getSubClasses. default: false
         */

    }, {
        key: "lazyInject",
        value: function lazyInject(type) {
            var _this5 = this;

            var always = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var subClass = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var globalType = utils_1.getGlobalType(type);
            return function (target, key) {
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
         * @param type class or string
         * @param always always read from context. default: false
         */

    }, {
        key: "lazyInjectSubClass",
        value: function lazyInjectSubClass(type) {
            var always = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this.lazyInject(type, always, true);
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