import { test as vitestTest, expect, beforeEach } from 'vitest';
import {
  IocContext,
  NotfoundTypeError,
  inject,
  classInfo,
  injectable,
  imports,
  postConstruct,
  preDestroy,
} from '@power-di/di';
import { aspect } from '@power-di/aspect';
import { FunctionContext, getMetadataField } from '@power-di/class-loader';
import co = require('co');

const test = (name: string, fn: (t: any) => any) => vitestTest(name, () => fn(createAssert()));

function createAssert() {
  return {
    true: (value: any) => expect(value).toBe(true),
    false: (value: any) => expect(value).toBe(false),
    is: (value: any, expected: any) => expect(value).toBe(expected),
    deepEqual: (value: any, expected: any) => expect(value).toEqual(expected),
    throws: (fn: () => any, opts?: any, message?: string) => {
      if (message) {
        return expect(fn).toThrow(message);
      }
      if (opts?.instanceOf) {
        return expect(fn).toThrow(opts.instanceOf);
      }
      return expect(fn).toThrow();
    },
    notThrows: (fn: () => any) => expect(fn).not.toThrow(),
    throwsAsync: async (fn: () => Promise<any>) => {
      await expect(fn()).rejects.toThrow();
    },
    notThrowsAsync: async (fn: () => Promise<any>) => {
      await expect(fn()).resolves.toBeUndefined();
    },
    pass: () => expect(true).toBe(true),
    assert: (value: any) => expect(!!value).toBe(true),
    fail: () => expect(false).toBe(true),
  };
}

test('decorator, custom IocContext.', t => {
  const context = new IocContext();

  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof NRService);
});

test('decorator, function IocContext.', t => {
  const context = new IocContext();

  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof NRService);
});

test('decorator, default IocContext.', t => {
  @injectable()
  class NRService {}

  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = IocContext.DefaultInstance.get(LITestService);
  t.true(test.testService instanceof NRService);
});

let context: IocContext;

beforeEach(() => {
  context = new IocContext();
});

test('inject decorator.', t => {
  @injectable()
  class DTestService {}
  @injectable()
  class ITestService {
    @inject({ type: DTestService, lazy: false })
    public testService: DTestService;

    @inject({ type: DTestService, lazy: false })
    public testService2: DTestService;
  }

  const test = context.get(ITestService);
  t.true(test.testService instanceof DTestService);
  t.true(test.testService2 instanceof DTestService);
});

test('inject decorator, without reflect-metadata.', t => {
  @injectable()
  class DTestService {}
  @injectable()
  class ITestService {
    @inject({ type: DTestService, lazy: false })
    public testService: DTestService;
  }

  const test = context.get(ITestService);
  t.true(test.testService instanceof DTestService);
});

test('inject decorator, no data.', t => {
  class NRService {}
  @injectable()
  class ITestService {
    @inject({ type: NRService, lazy: false, optional: true })
    public testService: NRService;
  }

  t.true(!context.get(ITestService).testService);
});

test('inject decorator, constructor error.', t => {
  @injectable()
  class NRService {
    constructor() {
      throw new Error('test error');
    }
  }
  @injectable()
  class ITestService {
    @inject({ type: NRService, lazy: false, optional: true })
    public testService: NRService;
  }

  t.throws(() => !context.get(ITestService).testService, null, 'test error');
});

test('inject decorator, must have instance.', t => {
  class NRService {}
  @injectable()
  class ITestService {
    @inject({ type: NRService, lazy: false })
    public testService: NRService;
  }

  t.throws(() => !context.get(ITestService).testService, {
    instanceOf: NotfoundTypeError,
  });
});

test('lazyInject decorator.', t => {
  @injectable()
  class DTestService {}
  @injectable()
  class LITestService {
    @inject({ type: DTestService })
    public testService: DTestService;

    @inject({ type: DTestService })
    public testService2: DTestService;
  }

  const test = context.get(LITestService);
  t.true(test.testService instanceof DTestService);
  t.true(test.testService2 instanceof DTestService);
});

test('lazyInject decorator, no data.', t => {
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(!test.testService);
});

test('lazyInject decorator, no data, then have.', t => {
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(!test.testService);

  context.register(NRService);
  t.true(test.testService instanceof NRService);
});

test('lazyInject decorator, always option true.', t => {
  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, always: true })
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
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, always: false })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.true(test.testService instanceof NRService);
  context.remove(NRService);
  t.true(test.testService instanceof NRService);
});

test('lazyInject decorator, imports.', t => {
  abstract class A {}
  @classInfo()
  class B extends A {}
  @classInfo()
  class C extends A {}
  @injectable()
  class LITestService {
    @imports({ type: A })
    public testService: A[];

    @imports({ type: A })
    public testServiceAgain: A[];
  }

  const test = context.get(LITestService);
  t.true(test.testService.length === 2);
  t.true(test.testService[0] instanceof B);
  t.true(test.testService[1] instanceof C);
  t.true(test.testServiceAgain.length === 2);
  t.true(test.testService === test.testServiceAgain);
  t.deepEqual(test.testService, test.testServiceAgain);
});

test('lazyInject decorator, defaultValue, auto optional.', t => {
  class NRService {}
  const defaultValue = new NRService();

  class LITestService {
    @inject({ type: NRService })
    public testService: NRService = defaultValue;
  }

  const context = new IocContext();
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(test.testService === defaultValue);

  const value2 = new NRService();
  test.testService = value2;
  t.true(test.testService === value2);
});

test('inject decorator, setter.', t => {
  class NRService {}

  class LITestService {
    @inject({ type: NRService, lazy: false })
    public testService: NRService;
  }

  const context = new IocContext();
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(!!test.testService);
  const oldService = test.testService;

  const newService = new NRService();
  test.testService = newService;

  t.true(test.testService !== oldService);
  t.true(test.testService === newService);
});

test('lazyInject decorator, setter.', t => {
  class NRService {}

  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const context = new IocContext();
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.true(!!test.testService);
  const oldService = test.testService;

  const newService = new NRService();
  test.testService = newService;

  t.true(test.testService !== oldService);
  t.true(test.testService === newService);
});

test('multi level inject.', t => {
  @injectable()
  class X {
    name = 'x';
  }
  @injectable()
  class Y {
    name = 'y';
  }

  @injectable()
  class Base {
    @inject({ type: X })
    service: X;
  }
  @injectable()
  class Test extends Base {
    @inject({ type: Y })
    service: Y;
  }

  const context = new IocContext();
  context.register(Base);
  t.deepEqual('x', context.get(Base).service.name, 'Base');
  t.deepEqual('y', context.get(Test).service.name, 'Test');
});

test('inject, opt default.', t => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }

  const context = new IocContext({
    defaultInjectOptions: {
      optional: true,
    },
  });

  context.register(B);
  t.true(context.get(B) instanceof B);
});

test('inject decorator, opt.', t => {
  class DTestService {}
  class ITestService {
    @inject({ type: DTestService, lazy: false })
    public testService: DTestService;

    @inject({ type: DTestService, lazy: false })
    public testService2: DTestService;
  }

  const context = new IocContext({
    defaultInjectOptions: {
      optional: true,
    },
  });
  context.register(ITestService);
  const test = context.get(ITestService);
  t.true(test.testService === undefined);
  t.true(test.testService2 === undefined);
});

test('postConstruct, after inject.', t => {
  @injectable()
  class B {
    id = 1;
  }

  @injectable()
  class A {
    @inject({ type: B })
    b: B;

    @postConstruct()
    init() {
      t.true(this.b.id === 1);
    }
  }

  const ioc = new IocContext();
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
  const ioc = new IocContext();
  ioc.inject(a);
  t.true(count === 2);
});

test('postConstruct, parent and subClass.', t => {
  let count = 0;

  class A {
    test = 1;

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

  const ioc = new IocContext();
  ioc.get(B);
  t.is(count, 1);

  @injectable()
  class C extends B {
    @postConstruct()
    init2() {
      count++;

      t.deepEqual(this.test, 1);
    }
  }

  ioc.get(C);
  t.is(count, 3);
});

test('class inject use interface.', t => {
  abstract class AInterface {}
  const BInterface = Symbol('BInterface');
  interface BInterface {}

  @classInfo({ implements: [AInterface] })
  @injectable()
  class A implements AInterface {}

  @injectable()
  @classInfo({ implements: [BInterface] })
  class B implements BInterface {}

  const ioc = new IocContext();
  t.true(ioc.get(AInterface) instanceof A);
  t.true(ioc.get<BInterface>(BInterface) instanceof B);
});

test('throw error when inject Object/undefined.', t => {
  interface AInterface {}
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
        },
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
        },
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
        },
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aspect()
    *a() {
      return 'oka';
    }

    @aAspect()
    *b(x: string) {
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
      return aspect<{ before: string }>({
        before: ctx => {
          ctx.data.before = 'before';
        },
        after: ctx => {
          t.deepEqual(ctx.data.before, 'before');
          aspectFnCtx = ctx;
        },
        error: ctx => {
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        },
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
      return aspect<{ before: string }>({
        before: ctx => {
          ctx.data.before = 'before';
        },
        after: ctx => {
          t.deepEqual(ctx.data.before, 'before');
          aspectFnCtx = ctx;
        },
        error: ctx => {
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        },
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
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: ctx => {
          ctx.err = undefined;
        },
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()
    *a() {
      throw new Error();
    }
    @ignoreErr()
    *b() {
      throw new Error();
    }
  }

  const context = new IocContext();
  const a = context.get(A);

  await t.throwsAsync(() =>
    co(function* () {
      return yield a.a();
    })
  );
  t.true(aspectFnCtx.err instanceof Error);
  await t.notThrowsAsync(() =>
    co(function* () {
      return yield a.b();
    })
  );
});

test('aspect, skipRunning', async t => {
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: ctx => {
          if (ctx.args[0] === 'xxx') {
            ctx.ret = 'yyy';
            ctx.skipRunning = true;
          }
        },
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()
    a(str: string) {
      return str;
    }

    @aAspect()
    *b(str: string) {
      return str;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.deepEqual(a.a('oka'), 'oka');
  t.deepEqual(a.a('xxx'), 'yyy');
  t.deepEqual(
    await co(function* () {
      return yield a.b('oka');
    }),
    'oka' as any
  );
  t.deepEqual(
    await co(function* () {
      return yield a.b('xxx');
    }),
    'yyy' as any
  );
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

  const ioc = new IocContext();
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

  const ioc = new IocContext();
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

test('metadata', t => {
  @injectable()
  class A {}
  @injectable()
  class B extends A {}

  t.deepEqual(getMetadataField(A, 'injectable'), true);

  t.deepEqual(getMetadataField(B, 'injectable'), true);
});

test('constructor inject', t => {
  const ioc = new IocContext();

  @injectable()
  class A {
    getMessage() {
      return 'Hello from A';
    }
  }

  @injectable()
  class B {
    constructor(a: A) {
      t.assert(a instanceof A);
      t.is(a.getMessage(), 'Hello from A');
    }
  }

  Reflect.defineMetadata('design:paramtypes', [A], B);
  ioc.get(B);
});
