import { test as vitestTest, expect } from 'vitest';
import {
  IocContext,
  inject,
  NotfoundTypeError,
  injectable,
  MultiImplementError,
  classInfo,
  postConstruct,
  preDestroy,
} from '@power-di/di';
import { classLoader, ClassLoader } from '@power-di/class-loader';
import { TestService as TS2 } from './base.test';

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

class TestService {}

test('default instance.', t => {
  t.true(IocContext.DefaultInstance instanceof IocContext);
});

test('register component error case.', t => {
  enum INJECTTYPE {
    test,
  }

  const context = new IocContext();
  t.throws(() => context.register(undefined));
  t.throws(() => context.register(123123));
  t.throws(() => context.register({}));
  t.throws(() => context.register({}, 123123 as any));
  t.throws(() => context.register({}, INJECTTYPE.test as any));
  t.throws(() => context.get('TEST'), { instanceOf: NotfoundTypeError });
});

test('register component by class.', t => {
  const context = new IocContext();
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);
});

test('register component by class, symbol.', t => {
  const context = new IocContext();
  const service = Symbol('TestService');
  context.register(TestService, service);
  t.true((context.get(service) as any) instanceof TestService);
});

test('register component by class, no new.', t => {
  const context = new IocContext();
  context.register(TestService, TestService, { autoNew: false });
  t.true(!(context.get(TestService) instanceof TestService));
});

test('register component by class, singleton', t => {
  const context = new IocContext();
  context.register(TestService, TestService, { singleton: false });
  t.true(context.get(TestService) instanceof TestService);
  t.true(context.get(TestService) !== context.get(TestService));
});

test('register component by class, singleton', t => {
  const context = new IocContext();
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);
  t.true(context.get(TestService) === context.get(TestService));
});

test('register component by value.', t => {
  const context = new IocContext();
  context.register(1, TestService);
  t.true(context.get(TestService) === 1);
  t.throws(() => context.register(2, TestService));
});

test('register component by value, no auto new.', t => {
  const context = new IocContext();
  context.register(TestService, TestService, { autoNew: false });
  t.true(!(context.get(TestService) instanceof TestService));
  t.true(context.get(TestService) === TestService);
  t.true(context.get(TestService) === context.get(TestService));
});

test('register component, autoRegisterSelf.', t => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }
  const context = new IocContext({ autoRegisterSelf: true });
  t.true(context.get(B) instanceof B);
  t.true(context.get(B).a instanceof A);
});

test('has component.', t => {
  const context = new IocContext();
  context.register(TestService);
  t.true(context.has(TestService));

  class BTest {}
  t.false(context.has(BTest));
});

test('has component, mapping.', t => {
  const context = new IocContext();

  class AService extends TestService {}

  t.false(context.has(TestService, true, true));

  context.classLoader.registerClass(AService);

  context.register(AService);
  t.true(context.has(TestService, true, true));

  context.classLoader.unregisterClass(AService);
});

test('has component, deep.', t => {
  const cl1 = new ClassLoader();
  const cl2 = new ClassLoader();

  const context = new IocContext({
    useClassLoader: cl1,
  });

  const childContext = context.createChildContext({
    useClassLoader: cl2,
  });

  class AService extends TestService {}

  cl1.registerClass(AService);

  const service = context.get(TestService);
  t.true(service instanceof AService);

  t.true(context.has(TestService, true, true));
  t.false(childContext.has(TestService, false, true));
  t.true(childContext.has(TestService, true, true));
});

test('remove component.', t => {
  const context = new IocContext();
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);
  t.deepEqual(context.remove(TestService), true);
  t.deepEqual(context.remove(TestService), false);
  t.throws(() => context.get(TestService), { instanceOf: NotfoundTypeError });
});

test('replace component.', t => {
  class BClass {}
  const context = new IocContext();
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);

  context.replace(TestService, BClass);
  t.true(context.get(TestService) instanceof BClass);

  t.throws(() => context.replace(BClass, TestService));

  context.replace(BClass, '123', undefined, true);
  t.true(context.get(BClass) === '123');
});

test('difference class with same class name.', t => {
  const context = new IocContext();
  context.register(TestService);
  context.register(TS2);
  t.true(context.get(TestService) instanceof TestService);
  t.true(context.get(TS2) instanceof TS2);
});

test('subComponent.', t => {
  class SubClass extends TestService {}

  const context = new IocContext();
  context.register(SubClass, TestService);
  t.true(context.get(TestService) instanceof SubClass);
  t.true(context.get(TestService) instanceof TestService);
  t.throws(() => context.get(SubClass), { instanceOf: NotfoundTypeError });
});

test('getSubClasses, with classLoader.', t => {
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.true(!context.getImports(AClass).length);

  classLoader.registerClass(BClass);
  classLoader.registerClass(CClass);

  const cls = context.getImports<AClass>(AClass);
  t.true(cls.length === 2);
  t.true(cls[0] instanceof BClass);
  t.true(cls[1] instanceof CClass);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

test('getSubClasses, with classLoader with implements.', t => {
  abstract class ITest {}
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.true(!context.getImports(AClass).length);

  classLoader.registerClass(BClass, { implements: [ITest] });
  classLoader.registerClass(CClass, { implements: [ITest] });

  const cls = context.getImports<AClass>(ITest);
  t.true(cls.length === 2);
  t.true(cls[0] instanceof BClass);
  t.true(cls[1] instanceof CClass);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

test('getSubClasses, with classLoader with implements.', t => {
  abstract class ITest {}
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.true(!context.getImports(AClass).length);

  classLoader.registerClass(BClass, { implements: [ITest] });
  classLoader.registerClass(CClass);

  const cls2 = context.getImports<AClass>(ITest);
  t.true(cls2.length === 1);
  t.true(cls2[0] instanceof BClass);
  t.false(cls2[0] instanceof CClass);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

test('new constructor.', t => {
  let count = 0;

  @injectable()
  class A {
    constructor() {
      count++;
    }
  }

  const context = new IocContext({ constructorInject: true });
  context.register(A);

  t.true(context.get(A) instanceof A);
  t.true(context.get(A) === context.get(A));
  t.is(count, 1);

  context.remove(A);
  context.register(A, A, { singleton: false });
  t.true(context.get(A) instanceof A);
  t.true(context.get(A) !== context.get(A));
  t.is(count, 4);
});

test('new constructor, opt.', t => {
  let count = 0;

  @injectable()
  class A {
    constructor() {
      count++;
    }
  }

  const context = new IocContext();
  context.register(A);

  t.true(context.get(A) instanceof A);
  t.true(context.get(A) === context.get(A));
  t.is(count, 1);

  t.true(context.get(A, { forceNew: true }) instanceof A);
  t.true(context.get(A, { forceNew: true }) !== context.get(A));
  t.is(count, 3);
});

test('new constructor, error type.', t => {
  class A {}
  const context = new IocContext();
  t.throws(() => context.get(A));
});

test('default value.', t => {
  class A {
    a: number = 1;
  }
  class B {
    @inject({ type: A })
    a: A;
  }
  class C {
    @inject({ type: A })
    a: A = new A();
  }

  const context = new IocContext({ autoRegisterSelf: true });
  t.true(context.get(A) instanceof A);
  t.true(context.get(B).a instanceof A);

  const c = context.get(C);
  t.true(c.a instanceof A);
});

test('default value, inject from parent.', t => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }
  class C {
    @inject({ type: A })
    a: A = new A();
  }

  const parent = new IocContext({ autoRegisterSelf: true });
  parent.register(A);

  const child = parent.createChildContext();
  t.true(child.get(A) instanceof A);
  t.true(child.get(B).a instanceof A);

  const c = child.get(C);
  t.true(c.a instanceof A);
});

test('inject, from parent.', t => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }

  const parent = new IocContext({ autoRegisterSelf: true });
  parent.register(A);

  const child = parent.createChildContext();
  t.true(child.get(A) instanceof A);
  t.true(child.get(B).a instanceof A);
});

test('inject, from parent, not found.', t => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }

  const parent = new IocContext();
  const child = parent.createChildContext();
  t.throws(() => child.get(A), { instanceOf: NotfoundTypeError });
  t.throws(() => child.get(B), { instanceOf: NotfoundTypeError });
});

test('inject, from parent, not found, optional.', t => {
  class A {}
  @injectable()
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  const child = parent.createChildContext({ newInstanceInThisContext: true });
  t.true(child.get(B) instanceof B);
});

test('inject, from parent, not found, autoNew.', t => {
  class A {}
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
  });
  t.true(child.get(B) instanceof B);
});

test('inject, from parent, not found, autoNew, value.', t => {
  class A {}
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
  });
  t.true(child.get(B) instanceof B);
  t.true(child.get(B).a === 1);
});

test('inject, from parent, not found, autoNew, value, opt.', t => {
  class A {}
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
    constructorInject: false,
  });
  t.true(child.get(B) instanceof B);
  t.true(child.get(B).a === 1);
});

test('inject, from parent, not found, autoNew, value, opt.', t => {
  class A {}
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
    constructorInject: false,
  });
  t.true(child.get(B) instanceof B);
  t.true(child.get(B).a === 1);
});

test('get, from parent, not found, autoNew, value, opt.', t => {
  class A {}

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    constructorInject: false,
  });
  t.true(child.get(A) === 1);
});

test('get, from parent, not found, autoNew, value, opt.', t => {
  class A {}

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    constructorInject: false,
  });
  t.true(child.get(A) === 1);
});

test('config, defaultInjectOptions', t => {
  const IfA = Symbol('IfA');
  interface IfA {}

  class A implements IfA {}
  class B {
    @inject({ type: IfA })
    a: IfA;
  }

  class C {
    @inject({ type: IfA })
    a: IfA;
  }

  const context = new IocContext({
    defaultInjectOptions: {
      optional: true,
    },
  });

  context.register(A, IfA);
  context.register(B);
  context.register(C);

  t.true(context.get(B).a instanceof A);
  t.true(context.get(C).a instanceof A);
});

test('config, notFoundHandler', t => {
  const context = new IocContext({
    notFoundHandler: (type: any) => {
      if (type === 'str') {
        return '123';
      }
    },
  });
  t.is(context.get('str'), '123');
});

test('config, parentContext, useClassLoader', t => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    useClassLoader: true,
  });

  t.true(child.get(A) instanceof A);
  t.throws(() => child.get(B), { instanceOf: NotfoundTypeError });
});

test('config, parentContext, no useClassLoader', t => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    useClassLoader: false,
  });

  t.true(child.get(A) instanceof A);
  t.throws(() => child.get(B), { instanceOf: NotfoundTypeError });
});

test('config, parentContext, autoRegisterSelf', t => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
  });

  t.true(child.get(A) instanceof A);
  t.true(child.get(B) instanceof B);
});

test('config, parentContext, newInstanceInThisContext', t => {
  class A {}
  @injectable()
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.true(a === a1);

  const b = child.get(B);
  const b1 = child.get(B);
  t.true(b === b1);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.true(child2.get(A) === child.get(A));
  t.true(child2.get(B) !== child.get(B));
});

test('config, parentContext, newInstanceInThisContext, no default', t => {
  class A {}
  @injectable()
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.true(a === a1);

  const b = child.get(B);
  const b1 = child.get(B);
  t.true(b === b1);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.true(child2.get(A) === child.get(A));
  t.true(child2.get(B) !== child.get(B));
});

test('config, parentContext, newInstanceInThisContext, true', t => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.true(a === a1);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.true(child2.get(A) === child.get(A));
  t.true(child2.get(A) === parent.get(A));
});

test('config, parentContext, newInstanceInThisContext, false', t => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: false,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.true(a === a1);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: false,
  });

  t.true(child2.get(A) === child.get(A));
  t.true(child2.get(A) === parent.get(A));
});

test('clear, test class info', t => {
  class TestClass {
    a() {
      return 1;
    }
  }
  const context = new IocContext();
  context.register(TestClass);
  t.true(context.get(TestClass).a() === 1);

  context.clear();
  t.throws(() => context.get(TestClass), { instanceOf: NotfoundTypeError });
});

test('multi implement, use classLoader.', t => {
  const context = new IocContext();

  abstract class IService {}

  t.throws(() => context.get(IService), { instanceOf: NotfoundTypeError });

  @injectable()
  class A extends IService {}

  t.true(context.get(IService) instanceof IService);
  t.true(context.get(IService) instanceof A);
  context.remove(A);

  @injectable()
  class B extends IService {}

  t.throws(() => context.get(IService), { instanceOf: MultiImplementError });
});

test('multi implement, conflictHandler.', t => {
  abstract class IService {}

  @injectable()
  class A extends IService {}
  @injectable()
  class B extends IService {}

  const context = new IocContext({
    conflictHandler: (type, implCls, sourceCls) => {
      return undefined;
    },
  });

  t.throws(() => context.get(IService), { instanceOf: MultiImplementError });
});

test('multi implement, no err.', t => {
  @injectable()
  class BaseService {}
  @injectable()
  class A extends BaseService {}
  @injectable()
  class B extends BaseService {}

  const context = new IocContext();

  t.true(context.get(BaseService) instanceof BaseService);

  const childContext = context.createChildContext({
    conflictHandler: (type, implCls, sourceCls) => {
      return implCls.find(s => s.type === A)!.type;
    },
  });
  t.true(childContext.get(BaseService) instanceof A);
});

test('constructor inject', t => {
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
  const ioc = new IocContext();
  ioc.get(B);
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

test('autoRun postConstruct', t => {
  const ioc = new IocContext();
  class A {
    x: number;
    @postConstruct()
    init() {
      this.x = 1;
    }
  }

  const a = new A();
  ioc.inject(a);
  t.deepEqual(a.x, 1);

  const a2 = new A();
  ioc.inject(a2, { autoRunPostConstruct: false });
  t.deepEqual(a2.x, undefined);
});

test('run preDestroy', t => {
  const ioc = new IocContext();
  class A {
    x: number;
    @preDestroy()
    init() {
      this.x = 1;
    }
  }

  const a = new A();
  ioc.inject(a);
  ioc.runPreDestroy(a);
  t.deepEqual(a.x, 1);
});

test('clear, child, parent, retain dependency', t => {
  @injectable()
  class A {}

  const parent = new IocContext();
  parent.register(A);

  const child1 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.true(parent.has(A, false));

  parent.get(A);
  t.true(parent.has(A, false));

  parent.clear();
  t.false(parent.has(A, false));

  child1.get(A);
  t.false(parent.has(A, false));
  t.true(child1.has(A, false));

  parent.clear();
  t.false(parent.has(A, false));

  child2.get(A);
  t.false(parent.has(A, false));
  t.true(child2.has(A, false));
});

test('config, defaultInjectOptions', t => {
  const IfA = Symbol('IfA');
  interface IfA {}

  class A implements IfA {}
  class B {
    @inject({ type: IfA })
    a: IfA;
  }

  class C {
    @inject({ type: IfA })
    a: IfA;
  }

  const context = new IocContext({
    defaultInjectOptions: {
      optional: true,
    },
  });

  context.register(A, IfA);
  context.register(B);
  context.register(C);

  t.true(context.get(B).a instanceof A);
  t.true(context.get(C).a instanceof A);
});
