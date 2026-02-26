import { getRefMap } from '@power-di/class-loader';
import { expect, it } from 'vitest';
import { inject, injectable } from '../src';

it('getRefMap, base', () => {
  @injectable()
  class A {}

  @injectable()
  class B {
    @inject({ type: A })
    private a: A;
  }

  class C {
    @inject({ type: A })
    private a: A;

    @inject({ type: B })
    private b: B;
  }

  const data = getRefMap(C);
  expect(data).toEqual({
    C: {
      count: 0,
      deps: [
        { prop: 'a', type: 'A' },
        { prop: 'b', type: 'B' },
      ],
    },
    A: {
      count: 2,
      deps: [],
    },
    B: {
      count: 1,
      deps: [{ prop: 'a', type: 'A' }],
    },
  });
});

it('getRefMap, super class', () => {
  class Base {}

  @injectable()
  class D extends Base {}

  @injectable()
  class E extends Base {
    @inject({ type: D })
    private a: D;
  }

  class F extends Base {
    @inject({ type: D })
    private a: D;

    @inject({ type: E })
    private b: E;
  }

  const data = getRefMap(F);
  expect(data).toEqual({
    F: {
      count: 0,
      deps: [
        { prop: 'a', type: 'D' },
        { prop: 'b', type: 'E' },
      ],
    },
    D: {
      count: 2,
      deps: [],
    },
    E: {
      count: 1,
      deps: [{ prop: 'a', type: 'D' }],
    },
  });
});

it('getRefMap, extends', () => {
  class InjClsA {}
  class InjClsB {}

  class BaseCls {
    @inject({ type: InjClsA })
    a: InjClsA;
  }

  class SubCls extends BaseCls {
    @inject({ type: InjClsB })
    b: InjClsB;
  }

  const map = {};
  getRefMap(BaseCls, map);
  getRefMap(SubCls, map);

  expect(map).toEqual({
    BaseCls: {
      count: 0,
      deps: [
        {
          prop: 'a',
          type: 'InjClsA',
        },
      ],
    },
    InjClsA: {
      count: 2,
      deps: [],
    },
    SubCls: {
      count: 0,
      deps: [
        {
          prop: 'a',
          type: 'InjClsA',
        },
        {
          prop: 'b',
          type: 'InjClsB',
        },
      ],
    },
    InjClsB: {
      count: 1,
      deps: [],
    },
  });
});
