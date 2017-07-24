import path from 'path'
import {ask, log, saveJob, humanList} from '../util'

function isValidRepo (repo) {
  return repo.split('/').length === 2
}

function reformatRepo (repo) {
  const githubDomain = 'github.com/'
  const domainStart = repo.indexOf(githubDomain)
  if (domainStart !== -1) {
    repo = repo.slice(domainStart + githubDomain.length)
  }

  const gitPostfix = '.git'
  if (repo.endsWith(gitPostfix)) {
    repo = repo.slice(0, -gitPostfix.length)
  }

  return repo
}

async function askRepo () {
  let repo = await ask({
    type: 'input',
    message: 'Repo owner/name: (enter nothing to cancel)'
  })
  if (!repo) {
    return null
  }
  repo = repo && repo.trim()
  if (!isValidRepo(repo)) {
    repo = reformatRepo(repo)
    if (!isValidRepo(repo)) {
      log('Please enter repos as ownerName/repoName like canjs/can-connect')
      return askRepo()
    }
  }
  return repo
}

async function askGithubOptions (defaultBranch, defaultPrTitle) {
  const branch = await ask({
    message: 'What should the branch name be?',
    default: `landscaper/${defaultBranch}`
  })
  const baseBranch = await ask({
    message: 'Base off which branch?',
    default: 'master'
  })
  const prTitle = await ask({
    message: 'Pull request title:',
    default: defaultPrTitle
  })
  return {
    baseBranch,
    branch,
    prTitle
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

  const repo = await ask({
    type: 'list',
    message: 'Which repo should be edited?',
    choices
  })

  return repo
}

export async function editRepo (filepath, job) {
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
  return editRepo(filepath, job)
}

export async function addRepo (filepath, job, history = []) {
  const name = await askRepo()
  if (!name) {
    return job
  }

  const defaultBranch = path.basename(filepath, '.json')

  let defaultPrTitle = `Landscaper: "${defaultBranch}" services`
  const previousEntry = history[history.length - 1]
  if (previousEntry) {
    defaultPrTitle = previousEntry.options.prTitle
  }
  const options = await askGithubOptions(defaultBranch, defaultPrTitle)
  const repoEntry = {
    name,
    options
  }

  const newHistory = [...history, repoEntry]
  const newJob = {
    ...job,
    githubRepos: [...(job.githubRepos || []), repoEntry]
  }

  await saveJob(filepath, newJob)
  log(`Added Github repo "${name}"`)
  return addRepo(filepath, newJob, newHistory)
}

export async function removeRepo (filepath, job) {
  const choices = job.githubRepos.map(repo => ({
    name: getRepoTitle(repo),
    value: repo.name
  }))
  const badRepos = await ask({
    type: 'checkbox',
    message: 'Which repos should be removed?',
    choices
  })

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
