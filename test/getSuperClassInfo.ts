import test from 'ava';
import { getSuperClassInfo } from '../lib/utils/getSuperClassInfo';

test('basic', t => {
  class A {}
  class B extends A {}
  class C extends B {}

  t.deepEqual(getSuperClassInfo(C), [
    { type: 'B', class: B },
    { type: 'A', class: A },
  ]);
});
