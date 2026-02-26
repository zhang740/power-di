import { expect, it } from 'vitest';
import { classLoader, ClassLoader, DuplicateRegistrationError } from '../src/class/ClassLoader';
import { getMetadata, MetadataType, metaSymbol } from '../src/class/metadata';

it('class info', () => {
  classLoader.clearAll();
  class A {}
  classLoader.registerClass(A);

  expect(classLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [],
    implements: [],
  });
});

it('class info, name from classInfo', () => {
  classLoader.clearAll();
  class A {}
  classLoader.registerClass(A, { name: 'newName' });

  expect(classLoader.getClassInfo(A)).toEqual({
    name: 'newName',
    extends: [],
    implements: [],
  });
});

it('has super class', () => {
  classLoader.clearAll();
  class Z {}
  class A extends Z {}
  class B extends A {}
  classLoader.registerClass(B);

  expect(classLoader.getClassInfo(B)).toEqual({
    name: 'B',
    extends: [A, Z],
    implements: [],
  });

  expect(classLoader.getImplementClasses(Z)).toEqual([
    {
      type: B,
      info: {
        name: 'B',
        extends: [A, Z],
        implements: [],
      },
    },
  ]);
  expect(classLoader.getImplementClasses(A)).toEqual([
    {
      type: B,
      info: {
        name: 'B',
        extends: [A, Z],
        implements: [],
      },
    },
  ]);
});

it('has interface', () => {
  classLoader.clearAll();
  const A = Symbol('A');
  interface A {}
  class B implements A {}

  classLoader.registerClass(B, { implements: [A] });

  expect(classLoader.getImplementClasses(A)).toEqual([
    {
      type: B,
      info: {
        name: 'B',
        extends: [],
        implements: [A],
      },
    },
  ]);
});

it('register with info', () => {
  classLoader.clearAll();
  class A {}
  classLoader.registerClass(A, {});

  expect(classLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [],
    implements: [],
  });
});

it('cannot register twice', () => {
  classLoader.clearAll();
  class A {}
  classLoader.registerClass(A);
  expect(() => classLoader.registerClass(A)).toThrow(DuplicateRegistrationError);
});

it('unregisterClass', () => {
  classLoader.clearAll();
  class A {}
  class B extends A {}
  classLoader.registerClass(B);
  expect(classLoader.getClassInfo(B)).toEqual({
    name: 'B',
    extends: [A],
    implements: [],
  });
  expect(classLoader.getImplementClasses(A)).toEqual([
    {
      type: B,
      info: {
        name: 'B',
        extends: [A],
        implements: [],
      },
    },
  ]);
  expect(classLoader.unregisterClass(B)).toBe(true);
  expect(classLoader.unregisterClass(B)).toBe(false);
  expect(classLoader.getClassInfo(B)).toBeUndefined();
  expect(classLoader.getImplementClasses(A)).toEqual([]);

  expect(() => classLoader.unregisterClass(B)).not.toThrow();
});

it('filterClasses', () => {
  classLoader.clearAll();
  class A {}
  class B extends A {}
  classLoader.registerClass(B);

  expect(classLoader.filterClasses(info => info.type === B)).toEqual([
    {
      info: {
        name: 'B',
        extends: [A],
        implements: [],
      },
      type: B,
    },
  ]);
});

it('classAll', () => {
  classLoader.clearAll();
  class A {}
  class B extends A {}
  classLoader.registerClass(B);
  expect(classLoader.getClassInfo(B)).toEqual({
    name: 'B',
    extends: [A],
    implements: [],
  });
  expect(classLoader.getImplementClasses(A)).toEqual([
    {
      type: B,
      info: {
        name: 'B',
        extends: [A],
        implements: [],
      },
    },
  ]);
  classLoader.clearAll();
  expect(classLoader.getClassInfo(B)).toBeUndefined();
  expect(classLoader.getImplementClasses(A)).toEqual([]);
});

it('double in impl and extends', () => {
  classLoader.clearAll();
  abstract class Base {}
  class A extends Base {}
  classLoader.registerClass(A, { implements: [Base] });

  expect(classLoader.getImplementClasses(Base)).toEqual([
    {
      type: A,
      info: {
        name: 'A',
        extends: [Base],
        implements: [Base],
      },
    },
  ]);
});

it('clone', () => {
  classLoader.clearAll();
  class Base {}
  class A extends Base {}
  class B extends Base {}

  classLoader.registerClass(A);

  const newLoader = classLoader.clone();

  expect(classLoader).not.toBe(newLoader);
  expect(classLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [Base],
    implements: [],
  });
  expect(newLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [Base],
    implements: [],
  });
  expect(classLoader.getImplementClasses(Base).length).toBe(1);
  expect(newLoader.getImplementClasses(Base).length).toBe(1);

  newLoader.registerClass(B);
  expect(classLoader.getClassInfo(B)).toBeFalsy();
  expect(newLoader.getClassInfo(B)).toEqual({
    name: 'B',
    extends: [Base],
    implements: [],
  });
  expect(classLoader.getImplementClasses(Base).length).toBe(1);
  expect(newLoader.getImplementClasses(Base).length).toBe(2);
});

it('clone, subclass', () => {
  classLoader.clearAll();
  class NewClassLoader extends ClassLoader {}

  const newLoader = new NewClassLoader();
  expect(newLoader instanceof ClassLoader).toBe(true);
  expect(newLoader instanceof NewClassLoader).toBe(true);

  const newLoader2 = newLoader.clone();
  expect(newLoader2 instanceof ClassLoader).toBe(true);
  expect(newLoader2 instanceof NewClassLoader).toBe(true);
});

it('init with', () => {
  classLoader.clearAll();
  class A {}
  class B {}

  classLoader.registerClass(A);

  const newLoader = new ClassLoader();
  newLoader.initWith(classLoader);

  expect(classLoader).not.toBe(newLoader);
  expect(classLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [],
    implements: [],
  });
  expect(newLoader.getClassInfo(A)).toEqual({
    name: 'A',
    extends: [],
    implements: [],
  });

  newLoader.registerClass(B);
  expect(classLoader.getClassInfo(B)).toBeFalsy();
  expect(newLoader.getClassInfo(B)).toEqual({
    name: 'B',
    extends: [],
    implements: [],
  });
});

it('getMetadata, Object', () => {
  classLoader.clearAll();
  const meta = getMetadata(Object);
  expect(meta).toEqual(new MetadataType());

  meta.injectable = true;
  expect(meta.injectable).toBe(true);
  expect(getMetadata(Object)).not.toEqual(meta);
  expect(getMetadata(Object).injectable).toBeUndefined();

  expect((Object as any)[metaSymbol]).toBeUndefined();
});

it('hook, registerClass', () => {
  classLoader.clearAll();
  const loader = new ClassLoader();

  class Test {}

  loader.callback.onRegisterClass = (type, info) => {
    expect(type).toBe(Test);
    expect(info).toEqual({
      extends: [],
      implements: [],
      name: 'xxx',
    });
  };

  loader.registerClass(Test, { name: 'xxx' });
});

it('hook, unregisterClass', () => {
  classLoader.clearAll();
  const loader = new ClassLoader();

  class BaseTest {}

  class Test extends BaseTest {}

  loader.registerClass(Test);

  loader.callback.onUnregisterClass = (type, info) => {
    expect(type).toBe(Test);
    expect(info).toEqual({
      extends: [BaseTest],
      implements: [],
      name: 'Test',
    });
  };

  loader.unregisterClass(Test);
});
