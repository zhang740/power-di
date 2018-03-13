import test from 'ava'
import { getGlobalType, getSuperClassInfo, isExtendOf } from '../lib/utils'

test('getGlobalType, error.', t => {
  t.throws(() => getGlobalType(undefined))
  t.throws(() => getGlobalType(123))
  t.throws(() => getGlobalType(() => { }))
  t.throws(() => getGlobalType(function () { }))
})

test('getGlobalType, string.', t => {
  t.true(getGlobalType('stringkey') === 'stringkey')
})

test('getGlobalType, a class.', t => {
  class A { }

  const typeA = getGlobalType(A)
  t.true(typeA === 'A')

  // es5
  function test() { }
  t.true(getGlobalType(test) === 'test')
})

test('getSuperClassInfo.', t => {
  class A { }
  class B extends A { }

  const typeAs = getSuperClassInfo(A)
  const typeBs = getSuperClassInfo(B)
  t.true(typeAs.length === 0)
  t.true(typeBs.length === 1)
  t.true(typeBs[0].type === getGlobalType(A))
  t.true(typeBs[0].class === A)
  t.throws(() => getSuperClassInfo(123 as any))
  t.throws(() => getSuperClassInfo('123' as any))
  t.throws(() => getSuperClassInfo(() => { }))
})

test('isExtendOf', t => {
  class A { }
  class B extends A { }
  class C { }

  t.true(isExtendOf(B, A))
  t.false(isExtendOf(A, B))
  t.false(isExtendOf(C, A))
  t.throws(() => isExtendOf(A, 1 as any))
  t.throws(() => isExtendOf(1 as any, A))
})
