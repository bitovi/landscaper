import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import {ask, log, saveJob} from './util'

export default function begin (startingFile) {
  if (startingFile) {
    return loadJobFile(startingFile)
  }

  return initJobFile()
}

function isFileNotFound (error) {
  return error && error.code === 'ENOENT'
}

function isMissingExtension (filename) {
  return !filename.endsWith('.json')
}

function isJobLike (job) {
  return [
    'directories',
    'githubRepos',
    'mods'
  ].every(key => Array.isArray(job[key]))
}

function loadJobFile (filename, oldFilename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, {encoding: 'utf8'}, (error, text) => {
      error ? reject(error) : resolve(text)
    })
  }).then(text => {
    let json
    try {
      json = JSON.parse(text)
    } catch (error) {
      throw new Error(`Malformed JSON in "${filename}": ` + error)
    }

    if (!isJobLike(json)) {
      throw new Error(`File "${filename}" does not look like a Landscaper job."`)
    }

    return {filepath: filename, job: json}
  }).catch(error => {
    if (isFileNotFound(error) && isMissingExtension(filename)) {
      const newFilename = filename + '.json'
      return loadJobFile(newFilename, filename)
    }

    if (isFileNotFound(error)) {
      if (oldFilename) {
        throw new Error(`Files "${oldFilename}" nor "${filename}" were found`)
      } else {
        throw new Error(`File "${filename}" not found`)
      }
    }

    throw error
  })
}

async function askFilename (message) {
  const filename = await ask({message})
  const cleanName = filename && filename.trim()
  if (!cleanName) {
    log('No file name? That is not a good idea.')
    return askFilename('What should we name the file?')
  }

  return cleanName
}

async function askDirectory (message) {
  const directory = await ask({message})
  const cleanName = directory && directory.trim()
  if (!cleanName) {
    return null
  }

  return cleanName
}

const introMessage = `
${chalk.green.bold.underline('Landscaper')}
Hello! Let's start landscaping!

First, we need to create a landscaping "job" which
is a JSON file describing:
  - The directories we will modify
  - The Github repos to pull request (optional)
  - The mods we will run in each directory
  - The configuration options for each mod

You can view/edit/commit this file if you want.
Don't worry, I'll try to do most of the legwork.
`

async function initJobFile (isRetry) {
  if (!isRetry) {
    log(introMessage)
  }

  let filename = await askFilename('What should we name this new job file?')
  if (isMissingExtension(filename)) {
    filename += '.json'
  }
  const defaultDirectory = process.cwd()
  const directory = await askDirectory(`Where should we put "${filename}"? (Defaults to current directory)`) || defaultDirectory
  // TODO: ensure directory exists

  const filepath = path.join(directory, filename)
  // TODO: ensure we aren't overriding and ask --force if so
  if (fs.existsSync(filepath)) {
    let savedJob
    try {
      savedJob = await loadJobFile(filepath)
    } catch (error) {}
    if (savedJob) {
      log(`File "${filename}" looks like a Landscaper job`)
      const shouldUse = await ask({
        type: 'confirm',
        message: 'Use this existing job?'
      })

      if (shouldUse) {
        return savedJob
      }
    }

    log(`File "${filename}" already exists in "${directory}"`)
    const shouldReplace = await ask({
      type: 'confirm',
      message: 'Replace this file?'
    })

    if (!shouldReplace) {
      return initJobFile(true)
    }
  }

  const initialJob = {
    directories: [],
    githubRepos: [],
    mods: []
  }

  await saveJob(filepath, initialJob)
  return {filepath, job: initialJob}
}
