import path from 'path'
import validateNpmPackageName from 'validate-npm-package-name'
import {getInfoForPackage} from '../utils/registry'

export function isValidPackage (name) {
  return validateNpmPackageName(name).validForNewPackages
}

export function getNameAndPath (modName) {
  if (modName.includes('://')) {
    return
  }

  let [scope, name, ...parts] = modName.split('/')
  if (scope.charAt(0) === '@') {
    name = scope + '/' + name
  } else {
    parts.unshift(name)
    name = scope
  }
  if (!isValidPackage(name)) {
    return
  }
  const path = parts.join('/')
  if (!path) {
    return [name]
  }
  return [name, path]
}

export default {
  isMatch (modName) {
    return !!getNameAndPath(modName)
  },

  async getInfo (modName, {cache, transforms}) {
    const [packageName, packagePath] = getNameAndPath(modName)
    const {name, description} = await getInfoForPackage(packageName)
    const packageDir = await cache.getPackage(packageName)
    const requirePath = path.join(packageDir, packagePath || '')
    const mod = transforms.getMod(requirePath)
    const options = mod.getOptions ? mod.getOptions() : []
    return {name, description, options}
  },

  async getExecutor (modName, {cache, transforms}) {
    const [packageName, packagePath] = getNameAndPath(modName)
    const packageDir = await cache.getPackage(packageName)
    const requirePath = path.join(packageDir, packagePath || '')
    const runner = transforms.getMod(requirePath)
    return function (root, options) {
      return runner.run(root, options)
    }
  }
}
