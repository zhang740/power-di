import { test, expect } from 'vitest';
import { getSuperClassInfo } from '@power-di/class-loader';

test('basic', () => {
  class A {}
  class B extends A {}
  class C extends B {}

  expect(getSuperClassInfo(C)).toEqual([
    { type: 'B', class: B },
    { type: 'A', class: A },
  ]);
});
