import test from 'ava';
import { classInfo, DuplicateRegistrationError, IocContext } from '../lib';
import { getMetadata, MetadataType } from '../lib/class/metadata';
import { classLoader, ClassLoader } from '../lib/class/ClassLoader';

test('class info', t => {
  @classInfo()
  class A {}

  t.deepEqual(getMetadata(A).classInfo, {
    name: 'A',
    extends: [],
    implements: [],
  });
});

test('class info, name from classInfo', t => {
  @classInfo({ name: 'newName' })
  class A {}

  t.deepEqual(getMetadata(A).classInfo, {
    name: 'newName',
    extends: [],
    implements: [],
  });
});

test('has super class', t => {
  class Z {}
  class A extends Z {}
  @classInfo()
  class B extends A {}

  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A, Z],
    implements: [],
  });

  t.deepEqual(classLoader.getImplementClasses(Z), [
    {
      type: B,
      info: {
        name: 'B',
        extends: [A, Z],
        implements: [],
      },
    },
  ]);
  t.deepEqual(classLoader.getImplementClasses(A), [
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

test('has interface', t => {
  const A = Symbol('A');
  interface A {}
  @classInfo({ implements: [A] })
  class B implements A {}

  t.deepEqual(getMetadata(B).classInfo, {
    name: 'B',
    extends: [],
    implements: [A],
  });

  t.deepEqual(classLoader.getImplementClasses(A), [
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

test('register with info', t => {
  class A {}
  classLoader.registerClass(A, {});

  t.deepEqual(classLoader.getClassInfo(A), {
    name: 'A',
    extends: [],
    implements: [],
  });
});

test('cannot register twice', t => {
  class A {}
  classLoader.registerClass(A);
  t.throws(() => classLoader.registerClass(A), { instanceOf: DuplicateRegistrationError });
});

test('unregisterClass', t => {
  class A {}
  class B extends A {}
  classLoader.registerClass(B);
  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(A), [
    {
      type: B,
      info: {
        name: 'B',
        extends: [A],
        implements: [],
      },
    },
  ]);
  t.deepEqual(classLoader.unregisterClass(B), true);
  t.deepEqual(classLoader.unregisterClass(B), false);
  t.deepEqual(classLoader.getClassInfo(B), undefined);
  t.deepEqual(classLoader.getImplementClasses(A), []);

  t.notThrows(() => classLoader.unregisterClass(B));
});

test('filterClasses', t => {
  class A {}
  @classInfo()
  class B extends A {}

  t.deepEqual(
    classLoader.filterClasses(info => info.type === B),
    [
      {
        info: {
          name: 'B',
          extends: [A],
          implements: [],
        },
        type: B,
      },
    ]
  );
});

test('classAll', t => {
  class A {}
  class B extends A {}
  classLoader.registerClass(B);
  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(A), [
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
  t.deepEqual(classLoader.getClassInfo(B), undefined);
  t.deepEqual(classLoader.getImplementClasses(A), []);
});

test('double in impl and extends', t => {
  abstract class Base {}
  @classInfo({ implements: [Base] })
  class A extends Base {}

  t.deepEqual(classLoader.getImplementClasses(Base), [
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

test('clone', t => {
  class Base {}
  class A extends Base {}
  class B extends Base {}

  classLoader.registerClass(A);

  const newLoader = classLoader.clone();

  t.true(classLoader !== newLoader);
  t.deepEqual(classLoader.getClassInfo(A), {
    name: 'A',
    extends: [Base],
    implements: [],
  });
  t.deepEqual(newLoader.getClassInfo(A), {
    name: 'A',
    extends: [Base],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(Base).length, 1);
  t.deepEqual(newLoader.getImplementClasses(Base).length, 1);

  newLoader.registerClass(B);
  t.falsy(classLoader.getClassInfo(B));
  t.deepEqual(newLoader.getClassInfo(B), {
    name: 'B',
    extends: [Base],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(Base).length, 1);
  t.deepEqual(newLoader.getImplementClasses(Base).length, 2);
});

test('clone, subclass', t => {
  class NewClassLoader extends ClassLoader {}

  const newLoader = new NewClassLoader();
  t.true(newLoader instanceof ClassLoader);
  t.true(newLoader instanceof NewClassLoader);

  const newLoader2 = newLoader.clone();
  t.true(newLoader2 instanceof ClassLoader);
  t.true(newLoader2 instanceof NewClassLoader);
});

test('init with', t => {
  class A {}
  class B {}

  classLoader.registerClass(A);

  const newLoader = new ClassLoader();
  newLoader.initWith(classLoader);

  t.true(classLoader !== newLoader);
  t.deepEqual(classLoader.getClassInfo(A), {
    name: 'A',
    extends: [],
    implements: [],
  });
  t.deepEqual(newLoader.getClassInfo(A), {
    name: 'A',
    extends: [],
    implements: [],
  });

  newLoader.registerClass(B);
  t.falsy(classLoader.getClassInfo(B));
  t.deepEqual(newLoader.getClassInfo(B), {
    name: 'B',
    extends: [],
    implements: [],
  });
});

test('no classLoader', t => {
  const ioc = new IocContext({ useClassLoader: false });
  t.true(ioc.classLoader === undefined);

  abstract class Base {}
  @classInfo({ implements: [Base] })
  class A extends Base {}

  t.true(ioc.getImports(Base).length === 0);
});

test('getMetadata, Object', t => {
  const meta = getMetadata(Object);
  t.deepEqual(meta, new MetadataType());

  meta.injectable = true;
  t.deepEqual(meta.injectable, true);
  t.notDeepEqual(getMetadata(Object), meta);
  t.deepEqual(getMetadata(Object).injectable, undefined);
});
