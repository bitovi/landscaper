import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import dedent from 'dedent'
import {ask, log} from '../util'
import {executeJob} from '../execute'

export function indent (str) {
  return str
    .split('\n')
    .map(line => '  ' + line)
    .join('\n')
}

export function modStep (mod) {
  if (!mod.optionValues) {
    return `run "${mod.name}"`
  }

  const config = JSON.stringify(mod.optionValues, null, 2)
  return `run "${mod.name}" with configuration\n${indent(config)}`
}

export function getPlanItem (header, steps) {
  const stepSpacing = '\n'
  return `${chalk.bold(header)}\n${steps.map(indent).join(stepSpacing)}`
}

export function getDirectoryTask (directory, mods) {
  const steps = mods.map(modStep)
  if (directory.options) {
    const {branch, baseBranch} = directory.options
    steps.unshift(`create branch "${branch}" from base "${baseBranch}"`)
  }

  return getPlanItem(directory.name, steps)
}

export function getRepoTask (repo, mods) {
  const cloneStep = `clone "https://github.com/${repo.name}.git"`

  const {branch, baseBranch, prTitle} = repo.options
  const branchStep = `create branch "${branch}" from base "${baseBranch}"`

  const prStep = `create pull request "${prTitle}" at "https://github.com/${repo.name}"`

  const steps = [
    cloneStep,
    branchStep,
    ...mods.map(modStep),
    prStep
  ]

  return getPlanItem(repo.name, steps)
}

export function getJobPreview (filepath, job) {
  const jobName = path.basename(filepath, '.json')
  const directoryTasks = job.directories
    .map(dir => getDirectoryTask(dir, job.mods))
  const githubRepoTasks = job.githubRepos
    .map(repo => getRepoTask(repo, job.mods))

  const itemSpacing = '\n\n'
  return [
    `The "${jobName}" execution plan:`,
    itemSpacing,
    directoryTasks.join(itemSpacing),
    itemSpacing,
    githubRepoTasks.join(itemSpacing),
    itemSpacing,
    '===================='
  ].join('')
}

export function previewJob (filepath, job) {
  log(getJobPreview(filepath, job))
  return job
}

export const accessTokenMessage = dedent`
  To create pull requests on Github, I need an access token.
  Visit your https://github.com/settings/tokens page to make one.
  I need scope "public_repo" for public-only PRs, otherwise scope "repo".
  Note: Tokens must be manually entered so they are not accidentally commited.
`

export async function runJob (filepath, job) {
  let accessToken
  const needsAccessToken = job.githubRepos.length > 0
  if (needsAccessToken) {
    log(accessTokenMessage)

    accessToken = await ask({
      type: 'password',
      message: 'Github access token:'
    })
    if (!accessToken) {
      return job
    }
  }

  await executeJob(job, accessToken)
  return job
}

export function deleteJob (filepath, job) {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, error => error ? reject(error) : resolve())
  }).then(() => log(`Deleted "${filepath}"`))
}
