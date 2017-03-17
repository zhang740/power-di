import test from 'ava'
import { IocContext } from '../IocContext'

class TestService {
}

test('default instance.', t => {
    t.true(IocContext.DefaultInstance instanceof IocContext)
})

test('register component error case.', t => {
    enum INJECTTYPE {
        test
    }

    const context = new IocContext
    t.throws(() => context.register(undefined))
    t.throws(() => context.register(123123))
    t.throws(() => context.register('123123'))
    t.throws(() => context.register({}, 123123 as any))
    t.throws(() => context.register({}, INJECTTYPE.test as any))
})

test('register component by class.', t => {
    const context = new IocContext
    context.register(TestService)
    t.true(context.get(TestService) instanceof TestService)
})

test('register component mutli-instance.', t => {
    const context = new IocContext
    context.register(TestService, undefined, { singleton: false })
    const dataA = context.get(TestService)
    t.true(dataA instanceof TestService)
    const dataB = context.get(TestService)
    t.true(dataB instanceof TestService)
    t.false(dataA === dataB)
})

test('register component no autonew.', t => {
    const context = new IocContext
    context.register(TestService, undefined, { autoNew: false })
    const dataA = context.get(TestService)
    t.false(dataA instanceof TestService)
    t.true(dataA === TestService)
})

test('register 2nd with same key.', t => {
    const context = new IocContext
    context.register(TestService)
    t.throws(() => context.register(TestService))
})

test('register component by string.', t => {
    const context = new IocContext
    context.register(TestService, 'string_key')
    t.true(context.get('string_key') instanceof TestService)

    const data = { x: 'test' }
    context.register(data, 'string_key_value')
    t.true(context.get('string_key_value') === data)
})

test('register not allowed.', t => {
    const context = new IocContext
    t.throws(() => context.register(new TestService))
})

test('remove component.', t => {
    const context = new IocContext
    context.register(TestService)
    t.true(context.get(TestService) instanceof TestService)
    context.remove(TestService)
    t.true(!context.get(TestService))
})

test('replace component.', t => {
    class BClass { }
    const context = new IocContext
    context.register(TestService)
    t.true(context.get(TestService) instanceof TestService)
    context.replace(TestService, BClass)
    t.true(context.get(TestService) instanceof BClass)
    t.throws(() => context.replace(BClass, TestService))
})

import { TestService as TS2 } from './base'
test('difference class with same class name.', t => {
    const context = new IocContext
    context.register(TestService)
    context.register(TS2)
    t.true(context.get(TestService) instanceof TestService)
    t.true(context.get(TS2) instanceof TS2)
})

test('subcomponent.', t => {
    class SubClass extends TestService { }

    const context = new IocContext
    context.register(SubClass, TestService)
    t.true(context.get(TestService) instanceof SubClass)
    t.true(context.get(TestService) instanceof TestService)
    t.true(!context.get(SubClass))
})

test('subcomponent? whatever.', t => {
    class SubClass { }

    const context = new IocContext
    context.register(SubClass, TestService)
    t.true(context.get(TestService) instanceof SubClass)
    t.false(context.get(TestService) instanceof TestService)
    t.true(!context.get(SubClass))
})

test('getSubClasses.', t => {
    class AClass { }
    class BClass extends AClass { }
    class CClass extends AClass { }

    const context = new IocContext
    t.true(!context.getSubClasses(AClass))
    context.register(BClass, undefined, { regInSuperClass: true })
    context.register(CClass, undefined, { regInSuperClass: true })
    const cls = context.getSubClasses(AClass)
    t.true(cls.length === 2)
    t.true(cls[0] instanceof BClass)
    t.true(cls[1] instanceof CClass)
    t.false(!context.get(AClass))
})

test('getSubClasses, diff options.', t => {
    class AClass { }
    class BClass extends AClass { }
    class CClass extends AClass { }

    const context = new IocContext
    context.register(BClass, undefined, { regInSuperClass: true })
    context.register(CClass, undefined, { singleton: false, regInSuperClass: true })
    const cls1 = context.getSubClasses(AClass)
    const cls2 = context.getSubClasses(AClass)
    t.true(cls1[0] === cls2[0])
    t.true(cls1[1] !== cls2[1])
})

test('getSubClasses, mutli.', t => {
    class AClass { }
    class BClass extends AClass { }
    class CClass extends BClass { }

    const context = new IocContext
    context.register(CClass, undefined, { regInSuperClass: true })
    t.true(context.getSubClasses(AClass).length === 1)
    t.true(context.getSubClasses(AClass)[0] instanceof AClass)
    t.true(context.getSubClasses(BClass).length === 1)
    t.true(context.getSubClasses(BClass)[0] instanceof BClass)
})