import { expect, it } from 'vitest';
import {
  getGlobalType,
  getSuperClassInfo,
  isClass,
  isExtendOf,
  symbolString,
} from '../src';

it('getGlobalType, error.', () => {
  expect(() => getGlobalType(undefined)).toThrow();
  expect(() => getGlobalType(123)).toThrow();
});

it('getGlobalType, string.', () => {
  expect(getGlobalType('stringKey')).toBe('stringKey');
});

it('getGlobalType, a class.', () => {
  class A {}

  expect(getGlobalType(A)).toBe('A');

  class B extends A {}

  expect(getGlobalType(B)).toBe('B');

  expect(getGlobalType(class {})).toBe('[anonymous]');

  function test() {}
  expect(getGlobalType(test)).toMatch(/^test/);
});

it('getSuperClassInfo.', () => {
  class A {}
  class B extends A {}

  const typeAs = getSuperClassInfo(A);
  const typeBs = getSuperClassInfo(B);
  expect(typeAs.length).toBe(0);
  expect(typeBs.length).toBe(1);
  expect(typeBs[0].type).toBe(getGlobalType(A));
  expect(typeBs[0].class).toBe(A);
  expect(() => getSuperClassInfo(123 as any)).toThrow();
  expect(() => getSuperClassInfo('123' as any)).toThrow();
  expect(() => getSuperClassInfo(() => {})).toThrow();
});

it('isExtendOf', () => {
  class A {}
  class B extends A {}
  class C {}

  expect(isExtendOf(B, A)).toBe(true);
  expect(isExtendOf(A, B)).toBe(false);
  expect(isExtendOf(C, A)).toBe(false);
  expect(() => isExtendOf(A, 1 as any)).toThrow();
  expect(() => isExtendOf(1 as any, A)).toThrow();
});

it('symbolString', () => {
  const sym = Symbol('TestSymbol');
  expect(symbolString(sym)).toBe('Symbol(TestSymbol)');
});

it('isClass', () => {
  expect(!!isClass(1)).toBe(false);
  expect(!!isClass('')).toBe(false);
  expect(!!isClass(undefined)).toBe(false);
  expect(!!isClass(null)).toBe(false);
  expect(!!isClass({})).toBe(false);
  expect(!!isClass(new Date())).toBe(false);
  expect(!!isClass(Symbol('TestSymbol'))).toBe(false);

  class B {}
  class C extends B {}
  expect(isClass(B)).toBe(true);
  expect(isClass(C)).toBe(true);
  expect(isClass(class {})).toBe(true);
});
