import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

export function getTestDir (name) {
  return path.join(__dirname, name)
}

export function removeTestDir (name) {
  const directory = getTestDir(name)
  return new Promise((resolve, reject) => {
    rimraf(directory, error => (
      error ? reject(error) : resolve()
    ))
  })
}

export function createTestDir (name) {
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
