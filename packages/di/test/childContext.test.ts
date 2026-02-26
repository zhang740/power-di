import { it } from 'vitest';
import { injectable, IocContext, MultiImplementError } from '../src';

it('default.', (t) => {
  const parent = new IocContext();
  parent.register(5, 'TEST');
  t.expect(parent.get('TEST') === 5).toBe(true);

  const child = parent.createChildContext();
  t.expect(child.get('TEST') === 5).toBe(true);

  child.register(8, 'TEST');
  t.expect(child.get('TEST') === 8).toBe(true);
  t.expect(parent.get('TEST') === 5).toBe(true);
});

it('getImports.', (t) => {
  class BaseCls {}
  class TestCls extends BaseCls {}
  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  const parentImpls = parent.getImports(BaseCls);
  t.expect(parentImpls[0] instanceof TestCls).toBe(true);

  const child = parent.createChildContext();

  const childImpls = child.getImports(BaseCls);
  t.expect(childImpls[0] instanceof TestCls).toBe(true);

  t.expect(parentImpls[0] === childImpls[0]).toBe(true);
});

it('inherit.', (t) => {
  const parent = new IocContext({ autoRegisterSelf: true });
  t.expect(parent.config.autoRegisterSelf === true).toBe(true);

  const child = parent.createChildContext();
  t.expect(child.config.autoRegisterSelf === true).toBe(true);

  const child2 = parent.createChildContext({});
  t.expect(child2.config.autoRegisterSelf === true).toBe(true);
});

it('parent finder', (t) => {
  class IService {}
  class TestCls extends IService {}

  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  t.expect(parent.get(IService) === parent.get(TestCls)).toBe(true);

  const child = parent.createChildContext();
  t.expect(child.get(IService) === parent.get(IService)).toBe(true);
  t.expect(child.get(IService) === parent.get(TestCls)).toBe(true);

  parent.register('TEST', IService);
  t.expect(parent.get(IService) === 'TEST').toBe(true);
  t.expect(child.get(IService) === 'TEST').toBe(true);
});

it('parent finder, not deep', (t) => {
  class IService {}
  class TestCls extends IService {}

  const parent = new IocContext();
  parent.classLoader!.registerClass(TestCls);

  t.expect(parent.get(IService) === parent.get(TestCls)).toBe(true);

  const child = parent.createChildContext();
  t.expect(child.get(IService, { deep: false }) !== parent.get(IService, { deep: false })).toBe(true);
  t.expect(child.get(IService, { deep: false }) !== parent.get(TestCls, { deep: false })).toBe(true);
});

it('multi implement, use classLoader, resolve.', (t) => {
  const context = new IocContext();
  const childContext = context.createChildContext();

  abstract class IService {}

  @injectable()
  class A extends IService {}

  t.expect(context.get(IService) instanceof IService).toBe(true);
  t.expect(context.get(IService) instanceof A).toBe(true);
  context.remove(A);

  @injectable()
  class B extends IService {}

  t.expect(() => childContext.get(IService)).toThrowError(MultiImplementError);

  childContext.setConfig({
    conflictHandler(type, implCls, sourceCls) {
      return implCls.find(s => s.type === A)?.type;
    },
  });

  t.expect(childContext.get(IService) instanceof A).toBe(true);
});

it('multi implement, use classLoader, resolve deep.', (t) => {
  const context = new IocContext();
  const childContext = context.createChildContext();

  abstract class IService {}

  @injectable()
  class A extends IService {}

  t.expect(context.get(IService) instanceof IService).toBe(true);
  t.expect(context.get(IService) instanceof A).toBe(true);
  context.remove(A);

  @injectable()
  class B extends A {}

  t.expect(() => childContext.get(IService)).toThrowError(MultiImplementError);

  context.setConfig({
    conflictHandler(type, implCls, sourceCls) {
      return implCls.find(s => s.type === A)?.type;
    },
  });

  t.expect(childContext.get(IService) instanceof A).toBe(true);
  t.expect(childContext.get(IService) instanceof B).toBe(false);

  context.clear();
  const subChildContext = childContext.createChildContext();

  t.expect(() => subChildContext.get(IService, { deep: false })).toThrowError(MultiImplementError);

  t.expect(subChildContext.get(IService) instanceof A).toBe(true);
  t.expect(subChildContext.get(IService) instanceof B).toBe(false);
});

it('multi implement, use classLoader, one instance existed.', (t) => {
  const context = new IocContext({
    conflictHandler(type, implCls, sourceCls) {
      return implCls.find(s => s.type === A)?.type;
    },
  });
  const childContext = context.createChildContext({
    newInstanceInThisContext: true,
  });

  abstract class IService {}

  @injectable()
  class A extends IService {}
  @injectable()
  class B extends A {}

  t.expect(context.get(IService) instanceof B).toBe(false);
  t.expect(childContext.get(IService) instanceof B).toBe(false);
});
