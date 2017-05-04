import fs from 'fs'
import path from 'path'
import test from 'ava'
import rimraf from 'rimraf'
import {getInfoForMod, run, createPackageCache} from '../src'

test('it should have all the methods', t => {
  t.is(typeof getInfoForMod, 'function')
  t.is(typeof run, 'function')
  t.is(typeof createPackageCache, 'function')
})

function getTestDir (name) {
  return path.join(__dirname, name)
}

function removeTestDir (name) {
  const directory = getTestDir(name)
  return new Promise((resolve, reject) => {
    rimraf(directory, error => (
      error ? reject(error) : resolve()
    ))
  })
}

function createTestDir (name) {
  return removeTestDir(name).then(() => {
    const directory = getTestDir(name)
    return new Promise((resolve, reject) => {
      fs.mkdir(directory, error => (
        error ? reject(error) : resolve()
      ))
    }).then(() => ({
      cleanup: () => removeTestDir(name),
      directory
    }))
  })
}

// gist tests
const accessToken = process.env.GH_TOKEN // personal access tokens work
if (!accessToken) {
  throw new Error('Provide a Github access token with GH_TOKEN={your token}')
}
const gistUrl = 'https://gist.github.com/andrejewski/9c604c2ed8d5b6b1b8df5bfdd35abcf7#file-text-file-js'

test('getInfoForMod() should work for gists', async t => {
  const info = await getInfoForMod(gistUrl, {accessToken})
  t.deepEqual(info, {
    name: 'text-file.js',
    description: 'Landscaper test mods',
    options: [{
      name: 'content',
      type: 'input',
      default: 'Some text I made',
      message: 'Text to write'
    }]
  })
})

test('run() should work for gists', async t => {
  const {directory, cleanup} = await createTestDir('gist-run')
  const content = 'Hello world'
  const mods = [{
    id: gistUrl,
    options: {content}
  }]

  const reporter = run(directory, mods, {accessToken})
  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  const text = await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'foo.txt')
    fs.readFile(filepath, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  t.is(text, content)
  await cleanup()
})

const rawGistUrl = 'https://gist.githubusercontent.com/andrejewski/9c604c2ed8d5b6b1b8df5bfdd35abcf7/raw/f528678d5cf75a972f2f56c7d1ec43f6d3352976/text-file.js'

test('getInfoForMod() should work for raw gists', async t => {
  const info = await getInfoForMod(rawGistUrl, {accessToken})
  t.deepEqual(info, {
    name: 'text-file.js',
    description: 'Raw github gist',
    options: [{
      name: 'content',
      type: 'input',
      default: 'Some text I made',
      message: 'Text to write'
    }]
  })
})

test('run() should work for raw gists', async t => {
  const {directory, cleanup} = await createTestDir('raw-gist-run')
  const content = 'Hello world'
  const mods = [{
    id: rawGistUrl,
    options: {content}
  }]

  const reporter = run(directory, mods, {accessToken})
  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  const text = await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'foo.txt')
    fs.readFile(filepath, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  t.is(text, content)
  await cleanup()
})

// npm tests
const npmPackage = 'landscaper-test-examples'

test('getInfoForMod() should work for NPM modules', async t => {
  const info = await getInfoForMod(npmPackage, {accessToken})
  t.deepEqual(info, {
    name: npmPackage,
    description: 'Landscaper test examples',
    options: [{
      name: 'content',
      type: 'input',
      default: 'Some text I made',
      message: 'Text to write'
    }]
  })
})

test('run() should work for npm modules', async t => {
  const {directory, cleanup} = await createTestDir('npm-run')
  const content = 'Hello world'
  const mods = [{
    id: npmPackage,
    options: {content}
  }]

  const reporter = run(directory, mods, {accessToken})
  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  const text = await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'foo.txt')
    fs.readFile(filepath, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  t.is(text, content)
  await cleanup()
})

test('run() should work for npm subpath modules', async t => {
  const npmPackage = 'landscaper-test-examples/nested/example'
  const {directory, cleanup} = await createTestDir('npm-nested')
  const content = 'Hello world'
  const mods = [{
    id: npmPackage,
    options: {content}
  }]

  const reporter = run(directory, mods, {accessToken})
  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  const text = await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'bar.txt')
    fs.readFile(filepath, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  t.is(text, content)
  await cleanup()
})

// jscodeshift test
const shiftGist = 'https://gist.github.com/andrejewski/6e2f6205c91fd099e09b86e309daf642#file-reverse-vars-js'

test('run() should work for raw gists', async t => {
  const {directory, cleanup} = await createTestDir('code-shift')
  await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'foo.js')
    fs.writeFile(filepath, 'var foo = 1;', (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  const mods = [{
    id: shiftGist,
    options: {path: [directory]}
  }]

  const reporter = run(directory, mods, {accessToken, cache: createPackageCache(directory)})
  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  const text = await new Promise((resolve, reject) => {
    const filepath = path.join(directory, 'foo.js')
    fs.readFile(filepath, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  })

  t.is(text, 'var oof = 1;')
  await cleanup()
})
