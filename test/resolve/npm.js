import test from 'ava'
import {getNameAndPath} from '../../src/resolve/npm'

test('getNameAndPath() should work with packages', t => {
  const plain = 'foo'
  t.deepEqual(getNameAndPath(plain), ['foo'])

  const scope = '@bar/foo'
  t.deepEqual(getNameAndPath(scope), ['@bar/foo'])

  const plainWithPath = 'foo/nested/file'
  t.deepEqual(getNameAndPath(plainWithPath), ['foo', 'nested/file'])

  const scopeWithPath = '@bar/foo/nested/file'
  t.deepEqual(getNameAndPath(scopeWithPath), ['@bar/foo', 'nested/file'])
})
