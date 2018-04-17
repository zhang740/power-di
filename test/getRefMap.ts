import test from 'ava'
import { getDecorators, lazyInject } from '../lib/helper'
import { getRefMap } from '../lib/utils/getRefMap'
const { register } = getDecorators()

test('getRefMap, base', t => {
  @register()
  class A { }

  @register()
  class B {
    @lazyInject()
    private a: A
  }

  class C {
    @lazyInject()
    private a: A

    @lazyInject()
    private b: B
  }

  const data = getRefMap(C)
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
  })
})

test('getRefMap, super class', t => {

  class Base { }

  @register()
  class D extends Base { }

  @register()
  class E extends Base {
    @lazyInject()
    private a: D
  }

  class F extends Base {
    @lazyInject()
    private a: D

    @lazyInject()
    private b: E
  }

  const data = getRefMap(F)
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
  })
})

test('getRefMap, extends', t => {

  class InjClsA { }
  class InjClsB { }

  class BaseCls {
    @lazyInject()
    a: InjClsA
  }

  class SubCls extends BaseCls {
    @lazyInject()
    b: InjClsB
  }

  const map = {}
  getRefMap(BaseCls, map)
  getRefMap(SubCls, map)

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
  })
})
