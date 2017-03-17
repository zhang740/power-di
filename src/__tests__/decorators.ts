import test from 'ava'
import { IocContext } from '../IocContext'
import { register, inject, lazyInject, registerSubClass } from '../helper'
import { logger, OutLevel } from '../utils'
logger.setOutLevel(OutLevel.Error)

const context = IocContext.DefaultInstance

test('register decorator.', t => {
    @register()
    class DTestService { }
    t.true(context.get(DTestService) instanceof DTestService)
})

test('inject decorator.', t => {
    @register()
    class DTestService { }
    class ITestService {
        @inject(DTestService)
        public testService: DTestService
    }

    const test = new ITestService
    t.true(test.testService instanceof DTestService)
})

test('inject decorator, no data.', t => {
    class NRService { }
    class ITestService {
        @inject(NRService)
        public testService: NRService
    }

    const test = new ITestService
    t.true(!test.testService)
})

test('lazyInject decorator.', t => {
    @register()
    class DTestService { }
    class LITestService {
        @lazyInject(DTestService)
        public testService: DTestService
    }

    const test = new LITestService
    t.true(test.testService instanceof DTestService)
})

test('lazyInject decorator, no data.', t => {
    class NRService { }
    class LITestService {
        @lazyInject(NRService)
        public testService: NRService
    }

    const test = new LITestService
    t.true(!test.testService)
})

test('lazyInject decorator, no data, then have.', t => {
    class NRService { }
    class LITestService {
        @lazyInject(NRService)
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
        @lazyInject(NRService, true)
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
        @lazyInject(NRService, false)
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
    class LITestService {
        @lazyInject(A, false, true)
        public testService: A[]
    }

    const test = new LITestService
    t.true(test.testService.length === 2)
    t.true(test.testService[0] instanceof B)
    t.true(test.testService[1] instanceof C)
})