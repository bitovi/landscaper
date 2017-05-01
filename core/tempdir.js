const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

let i = 0

function makeDir (path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, error => (
            error ? reject(error) : resolve()
        ))
    })
}

module.exports = {
    createDir (parentDir) {
        return new Promise((resolve, reject) => {
            let attmepts = 0
            let error
            let filepath
            while (attmepts++ < 3) {
                try {
                    name = 'work-dir-' + (i++)
                    filepath = path.join(parentDir, name)
                    await makeDir(filepath)
                } catch (caughtError) {
                    error = caughtError
                    continue
                }
                error = null
                break
            }
            if (error) {
                reject(error)
            } else {
                resolve(filepath)
            }
        })
    },

    removeDir (dir) {
        return new Promise((resolve, reject) => {
            rimraf(dir, function (error) {
                error ? reject(error) : resolve()
            })
        })
    }
}
