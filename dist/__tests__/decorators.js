"use strict";

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _metadata = require("babel-runtime/core-js/reflect/metadata");

var _metadata2 = _interopRequireDefault(_metadata);

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _getOwnPropertyDescriptor = require("babel-runtime/core-js/object/get-own-property-descriptor");

var _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = (0, _getOwnPropertyDescriptor2.default)(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : (0, _typeof3.default)(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && (0, _defineProperty2.default)(target, key, r), r;
};
var __metadata = undefined && undefined.__metadata || function (k, v) {
    if ((typeof Reflect === "undefined" ? "undefined" : (0, _typeof3.default)(Reflect)) === "object" && typeof _metadata2.default === "function") return (0, _metadata2.default)(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var IocContext_1 = require("../IocContext");
var helper_1 = require("../helper");
var utils_1 = require("../utils");
utils_1.logger.setOutLevel(utils_1.OutLevel.Error);
var context = IocContext_1.IocContext.DefaultInstance;
ava_1.default('register decorator.', function (t) {
    var DTestService = function DTestService() {
        (0, _classCallCheck3.default)(this, DTestService);
    };
    DTestService = __decorate([helper_1.registerDecorator()], DTestService);
    t.true(context.get(DTestService) instanceof DTestService);
});
ava_1.default('inject decorator.', function (t) {
    var DTestService = function DTestService() {
        (0, _classCallCheck3.default)(this, DTestService);
    };
    DTestService = __decorate([helper_1.registerDecorator()], DTestService);

    var ITestService = function ITestService() {
        (0, _classCallCheck3.default)(this, ITestService);
    };

    __decorate([helper_1.injectDecorator(DTestService), __metadata("design:type", DTestService)], ITestService.prototype, "testService", void 0);
    var test = new ITestService();
    t.true(test.testService instanceof DTestService);
});
ava_1.default('inject decorator, no data.', function (t) {
    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };

    var ITestService = function ITestService() {
        (0, _classCallCheck3.default)(this, ITestService);
    };

    __decorate([helper_1.injectDecorator(NRService), __metadata("design:type", NRService)], ITestService.prototype, "testService", void 0);
    var test = new ITestService();
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator.', function (t) {
    var DTestService = function DTestService() {
        (0, _classCallCheck3.default)(this, DTestService);
    };
    DTestService = __decorate([helper_1.registerDecorator()], DTestService);

    var LITestService = function LITestService() {
        (0, _classCallCheck3.default)(this, LITestService);
    };

    __decorate([helper_1.lazyInjectDecorator(DTestService), __metadata("design:type", DTestService)], LITestService.prototype, "testService", void 0);
    var test = new LITestService();
    t.true(test.testService instanceof DTestService);
});
ava_1.default('lazyInject decorator, no data.', function (t) {
    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };

    var LITestService = function LITestService() {
        (0, _classCallCheck3.default)(this, LITestService);
    };

    __decorate([helper_1.lazyInjectDecorator(NRService), __metadata("design:type", NRService)], LITestService.prototype, "testService", void 0);
    var test = new LITestService();
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator, no data, then have.', function (t) {
    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };

    var LITestService = function LITestService() {
        (0, _classCallCheck3.default)(this, LITestService);
    };

    __decorate([helper_1.lazyInjectDecorator(NRService), __metadata("design:type", NRService)], LITestService.prototype, "testService", void 0);
    var test = new LITestService();
    t.true(!test.testService);
    context.register(NRService);
    t.true(test.testService instanceof NRService);
});
ava_1.default('lazyInject decorator, always option true.', function (t) {
    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };
    NRService = __decorate([helper_1.registerDecorator()], NRService);

    var LITestService = function LITestService() {
        (0, _classCallCheck3.default)(this, LITestService);
    };

    __decorate([helper_1.lazyInjectDecorator(NRService, true), __metadata("design:type", NRService)], LITestService.prototype, "testService", void 0);
    var test = new LITestService();
    t.true(test.testService instanceof NRService);
    context.remove(NRService);
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator, always option false.', function (t) {
    var NRService = function NRService() {
        (0, _classCallCheck3.default)(this, NRService);
    };
    NRService = __decorate([helper_1.registerDecorator()], NRService);

    var LITestService = function LITestService() {
        (0, _classCallCheck3.default)(this, LITestService);
    };

    __decorate([helper_1.lazyInjectDecorator(NRService, false), __metadata("design:type", NRService)], LITestService.prototype, "testService", void 0);
    var test = new LITestService();
    t.true(test.testService instanceof NRService);
    context.remove(NRService);
    t.false(!test.testService);
});
//# sourceMappingURL=decorators.js.map