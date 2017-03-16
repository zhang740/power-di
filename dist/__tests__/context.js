"use strict";

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var IocContext_1 = require("../IocContext");

var TestService = function TestService() {
    (0, _classCallCheck3.default)(this, TestService);
};

ava_1.default('default instance.', function (t) {
    t.true(IocContext_1.IocContext.DefaultInstance instanceof IocContext_1.IocContext);
});
ava_1.default('register component error case.', function (t) {
    var INJECTTYPE;
    (function (INJECTTYPE) {
        INJECTTYPE[INJECTTYPE["test"] = 0] = "test";
    })(INJECTTYPE || (INJECTTYPE = {}));
    var context = new IocContext_1.IocContext();
    t.throws(function () {
        return context.register(123123);
    });
    t.throws(function () {
        return context.register('123123');
    });
    t.throws(function () {
        return context.register({}, 123123);
    });
    t.throws(function () {
        return context.register({}, INJECTTYPE.test);
    });
});
ava_1.default('register component by class.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
});
ava_1.default('register component mutli-instance.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService, undefined, { singleton: false });
    var dataA = context.get(TestService);
    t.true(dataA instanceof TestService);
    var dataB = context.get(TestService);
    t.true(dataB instanceof TestService);
    t.false(dataA === dataB);
});
ava_1.default('register component no autonew.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService, undefined, { autoNew: false });
    var dataA = context.get(TestService);
    t.false(dataA instanceof TestService);
    t.true(dataA === TestService);
});
ava_1.default('register 2nd with same key, need return the same object.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService);
    t.throws(function () {
        return context.register(TestService);
    });
});
ava_1.default('register component by string.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService, 'string_key');
    t.true(context.get('string_key') instanceof TestService);
    var data = { x: 'test' };
    context.register(data, 'string_key_value');
    t.true(context.get('string_key_value') === data);
});
ava_1.default('register not allowed.', function (t) {
    var context = new IocContext_1.IocContext();
    t.throws(function () {
        return context.register(new TestService());
    });
});
ava_1.default('remove component.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
    context.remove(TestService);
    t.true(!context.get(TestService));
});
ava_1.default('replace component.', function (t) {
    var BClass = function BClass() {
        (0, _classCallCheck3.default)(this, BClass);
    };

    var context = new IocContext_1.IocContext();
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
    context.replace(TestService, BClass);
    t.true(context.get(TestService) instanceof BClass);
    t.throws(function () {
        return context.replace(BClass, TestService);
    });
});
var base_1 = require("./base");
ava_1.default('difference class with same class name.', function (t) {
    var context = new IocContext_1.IocContext();
    context.register(TestService);
    context.register(base_1.TestService);
    t.true(context.get(TestService) instanceof TestService);
    t.true(context.get(base_1.TestService) instanceof base_1.TestService);
});
ava_1.default('subcomponent.', function (t) {
    var SubClass = function (_TestService) {
        (0, _inherits3.default)(SubClass, _TestService);

        function SubClass() {
            (0, _classCallCheck3.default)(this, SubClass);
            return (0, _possibleConstructorReturn3.default)(this, (SubClass.__proto__ || (0, _getPrototypeOf2.default)(SubClass)).apply(this, arguments));
        }

        return SubClass;
    }(TestService);

    var context = new IocContext_1.IocContext();
    context.register(SubClass, TestService);
    t.true(context.get(TestService) instanceof SubClass);
    t.true(context.get(TestService) instanceof TestService);
    t.true(!context.get(SubClass));
});
ava_1.default('subcomponent? whatever.', function (t) {
    var SubClass = function SubClass() {
        (0, _classCallCheck3.default)(this, SubClass);
    };

    var context = new IocContext_1.IocContext();
    context.register(SubClass, TestService);
    t.true(context.get(TestService) instanceof SubClass);
    t.false(context.get(TestService) instanceof TestService);
    t.true(!context.get(SubClass));
});
//# sourceMappingURL=context.js.map