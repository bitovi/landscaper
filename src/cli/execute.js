import tmp from 'tmp'
import chalk from 'chalk'
import rimraf from 'rimraf'
import octonode from 'octonode'
import {run as landscaperRun} from '../'
import dedent from 'dedent'
import execa from 'execa'
import {initJobFile} from './begin'
import {ask, saveJob} from './util'

export function formatMod (jobMod) {
  return {
    name: jobMod.name,
    options: jobMod.optionValues
  }
}

export function getDirectoryResults (stats, fails) {
  const statistics = dedent`
    ${chalk.underline('Directory stats:')}
    ${chalk.red(`Failed: ${stats.failed.length}`)}
    ${chalk.green(`Successful: ${stats.successful.length}`)}
  `
  if (!fails.length) {
    return statistics
  }

  const failures = dedent`
    ${chalk.underline('Directory failures:')}
    ${fails.map(({directory, error}) => (
      `${chalk.bold(directory.name)}: ${error.message}`
    )).join('\n')}
  `

  return `\n\n${statistics}\n\n${failures}\n\n`
}

export function getGithubRepoResults (stats, fails) {
  const statistics = dedent`
    ${chalk.underline('Github repo stats:')}
    ${chalk.red(`Failed: ${stats.failed.length}`)}
    ${chalk.yellow(`Unmodified: ${stats.unmodified.length}`)}
    ${chalk.green(`Successful: ${stats.successful.length}`)}
  `
  if (!fails.length) {
    return statistics
  }

  const failures = dedent`
    ${chalk.underline('Github repo failures:')}
    ${fails.map(({githubRepo, error}) => (
      `${chalk.bold(githubRepo.name)}: ${error.message}`
    )).join('\n')}
  `

  return `\n\n${statistics}\n\n${failures}\n\n`
}

export async function executeJob (job, accessToken) {
  const log = msg => console.log(msg)
  const mods = job.mods.map(formatMod)

  const dirStats = {
    failed: [],
    successful: []
  }
  const failedDirs = []

  for (let i = 0; i < job.directories.length; i++) {
    const directory = job.directories[i]
    const {name} = directory
    log(chalk.bold(name))
    try {
      await transformRepo(name, mods, void 0, log)
      dirStats.successful.push(name)
    } catch (error) {
      console.error(error.message)
      failedDirs.push({directory, error})
      dirStats.failed.push(name)
    }
  }

  const repoStats = {
    failed: [],
    unmodified: [],
    successful: []
  }
  const failedRepos = []

  for (let i = 0; i < job.githubRepos.length; i++) {
    const githubRepo = job.githubRepos[i]
    const {name} = githubRepo
    const [repoOwner, repoName] = name.split('/')
    const repo = {
      repoName,
      repoOwner,
      mods,
      options: githubRepo.options
    }
    log(chalk.bold(name))
    try {
      const didModify = await processRepo(repo, log, accessToken)
      const stat = didModify ? repoStats.successful : repoStats.unmodified
      stat.push(name)
    } catch (error) {
      console.error(error.message)
      failedRepos.push({githubRepo, error})
      repoStats.failed.push(name)
    }
  }

  if (job.directories.length) {
    const resultMessage = getDirectoryResults(dirStats, failedDirs)
    log(resultMessage)
  }

  if (job.githubRepos.length) {
    const resultMessage = getGithubRepoResults(repoStats, failedRepos)
    log(resultMessage)
  }

  const hasFailures = failedDirs.length > 0 || failedRepos.length > 0
  const hasDirNonFailures = (job.directories.length - failedDirs.length) > 0
  const hasRepoNonFailures = (job.githubRepos.length - failedRepos.length) > 0
  const hasNonFailures = hasDirNonFailures || hasRepoNonFailures
  const isPartialFailure = hasFailures && hasNonFailures
  if (isPartialFailure) {
    const failureTotal = failedDirs.length + failedRepos.length
    log(dedent`
      There were ${failureTotal} failures during the job execution.
      I can fork a new job which only includes failed directories and Github repos.
      I recommend this because it means less work for the both of us.
    `)
    const shouldFork = await ask({
      type: 'confirm',
      message: 'Should I create a new job which only includes those failures?'
    })
    if (shouldFork) {
      const {filepath} = await initJobFile(true)
      const failJob = {
        ...job,
        directories: failedDirs.map(({directory}) => directory),
        githubRepos: failedRepos.map(({githubRepo}) => githubRepo)
      }
      await saveJob(filepath, failJob)
      log(`Forked failures to job "${filepath}"`)
    }
  }
  return job
}

function formatLog ({type, data}) {
  if (type === 'error' || type === 'done') {
    return
  }
  let msg = '  '
  if (data.mod) {
    msg += '[' + data.mod.name + '] '
  }
  msg += type.slice(4)
  if (data.error) {
    msg += ' ' + data.error
  }
  return msg
}

function createTempDirectory () {
  return new Promise((resolve, reject) => {
    // `unsafeCleanup: true` allows you to delete cleanup the directory when it still has content
    tmp.dir({ unsafeCleanup: true }, (err, directory) => {
      if (err) {
        reject(err)
      }

      const cleanup = () => {
        return new Promise((resolve, reject) => {
          rimraf(directory, error => {
            if (error) {
              const isRemovedAlready = error.code === 'ENOENT'
              if (isRemovedAlready) {
                return resolve()
              }
              return reject(error)
            }
            resolve()
          })
        })
      }

      resolve({ directory, cleanup })
    })
  })
}

async function cloneProject (directory, githubUrl) {
  await execa('git', ['clone', '--depth', '1', '--', githubUrl, directory])
}

async function createBranch (directory, baseBranchName, branchName) {
  await execa('git', ['-C', directory, 'checkout', baseBranchName])
  await execa('git', [ '-C', directory, 'checkout', '-b', branchName ])
}

function transformRepo (directory, mods, options, log) {
  const reporter = landscaperRun(directory, mods, options)
  reporter.on('log', logItem => {
    const msg = formatLog(logItem)
    if (msg) {
      log(msg)
    }
  })

  return new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })
}

async function commitChanges (directory, commitMessage) {
  await execa('git', ['-C', directory, 'add', '.'])
  await execa('git', ['-C', directory, 'commit', '-m', commitMessage])
}

async function pushChanges (directory, fullProjectUrl, branchName) {
  return execa('git', ['-C', directory, 'push', '-u', fullProjectUrl, branchName])
}

function createPullRequest (directory, options) {
  const {
    repoOwner,
    repoName,
    baseBranchName,
    branchName,
    prTitle,
    prDescription,
    accessToken
  } = options
  const github = octonode.client(accessToken)
  const repo = github.repo(`${repoOwner}/${repoName}`)
  return new Promise((resolve, reject) => {
    repo.pr({
      title: prTitle,
      body: prDescription,
      head: branchName,
      base: baseBranchName
    }, function (error, body) {
      error ? reject(error) : resolve(body.html_url)
    })
  })
}

async function inTempDirectory (task) {
  const {directory, cleanup} = await createTempDirectory()
  return task(directory)
    .then(async value => {
      await cleanup()
      return value
    })
    .catch(async error => {
      await cleanup()
      throw error
    })
}

function getJobDecription (mods) {
  return dedent`
    This pull request was created with [Landscaper](https://github.com/bitovi/landscaper).
    The following code mods were used to create this PR:

    ${mods.map(mod => dedent`
      1. **${mod.name}**${mod.description ? `: ${mod.description}` : ''}
    `)}

    Please review this PR carefully as Landscaper does not guarantee any code mod's quality.
  `
}

function hasKeyPhrases (str, phrases) {
  str = str.toLowerCase()
  return phrases.every(phrase => str.includes(phrase))
}

function getErrorMessage (error) {
  return (error && ((error.toString && error.toString()) || error.message)) || ''
}

function isMissingRepoError (error) {
  return hasKeyPhrases(getErrorMessage(error), ['repository not found'])
}

function isMissingBaseBranchError (error) {
  return hasKeyPhrases(getErrorMessage(error), ['pathspec', 'did not match'])
}

function isEmptyCommitError (error) {
  return hasKeyPhrases(getErrorMessage(error), ['nothing to commit'])
}

function isRemoteBranchConflict (error) {
  return hasKeyPhrases(getErrorMessage(error), ['remote contains work'])
}

function isPermissionDeniedError (error) {
  return hasKeyPhrases(getErrorMessage(error), ['permission', 'denied'])
}

function processRepo (repo, log, accessToken) {
  const {repoOwner, repoName, mods} = repo
  const projectUrl = `https://github.com/${repoOwner}/${repoName}.git`
  const fullProjectUrl = `https://${accessToken}@github.com/${repoOwner}/${repoName}.git`
  const {
    branch: branchName,
    baseBranch: baseBranchName,
    prTitle
  } = repo.options

  return inTempDirectory(async directory => {
    try {
      await cloneProject(directory, fullProjectUrl)
    } catch (error) {
      if (isMissingRepoError(error)) {
        throw new Error(`Repository not found`)
      }
      throw error
    }
    log(`cloned repository "${projectUrl}"`)

    try {
      await createBranch(directory, baseBranchName, branchName)
    } catch (error) {
      if (isMissingBaseBranchError(error)) {
        throw new Error(`Could not checkout non-existent branch "${baseBranchName}"`)
      }
      throw error
    }
    log(`created branch "${branchName}" from "${baseBranchName}"`)

    await transformRepo(directory, mods, {accessToken}, log)
    log(`applied mods to "${branchName}"`)

    try {
      await commitChanges(directory, prTitle)
    } catch (error) {
      if (isEmptyCommitError(error)) {
        log('NOTE: Skipping pull request as there were no changes.')
        return false
      }
      throw error
    }

    try {
      await pushChanges(directory, fullProjectUrl, branchName)
    } catch (error) {
      if (isRemoteBranchConflict(error)) {
        throw new Error(`Branch "${branchName}" has existing commits`)
      }
      if (isPermissionDeniedError(error)) {
        throw new Error(`Push access to the repository was denied`)
      }
      throw error
    }
    log(`pushed branch "${branchName}" to "${projectUrl}"`)

    const prDescription = getJobDecription(mods)
    const prUrl = await createPullRequest(directory, {
      repoOwner,
      repoName,
      baseBranchName,
      branchName,
      prTitle,
      prDescription,
      accessToken
    })
    log(`submitted pull request at "${prUrl}"`)
    return true
  })
}
