const request = require('request')

const gistWithOwnerAndId = /https:\/\/gist.github.com\/(.*)\/(.*)/
function getOwnerAndId (url) {
    const match = url.match(gistWithOwnerAndId)
    if (match) {
        const [_, owner, id] = match
        return [owner, id]
    }
}

function getGist (id) {
    const url = `https://api.github.com/v3/gists/${id}`
    return new Promise((resolve, reject) => {
        request({url, json: true}).then((error, res, data) => {
            error ? reject(error) : resolve(data)
        })
    })
}

function getGistFile (url) {
    return new Promise((resolve, reject) => {
        request({url}).then((error, res, body) => {
            error ? reject(error) : resolve(body)
        })
    })
}

function compileModule(code, globals = {}) {
  let exports = {};
  let module = { exports };
  let globalNames = Object.keys(globals);
  let keys = ['module', 'exports', ...globalNames];
  let values = [module, exports, ...globalNames.map(key => globals[key])];
  new Function(keys.join(), code).apply(exports, values);
  return module.exports;
}

getPrimaryFile (gist) {
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

module.exports = {
    isMatch (url) {
        return !!getOwnerAndId(url)
    },

    getInfoForUrl (url) {
        const [owner, id] = getOwnerAndId(url)
        return getGist(id).then(gist => {
            const fileUrl = getPrimaryFile(gist)
            if (!fileUrl) {
                throw new Error('Gist did not have any files')
            }
            return getGistFile(fileUrl).then(script => {
                return {
                    name: path.basename(fileUrl),
                    description: gist.description,
                    options: compileModule(script).getOptions()
                }
            })
        })
    },

    getExecutorForUrl (url) {
        const [owner, id] = getOwnerAndId(url)
        return getGist(id).then(gist => {
            const fileUrl = getPrimaryFile(gist)
            if (!fileUrl) {
                throw new Error('Gist did not have any files')
            }
            const executor = compileModule(script)
            return function execute(root, options) {
                return executor.run(root, options)
            }
        })
    }
}
