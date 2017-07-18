import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import npmProg from 'npm-programmatic'

function isExistingDirectory (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stats) => {
      resolve(!error && stats.isDirectory())
    })
  })
}

export function ensureLocalPackageJson (directory) {
  const packageJsonPath = path.join(directory, 'package.json')
  const hasPackageJson = fs.existsSync(packageJsonPath)
  if (hasPackageJson) {
    return Promise.resolve()
  }

  const content = JSON.stringify({name: 'needed-for-local-cache-install'})
  return new Promise((resolve, reject) => {
    fs.writeFile(packageJsonPath, content, error => {
      error ? reject(error) : resolve()
    })
  })
}

export function npmInstall (directory, packageName) {
  return ensureLocalPackageJson(directory).then(() => {
    return npmProg.install(packageName, {cwd: directory})
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
