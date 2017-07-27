import path from 'path'
import dedent from 'dedent'
import octonode from 'octonode'
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

function getRepoOwner (repoSlug) {
  return repoSlug.split('/')[0]
}

function wildcardAdviser (neverSuggest) {
  let hasSuggestedWildcard = neverSuggest
  return function shouldSuggestWildcard (repoNameHistory, usedWildcard) {
    if (hasSuggestedWildcard || usedWildcard) {
      return false
    }

    if (repoNameHistory.length < 2) {
      return false
    }

    const [lastLastRepo, lastRepo] = repoNameHistory.slice(-2)
    const lastLastOwner = getRepoOwner(lastLastRepo)
    const lastOwner = getRepoOwner(lastRepo)
    const isSameOwner = lastLastOwner === lastOwner
    if (isSameOwner) {
      hasSuggestedWildcard = true
      return true
    }
  }
}

const shouldSuggestWildcard = wildcardAdviser()
const wildcardSuggestionMessage = ownerName => dedent`
It looks like you are adding multiple repos from the same owner.
Landscaper supports basic wildcard (*) expressions for repo names.
To add multiple repos from the same owner at once, try:

  ${ownerName}/* or ${ownerName}/prefix-*, etc

Wildcards do not work on the owner/ side due to API limitations.
`

function getRepoName (repoSlug) {
  return repoSlug.split('/').pop()
}

function isWildcard (repoSlug) {
  const repoName = getRepoName(repoSlug)
  return repoName.includes('*')
}

function wildcardMatcher (wildcardExpression) {
  const search = wildcardExpression.split('*').join('(.*)')
  const regex = new RegExp(`^${search}$`)
  return function matchesWildcard (str) {
    return regex.test(str)
  }
}

function isNotFoundError (error) {
  return error && error.message.toLowerCase().includes('not found')
}

function uniqueRepos (repos) {
  return repos.reduce((uniques, repo) => {
    const existingRepo = uniques.find(r => r.name === repo.name)
    return existingRepo ? uniques : [...uniques, repo]
  }, [])
}

async function getOwnerRepos (repoOwner, accessToken) {
  let repos
  try {
    repos = await getReposForOwner(repoOwner, true, accessToken)
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
    repos = await getReposForOwner(repoOwner, false, accessToken)
  }
  return uniqueRepos(repos)
}

async function getReposForOwner (repoOwner, isOrg, accessToken) {
  const github = octonode.client(accessToken)
  const owner = isOrg ? github.org(repoOwner) : github.user(repoOwner)
  let repos = []
  let page = 0
  while (true) {
    const {repoPage, isDone} = await getRepoPage(owner, page++)
    repos = [...repos, ...repoPage]
    if (isDone) {
      break
    }
  }
  return repos
}

async function getRepoPage (owner, page) {
  const pageSize = 50
  return new Promise((resolve, reject) => {
    owner.repos({page, per_page: pageSize}, (error, repos) => {
      if (error) {
        return reject(error)
      }
      const isDone = repos.length < pageSize
      resolve({isDone, repoPage: repos})
    })
  })
}

const privateSearchMessage = dedent`
  To find private repos, I need an access token.
  Visit your https://github.com/settings/tokens page to make one.
  The token needs scope "repo" to have access to all repos to which you have access.
  This token can be the same one you use to submit pull requests.
  Without an access token, I can only find public repos.
`

export async function addRepo (filepath, job, history = [], usedWildcard) {
  const repoNameHistory = history.map(repo => repo.name)
  if (shouldSuggestWildcard(repoNameHistory, usedWildcard)) {
    const lastOwner = getRepoOwner(repoNameHistory.pop())
    log(wildcardSuggestionMessage(lastOwner))
  }

  const name = await askRepo()
  if (!name) {
    return job
  }

  const continueAdd = () => (
    addRepo(filepath, job, history, usedWildcard)
  )

  let repoNames = [name]
  if (isWildcard(name)) {
    const repoOwner = getRepoOwner(name)
    const repoName = getRepoName(name)

    if (!usedWildcard) {
      log(privateSearchMessage)
      usedWildcard = true
    }

    const accessToken = await ask({
      type: 'password',
      message: 'Github access token: (enter nothing for public only)'
    })
    let allRepos
    try {
      allRepos = await getOwnerRepos(repoOwner, accessToken)
    } catch (error) {
      if (isNotFoundError(error)) {
        log(`The org/user "${repoOwner}" was not found`)
        return continueAdd()
      }
      throw error
    }
    if (allRepos.length < 1) {
      const repos = accessToken ? 'repos' : 'public repos'
      log(`The org/user "${repoOwner}" has no ${repos}`)
      return continueAdd()
    }
    const matchesWildcard = wildcardMatcher(repoName)
    const matchedRepos = allRepos.filter(repo => matchesWildcard(repo.name))
    if (matchedRepos.length < 1) {
      log(`No repos from org/user "${repoOwner}" matched "${repoName}"`)
      return continueAdd()
    }

    const chosenRepos = await ask({
      type: 'checkbox',
      message: 'Which repos should be added?',
      choices: matchedRepos.map(repo => ({
        value: repo.full_name,
        message: repo.full_name
      }))
    })

    if (!chosenRepos.length) {
      return continueAdd()
    }

    repoNames = chosenRepos
  }

  const newRepoNames = repoNames.filter(name => {
    const existingRepo = job.githubRepos.find(r => r.name === name)
    if (existingRepo) {
      log(`Already added "${name}", ignoring the duplicate`)
    }
    return !existingRepo
  })

  if (newRepoNames.length < 1) {
    return continueAdd()
  }

  const defaultBranch = path.basename(filepath, '.json')

  let defaultPrTitle = `Landscaper: "${defaultBranch}" services`
  const previousEntry = history[history.length - 1]
  if (previousEntry) {
    defaultPrTitle = previousEntry.options.prTitle
  }
  const options = await askGithubOptions(defaultBranch, defaultPrTitle)
  const repoEntries = newRepoNames.map(name => ({
    name,
    options
  }))

  const newHistory = [...history, ...repoEntries]
  const newJob = {
    ...job,
    githubRepos: [...job.githubRepos, ...repoEntries]
  }

  await saveJob(filepath, newJob)
  log(`Added Github repo ${humanList(newRepoNames.map(n => `"${n}"`))}`)
  return addRepo(filepath, newJob, newHistory, usedWildcard)
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
