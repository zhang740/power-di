import type { FunctionContext } from '@power-di/class-loader';
import { getMetadataField } from '@power-di/class-loader';
import { beforeEach, expect, it } from 'vitest';
import {
  aspect,
  classInfo,
  imports,
  inject,
  injectable,
  IocContext,
  NotfoundTypeError,
  postConstruct,
  preDestroy,
} from '../src';
import { co } from './co';

async function throwsAsync(fn: () => Promise<any>) {
  await expect(fn()).rejects.toThrow();
}

async function notThrowsAsync(fn: () => Promise<any>) {
  await expect(fn()).resolves.toBeUndefined();
}

it('decorator, custom IocContext.', (t) => {
  const context = new IocContext();

  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.expect(test.testService instanceof NRService).toBe(true);
});

it('decorator, function IocContext.', (t) => {
  const context = new IocContext();

  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.expect(test.testService instanceof NRService).toBe(true);
});

it('decorator, default IocContext.', (t) => {
  @injectable()
  class NRService {}

  @injectable()
  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const test = IocContext.DefaultInstance.get(LITestService);
  t.expect(test.testService instanceof NRService).toBe(true);
});

let context: IocContext;

beforeEach(() => {
  context = new IocContext();
});

it('inject decorator.', (t) => {
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
  t.expect(test.testService instanceof DTestService).toBe(true);
  t.expect(test.testService2 instanceof DTestService).toBe(true);
});

it('inject decorator, without reflect-metadata.', (t) => {
  @injectable()
  class DTestService {}
  @injectable()
  class ITestService {
    @inject({ type: DTestService, lazy: false })
    public testService: DTestService;
  }

  const test = context.get(ITestService);
  t.expect(test.testService instanceof DTestService).toBe(true);
});

it('inject decorator, no data.', (t) => {
  class NRService {}
  @injectable()
  class ITestService {
    @inject({ type: NRService, lazy: false, optional: true })
    public testService: NRService;
  }

  t.expect(!context.get(ITestService).testService).toBe(true);
});

it('inject decorator, constructor error.', (t) => {
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

  t.expect(() => !context.get(ITestService).testService).toThrow('test error');
});

it('inject decorator, must have instance.', (t) => {
  class NRService {}
  @injectable()
  class ITestService {
    @inject({ type: NRService, lazy: false })
    public testService: NRService;
  }

  t.expect(() => !context.get(ITestService).testService).toThrowError(NotfoundTypeError);
});

it('lazyInject decorator.', (t) => {
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
  t.expect(test.testService instanceof DTestService).toBe(true);
  t.expect(test.testService2 instanceof DTestService).toBe(true);
});

it('lazyInject decorator, no data.', (t) => {
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.expect(!test.testService).toBe(true);
});

it('lazyInject decorator, no data, then have.', (t) => {
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, optional: true })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.expect(!test.testService).toBe(true);

  context.register(NRService);
  t.expect(test.testService instanceof NRService).toBe(true);
});

it('lazyInject decorator, always option true.', (t) => {
  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, always: true })
    public testService: NRService;
  }

  const test = context.get(LITestService);
  t.expect(test.testService instanceof NRService).toBe(true);
  t.expect(test.testService === test.testService).toBe(true);

  const old = test.testService;
  context.remove(NRService);
  t.expect(test.testService !== old).toBe(true);
});

it('lazyInject decorator, always option false.', (t) => {
  @injectable()
  class NRService {}
  @injectable()
  class LITestService {
    @inject({ type: NRService, always: false })
    public testService: NRService;
  }

  const test = context.get<LITestService>(LITestService);
  t.expect(test.testService instanceof NRService).toBe(true);
  context.remove(NRService);
  t.expect(test.testService instanceof NRService).toBe(true);
});

it('lazyInject decorator, imports.', (t) => {
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
  t.expect(test.testService.length === 2).toBe(true);
  t.expect(test.testService[0] instanceof B).toBe(true);
  t.expect(test.testService[1] instanceof C).toBe(true);
  t.expect(test.testServiceAgain.length === 2).toBe(true);
  t.expect(test.testService === test.testServiceAgain).toBe(true);
  t.expect(test.testService).toEqual(test.testServiceAgain);
});

it('lazyInject decorator, defaultValue, auto optional.', (t) => {
  class NRService {}
  const defaultValue = new NRService();

  class LITestService {
    @inject({ type: NRService })
    public testService: NRService = defaultValue;
  }

  const context = new IocContext();
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.expect(test.testService === defaultValue).toBe(true);

  const value2 = new NRService();
  test.testService = value2;
  t.expect(test.testService === value2).toBe(true);
});

it('inject decorator, setter.', (t) => {
  class NRService {}

  class LITestService {
    @inject({ type: NRService, lazy: false })
    public testService: NRService;
  }

  const context = new IocContext();
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.expect(!!test.testService).toBe(true);
  const oldService = test.testService;

  const newService = new NRService();
  test.testService = newService;

  t.expect(test.testService !== oldService).toBe(true);
  t.expect(test.testService === newService).toBe(true);
});

it('lazyInject decorator, setter.', (t) => {
  class NRService {}

  class LITestService {
    @inject({ type: NRService })
    public testService: NRService;
  }

  const context = new IocContext();
  context.register(NRService);
  context.register(LITestService);

  const test = context.get<LITestService>(LITestService);
  t.expect(!!test.testService).toBe(true);
  const oldService = test.testService;

  const newService = new NRService();
  test.testService = newService;

  t.expect(test.testService !== oldService).toBe(true);
  t.expect(test.testService === newService).toBe(true);
});

it('multi level inject.', (t) => {
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
    declare service: Y;
  }

  const context = new IocContext();
  context.register(Base);
  t.expect('x', context.get(Base).service.name);
  t.expect('y', context.get(Test).service.name);
});

it('inject, opt default.', (t) => {
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
  t.expect(context.get(B) instanceof B).toBe(true);
});

it('inject decorator, opt.', (t) => {
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
  t.expect(test.testService === undefined).toBe(true);
  t.expect(test.testService2 === undefined).toBe(true);
});

it('postConstruct, after inject.', (t) => {
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
      t.expect(this.b.id === 1).toBe(true);
    }
  }

  const ioc = new IocContext();
  ioc.get(A);
});

it('postConstruct, without get.', (t) => {
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
  t.expect(count === 2).toBe(true);
});

it('postConstruct, parent and subClass.', (t) => {
  let count = 0;

  class A {
    test = 1;

    @postConstruct()
    init() {
      t.expect(false).toBe(true);
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
  t.expect(count === 1).toBe(true);

  @injectable()
  class C extends B {
    @postConstruct()
    init2() {
      count++;

      t.expect(this.test).toBe(1);
    }
  }

  ioc.get(C);
  t.expect(count === 3).toBe(true);
});

it('class inject use interface.', (t) => {
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
  t.expect(ioc.get(AInterface) instanceof A).toBe(true);
  t.expect(ioc.get<BInterface>(BInterface) instanceof B).toBe(true);
});

it('throw error when inject Object/undefined.', (t) => {
  interface AInterface {}
  const AInterface = Symbol('AInterface');

  t.expect(() => {
    class Test {
      @inject()
      a: AInterface;
    }
  });
});

it('aspect', (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
          ctx.data.before = 'before';
        },
        after: (ctx) => {
          t.expect(ctx.data.before).toBe('before');
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
      return `okb${x}`;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.expect(a.a()).toBe('oka');

  t.expect(a.b('!')).toBe('okb!');
  t.expect(aspectFnCtx.ioc instanceof IocContext).toBe(true);
  t.expect(aspectFnCtx.inst instanceof A).toBe(true);
  t.expect(aspectFnCtx.functionName).toBe('b');
  t.expect(aspectFnCtx.data).toEqual({ before: 'before' });
  t.expect(aspectFnCtx.args).toEqual(['!']);
  t.expect(aspectFnCtx.ret).toBe('okb!');
});

it('aspect, promise', async (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
          ctx.data.before = 'before';
        },
        after: (ctx) => {
          t.expect(ctx.data.before).toBe('before');
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
      return `okb${x}`;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.expect(await a.a()).toBe('oka');

  t.expect(await a.b('!')).toBe('okb!');
  t.expect(aspectFnCtx.ioc instanceof IocContext).toBe(true);
  t.expect(aspectFnCtx.inst instanceof A).toBe(true);
  t.expect(aspectFnCtx.functionName).toBe('b');
  t.expect(aspectFnCtx.data).toEqual({ before: 'before' });
  t.expect(aspectFnCtx.args).toEqual(['!']);
  t.expect(aspectFnCtx.ret).toBe('okb!');
});

it('aspect, generator', async (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
          ctx.data.before = 'before';
        },
        after: (ctx) => {
          t.expect(ctx.data.before).toBe('before');
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aspect()* a() {
      return 'oka';
    }

    @aAspect()* b(x: string) {
      return `okb${x}`;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  await co(function* () {
    t.expect(yield a.a()).toBe('oka');

    t.expect(yield a.b('!')).toBe('okb!');
    t.expect(aspectFnCtx.ioc instanceof IocContext).toBe(true);
    t.expect(aspectFnCtx.inst instanceof A).toBe(true);
    t.expect(aspectFnCtx.functionName).toBe('b');
    t.expect(aspectFnCtx.data).toEqual({ before: 'before' });
    t.expect(aspectFnCtx.args).toEqual(['!']);
    t.expect(aspectFnCtx.ret).toBe('okb!');
  });
});

it('aspect, error', (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
          ctx.data.before = 'before';
        },
        after: (ctx) => {
          t.expect(ctx.data.before).toBe('before');
          aspectFnCtx = ctx;
        },
        error: (ctx) => {
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: (ctx) => {
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

  t.expect(() => a.a()).toThrowError(Error);
  t.expect(aspectFnCtx.err instanceof Error).toBe(true);
  t.expect(() => a.b()).not.toThrowError(Error);
});

it('aspect, error, promise', async (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
          ctx.data.before = 'before';
        },
        after: (ctx) => {
          t.expect(ctx.data.before).toBe('before');
          aspectFnCtx = ctx;
        },
        error: (ctx) => {
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: (ctx) => {
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

  await throwsAsync(() => a.a());
  t.expect(aspectFnCtx.err instanceof Error).toBe(true);
  await notThrowsAsync(() => a.b());
});

it('aspect, error, generator', async (t) => {
  let aspectFnCtx: FunctionContext;
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: (ctx) => {
          aspectFnCtx = ctx;
        },
      })(target, key, desc);
    };
  }
  function ignoreErr(): MethodDecorator {
    return (target, key, desc) => {
      return aspect({
        error: (ctx) => {
          ctx.err = undefined;
        },
      })(target, key, desc);
    };
  }

  @injectable()
  class A {
    @aAspect()* a() {
      throw new Error();
    }

    @ignoreErr()* b() {
      throw new Error();
    }
  }

  const context = new IocContext();
  const a = context.get(A);

  await throwsAsync(() =>
    co(function* () {
      return yield a.a();
    }),
  );
  t.expect(aspectFnCtx.err instanceof Error).toBe(true);
  await notThrowsAsync(() =>
    co(function* () {
      return yield a.b();
    }),
  );
});

it('aspect, skipRunning', async (t) => {
  function aAspect(): MethodDecorator {
    return (target, key, desc) => {
      return aspect<{ before: string }>({
        before: (ctx) => {
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

    @aAspect()* b(str: string) {
      return str;
    }
  }

  const context = new IocContext();
  const a = context.get(A);
  t.expect(a.a('oka')).toBe('oka');
  t.expect(a.a('xxx')).toBe('yyy');
  t.expect(
    await co(function* () {
      return yield a.b('oka');
    }),
    'oka',
  );
  t.expect(
    await co(function* () {
      return yield a.b('xxx');
    }),
    'yyy',
  );
});

it('preDestroy.', (t) => {
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
  t.expect(count).toBe(0);

  t.expect(ioc.get(A) instanceof A).toBe(true);
  ioc.remove(A);
  t.expect(count).toBe(1);
  t.expect(!ioc.has(A)).toBe(true);

  t.expect(ioc.get(A) instanceof A).toBe(true);
  ioc.clear();
  t.expect(count).toBe(2);
  t.expect(!ioc.has(A)).toBe(true);
});

it('preDestroy, parent and subClass.', (t) => {
  let count = 0;

  class A {
    @preDestroy()
    destroy() {
      t.expect(false).toBe(true);
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
  t.expect(count).toBe(1);

  @injectable()
  class C extends B {
    @preDestroy()
    destroy2() {
      count++;
    }
  }

  ioc.get(C);
  ioc.clear();
  t.expect(count).toBe(3);
});

it('metadata', (t) => {
  @injectable()
  class A {}
  @injectable()
  class B extends A {}

  t.expect(getMetadataField(A, 'injectable')).toBe(true);

  t.expect(getMetadataField(B, 'injectable')).toBe(true);
});

it('constructor inject', (t) => {
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
      t.expect(a instanceof A).toBe(true);
      t.expect(a.getMessage()).toBe('Hello from A');
    }
  }

  Reflect.defineMetadata('design:paramtypes', [A], B);
  ioc.get(B);
});
