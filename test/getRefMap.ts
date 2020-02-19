import test from 'ava';
import { getRefMap } from '../lib/utils/getRefMap';
import { inject, injectable } from '../lib';

test('getRefMap, base', t => {
  @injectable()
  class A { }

  @injectable()
  class B {
    @inject()
    private a: A;
  }

  class C {
    @inject()
    private a: A;

    @inject()
    private b: B;
  }

  const data = getRefMap(C);
  t.deepEqual(data, {
    'C': {
      'count': 0,
      'deps': [
        { 'prop': 'a', 'type': 'A' },
        { 'prop': 'b', 'type': 'B' }
      ]
    },
    'A': {
      'count': 2,
      'deps': []
    },
    'B': {
      'count': 1,
      'deps': [
        { 'prop': 'a', 'type': 'A' }
      ]
    }
  });
});

test('getRefMap, super class', t => {

  class Base { }

  @injectable()
  class D extends Base { }

  @injectable()
  class E extends Base {
    @inject()
    private a: D;
  }

  class F extends Base {
    @inject()
    private a: D;

    @inject()
    private b: E;
  }

  const data = getRefMap(F);
  t.deepEqual(data, {
    'F': {
      'count': 0,
      'deps': [
        { 'prop': 'a', 'type': 'D' },
        { 'prop': 'b', 'type': 'E' }
      ]
    },
    'D': {
      'count': 2,
      'deps': []
    },
    'E': {
      'count': 1,
      'deps': [
        { 'prop': 'a', 'type': 'D' }
      ]
    }
  });
});

test('getRefMap, extends', t => {

  class InjClsA { }
  class InjClsB { }

  class BaseCls {
    @inject()
    a: InjClsA;
  }

  class SubCls extends BaseCls {
    @inject()
    b: InjClsB;
  }

  const map = {};
  getRefMap(BaseCls, map);
  getRefMap(SubCls, map);

  t.deepEqual(map, {
    'BaseCls': {
      'count': 0,
      'deps': [
        {
          'prop': 'a',
          'type': 'InjClsA'
        }
      ]
    },
    'InjClsA': {
      'count': 2,
      'deps': []
    },
    'SubCls': {
      'count': 0,
      'deps': [
        {
          'prop': 'b',
          'type': 'InjClsB'
        },
        {
          'prop': 'a',
          'type': 'InjClsA'
        }
      ]
    },
    'InjClsB': {
      'count': 1,
      'deps': []
    }
  });
});
