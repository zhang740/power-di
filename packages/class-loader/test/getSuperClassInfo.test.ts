import { expect, it } from 'vitest';
import { getSuperClassInfo } from '../src';

it('basic', () => {
  class A {}
  class B extends A {}
  class C extends B {}

  expect(getSuperClassInfo(C)).toEqual([
    { type: 'B', class: B },
    { type: 'A', class: A },
  ]);
});
