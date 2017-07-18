import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'

function log () {
  console.log.apply(console, arguments)
}

export default function begin (startingFile) {
  if (startingFile) {
    return loadJobFile(startingFile)
  } else {
    return initJobFile()
  }
}

function isFileNotFound (error) {
  return error && error.code === 'ENOENT'
}

function isMissingExtension (filename) {
  return !filename.endsWith('.json')
}

function loadJobFile (filename, isRetry) {
  if (!isRetry) {
    log(`Loading job "${filename}"...`)
  }
  return new Promise((resolve, reject) => {
    fs.readFile(filename, {encoding: 'utf8'}, function (error, text) {
      if (isFileNotFound(error) && isMissingExtension(filename)) {
        const newFilename = filename + '.json'
        log(`Job "${filename}" not found; trying "${newFilename}"...`)
        return loadJobFile(newFilename, true).then(resolve, reject)
      }

      if (isFileNotFound(error)) {
        return reject(new Error(`File "${filename}" not found`))
      }

      if (error) {
        return reject(error)
      }

      let json
      try {
        json = JSON.parse(text)
      } catch (error) {
        reject(new Error(`Malformed JSON in "${filename}": ` + error))
      }

      // TODO: validate the structure of the JSON

      resolve({filepath: filename, job: json})
    })
  })
}

async function askFilename (message) {
  const {filename} = await inquirer.prompt([{
    name: 'filename',
    type: 'input',
    message
  }])
  const cleanName = filename && filename.trim()
  if (!cleanName) {
    log('No file name? That is not a good idea.')
    return askFilename('What should we name the file?')
  }

  return cleanName
}

async function askDirectory (message) {
  const {directory} = await inquirer.prompt([{
    name: 'directory',
    type: 'input',
    message
  }])
  const cleanName = directory && directory.trim()
  if (!cleanName) {
    return null
  }

  return cleanName
}

const introMessage = `
Hello! Let's start landscaping!

First, we need to create a landscaping "job" which
is a JSON file describing:
  - The directories we will modify
  - The mods we will run in each directory
  - The configuration options for each mod

You can view/edit/commit this file if you want.
Don't worry, I'll try to do most of the legwork.
`

async function initJobFile () {
  log(introMessage)

  let filename = await askFilename('What should we name this new job file?')
  if (isMissingExtension(filename)) {
    filename += '.json'
  }
  const defaultDirectory = process.cwd()
  const directory = await askDirectory(`Where should we put "${filename}"? (Defaults to current directory)`) || defaultDirectory
  // TODO: ensure directory exists

  const filepath = path.join(directory, filename)
  // TODO: ensure we aren't overriding and ask --force if so

  const initialJob = {
    directories: []
  }

  const text = JSON.stringify(initialJob, null, 2)
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, text, error => {
      if (error) {
        return reject(error)
      }

      log(`Created "${filepath}"`)
      resolve({filepath, job: initialJob})
    })
  })
}
