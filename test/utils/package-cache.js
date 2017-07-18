import fs from 'fs'
import path from 'path'
import test from 'ava'
import {npmInstall} from '../../src/utils/package-cache'
import {createTestDir} from '../helpers/temp-folder'

test('npmInstall() should work', async t => {
  const packageName = 'left-pad'
  const {directory, cleanup} = await createTestDir('npm-install')
  return npmInstall(directory, packageName).then(() => {
    t.true(fs.existsSync(path.join(directory, 'node_modules', packageName)))
    return cleanup()
  })
})
