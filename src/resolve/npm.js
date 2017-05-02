import path from 'path'
import https from 'https'

export function packageUrl (name) {
  return `https://registry.npmjs.com/${name}`
}

export function makeJsonRequest (https, url) {
  return new Promise((resolve, reject) => {
    const fail = msg => reject(new Error(`${url}: ${msg}`))

    https.get(url, res => {
      if (res.statusCode >= 400) {
        return fail(`NPM registry returning status code ${res.statusCode}`)
      }

      let body = ''
      res.on('data', text => {
        body += text.toString()
      })
      res.on('end', () => {
        if (!body.length) {
          return fail(`No registry info`)
        }

        try {
          const result = JSON.parse(body)
          resolve(result)
        } catch (error) {
          fail(`Registry not returning valid JSON: ${error}`)
        }
      })
    }).on('error', reject)
  })
}

export function getInfoForPackage (name) {
  return makeJsonRequest(https, packageUrl(name))
}

export function getNameAndPath (modName) {
  return ['can-util', 'js/assign/assign']
}

export default {
  isMatch (modName) {
    const pkg = getNameAndPath(modName)
    return !!(pkg && pkg.name)
  },

  async getInfo (modName, {cache}) {
    const {
      name: packageName,
      path: packagePath
    } = getNameAndPath(modName)
    const {name, description} = await getInfoForPackage(packageName)
    const packageDir = await cache.getPackage(packageName)
    const requirePath = path.join(packageDir, packagePath || '')
    const options = require(requirePath).getOptions()
    return {name, description, options}
  },

  async getExecutor (modName, {cache}) {
    const {
      name: packageName,
      path: packagePath
    } = getNameAndPath(modName)
    const packageDir = await cache.getPackage(packageName)
    const requirePath = path.join(packageDir, packagePath || '')
    return function (root, options) {
      return require(requirePath).run(root, options)
    }
  }
}
