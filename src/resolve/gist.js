import path from 'path'
import request from 'request'

const gistWithOwnerAndId = /https:\/\/gist.github.com\/(.*)\/(.*)/
export function getOwnerAndId (url) {
  const match = url.match(gistWithOwnerAndId)
  if (match) {
    const [, owner, id] = match
    return [owner, id]
  }
}

export function getGist (id, options) {
  const url = `https://api.github.com/v3/gists/${id}`
  return new Promise((resolve, reject) => {
    request({url, json: true}).then((error, res, data) => {
      error ? reject(error) : resolve(data)
    })
  })
}

export function getGistFile (url, options) {
  return new Promise((resolve, reject) => {
    request({url}).then((error, res, body) => {
      error ? reject(error) : resolve(body)
    })
  })
}

export function compileModule (code, globals = {}) {
  let exports = {}
  let module = { exports }
  let globalNames = Object.keys(globals)
  let keys = ['module', 'exports', ...globalNames]
  let values = [module, exports, ...globalNames.map(key => globals[key])]
  /* eslint-disable no-new-func */
  new Function(keys.join(), code).apply(exports, values)
  return module.exports
}

export function getPrimaryFile (gist) {
  const {files} = gist
  if (!files) {
    return
  }
  const index = files['index.js']
  if (index) {
    return index.raw_url
  }
  for (const filename in files) {
    return files[filename].raw_url
  }
}

export default {
  isMatch (url) {
    return !!getOwnerAndId(url)
  },

  getInfo (url, options) {
    const [, id] = getOwnerAndId(url)
    return getGist(id, options).then(gist => {
      const fileUrl = getPrimaryFile(gist)
      if (!fileUrl) {
        throw new Error('Gist did not have any files')
      }
      return getGistFile(fileUrl, options).then(script => {
        return {
          name: path.basename(fileUrl),
          description: gist.description,
          options: compileModule(script).getOptions()
        }
      })
    })
  },

  getExecutor (url, options) {
    const [, id] = getOwnerAndId(url)
    return getGist(id, options).then(gist => {
      const fileUrl = getPrimaryFile(gist)
      if (!fileUrl) {
        throw new Error('Gist did not have any files')
      }
      return getGistFile(fileUrl, options).then(script => {
        const executor = compileModule(script)
        return function execute (root, options) {
          return executor.run(root, options)
        }
      })
    })
  }
}
