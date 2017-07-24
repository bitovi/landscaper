import fs from 'fs'
import path from 'path'
import {ask, log, saveJob, humanList} from '../util'

function isGitRepo () {
  return false
}

async function askGitOptions (defaultBranch, defaultPrTitle) {
  const branch = await ask({
    message: 'What should the branch name be?',
    default: `landscaper/${defaultBranch}`
  })
  const baseBranch = await ask({
    message: 'Base off which branch?',
    default: 'master'
  })

  return {
    baseBranch,
    branch
  }
}

export async function addDirectory (filepath, job) {
  const directory = await ask({
    type: 'input',
    message: 'Directory path: (enter nothing to cancel)'
  })
  if (!directory) {
    return job
  }

  const realPath = path.resolve(directory)
  await new Promise((resolve, reject) => {
    fs.stat(realPath, (error, stats) => {
      if (error) {
        return reject(error)
      }
      if (!stats.isDirectory()) {
        return reject(new Error(`Entry "${realPath}" is not a directory`))
      }
      resolve()
    })
  })

  let options
  if (isGitRepo(directory)) {
    const defaultBranch = path.basename(filepath, '.json')
    options = await askGitOptions(defaultBranch)
  }

  const dirEntry = {
    name: realPath,
    options
  }

  const newJob = {
    ...job,
    directories: [...job.directories, dirEntry]
  }

  await saveJob(filepath, newJob)
  log(`Added directory "${realPath}"`)
  return addDirectory(filepath, newJob)
}

function getDirectoryTitle (directory) {
  if (!directory.options) {
    return `${directory.name}`
  }
  return `${directory.name} [${directory.options.branch} → ${directory.options.baseBranch}]`
}

async function pickDirectory (directories) {
  const choices = directories.map(dir => ({
    name: getDirectoryTitle(dir),
    value: dir.name
  }))

  choices.unshift({
    name: 'Never mind',
    value: null
  })

  const directory = await ask({
    type: 'list',
    message: 'Which directory should be edited?',
    choices
  })

  return directory
}

export async function editDirectory (filepath, job) {
  const directoryName = await pickDirectory(job.directories)
  if (!directoryName) {
    return job
  }

  if (!isGitRepo(directoryName)) {
    log('Only directories which are Git repositories can be configured')
    return editDirectory(filepath, job)
  }

  const defaultBranch = path.basename(filepath, '.json')
  const options = await askGitOptions(defaultBranch)
  const directory = job.directories.find(dir => dir.name === directoryName)
  Object.assign(directory, {options})

  await saveJob(filepath, job)
  log(`Modified "${directoryName}"`)
  return editDirectory(filepath, job)
}

export async function removeDirectory (filepath, job) {
  const choices = job.directories.map(dir => ({
    name: getDirectoryTitle(dir),
    value: dir.name
  }))
  const removed = await ask({
    type: 'checkbox',
    message: 'Which directories should be removed?',
    choices
  })

  const newJob = {
    ...job,
    directories: job.directories.filter(dir =>
      !removed.includes(dir.name)
    )
  }

  await saveJob(filepath, newJob)
  log(`Removed ${humanList(removed.map(dir => `"${dir}"`))}`)
  return newJob
}
