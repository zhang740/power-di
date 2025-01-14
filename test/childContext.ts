import test from 'ava';
import { injectable, IocContext, MultiImplementError, NotfoundTypeError } from '../lib';

test('default.', t => {
  const parent = new IocContext();
  parent.register(5, 'TEST');
  t.true(parent.get('TEST') === 5);

  const child = parent.createChildContext();
  t.true(child.get('TEST') === 5);

  child.register(8, 'TEST');
  t.true(child.get('TEST') === 8);
  t.true(parent.get('TEST') === 5);
});

test('getImports.', t => {
  class BaseCls {}
  class TestCls extends BaseCls {}
  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  const parentImpls = parent.getImports(BaseCls);
  t.true(parentImpls[0] instanceof TestCls);

  const child = parent.createChildContext();

  const childImpls = child.getImports(BaseCls);
  t.true(childImpls[0] instanceof TestCls);

  t.true(parentImpls[0] === childImpls[0]);
});

test('inherit.', t => {
  const parent = new IocContext({ autoRegisterSelf: true });
  t.true(parent.config.autoRegisterSelf === true);

  const child = parent.createChildContext();
  t.true(child.config.autoRegisterSelf === true);

  const child2 = parent.createChildContext({});
  t.true(child2.config.autoRegisterSelf === true);
});

test('parent finder', t => {
  class IService {}
  class TestCls extends IService {}

  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  t.true(parent.get(IService) === parent.get(TestCls));

  const child = parent.createChildContext();
  t.true(child.get(IService) === parent.get(IService));
  t.true(child.get(IService) === parent.get(TestCls));

  parent.register('TEST', IService);
  t.true(parent.get(IService) === 'TEST');
  t.true(child.get(IService) === 'TEST');
});

test('parent finder, not deep', t => {
  class IService {}
  class TestCls extends IService {}

  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  t.true(parent.get(IService) === parent.get(TestCls));

  const child = parent.createChildContext();

  t.true(child.get(IService, { deep: false }) !== parent.get(IService, { deep: false }));
  t.true(child.get(IService, { deep: false }) !== parent.get(TestCls, { deep: false }));
});

test('multi implement, use classLoader, resolve.', t => {
  const context = new IocContext();
  const childContext = context.createChildContext();

  abstract class IService {}

  @injectable()
  class A extends IService {}

  t.true(context.get(IService) instanceof IService);
  t.true(context.get(IService) instanceof A);
  context.remove(A);

  @injectable()
  class B extends IService {}

  t.throws(() => childContext.get(IService), { instanceOf: MultiImplementError });

  childContext.setConfig({
    conflictHandler(type, implCls, sourceCls) {
      return implCls.find(s => s.type === A)?.type;
    },
  });

  t.true(childContext.get(IService) instanceof A);
});

test('multi implement, use classLoader, resolve deep.', t => {
  const context = new IocContext();
  const childContext = context.createChildContext();

  abstract class IService {}

  @injectable()
  class A extends IService {}

  t.true(context.get(IService) instanceof IService);
  t.true(context.get(IService) instanceof A);
  context.remove(A);

  @injectable()
  class B extends A {}

  t.throws(() => childContext.get(IService), { instanceOf: MultiImplementError });

  context.setConfig({
    conflictHandler(type, implCls, sourceCls) {
      return implCls.find(s => s.type === A)?.type;
    },
  });

  console.log('!!!!!');
  t.true(childContext.get(IService) instanceof A);
  t.false(childContext.get(IService) instanceof B);
});
