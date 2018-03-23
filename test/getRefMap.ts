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
  t.true(JSON.stringify(data) === JSON.stringify({
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
  }))
})
