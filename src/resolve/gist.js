import path from 'path'
import request from 'request'

export function getFilenames (hash) {
  if (!(hash && hash.startsWith('file-'))) {
    return []
  }
  const segments = hash.slice(5).split('-')
  return segments.reduce((filesnames, segment, index, segments) => {
    const nextIndex = index + 1
    const basename = segments.slice(0, nextIndex).join('-')
    const ext = segments.slice(nextIndex)
    const extension = ext.length ? '.' + ext.join('.') : ''
    return filesnames.concat(`${basename}${extension}`)
  }, [])
}

const gistWithOwnerAndId = /https:\/\/gist\.github\.com\/(?:.*)\/(.*)/
export function getGistId (url) {
  const match = url.match(gistWithOwnerAndId)
  if (match) {
    const [, id] = match
    const [gistId, hash] = id.split('#')
    const filenames = getFilenames(hash)
    return [gistId, filenames]
  }
}

const rawGistUrl = /https:\/\/gist\.githubusercontent\.com\/(.*)\/(.*)\/raw\/(.*)\/(.*)/
export function isRawGistUrl (url) {
  return rawGistUrl.test(url)
}

const baseHeaders = {
  'User-Agent': 'Landscaper'
}

export function githubHeaders (accessToken) {
  if (!accessToken) {
    return baseHeaders
  }
  return {
    ...baseHeaders,
    'Authorization': `token ${accessToken}`
  }
}

export function getGist (id, options) {
  const url = `https://api.github.com/gists/${id}`
  return new Promise((resolve, reject) => {
    request({
      url,
      headers: githubHeaders(options.accessToken),
      json: true
    }, (error, res, data) => {
      error ? reject(error) : resolve(data)
    })
  })
}

export function getGistFile (url, options) {
  return new Promise((resolve, reject) => {
    request({
      url,
      headers: githubHeaders(options.accessToken)
    }, (error, res, body) => {
      error ? reject(error) : resolve(body)
    })
  })
}

export function compileModule (code, globals = {}) {
  let exports = {}
  let module = { exports }
  let globalNames = Object.keys(globals)
  let keys = ['module', 'exports', 'require', ...globalNames]
  let values = [module, exports, require, ...globalNames.map(key => globals[key])]
  /* eslint-disable no-new-func */
  new Function(keys.join(), code).apply(exports, values)
  return module.exports
}

export function getPrimaryFile (gist, filenames) {
  const {files} = gist
  if (!files) {
    return
  }
  for (const filename of filenames) {
    const file = files[filename]
    if (file) {
      return file.raw_url
    }
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
    return !!(getGistId(url) || isRawGistUrl(url))
  },

  async getInfo (url, resolveOptions) {
    let fileUrl
    let description
    if (isRawGistUrl(url)) {
      fileUrl = url
      description = 'Raw github gist'
    } else {
      const [id, filenames] = getGistId(url)
      const gist = await getGist(id, resolveOptions)
      fileUrl = getPrimaryFile(gist, filenames)
      description = gist.description
    }
    if (!fileUrl) {
      throw new Error('Gist did not have any files')
    }
    const [name] = path.basename(fileUrl).split('#')
    const script = await getGistFile(fileUrl, resolveOptions)
    const {cache, transforms} = resolveOptions
    const {scriptPath, cleanup} = await cache.saveGist(fileUrl, script)
    const mod = transforms.getMod(scriptPath)
    const options = mod.getOptions ? mod.getOptions() : []
    await cleanup()
    return {name, description, options}
  },

  async getExecutor (url, resolveOptions) {
    let fileUrl = url
    if (!isRawGistUrl(url)) {
      const [id, filenames] = getGistId(url)
      const gist = await getGist(id, resolveOptions)
      fileUrl = getPrimaryFile(gist, filenames)
    }
    if (!fileUrl) {
      throw new Error('Gist did not have any files')
    }
    const script = await getGistFile(fileUrl, resolveOptions)
    const {cache, transforms} = resolveOptions
    const {scriptPath, cleanup} = await cache.saveGist(fileUrl, script)
    const runner = transforms.getMod(scriptPath)
    await cleanup()
    return function execute (root, options) {
      return runner.run(root, options)
    }
  }
}
