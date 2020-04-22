import test from 'ava';
import { IocContext, inject, NotfoundTypeError, injectable, MultiImplementError, classInfo } from '../lib';

class TestService {
}

test('default instance.', t => {
  t.true(IocContext.DefaultInstance instanceof IocContext);
});

test('register component error case.', t => {
  enum INJECTTYPE {
    test
  }

  const context = new IocContext;
  t.throws(() => context.register(undefined));
  t.throws(() => context.register(123123));
  t.throws(() => context.register({}));
  t.throws(() => context.register({}, 123123 as any));
  t.throws(() => context.register({}, INJECTTYPE.test as any));
  t.throws(() => context.get('TEST'), err => err instanceof NotfoundTypeError);
});

test('register component by class.', t => {
  const context = new IocContext;
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);

  // test for tip of type.
  class A { }
  context.register(A);
  abstract class B { }
  context.register(B);
  t.true(context.get(A) instanceof A);
  t.true(context.get(B) instanceof B);
  t.false(context.get<A>(B) instanceof A);
});

test('register component by create function.', t => {
  const context = new IocContext;
  context.register(() => {
    t.fail();
  }, 'test', { autoNew: false });
  context.register(() => {
    return { a: 5 };
  }, 'test2');
  t.true(context.get<{ a: number }>('test2').a === 5);
});

test('register component mutli-instance.', t => {
  const context = new IocContext;
  context.register(TestService, undefined, { singleton: false });
  const dataA = context.get(TestService);
  t.true(dataA instanceof TestService);
  const dataB = context.get(TestService);
  t.true(dataB instanceof TestService);
  t.false(dataA === dataB);
});

test('register component no autonew.', t => {
  const context = new IocContext;
  context.register(TestService, undefined, { autoNew: false });
  const dataA = context.get(TestService);
  t.false(dataA instanceof TestService);
  t.true(dataA === TestService);
});

test('register 2nd with same key.', t => {
  const context = new IocContext;
  context.register(TestService);
  t.throws(() => context.register(TestService));
});

test('register component by string.', t => {
  const context = new IocContext;
  context.register(TestService, 'string_key');
  t.true(context.get('string_key') instanceof TestService);

  const data = { x: 'test' };
  context.register(data, 'string_key_value');
  t.true(context.get('string_key_value') === data);

  const data2 = 'test_str';
  context.register(data2, 'string_key_value2');
  t.true(context.get('string_key_value2') === data2);
});

test('register not allowed.', t => {
  const context = new IocContext;
  t.throws(() => context.register(new TestService));
});

test('auto register component by class.', t => {
  class A { }
  class B {
    @inject()
    a: A;
  }
  const context = new IocContext({ autoRegisterSelf: true });
  t.true(context.get(B) instanceof B);
  t.true(context.get(B).a instanceof A);
});

test('has component.', t => {
  const context = new IocContext;
  context.register(TestService);
  t.true(context.has(TestService));

  class BTest {
  }
  t.false(context.has(BTest));
});

test('remove component.', t => {
  const context = new IocContext;
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);
  context.remove(TestService);
  t.throws(() => context.get(TestService), err => err instanceof NotfoundTypeError);
});

test('replace component.', t => {
  class BClass { }
  const context = new IocContext;
  context.register(TestService);
  t.true(context.get(TestService) instanceof TestService);

  context.replace(TestService, BClass);
  t.true(context.get(TestService) instanceof BClass);

  t.throws(() => context.replace(BClass, TestService));

  context.replace(BClass, '123', undefined, true);
  t.true(context.get(BClass) === '123');
});

import { TestService as TS2 } from './base';
import { classLoader, ClassLoader } from '../lib/class/ClassLoader';
test('difference class with same class name.', t => {
  const context = new IocContext;
  context.register(TestService);
  context.register(TS2);
  t.true(context.get(TestService) instanceof TestService);
  t.true(context.get(TS2) instanceof TS2);
});

test('subcomponent.', t => {
  class SubClass extends TestService { }

  const context = new IocContext;
  context.register(SubClass, TestService);
  t.true(context.get(TestService) instanceof SubClass);
  t.true(context.get(TestService) instanceof TestService);
  t.throws(() => context.get(SubClass), err => err instanceof NotfoundTypeError);
});

test('getSubClasses, with classLoader.', t => {
  class AClass { }
  class BClass extends AClass { }
  class CClass extends AClass { }

  const context = new IocContext;
  t.true(!context.getImports(AClass).length);

  classLoader.registerClass(BClass);
  classLoader.registerClass(CClass);

  const cls = context.getImports(AClass);
  t.true(cls.length === 2);
  t.true(cls[0] instanceof BClass);
  t.true(cls[1] instanceof CClass);

  const cls2 = context.getImports(AClass);
  t.true(cls !== cls2);
  t.true(cls[0] === cls2[0]);

  const cls3 = context.getImports(AClass, { cache: true });
  const cls4 = context.getImports(AClass, { cache: true });
  t.true(cls3 === cls4);
  t.true(cls3[0] === cls4[0]);
});

test('new constructor.', t => {
  let count = 0;
  class OtherClass { }
  class AClass {
    @inject()
    other: OtherClass;

    constructor() { count++; }
  }
  const context = new IocContext;
  context.register(AClass);
  context.register(OtherClass);
  const a = new AClass;
  context.inject(a);
  t.true(a.other instanceof OtherClass);
  t.true(count === 1);
});

test('class init, with ioc instance.', t => {
  class TestService {
    constructor(ioc: IocContext) {
      t.true(ioc instanceof IocContext);
    }
  }

  const context = new IocContext;
  context.register(TestService);
  context.get(TestService);
});

test('inject instance.', t => {
  const context = new IocContext;

  class AClass {
  }

  class BClass {
    @inject({ lazy: false })
    aclass: AClass;
    @inject()
    injectclass: AClass;
  }

  context.register(AClass);

  const bclass = new BClass;
  context.inject(bclass);
  t.true(bclass.aclass instanceof AClass);
  t.true(bclass.injectclass instanceof AClass);
});

test('inject instance, notfound.', t => {
  const context = new IocContext;

  class AClass {
  }

  class BClass {
    @inject()
    aclass: AClass;
  }

  const bclass = new BClass;
  context.inject(bclass);
  t.throws(() => bclass.aclass, err => err instanceof NotfoundTypeError);
});

test('inject instance, notfoundhandler.', t => {
  class AClass {
  }

  class BClass {
    @inject()
    aclass: AClass;
  }

  const context = new IocContext({
    notFoundHandler: (type) => {
      return type === AClass && new AClass;
    }
  });
  const bclass = new BClass;
  context.inject(bclass);
  t.true(bclass.aclass instanceof AClass);
});

test('inject instance, string.', t => {
  const context = new IocContext;

  context.register({ a: 123 }, 'TEST_A');

  class BClass {
    @inject({ type: 'TEST_A' })
    aclass: { a: number };
  }

  const bclass = new BClass;
  context.inject(bclass);
  t.true(bclass.aclass.a === 123);
});


test('lazyInject redefined.', t => {
  const context = new IocContext;

  class TestClass {
    a() { return 1; }
  }

  class AClass {
    @inject()
    tClass: TestClass;
  }

  class BClass extends AClass {
    @inject()
    tClass: TestClass;
  }

  context.register(TestClass);
  context.register(AClass);
  context.register(BClass);

  t.true(context.get(BClass).tClass.a() === 1);
});

test('clear.', t => {
  const context = new IocContext;

  class TestClass {
    a() { return 1; }
  }
  context.register(TestClass);
  t.true(context.get(TestClass).a() === 1);

  context.clear();
  t.throws(() => context.get(TestClass), err => err instanceof NotfoundTypeError);
});

test('multi implement, use classLoader.', t => {
  const context = new IocContext();

  abstract class IService { }

  t.throws(() => context.get(IService), err => {
    return err instanceof NotfoundTypeError;
  });

  @injectable()
  class A extends IService { }

  t.true(context.get(IService) instanceof IService);
  t.true(context.get(IService) instanceof A);
  context.remove(IService);

  @injectable()
  class B extends IService { }

  t.throws(() => context.get(IService), err => {
    return err instanceof MultiImplementError;
  });
});

test('multi implement, conflictHandler.', t => {
  abstract class IService { }
  @injectable()
  class A extends IService { }
  @injectable()
  class B extends IService { }
  @injectable()
  class C {
    @inject({ lazy: false })
    b1: IService;
    @inject()
    b2: IService;
  }

  const context = new IocContext({
    conflictHandler: (type, implCls, sourceCls) => {
      if (type === IService) {
        return sourceCls?.type === C ?
          implCls.find(info => info.type === B).type :
          implCls.find(info => info.info.name === 'A').type;
      }
    }
  });

  t.true(context.get(IService) instanceof A);
  context.remove(IService);
  t.true(context.get(C).b1 instanceof B);
  context.remove(IService);
  t.true(context.get(C).b2 instanceof B);
});

test('child context.', t => {
  const parent = new IocContext();
  parent.register(5, 'TEST');
  t.true(parent.get('TEST') === 5);

  const child = parent.createChildContext();
  t.true(child.get('TEST') === 5);

  child.register(8, 'TEST');
  t.true(child.get('TEST') === 8);
  t.true(parent.get('TEST') === 5);
});

test('constructor inject', t => {
  @injectable()
  class A { }
  @injectable()
  class B {
    constructor(public a: A, public count: Number) { }
  }

  const context = new IocContext();
  t.true(context.get(B).a instanceof A);
});

test('no singleton inject', t => {
  let count = 0;
  @injectable()
  class A {
    id = count++;
  }
  @injectable()
  class B {
    @inject()
    a1: A;
    @inject()
    a2: A;
    @inject({ singleton: false })
    a3: A;
    @inject({ singleton: false, lazy: false })
    a4: A;
  }

  const context = new IocContext();
  const b = context.get(B);
  t.true(b.a1 === b.a1);
  t.true(b.a1 === b.a2);
  t.true(b.a1 !== b.a3);
  t.true(b.a3 === b.a3);
  t.true(b.a1 !== b.a4);
});

test('custom classLoader.', t => {
  const context = new IocContext({
    useClassLoader: new ClassLoader()
  });

  abstract class IA { }
  @classInfo()
  class A extends IA { }
  t.throws(() => context.get(IA));

  context.classLoader.registerClass(A);
  t.true(context.get(IA) instanceof A);
});


test('createInstanceHook.', t => {
  class AClass {
    test: string;
  }
  const context = new IocContext();
  context.register(AClass);

  context.setConfig({
    createInstanceHook: inst => {
      t.true(inst instanceof AClass);
      if (inst instanceof AClass) {
        inst.test = 'xxx';
      }
      return inst;
    }
  });

  const a = context.get(AClass);
  t.true(a.test === 'xxx');
});
