import test from 'ava'
import { IocContext } from '../lib/IocContext'
import { logger, OutLevel } from '../lib/utils'
import { getDecorators, Decorators } from '../lib/helper'
const {
    register, append, inject, lazyInject, registerSubClass, lazyInjectSubClass
} = getDecorators()

logger.setOutLevel(OutLevel.Error)

const context = IocContext.DefaultInstance

test('decorator, custom IocContext.', t => {
    const context = new IocContext()
    const { register, lazyInject } = new Decorators(context)
    @register()
    class NRService { }
    class LITestService {
        @lazyInject()
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
})

test('decorator, function IocContext.', t => {
    const context = new IocContext
    const { register, lazyInject } = new Decorators(() => context)
    @register()
    class NRService { }
    class LITestService {
        @lazyInject()
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
})

test('decorator, default IocContext.', t => {
    const decorator = new Decorators()
    @decorator.register()
    class NRService { }
    class LITestService {
        @decorator.lazyInject()
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
})

test('register decorator.', t => {
    @register()
    class DTestService { }
    t.true(context.get(DTestService) instanceof DTestService)
})

test('inject decorator.', t => {
    @register()
    class DTestService { }
    class ITestService {
        @inject()
        public testService: DTestService

        @inject({ type: DTestService })
        public testService2: DTestService
    }

    const test = new ITestService
    t.true(test.testService instanceof DTestService)
    t.true(test.testService2 instanceof DTestService)
})

test('inject decorator, no data.', t => {
    class NRService { }
    class ITestService {
        @inject()
        public testService: NRService
    }

    const test = new ITestService
    t.true(!test.testService)
})

test('lazyInject decorator.', t => {
    @register()
    class DTestService { }
    class LITestService {
        @lazyInject()
        public testService: DTestService

        @lazyInject({ type: DTestService })
        public testService2: DTestService
    }

    const test = new LITestService
    t.true(test.testService instanceof DTestService)
    t.true(test.testService2 instanceof DTestService)
})

test('lazyInject decorator, no data.', t => {
    class NRService { }
    class LITestService {
        @lazyInject()
        public testService: NRService
    }

    const test = new LITestService
    t.true(!test.testService)
})

test('lazyInject decorator, no data, then have.', t => {
    class NRService { }
    class LITestService {
        @lazyInject()
        public testService: NRService
    }

    const test = new LITestService
    t.true(!test.testService)

    context.register(NRService)
    t.true(test.testService instanceof NRService)
})

test('lazyInject decorator, always option true.', t => {
    @register()
    class NRService { }
    class LITestService {
        @lazyInject({ always: true })
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
    context.remove(NRService)
    t.true(!test.testService)
})

test('lazyInject decorator, always option false.', t => {
    @register()
    class NRService { }
    class LITestService {
        @lazyInject({ always: false })
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
    context.remove(NRService)
    t.false(!test.testService)
})

test('lazyInject decorator, subclass.', t => {
    class A { }
    @register(undefined, { regInSuperClass: true })
    class B extends A { }
    @registerSubClass()
    class C extends A { }
    @append(A)
    class D { }
    class LITestService {
        @lazyInject({ type: A, subClass: true })
        public testService: A[]
        @lazyInjectSubClass({ type: A })
        public testService2: A[]

        @lazyInjectSubClass()
        public testServiceErr: A[]
    }

    const test = new LITestService
    t.true(test.testService.length === 3)
    t.true(test.testService[0] instanceof B)
    t.true(test.testService[1] instanceof C)
    t.true(test.testService[2] instanceof D)
    t.true(test.testService2.length === 3)
    t.true(test.testService2[0] instanceof B)
    t.true(test.testService2[1] instanceof C)
    t.true(test.testService2[2] instanceof D)
    t.true(test.testServiceErr === undefined)
})


test('lazyInject decorator, defaultValue.', t => {

    class NRService { }
    const defaultValue = new NRService()

    class LITestService {
        @lazyInject()
        public testService: NRService = defaultValue
    }

    const test = new LITestService
    t.true(test.testService === defaultValue)
})
