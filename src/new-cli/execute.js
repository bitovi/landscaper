import tmp from 'tmp'
import gitClone from 'git-clone'
import octonode from 'octonode'
import landscaper from '../'
import execa from 'execa'

export async function executeJob (job, accessToken) {
  const log = msg => console.log(msg)

  for (let i = 0; i < job.directories.length; i++) {
    const directory = job.directories[i]
    await transformRepo(directory, job.mods, void 0, log)
  }

  for (let i = 0; i < job.githubRepos.length; i++) {
    const githubRepo = job.githubRepos[i]
    const [repoOwner, repoName] = githubRepo.name.split('/')
    const repo = {
      repoName,
      repoOwner,
      mods: job.mods,
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
  const reporter = landscaper.run(directory, mods, options)
  reporter.on('log', log => {
    const msg = formatLog(log)
    if (msg) {
      log(msg)
    }
  })

  return new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })
}

async function commitAndPush (fullProjectUrl, directory, branchName) {
  await execa('git', ['-C', directory, 'add', '.'])
  await execa('git', ['-C', directory, 'commit', '-m', 'Landscaping services'])
  await execa('git', ['-C', directory, 'push', '-u', fullProjectUrl, branchName])
}

function createPullRequest (directory, options) {
  const {repoOwner, repoName, baseBranchName, branchName, accessToken} = options
  const github = octonode.client(accessToken)
  const repo = github.repo(`${repoOwner}/${repoName}`)
  return new Promise((resolve, reject) => {
    repo.pr({
      title: 'Landscape project',
      body: 'Landscaping services have been requested. Thank you for using landscaper!',
      head: branchName,
      base: baseBranchName
    }, function (error, status, body) {
      error ? reject(error) : resolve(body.html_url)
    })
  })
}

async function processRepo (repo, log, accessToken) {
  const {repoOwner, repoName, mods} = repo
  const {directory, cleanup} = await createTempDirectory()
  const projectUrl = `https://github.com/${repoOwner}/${repoName}.git`
  const fullProjectUrl = `https://${accessToken}@github.com/${repoOwner}/${repoName}.git`
  const baseBranchName = repo.options.baseBranch
  const branchName = repo.options.branch

  await cloneProject(fullProjectUrl, baseBranchName, directory)
  log(`cloned ${projectUrl} ${baseBranchName} branch into ${directory}`)

  await createBranch(directory, baseBranchName, branchName)
  log(`created branch ${branchName} in ${directory}`)

  await transformRepo(directory, mods, {accessToken}, log)
  log(`applied mods to ${directory}`)

  await commitAndPush(fullProjectUrl, directory, branchName)
  log(`pushed branch "${branchName}" to "${projectUrl}"`)

  const prUrl = await createPullRequest(directory, {
    repoOwner,
    repoName,
    baseBranchName,
    branchName,
    accessToken
  })
  log(`submitted PR at ${prUrl}`)

  log('cleaning up')
  await cleanup()

  log('landscaping complete!')
}
