import test from 'ava'
import {getGistId, getFilenames} from '../../src/resolve/gist'

test('getGistId() should work with gist URLs', t => {
  const gistUrl = 'https://gist.github.com/andrejewski/88e8760bd8280b20f4aa28ec7606f9b5'
  t.deepEqual(getGistId(gistUrl), ['88e8760bd8280b20f4aa28ec7606f9b5', []])
})

test('getFilenames() should work with gist URL hashes', t => {
  t.deepEqual(getFilenames(), [])
  t.deepEqual(getFilenames('foo'), [])
  t.deepEqual(getFilenames('file-foo'), ['foo'])
  t.deepEqual(getFilenames('file-foo-txt'), ['foo.txt', 'foo-txt'])
  t.deepEqual(getFilenames('file-foo-bar-txt'), [
    'foo.bar.txt',
    'foo-bar.txt',
    'foo-bar-txt'
  ])
})
