import { expect, it } from 'vitest';
import { guard } from '../src';

it('guard', () => {
  expect(() =>
    guard(() => {
      throw new Error();
    }),
  ).not.toThrow();
});

it('default value', () => {
  expect(
    guard(
      () => {
        throw new Error();
      },
      { defaultValue: 5 },
    ),
  ).toBe(5);
});

it('onError', () => {
  guard(
    () => {
      throw new Error();
    },
    {
      onError: () => {
        expect(true).toBe(true);
      },
    },
  );
});
