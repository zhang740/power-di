"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const IocContext_1 = require("../IocContext");
const helper_1 = require("../helper");
const utils_1 = require("../utils");
utils_1.logger.setOutLevel(utils_1.OutLevel.Error);
const context = IocContext_1.IocContext.DefaultInstance;
ava_1.default('register decorator.', t => {
    let DTestService = class DTestService {
    };
    DTestService = __decorate([
        helper_1.register()
    ], DTestService);
    t.true(context.get(DTestService) instanceof DTestService);
});
ava_1.default('inject decorator.', t => {
    let DTestService = class DTestService {
    };
    DTestService = __decorate([
        helper_1.register()
    ], DTestService);
    class ITestService {
    }
    __decorate([
        helper_1.inject(DTestService),
        __metadata("design:type", DTestService)
    ], ITestService.prototype, "testService", void 0);
    const test = new ITestService;
    t.true(test.testService instanceof DTestService);
});
ava_1.default('inject decorator, no data.', t => {
    class NRService {
    }
    class ITestService {
    }
    __decorate([
        helper_1.inject(NRService),
        __metadata("design:type", NRService)
    ], ITestService.prototype, "testService", void 0);
    const test = new ITestService;
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator.', t => {
    let DTestService = class DTestService {
    };
    DTestService = __decorate([
        helper_1.register()
    ], DTestService);
    class LITestService {
    }
    __decorate([
        helper_1.lazyInject(DTestService),
        __metadata("design:type", DTestService)
    ], LITestService.prototype, "testService", void 0);
    const test = new LITestService;
    t.true(test.testService instanceof DTestService);
});
ava_1.default('lazyInject decorator, no data.', t => {
    class NRService {
    }
    class LITestService {
    }
    __decorate([
        helper_1.lazyInject(NRService),
        __metadata("design:type", NRService)
    ], LITestService.prototype, "testService", void 0);
    const test = new LITestService;
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator, no data, then have.', t => {
    class NRService {
    }
    class LITestService {
    }
    __decorate([
        helper_1.lazyInject(NRService),
        __metadata("design:type", NRService)
    ], LITestService.prototype, "testService", void 0);
    const test = new LITestService;
    t.true(!test.testService);
    context.register(NRService);
    t.true(test.testService instanceof NRService);
});
ava_1.default('lazyInject decorator, always option true.', t => {
    let NRService = class NRService {
    };
    NRService = __decorate([
        helper_1.register()
    ], NRService);
    class LITestService {
    }
    __decorate([
        helper_1.lazyInject(NRService, true),
        __metadata("design:type", NRService)
    ], LITestService.prototype, "testService", void 0);
    const test = new LITestService;
    t.true(test.testService instanceof NRService);
    context.remove(NRService);
    t.true(!test.testService);
});
ava_1.default('lazyInject decorator, always option false.', t => {
    let NRService = class NRService {
    };
    NRService = __decorate([
        helper_1.register()
    ], NRService);
    class LITestService {
    }
    __decorate([
        helper_1.lazyInject(NRService, false),
        __metadata("design:type", NRService)
    ], LITestService.prototype, "testService", void 0);
    const test = new LITestService;
    t.true(test.testService instanceof NRService);
    context.remove(NRService);
    t.false(!test.testService);
});
//# sourceMappingURL=decorators.js.map