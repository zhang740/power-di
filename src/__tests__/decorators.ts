import test from 'ava'
import { IocContext } from '../IocContext'
import { registerDecorator, injectDecorator, lazyInjectDecorator } from '../helper'
import { logger, OutLevel } from '../utils'
logger.setOutLevel(OutLevel.Error)

const context = IocContext.DefaultInstance

test('register decorator.', t => {
    @registerDecorator()
    class DTestService { }
    t.true(context.get(DTestService) instanceof DTestService)
})

test('inject decorator.', t => {
    @registerDecorator()
    class DTestService { }
    class ITestService {
        @injectDecorator(DTestService)
        public testService: DTestService
    }

    const test = new ITestService
    t.true(test.testService instanceof DTestService)
})

test('inject decorator, no data.', t => {
    class NRService { }
    class ITestService {
        @injectDecorator(NRService)
        public testService: NRService
    }

    const test = new ITestService
    t.true(!test.testService)
})

test('lazyInject decorator.', t => {
    @registerDecorator()
    class DTestService { }
    class LITestService {
        @lazyInjectDecorator(DTestService)
        public testService: DTestService
    }

    const test = new LITestService
    t.true(test.testService instanceof DTestService)
})

test('lazyInject decorator, no data.', t => {
    class NRService { }
    class LITestService {
        @lazyInjectDecorator(NRService)
        public testService: NRService
    }

    const test = new LITestService
    t.true(!test.testService)
})

test('lazyInject decorator, no data, then have.', t => {
    class NRService { }
    class LITestService {
        @lazyInjectDecorator(NRService)
        public testService: NRService
    }

    const test = new LITestService
    t.true(!test.testService)

    context.register(NRService)
    t.true(test.testService instanceof NRService)
})

test('lazyInject decorator, always option true.', t => {
    @registerDecorator()
    class NRService { }
    class LITestService {
        @lazyInjectDecorator(NRService, true)
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
    context.remove(NRService)
    t.true(!test.testService)
})

test('lazyInject decorator, always option false.', t => {
    @registerDecorator()
    class NRService { }
    class LITestService {
        @lazyInjectDecorator(NRService, false)
        public testService: NRService
    }

    const test = new LITestService
    t.true(test.testService instanceof NRService)
    context.remove(NRService)
    t.false(!test.testService)
})