import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'

import {getInfoForMod} from '../index'
import PackageCache from '../utils/package-cache'

function log () {
  console.log.apply(console, arguments)
}

async function ask (question) {
  const {x} = await inquirer.prompt([{
    ...question,
    name: 'x'
  }])
  return x
}

function saveJob (filepath, job) {
  return new Promise((resolve, reject) => {
    const text = JSON.stringify(job, null, 2)
    fs.writeFile(filepath, text, error =>
      error ? reject(error) : resolve()
    )
  })
}

function getMenuActions (job) {
  const section = (label, actions) => {
    actions = actions.filter(x => x)
    if (actions.length > 1) {
      return [
        new inquirer.Separator(label),
        ...actions.map(action => {
          action.name = '  ' + action.name
          return action
        })
      ]
    }
    return actions
  }
  return [
    {name: 'Nothing, I am tired', value: null},
    ...section(
      `Directory (${job.directories.length})`,
      getDirectoryMenu(job)),
    ...section(
      `Github repos (${job.githubRepos.length})`,
      getGithubRepoMenu(job)),
    ...section(
      `Code mods (${job.mods.length})`,
      getCodeModMenu(job)),
    ...section('Job', getJobMenu(job))
  ]
}

function getDirectoryMenu (job) {
  const baseActions = [{
    name: 'Add directories...',
    value: 'directory/add'
  }]

  const viewAction = {
    name: 'Edit directories...',
    value: 'directory/edit'
  }
  const removeAction = {
    name: 'Remove directories...',
    value: 'directory/remove'
  }

  const showView = job.directories.length > 0
  const showRemove = job.directories.length > 0
  return [
    showView && viewAction,
    ...baseActions,
    showRemove && removeAction
  ]
}

function getGithubRepoMenu (job) {
  const baseActions = [{
    name: 'Add Github repos...',
    value: 'repo/add'
  }]

  const viewAction = {
    name: 'Edit Github repos...',
    value: 'repo/edit'
  }
  const removeAction = {
    name: 'Remove Github repos...',
    value: 'repo/remove'
  }

  const showView = (job.githubRepos || []).length > 0
  const showRemove = (job.githubRepos || []).length > 0
  return [
    showView && viewAction,
    ...baseActions,
    showRemove && removeAction
  ]
}

function getCodeModMenu (job) {
  const baseActions = [{
    name: 'Add code mods...',
    value: 'mod/add'
  }]

  const viewAction = {
    name: 'Edit code mods...',
    value: 'mod/edit'
  }
  const removeAction = {
    name: 'Remove code mods...',
    value: 'mod/remove'
  }

  const showView = (job.mods || []).length > 0
  const showRemove = (job.mods || []).length > 0
  return [
    showView && viewAction,
    ...baseActions,
    showRemove && removeAction
  ]
}

function getJobMenu (job) {
  const actions = [{
    name: 'Delete job',
    value: 'job/delete'
  }]

  const hasMods = job.mods.length > 0
  const hasRepos = job.githubRepos.length > 0
  const hasDirectories = job.directories.length > 0
  const showRun = (hasDirectories || hasRepos) && hasMods
  if (showRun) {
    actions.unshift({
      name: 'Preview job',
      value: 'job/preview'
    }, {
      name: 'Run job',
      value: 'job/run'
    })
  }

  return actions
}

async function selectFromMenu (job) {
  const {action} = await inquirer.prompt([{
    name: 'action',
    type: 'list',
    message: 'What should we do?',
    choices: getMenuActions(job)
  }])

  return action
}

const actionMap = {
  'directory/add': addDirectorySentry,
  'directory/edit': editDirectorySentry,
  'directory/remove': removeDirectoryCommand,
  'repo/add': addGithubRepoSentry,
  'repo/edit': editGithubRepoSentry,
  'repo/remove': removeGithubRepoCommand,
  'mod/add': addModSentry,
  'mod/edit': editModSentry,
  'mod/remove': removeModSentry,
  'job/preview': previewJobCommand,
  'job/delete': deleteJobCommand,
  'job/run': runJobCommand
}

export default async function sentry (filepath, job) {
  while (true) {
    const action = await selectFromMenu(job)
    if (!action) {
      break
    }
    const routine = actionMap[action]
    job = await routine(filepath, job)
    if (!job) {
      break
    }
  }
  return {filepath, job}
}

async function askDirectory () {
  const {directory} = await inquirer.prompt([{
    name: 'directory',
    type: 'input',
    message: 'Directory path: (enter nothing to cancel)'
  }])
  return directory
}

function isGitRepo () {
  return false
}

async function addDirectorySentry (filepath, job) {
  const directory = await askDirectory()
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
    options = await askGithubOptions(defaultBranch)
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
  return addDirectorySentry(filepath, newJob)
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

  const {directory} = await inquirer.prompt([{
    name: 'directory',
    type: 'list',
    message: 'Which directory should be edited?',
    choices
  }])

  return directory
}

async function editDirectorySentry (filepath, job) {
  const directoryName = await pickDirectory(job.directories)
  if (!directoryName) {
    return job
  }

  if (!isGitRepo(directoryName)) {
    log('Only directories which are Git repositories can be configured')
    return editDirectorySentry(filepath, job)
  }

  const defaultBranch = path.basename(filepath, '.json')
  const options = await askGithubOptions(defaultBranch)
  const directory = job.directories.find(dir => dir.name === directoryName)
  Object.assign(directory, {options})

  await saveJob(filepath, job)
  log(`Modified "${directoryName}"`)
  return editGithubRepoSentry(filepath, job)
}

async function removeDirectoryCommand (filepath, job) {
  const choices = job.directories.map(dir => ({
    name: getDirectoryTitle(dir),
    value: dir.name
  }))
  const {removed} = await inquirer.prompt([{
    name: 'removed',
    type: 'checkbox',
    message: 'Which directories should be removed?',
    choices
  }])

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

function isValidRepo (repo) {
  return repo.split('/').length === 2
}

async function askRepo () {
  let {repo} = await inquirer.prompt([{
    name: 'repo',
    type: 'input',
    message: 'Repo owner/name: (enter nothing to cancel)'
  }])
  if (!repo) {
    return null
  }
  repo = repo && repo.trim()
  if (!isValidRepo(repo)) {
    log('Please enter repos as ownerName/repoName like canjs/can-connect')
    return askRepo()
  }
  return repo
}

async function askGithubOptions (defaultBranch) {
  const {baseBranch, newBranch} = await inquirer.prompt([{
    name: 'newBranch',
    message: 'What should the branch name be?',
    default: `landscaper/${defaultBranch}`
  }, {
    name: 'baseBranch',
    message: 'Base off which branch?',
    default: 'master'
  }])

  // TODO: ensure newBranch does not already exist
  // TODO: ensure baseBranch does exist

  return {
    baseBranch,
    branch: newBranch
  }
}

function getRepoTitle (repo) {
  return `${repo.name} [${repo.options.branch} → ${repo.options.baseBranch}]`
}

async function pickRepo (repos) {
  const choices = repos.map(repo => ({
    name: getRepoTitle(repo),
    value: repo.name
  }))

  choices.unshift({
    name: 'Never mind',
    value: null
  })

  const {repo} = await inquirer.prompt([{
    name: 'repo',
    type: 'list',
    message: 'Which repo should be edited?',
    choices
  }])

  return repo
}

async function editGithubRepoSentry (filepath, job) {
  const repoName = await pickRepo(job.githubRepos)
  if (!repoName) {
    return job
  }

  const defaultBranch = path.basename(filepath, '.json')
  const options = await askGithubOptions(defaultBranch)
  const repo = job.githubRepos.find(repo => repo.name === repoName)
  Object.assign(repo, {options})

  await saveJob(filepath, job)
  log(`Modified "${repoName}"`)
  return editGithubRepoSentry(filepath, job)
}

async function addGithubRepoSentry (filepath, job) {
  const name = await askRepo()
  if (!name) {
    return job
  }

  const defaultBranch = path.basename(filepath, '.json')
  const options = await askGithubOptions(defaultBranch)
  const repoEntry = {
    name,
    options
  }

  const newJob = {
    ...job,
    githubRepos: [...(job.githubRepos || []), repoEntry]
  }

  await saveJob(filepath, newJob)
  log(`Added Github repo "${name}"`)
  return addGithubRepoSentry(filepath, newJob)
}

function humanList (items) {
  if (items.length === 1) {
    return items[0]
  }
  if (items.length === 2) {
    const [first, second] = items
    return `${first} and ${second}`
  }
  const last = items.pop()
  return `${items.join(', ')}, and ${last}`
}

async function removeGithubRepoCommand (filepath, job) {
  const choices = job.githubRepos.map(repo => ({
    name: getRepoTitle(repo),
    value: repo.name
  }))
  const {badRepos} = await inquirer.prompt([{
    name: 'badRepos',
    type: 'checkbox',
    message: 'Which repos should be removed?',
    choices
  }])

  const newJob = {
    ...job,
    githubRepos: job.githubRepos.filter(repo =>
      !badRepos.includes(repo.name)
    )
  }

  await saveJob(filepath, newJob)
  log(`Removed ${humanList(badRepos.map(repo => `"${repo}"`))}`)
  return newJob
}

/// <Mod>
const cache = PackageCache.auto()

function getModDisplayName (mod) {
  if (mod.description) {
    return `${mod.name}: ${mod.description}`
  } else {
    return `${mod.name}`
  }
}

function isConfigurableMod (mod) {
  return mod.options && mod.options.length
}

async function addModSentry (filepath, job) {
  const modName = await ask({
    type: 'text',
    message: 'NPM or Gist mod: (enter nothing to cancel)'
  })
  if (!modName) {
    return job
  }

  let info
  try {
    // TODO: if loading takes long, show a loading message
    info = await getInfoForMod(modName, {cache})
  } catch (error) {
    log('Error:', error.message)
    return addModSentry(filepath, job)
  }

  log(`Located ${getModDisplayName(info)}`)

  let optionValues
  if (isConfigurableMod(info)) {
    log(`Mod "${info.name}" has configuration options:`)
    optionValues = await inquirer.prompt(info.options)
  }

  const newMod = {...info, optionValues}
  const newJob = {...job, mods: [...job.mods, newMod]}

  await saveJob(filepath, newJob)
  log(`Added mod "${info.name}"`)
  return addModSentry(filepath, newJob)
}

async function removeModSentry (filepath, job) {
  const choices = job.mods.map(mod => ({
    name: getModDisplayName(mod),
    value: mod.name
  }))

  const removed = await ask({
    type: 'checkbox',
    message: 'Which mods should be removed?',
    choices
  })

  if (!removed.length) {
    return job
  }

  const newMods = job.mods.filter(mod => !removed.includes(mod.name))
  const newJob = {...job, mods: newMods}

  await saveJob(filepath, newJob)
  log(`Removed ${humanList(removed.map(m => `"${m}"`))}`)
  return newJob
}

async function editModSentry (filepath, job) {
  const choices = job.mods.map(mod => ({
    name: getModDisplayName(mod),
    value: mod.name
  }))

  choices.unshift({
    name: 'Never mind',
    value: null
  })

  const modName = await ask({
    type: 'list',
    message: 'Which mod should be edited?',
    choices
  })
  if (!modName) {
    return job
  }

  const mod = job.mods.find(mod => mod.name === modName)
  if (!isConfigurableMod(mod)) {
    log(`Mod "${mod.name}" has no configuration options to edit`)
    return editModSentry(filepath, job)
  }

  const optionValues = await inquirer.prompt(mod.options)
  Object.assign(mod, {optionValues})

  await saveJob(filepath, job)
  log(`Modifed "${mod.name}"`)
  return editModSentry(filepath, job)
}
/// </Mod>

function previewJobCommand (filepath, job) {
  const jobName = path.basename(filepath, '.json')
  log(`The "${jobName}" execution plan:\n`)

  job.directories.forEach(dir => {
    log(chalk.bold(dir.name))
    if (dir.options) {
      const {branch, baseBranch} = dir.options
      log(`  create branch "${branch}" from base "${baseBranch}"`)
    }
    job.mods.forEach(mod => {
      if (mod.optionValues) {
        log(`  run "${mod.name}" with configuration`)
        log(JSON.stringify(mod.optionValues, null, 2)
          .split('\n')
          .map(line => '    ' + line)
          .join('\n')
        )
      } else {
        log(`  run "${mod.name}"`)
      }
    })
    log('\n')
  })
  job.githubRepos.forEach(repo => {
    log(chalk.bold(repo.name))
    log(`  clone "https://github.com/${repo.name}.git"`)

    const {branch, baseBranch} = repo.options
    log(`  create branch "${branch}" from base "${baseBranch}"`)
    job.mods.forEach(mod => {
      if (mod.optionValues) {
        log(`  run "${mod.name}" with configuration`)
        log(JSON.stringify(mod.optionValues, null, 2)
          .split('\n')
          .map(line => '    ' + line)
          .join('\n')
        )
      } else {
        log(`  run "${mod.name}"`)
      }
    })
    log(`  create pull request for "${branch}" at github.com/${repo.name}`)
    log('\n')
  })

  log('====================')

  return job
}

async function runJobCommand (filepath, job) {
  log('RAN')
  return job
}

function deleteJobCommand (filepath, job) {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, error => error ? reject(error) : resolve())
  }).then(() => log(`Deleted "${filepath}"`))
}
