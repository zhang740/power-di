import test from 'ava';
import { classInfo } from '../lib';
import { getMetadata } from '../lib/class/metadata';
import { classLoader } from '../lib/class/ClassLoader';

test('class info', t => {
  @classInfo()
  class A { }

  t.deepEqual(getMetadata(A).classInfo, {
    name: 'A',
    extends: [],
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
  });

  t.deepEqual(classLoader.getImplementClasses(Z), [B]);
  t.deepEqual(classLoader.getImplementClasses(A), [B]);
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

  t.deepEqual(classLoader.getImplementClasses(A), [B]);
});
