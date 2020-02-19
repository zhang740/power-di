import test from 'ava';
import { IocContext, NotfoundTypeError } from '../lib/IocContext';
import { logger, OutLevel } from '../lib/utils';
import { inject, injectable, imports } from '../lib';
import { classLoader } from '../lib/class/ClassLoader';

test('decorator, custom IocContext.', t => {
  const context = new IocContext();

  @injectable()
  class NRService { }
  @injectable()
  class LITestService {
    @inject()
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof NRService);
});

test('decorator, function IocContext.', t => {
  const context = new IocContext;

  @injectable()
  class NRService { }
  @injectable()
  class LITestService {
    @inject()
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof NRService);
});

test('decorator, default IocContext.', t => {
  @injectable()
  class NRService { }
  @injectable()
  class LITestService {
    @inject()
    public testService: NRService;
  }

  const test = IocContext.DefaultInstance.get(LITestService);
  t.true(test.testService instanceof NRService);
});

// default context, register decorators
const context = new IocContext();

test('inject decorator.', t => {
  @injectable()
  class DTestService { }
  @injectable()
  class ITestService {
    @inject({ lazy: false })
    public testService: DTestService;

    @inject({ type: DTestService, lazy: false })
    public testService2: DTestService;
  }

  const test = context.get(ITestService);
  t.true(test.testService instanceof DTestService);
  t.true(test.testService2 instanceof DTestService);
});

test('inject decorator, no data.', t => {
  class NRService { }
  @injectable()
  class ITestService {
    @inject({ lazy: false, optional: true })
    public testService: NRService;
  }

  t.true(!context.get(ITestService).testService);
});

test('inject decorator, must have instance.', t => {
  class NRService { }
  @injectable()
  class ITestService {
    @inject({ lazy: false })
    public testService: NRService;
  }

  t.throws(() => !context.get(ITestService).testService, err => {
    return err instanceof NotfoundTypeError;
  });
});

test('lazyInject decorator.', t => {
  @injectable()
  class DTestService { }
  @injectable()
  class LITestService {
    @inject()
    public testService: DTestService;

    @inject({ type: DTestService })
    public testService2: DTestService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof DTestService);
  t.true(test.testService2 instanceof DTestService);
});

test('lazyInject decorator, no data.', t => {
  class NRService { }
  @injectable()
  class LITestService {
    @inject({ optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(!test.testService);
});

test('lazyInject decorator, no data, then have.', t => {
  class NRService { }
  @injectable()
  class LITestService {
    @inject({ optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(!test.testService);

  context.register(NRService);
  t.true(test.testService instanceof NRService);
});

test('lazyInject decorator, always option true.', t => {
  @injectable()
  class NRService { }
  @injectable()
  class LITestService {
    @inject({ always: true })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof NRService);
  t.true(test.testService === test.testService);

  const old = test.testService;
  context.remove(NRService);
  t.true(test.testService !== old);
});

test('lazyInject decorator, always option false.', t => {
  @injectable()
  class NRService { }
  @injectable()
  class LITestService {
    @inject({ always: false })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(test.testService instanceof NRService);
  context.remove(NRService);
  t.true(test.testService instanceof NRService);
});

test('lazyInject decorator, imports.', t => {
  class A { }
  @injectable()
  class B extends A { }
  @injectable()
  class C extends A { }
  @injectable()
  class LITestService {
    @inject()
    public b: B;

    @imports({ type: A })
    public testService: A[];

    @imports({ type: A })
    public testServiceAgain: A[];
  }

  t.throws(() => {
    @injectable()
    class LITestService {
      @imports({ type: A })
      public testService: A; // need Array
    }
  });

  const test = context.get(LITestService);
  t.true(test.b instanceof B);
  t.true(test.testService.length === 2);
  t.true(test.testService[0] instanceof B);
  t.true(test.testService[1] instanceof C);
  t.true(test.testServiceAgain.length === 2);
  t.true(test.testService === test.testServiceAgain);
  t.deepEqual(test.testService, test.testServiceAgain);
});

test('lazyInject decorator, defaultValue, auto optional.', t => {

  class NRService { }
  const defaultValue = new NRService();

  class LITestService {
    @inject()
    public testService: NRService = defaultValue;
  }

  const context = new IocContext;
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(test.testService === defaultValue);

  const value2 = new NRService();
  test.testService = value2;
  t.true(test.testService === value2);
});

test('inject decorator, setter.', t => {

  class NRService { }

  class LITestService {
    @inject({ lazy: false })
    public testService: NRService;
  }

  const context = new IocContext;
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(!!test.testService);
  const oldService = test.testService;

  const newService = new NRService;
  test.testService = newService;

  t.true(test.testService !== oldService);
  t.true(test.testService === newService);
});

test('lazyInject decorator, setter.', t => {

  class NRService { }

  class LITestService {
    @inject()
    public testService: NRService;
  }

  const context = new IocContext;
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(!!test.testService);
  const oldService = test.testService;

  const newService = new NRService;
  test.testService = newService;

  t.true(test.testService !== oldService);
  t.true(test.testService === newService);
});

test('multi level inject.', t => {
  class A {
    echo() {
      return 'a';
    }
  }
  class B {
    @inject()
    a: A;
  }
  class C {
    @inject()
    b: B;
  }

  const ctx = new IocContext({ autoRegisterSelf: true });
  const c = ctx.get(C);
  t.is(c.b.a.echo(), 'a');
});
