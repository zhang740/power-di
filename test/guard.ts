import test from 'ava';
import { guard } from '../lib/utils/guard';

test('guard', t => {
  t.notThrows(() =>
    guard(() => {
      throw Error();
    })
  );
});

test('default value', t => {
  t.true(
    guard(
      () => {
        throw Error();
      },
      { defaultValue: 5 }
    ) === 5
  );
});

test('onError', t => {
  guard(
    () => {
      throw Error();
    },
    {
      onError: () => {
        t.pass();
      },
    }
  );
});
