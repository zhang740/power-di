import test from 'ava';
import { IocContext, NotfoundTypeError } from '../lib/IocContext';
import { inject, classInfo, injectable, imports, postConstruct, aspect } from '../lib';
import { FunctionContext } from '../lib/class/metadata';
import * as co from 'co';
import { preDestroy } from '../lib/decorator/preDestroy';

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

  t.throws(() => !context.get(ITestService).testService, {
    instanceOf: NotfoundTypeError
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
  abstract class A { }
  @classInfo()
  class B extends A { }
  @classInfo()
  class C extends A { }
  @injectable()
  class LITestService {
    @imports({ type: A })
    public testService: A[];

    @imports({ type: A })
    public testServiceAgain: A[];
  }

  t.throws(() => {
    class LITestService {
      @imports({ type: A })
      public testService: A; // need Array
    }
  });

  const test = context.get(LITestService);
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

test('postConstruct.', t => {
  @injectable()
  class A {
    @postConstruct()
    init() {
      t.pass();
    }
  }

  const ioc = new IocContext;
  ioc.get(A);
});

test('postConstruct, after inject.', t => {
  @injectable()
  class B {
    id = 1;
  }

  @injectable()
  class A {
    @inject()
    b: B;

    @postConstruct()
    init() {
      t.true(this.b.id === 1);
    }
  }

  const ioc = new IocContext;
  ioc.get(A);
});

test('postConstruct, without get.', t => {
  let count = 0;
  @injectable()
  class A {
    constructor() {
      count++;
    }
    @postConstruct()
    init() {
      count++;
    }
  }

  const a = new A();
  const ioc = new IocContext;
  ioc.inject(a);
  t.true(count === 2);
});

test('postConstruct, parent and subClass.', t => {
  let count = 0;

  class A {
    @postConstruct()
    init() {
      t.fail();
    }
  }

  @injectable()
  class B extends A {
    @postConstruct()
    init() {
      count++;
    }
  }

  const ioc = new IocContext;
  ioc.get(B);
  t.is(count, 1);

  @injectable()
  class C extends B {
    @postConstruct()
    init2() {
      count++;
    }
  }

  ioc.get(C);
  t.is(count, 3);
});

test('class inject use interface.', t => {
  abstract class AInterface { }
  const BInterface = Symbol('BInterface');
  interface BInterface { }

  @classInfo({ implements: [AInterface] })
  @injectable()
  class A implements AInterface { }

  @injectable()
  @classInfo({ implements: [BInterface] })
  class B implements BInterface { }

  const ioc = new IocContext;
  t.true(ioc.get(AInterface) instanceof A);
  t.true(ioc.get(BInterface) instanceof B);
});

test('throw error when inject Object/undefined.', t => {
  interface AInterface { }
  const AInterface = Symbol('AInterface');

  t.throws(() => {
    class Test {
      @inject()
      a: AInterface;
    }
  });
});

test('aspect', t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: ctx => {
          ctx.data.before = 'before';
        },
        after: ctx => {
          t.deepEqual(ctx.data.before, 'before');
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aspect()
    a() {
      return 'oka';
    }

    @aAspect()
    b(x: string) {
      return 'okb' + x;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.deepEqual(a.a(), 'oka');

  t.deepEqual(a.b('!'), 'okb!');
  t.true(aspectFnCtx.ioc instanceof IocContext);
  t.true(aspectFnCtx.inst instanceof A);
  t.deepEqual(aspectFnCtx.functionName, 'b');
  t.deepEqual(aspectFnCtx.data, { before: 'before' });
  t.deepEqual(aspectFnCtx.args, ['!']);
  t.deepEqual(aspectFnCtx.ret, 'okb!');
});

test('aspect, promise', async t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: ctx => {
          ctx.data.before = 'before';
        },
        after: ctx => {
          t.deepEqual(ctx.data.before, 'before');
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aspect()
    async a() {
      return 'oka';
    }

    @aAspect()
    async b(x: string) {
      return 'okb' + x;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.deepEqual(await a.a(), 'oka');

  t.deepEqual(await a.b('!'), 'okb!');
  t.true(aspectFnCtx.ioc instanceof IocContext);
  t.true(aspectFnCtx.inst instanceof A);
  t.deepEqual(aspectFnCtx.functionName, 'b');
  t.deepEqual(aspectFnCtx.data, { before: 'before' });
  t.deepEqual(aspectFnCtx.args, ['!']);
  t.deepEqual(aspectFnCtx.ret, 'okb!');
});

test('aspect, generator', async t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: ctx => {
          ctx.data.before = 'before';
        },
        after: ctx => {
          t.deepEqual(ctx.data.before, 'before');
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aspect()
    * a() {
      return 'oka';
    }

    @aAspect()
    * b(x: string) {
      return 'okb' + x;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  await co(function* () {
    t.deepEqual(yield a.a(), 'oka');

    t.deepEqual(yield a.b('!'), 'okb!');
    t.true(aspectFnCtx.ioc instanceof IocContext);
    t.true(aspectFnCtx.inst instanceof A);
    t.deepEqual(aspectFnCtx.functionName, 'b');
    t.deepEqual(aspectFnCtx.data, { before: 'before' });
    t.deepEqual(aspectFnCtx.args, ['!']);
    t.deepEqual(aspectFnCtx.ret, 'okb!');
  });
});

test('aspect, error', t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()
    a() {
      throw new Error();
    }
    @ignoreErr()
    b() {
      throw new Error();
    }
  }

  const context = new IocContext();
  const a = context.get(A);

  t.throws(() => a.a());
  t.true(aspectFnCtx.err instanceof Error);
  t.notThrows(() => a.b());
});

test('aspect, error, promise', async t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()
    async a() {
      throw new Error();
    }
    @ignoreErr()
    async b() {
      throw new Error();
    }
  }

  const context = new IocContext();
  const a = context.get(A);

  await t.throwsAsync(() => a.a());
  t.true(aspectFnCtx.err instanceof Error);
  await t.notThrowsAsync(() => a.b());
});

test('aspect, error, generator', async t => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          aspectFnCtx = ctx;
        }
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        }
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()
    * a() {
      throw new Error();
    }
    @ignoreErr()
    * b() {
      throw new Error();
    }
  }

  const context = new IocContext();
  const a = context.get(A);

  await t.throwsAsync(() => co(function* () {
    return yield a.a();
  }));
  t.true(aspectFnCtx.err instanceof Error);
  await t.notThrowsAsync(() => co(function* () {
    return yield a.b();
  }));
});

test('preDestroy.', t => {
  let count = 0;
  @injectable()
  class A {
    @preDestroy()
    destroy() {
      count++;
    }
  }

  const ioc = new IocContext;
  ioc.register(A);
  ioc.clear();
  t.is(count, 0);

  t.true(ioc.get(A) instanceof A);
  ioc.remove(A);
  t.is(count, 1);
  t.false(ioc.has(A));

  t.true(ioc.get(A) instanceof A);
  ioc.clear();
  t.is(count, 2);
  t.false(ioc.has(A));
});

test('preDestroy, parent and subClass.', t => {
  let count = 0;

  class A {
    @preDestroy()
    destroy() {
      t.fail();
    }
  }

  @injectable()
  class B extends A {
    @preDestroy()
    destroy() {
      count++;
    }
  }

  const ioc = new IocContext;
  ioc.get(B);
  ioc.clear();
  t.is(count, 1);

  @injectable()
  class C extends B {
    @preDestroy()
    destroy2() {
      count++;
    }
  }

  ioc.get(C);
  ioc.clear();
  t.is(count, 3);
});
