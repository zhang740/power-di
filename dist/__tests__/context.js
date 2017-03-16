"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const IocContext_1 = require("../IocContext");
class TestService {
}
ava_1.default('default instance.', t => {
    t.true(IocContext_1.IocContext.DefaultInstance instanceof IocContext_1.IocContext);
});
ava_1.default('register component error case.', t => {
    var INJECTTYPE;
    (function (INJECTTYPE) {
        INJECTTYPE[INJECTTYPE["test"] = 0] = "test";
    })(INJECTTYPE || (INJECTTYPE = {}));
    const context = new IocContext_1.IocContext;
    t.throws(() => context.register(123123));
    t.throws(() => context.register('123123'));
    t.throws(() => context.register({}, 123123));
    t.throws(() => context.register({}, INJECTTYPE.test));
});
ava_1.default('register component by class.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
});
ava_1.default('register component mutli-instance.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService, undefined, { singleton: false });
    const dataA = context.get(TestService);
    t.true(dataA instanceof TestService);
    const dataB = context.get(TestService);
    t.true(dataB instanceof TestService);
    t.false(dataA === dataB);
});
ava_1.default('register component no autonew.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService, undefined, { autoNew: false });
    const dataA = context.get(TestService);
    t.false(dataA instanceof TestService);
    t.true(dataA === TestService);
});
ava_1.default('register 2nd with same key.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService);
    t.throws(() => context.register(TestService));
});
ava_1.default('register component by string.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService, 'string_key');
    t.true(context.get('string_key') instanceof TestService);
    const data = { x: 'test' };
    context.register(data, 'string_key_value');
    t.true(context.get('string_key_value') === data);
});
ava_1.default('register not allowed.', t => {
    const context = new IocContext_1.IocContext;
    t.throws(() => context.register(new TestService));
});
ava_1.default('remove component.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
    context.remove(TestService);
    t.true(!context.get(TestService));
});
ava_1.default('replace component.', t => {
    class BClass {
    }
    const context = new IocContext_1.IocContext;
    context.register(TestService);
    t.true(context.get(TestService) instanceof TestService);
    context.replace(TestService, BClass);
    t.true(context.get(TestService) instanceof BClass);
    t.throws(() => context.replace(BClass, TestService));
});
const base_1 = require("./base");
ava_1.default('difference class with same class name.', t => {
    const context = new IocContext_1.IocContext;
    context.register(TestService);
    context.register(base_1.TestService);
    t.true(context.get(TestService) instanceof TestService);
    t.true(context.get(base_1.TestService) instanceof base_1.TestService);
});
ava_1.default('subcomponent.', t => {
    class SubClass extends TestService {
    }
    const context = new IocContext_1.IocContext;
    context.register(SubClass, TestService);
    t.true(context.get(TestService) instanceof SubClass);
    t.true(context.get(TestService) instanceof TestService);
    t.true(!context.get(SubClass));
});
ava_1.default('subcomponent? whatever.', t => {
    class SubClass {
    }
    const context = new IocContext_1.IocContext;
    context.register(SubClass, TestService);
    t.true(context.get(TestService) instanceof SubClass);
    t.false(context.get(TestService) instanceof TestService);
    t.true(!context.get(SubClass));
});
//# sourceMappingURL=context.js.map