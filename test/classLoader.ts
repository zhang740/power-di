import test from 'ava';
import { classInfo, DuplicateRegistrationError } from '../lib';
import { getMetadata } from '../lib/class/metadata';
import { classLoader } from '../lib/class/ClassLoader';

test('class info', t => {
  @classInfo()
  class A { }

  t.deepEqual(getMetadata(A).classInfo, {
    name: 'A',
    extends: [],
    implements: [],
  });
});

test('has super class', t => {
  class Z { }
  class A extends Z { }
  @classInfo()
  class B extends A { }

  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A, Z],
    implements: [],
  });

  t.deepEqual(classLoader.getImplementClasses(Z), [{
    type: B, info: {
      name: 'B',
      extends: [A, Z],
      implements: [],
    }
  }]);
  t.deepEqual(classLoader.getImplementClasses(A), [{
    type: B, info: {
      name: 'B',
      extends: [A, Z],
      implements: [],
    }
  }]);
});

test('has interface', t => {
  const A = Symbol('A');
  interface A { }
  @classInfo({ implements: [A] })
  class B implements A { }

  t.deepEqual(getMetadata(B).classInfo, {
    name: 'B',
    extends: [],
    implements: [A],
  });

  t.deepEqual(classLoader.getImplementClasses(A), [{
    type: B, info: {
      name: 'B',
      extends: [],
      implements: [A],
    }
  }]);
});

test('cannot register twice', t => {
  class A { }
  classLoader.registerClass(A);
  t.throws(() => classLoader.registerClass(A), err => err instanceof DuplicateRegistrationError);
});

test('unregisterClass', t => {
  class A { }
  class B extends A { }
  classLoader.registerClass(B);
  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(A), [{
    type: B,
    info: {
      name: 'B',
      extends: [A],
      implements: [],
    },
  }]);
  classLoader.unregisterClass(B);
  t.deepEqual(classLoader.getClassInfo(B), undefined);
  t.deepEqual(classLoader.getImplementClasses(A), []);
});

test('filterClasses', t => {
  class A { }
  @classInfo()
  class B extends A { }

  t.deepEqual(classLoader.filterClasses(info => info.type === B), [{
    info: {
      name: 'B',
      extends: [A],
      implements: [],
    },
    type: B
  }]);
});

test('classAll', t => {
  class A { }
  class B extends A { }
  classLoader.registerClass(B);
  t.deepEqual(classLoader.getClassInfo(B), {
    name: 'B',
    extends: [A],
    implements: [],
  });
  t.deepEqual(classLoader.getImplementClasses(A), [{
    type: B,
    info: {
      name: 'B',
      extends: [A],
      implements: [],
    },
  }]);
  classLoader.clearAll();
  t.deepEqual(classLoader.getClassInfo(B), undefined);
  t.deepEqual(classLoader.getImplementClasses(A), []);
});
