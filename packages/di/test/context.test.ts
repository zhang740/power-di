import { classLoader, ClassLoader } from '@power-di/class-loader';
import { it } from 'vitest';
import {
  inject,
  injectable,
  IocContext,
  MultiImplementError,
  NotfoundTypeError,
  postConstruct,
  preDestroy,
} from '../src';
import { TestService as TS2 } from './base.test';

class TestService {}

it('default instance.', (t) => {
  t.expect(IocContext.DefaultInstance instanceof IocContext).toBe(true);
});

it('register component error case.', (t) => {
  enum INJECTTYPE {
    test,
  }

  const context = new IocContext();
  t.expect(() => context.register(undefined)).toThrow();
  t.expect(() => context.register(123123)).toThrow();
  t.expect(() => context.register({})).toThrow();
  t.expect(() => context.register({}, 123123 as any)).toThrow();
  t.expect(() => context.register({}, INJECTTYPE.test as any)).toThrow();
  t.expect(() => context.get('TEST')).toThrow(NotfoundTypeError);
});

it('register component by class.', (t) => {
  const context = new IocContext();
  context.register(TestService);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
});

it('register component by class, symbol.', (t) => {
  const context = new IocContext();
  const service = Symbol('TestService');
  context.register(TestService, service);
  t.expect((context.get(service) as any) instanceof TestService).toBe(true);
});

it('register component by class, no new.', (t) => {
  const context = new IocContext();
  context.register(TestService, TestService, { autoNew: false });
  t.expect(!(context.get(TestService) instanceof TestService)).toBe(true);
});

it('register component by class, singleton', (t) => {
  const context = new IocContext();
  context.register(TestService, TestService, { singleton: false });
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
  t.expect(context.get(TestService) !== context.get(TestService)).toBe(true);
});

it('register component by class, singleton, simple', (t) => {
  const context = new IocContext();
  context.register(TestService);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
  t.expect(context.get(TestService) === context.get(TestService)).toBe(true);
});

it('register component by value.', (t) => {
  const context = new IocContext();
  context.register(1, TestService);
  t.expect(context.get(TestService) === 1).toBe(true);
  t.expect(() => context.register(2, TestService)).toThrow();
});

it('register component by value, no auto new.', (t) => {
  const context = new IocContext();
  context.register(TestService, TestService, { autoNew: false });
  t.expect(!(context.get(TestService) instanceof TestService)).toBe(true);
  t.expect(context.get(TestService) === TestService).toBe(true);
  t.expect(context.get(TestService) === context.get(TestService)).toBe(true);
});

it('register component, autoRegisterSelf.', (t) => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }
  const context = new IocContext({ autoRegisterSelf: true });
  t.expect(context.get(B) instanceof B).toBe(true);
  t.expect(context.get(B).a instanceof A).toBe(true);
});

it('has component.', (t) => {
  const context = new IocContext();
  context.register(TestService);
  t.expect(context.has(TestService)).toBe(true);

  class BTest {}
  t.expect(context.has(BTest)).toBe(false);
});

it('has component, mapping.', (t) => {
  const context = new IocContext();

  class AService extends TestService {}

  t.expect(context.has(TestService, true, true)).toBe(false);

  context.classLoader.registerClass(AService);

  context.register(AService);
  t.expect(context.has(TestService, true, true)).toBe(true);

  context.classLoader.unregisterClass(AService);
});

it('has component, deep.', (t) => {
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
  t.expect(service instanceof AService).toBe(true);

  t.expect(context.has(TestService, true, true)).toBe(true);
  t.expect(childContext.has(TestService, false, true)).toBe(false);
  t.expect(childContext.has(TestService, true, true)).toBe(true);
});

it('remove component.', (t) => {
  const context = new IocContext();
  context.register(TestService);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
  t.expect(context.remove(TestService)).toBe(true);
  t.expect(context.remove(TestService)).toBe(false);
  t.expect(() => context.get(TestService)).toThrow(NotfoundTypeError);
});

it('replace component.', (t) => {
  class BClass {}
  const context = new IocContext();
  context.register(TestService);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);

  context.replace(TestService, BClass);
  t.expect(context.get(TestService) instanceof BClass).toBe(true);

  t.expect(() => context.replace(BClass, TestService)).toThrow();

  context.replace(BClass, '123', undefined, true);
  t.expect(context.get(BClass) === '123').toBe(true);
});

it('difference class with same class name.', (t) => {
  const context = new IocContext();
  context.register(TestService);
  context.register(TS2);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
  t.expect(context.get(TS2) instanceof TS2).toBe(true);
});

it('subComponent.', (t) => {
  class SubClass extends TestService {}

  const context = new IocContext();
  context.register(SubClass, TestService);
  t.expect(context.get(TestService) instanceof SubClass).toBe(true);
  t.expect(context.get(TestService) instanceof TestService).toBe(true);
  t.expect(() => context.get(SubClass)).toThrow(NotfoundTypeError);
});

it('getSubClasses, with classLoader.', (t) => {
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.expect(!context.getImports(AClass).length).toBe(true);

  classLoader.registerClass(BClass);
  classLoader.registerClass(CClass);

  const cls = context.getImports<AClass>(AClass);
  t.expect(cls.length === 2).toBe(true);
  t.expect(cls[0] instanceof BClass).toBe(true);
  t.expect(cls[1] instanceof CClass).toBe(true);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

it('getSubClasses, with classLoader with implements.', (t) => {
  abstract class ITest {}
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.expect(!context.getImports(AClass).length).toBe(true);

  classLoader.registerClass(BClass, { implements: [ITest] });
  classLoader.registerClass(CClass, { implements: [ITest] });

  const cls = context.getImports<AClass>(ITest);
  t.expect(cls.length === 2).toBe(true);
  t.expect(cls[0] instanceof BClass).toBe(true);
  t.expect(cls[1] instanceof CClass).toBe(true);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

it('getSubClasses, with classLoader with implements, 2.', (t) => {
  abstract class ITest {}
  class AClass {}
  class BClass extends AClass {}
  class CClass extends BClass {}

  const context = new IocContext();
  t.expect(!context.getImports(AClass).length).toBe(true);

  classLoader.registerClass(BClass, { implements: [ITest] });
  classLoader.registerClass(CClass);

  const cls2 = context.getImports<AClass>(ITest);
  t.expect(cls2.length === 1).toBe(true);
  t.expect(cls2[0] instanceof BClass).toBe(true);
  t.expect(cls2[0] instanceof CClass).toBe(false);

  classLoader.unregisterClass(BClass);
  classLoader.unregisterClass(CClass);
});

it('new constructor.', (t) => {
  let count = 0;

  @injectable()
  class A {
    constructor() {
      count++;
    }
  }

  const context = new IocContext({ constructorInject: true });
  context.register(A);

  t.expect(context.get(A) instanceof A).toBe(true);
  t.expect(context.get(A) === context.get(A)).toBe(true);
  t.expect(count).toBe(1);

  context.remove(A);
  context.register(A, A, { singleton: false });
  t.expect(context.get(A) instanceof A).toBe(true);
  t.expect(context.get(A) !== context.get(A)).toBe(true);
  t.expect(count).toBe(4);
});

it('new constructor, opt.', (t) => {
  let count = 0;

  @injectable()
  class A {
    constructor() {
      count++;
    }
  }

  const context = new IocContext();
  context.register(A);

  t.expect(context.get(A) instanceof A).toBe(true);
  t.expect(context.get(A) === context.get(A)).toBe(true);
  t.expect(count).toBe(1);

  t.expect(context.get(A, { forceNew: true }) instanceof A).toBe(true);
  t.expect(context.get(A, { forceNew: true }) !== context.get(A)).toBe(true);
  t.expect(count).toBe(3);
});

it('new constructor, error type.', (t) => {
  class A {}
  const context = new IocContext();
  t.expect(() => context.get(A)).toThrow(NotfoundTypeError);
});

it('default value.', (t) => {
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
  t.expect(context.get(A) instanceof A).toBe(true);
  t.expect(context.get(B).a instanceof A).toBe(true);

  const c = context.get(C);
  t.expect(c.a instanceof A).toBe(true);
});

it('default value, inject from parent.', (t) => {
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
  t.expect(child.get(A) instanceof A).toBe(true);
  t.expect(child.get(B).a instanceof A).toBe(true);

  const c = child.get(C);
  t.expect(c.a instanceof A).toBe(true);
});

it('inject, from parent.', (t) => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }

  const parent = new IocContext({ autoRegisterSelf: true });
  parent.register(A);

  const child = parent.createChildContext();
  t.expect(child.get(A) instanceof A).toBe(true);
  t.expect(child.get(B).a instanceof A).toBe(true);
});

it('inject, from parent, not found.', (t) => {
  class A {}
  class B {
    @inject({ type: A })
    a: A;
  }

  const parent = new IocContext();
  const child = parent.createChildContext();
  t.expect(() => child.get(A)).toThrow(NotfoundTypeError);
  t.expect(() => child.get(B)).toThrow(NotfoundTypeError);
});

it('inject, from parent, not found, optional.', (t) => {
  class A {}
  @injectable()
  class B {
    @inject({ type: A, optional: true })
    a: A;
  }

  const parent = new IocContext();
  const child = parent.createChildContext({ newInstanceInThisContext: true });
  t.expect(child.get(B) instanceof B).toBe(true);
});

it('inject, from parent, not found, autoNew.', (t) => {
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
  t.expect(child.get(B) instanceof B).toBe(true);
});

it('inject, from parent, not found, autoNew, value.', (t) => {
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
  t.expect(child.get(B) instanceof B).toBe(true);
  t.expect(child.get(B).a === 1).toBe(true);
});

it('inject, from parent, not found, autoNew, value, opt.', (t) => {
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
  t.expect(child.get(B) instanceof B).toBe(true);
  t.expect(child.get(B).a === 1).toBe(true);
});

it('inject, from parent, not found, autoNew, value, opt, 2.', (t) => {
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
  t.expect(child.get(B) instanceof B).toBe(true);
  t.expect(child.get(B).a === 1).toBe(true);
});

it('get, from parent, not found, autoNew, value, opt.', (t) => {
  class A {}

  const parent = new IocContext();
  parent.register(1, A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    constructorInject: false,
  });
  t.expect(child.get(A) === 1).toBe(true);
});

it('config, defaultInjectOptions', (t) => {
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

  t.expect(context.get(B).a instanceof A).toBe(true);
  t.expect(context.get(C).a instanceof A).toBe(true);
});

it('config, notFoundHandler', (t) => {
  const context = new IocContext({
    notFoundHandler: (type: any) => {
      if (type === 'str') {
        return '123';
      }
    },
  });
  t.expect(context.get('str')).toBe('123');
});

it('config, parentContext, useClassLoader', (t) => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    useClassLoader: true,
  });

  t.expect(child.get(A) instanceof A).toBe(true);
  t.expect(() => child.get(B)).toThrow(NotfoundTypeError);
});

it('config, parentContext, no useClassLoader', (t) => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    useClassLoader: false,
  });

  t.expect(child.get(A) instanceof A).toBe(true);
  t.expect(() => child.get(B)).toThrow(NotfoundTypeError);
});

it('config, parentContext, autoRegisterSelf', (t) => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    autoRegisterSelf: true,
    newInstanceInThisContext: true,
  });

  t.expect(child.get(A) instanceof A).toBe(true);
  t.expect(child.get(B) instanceof B).toBe(true);
});

it('config, parentContext, newInstanceInThisContext', (t) => {
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
  t.expect(a === a1).toBe(true);

  const b = child.get(B);
  const b1 = child.get(B);
  t.expect(b === b1).toBe(true);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.expect(child2.get(A) === child.get(A)).toBe(true);
  t.expect(child2.get(B) !== child.get(B)).toBe(true);
});

it('config, parentContext, newInstanceInThisContext, no default', (t) => {
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
  t.expect(a === a1).toBe(true);

  const b = child.get(B);
  const b1 = child.get(B);
  t.expect(b === b1).toBe(true);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.expect(child2.get(A) === child.get(A)).toBe(true);
  t.expect(child2.get(B) !== child.get(B)).toBe(true);
});

it('config, parentContext, newInstanceInThisContext, true', (t) => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.expect(a === a1).toBe(true);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: true,
  });

  t.expect(child2.get(A) === child.get(A)).toBe(true);
  t.expect(child2.get(A) === parent.get(A)).toBe(true);
});

it('config, parentContext, newInstanceInThisContext, false', (t) => {
  class A {}
  class B {}

  const parent = new IocContext();
  parent.register(A);

  const child = parent.createChildContext({
    newInstanceInThisContext: false,
  });

  const a = child.get(A);
  const a1 = child.get(A);
  t.expect(a === a1).toBe(true);

  const child2 = parent.createChildContext({
    newInstanceInThisContext: false,
  });

  t.expect(child2.get(A) === child.get(A)).toBe(true);
  t.expect(child2.get(A) === parent.get(A)).toBe(true);
});

it('clear, test class info', (t) => {
  class TestClass {
    a() {
      return 1;
    }
  }
  const context = new IocContext();
  context.register(TestClass);
  t.expect(context.get(TestClass).a() === 1).toBe(true);

  context.clear();
  t.expect(() => context.get(TestClass)).toThrow(NotfoundTypeError);
});

it('multi implement, use classLoader.', (t) => {
  const context = new IocContext();

  abstract class IService {}

  t.expect(() => context.get(IService)).toThrow(NotfoundTypeError);

  @injectable()
  class A extends IService {}

  t.expect(context.get(IService) instanceof IService).toBe(true);
  t.expect(context.get(IService) instanceof A).toBe(true);
  context.remove(A);

  @injectable()
  class B extends IService {}

  t.expect(() => context.get(IService)).toThrow(MultiImplementError);
});

it('multi implement, conflictHandler.', (t) => {
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

  t.expect(() => context.get(IService)).toThrow(MultiImplementError);
});

it('multi implement, no err.', (t) => {
  @injectable()
  class BaseService {}
  @injectable()
  class A extends BaseService {}
  @injectable()
  class B extends BaseService {}

  const context = new IocContext();

  t.expect(context.get(BaseService) instanceof BaseService).toBe(true);

  const childContext = context.createChildContext({
    conflictHandler: (type, implCls, sourceCls) => {
      return implCls.find(s => s.type === A)!.type;
    },
  });
  t.expect(childContext.get(BaseService) instanceof A).toBe(true);
});

it('constructor inject', (t) => {
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
  const ioc = new IocContext();
  ioc.get(B);
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
  t.expect(context.get(Base).service.name).toBe('x');
  t.expect(context.get(Test).service.name).toBe('y');
});

it('autoRun postConstruct', (t) => {
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
  t.expect(a.x).toBe(1);

  const a2 = new A();
  ioc.inject(a2, { autoRunPostConstruct: false });
  t.expect(a2.x).toBe(undefined);
});

it('run preDestroy', (t) => {
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
  t.expect(a.x).toBe(1);
});

it('clear, child, parent, retain dependency', (t) => {
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

  t.expect(parent.has(A, false)).toBe(true);

  parent.get(A);
  t.expect(parent.has(A, false)).toBe(true);

  parent.clear();
  t.expect(parent.has(A, false)).toBe(false);

  child1.get(A);
  t.expect(parent.has(A, false)).toBe(false);
  t.expect(child1.has(A, false)).toBe(true);

  parent.clear();
  t.expect(parent.has(A, false)).toBe(false);

  child2.get(A);
  t.expect(parent.has(A, false)).toBe(false);
  t.expect(child2.has(A, false)).toBe(true);
});

it('config, defaultInjectOptions, 2', (t) => {
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

  t.expect(context.get(B).a instanceof A).toBe(true);
  t.expect(context.get(C).a instanceof A).toBe(true);
});
