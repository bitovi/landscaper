import tmp from 'tmp'
import gitClone from 'git-clone'
import octonode from 'octonode'
import {run as landscaperRun} from '../'
import dedent from 'dedent'
import execa from 'execa'

export function formatMod (jobMod) {
  return {
    name: jobMod.name,
    options: jobMod.optionValues
  }
}

export async function executeJob (job, accessToken) {
  const log = msg => console.log(msg)
  const mods = job.mods.map(formatMod)

  for (let i = 0; i < job.directories.length; i++) {
    const directory = job.directories[i]
    await transformRepo(directory.name, mods, void 0, log)
  }

  for (let i = 0; i < job.githubRepos.length; i++) {
    const githubRepo = job.githubRepos[i]
    const [repoOwner, repoName] = githubRepo.name.split('/')
    const repo = {
      repoName,
      repoOwner,
      mods,
      options: githubRepo.options
    }
    await processRepo(repo, log, accessToken)
  }
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
    tmp.dir({ unsafeCleanup: true }, (err, directory, cleanupCallback) => {
      if (err) {
        reject(err)
      }

      const cleanup = () => {
        return new Promise((resolve, reject) => {
          cleanupCallback(error => {
            error ? reject(error) : resolve()
          })
        })
      }

      resolve({ directory, cleanup })
    })
  })
}

function cloneProject (githubUrl, branch, destination) {
  return new Promise((resolve, reject) => {
    const options = {
      shallow: true,
      checkout: branch
    }
    gitClone(githubUrl, destination, options, function (error) {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
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
    .then(() => cleanup())
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

function isEmptyCommitError (error) {
  return error && error.message && error.message.includes('nothing to commit')
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
    // Potential error handling
    // TODO: ensure clone is successful
    // TODO: ensure newBranch does not already exist
    // TODO: ensure baseBranch does exist

    await cloneProject(fullProjectUrl, baseBranchName, directory)
    log(`cloned repo "${projectUrl}" branch "${baseBranchName}"`)

    await createBranch(directory, baseBranchName, branchName)
    log(`created branch "${branchName}"`)

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

    await pushChanges(directory, fullProjectUrl, branchName)
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
