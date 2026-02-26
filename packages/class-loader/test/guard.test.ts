import { test, expect } from 'vitest';
import { guard } from '@power-di/class-loader';

test('guard', () => {
  expect(() =>
    guard(() => {
      throw Error();
    })
  ).not.toThrow();
});

test('default value', () => {
  expect(
    guard(
      () => {
        throw Error();
      },
      { defaultValue: 5 }
    )
  ).toBe(5);
});

test('onError', () => {
  guard(
    () => {
      throw Error();
    },
    {
      onError: () => {
        expect(true).toBe(true);
      },
    }
  );
});
