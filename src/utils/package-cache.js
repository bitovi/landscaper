import fs from 'fs'
import path from 'path'
import npmi from 'npmi'
import rimraf from 'rimraf'

function isExistingDirectory (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stats) => {
      resolve(!error && stats.isDirectory())
    })
  })
}

// we need this to fix problems with npmlog and inquirer
function silence (promise) {
  const stdout = console._stdout
  console._stdout = { write () {} }
  return promise().then(x => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(x), 100)
    })
  }).then(x => {
    console._stdout = stdout
    return x
  }, error => {
    console._stdout = stdout
    throw error
  })
}

function npmInstall (directory, packageName) {
  return silence(() => {
    return new Promise((resolve, reject) => {
      npmi({
        name: packageName,
        path: directory,
        npmLoad: {
          loglevel: 'silent',
          progress: false
        }
      }, (error, result) => {
        error ? reject(error) : resolve(result)
      })
    })
  })
}

export default class PackageCache {
  constructor (directory) {
    this._directory = directory
    this.gistCounter = 0
  }

  async getPackage (packageName) {
    const packagePath = path.join(this._directory, 'node_modules', packageName)
    const isInstalled = await isExistingDirectory(packagePath)
    if (!isInstalled) {
      await npmInstall(this._directory, packageName)
    }
    return packagePath
  }

  async saveGist (rawGistUrl, scriptText) {
    const filename = path.basename(rawGistUrl).split('#')[0]
    const filepath = path.join(this._directory, filename + '-' + this.gistCounter++)

    await new Promise((resolve, reject) => {
      fs.writeFile(filepath, scriptText, error => (
        error ? reject(error) : resolve()
      ))
    })

    const cleanup = () => {
      return new Promise((resolve, reject) => {
        fs.unlink(filepath, error => {
          error ? reject(error) : resolve()
        })
      })
    }
    return {scriptPath: filepath, cleanup}
  }

  static auto () {
    const cachePath = path.join(path.dirname(__dirname), 'cache')
    const cache = new PackageCache(cachePath)
    cache.empty = () => {
      rimraf.sync(cachePath)
    }
    cache.empty()
    fs.mkdirSync(cachePath)
    return cache
  }
}
