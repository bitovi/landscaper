import inquirer from 'inquirer'
import {ask} from '../util'

export function menuSection (label, actions) {
  actions = actions.filter(x => x)
  const hasMultipleActions = actions.length > 1
  if (!hasMultipleActions) {
    return actions
  }

  const sectionHeader = new inquirer.Separator(label)
  const sectionActions = actions.map(action => {
    action.name = '  ' + action.name
    return action
  })
  return [sectionHeader, ...sectionActions]
}

export function getMenuActions (job) {
  return [
    {name: 'Nothing, I am tired', value: null},
    ...menuSection(
      `Directory (${job.directories.length})`,
      getDirectoryMenu(job)),
    ...menuSection(
      `Github repos (${job.githubRepos.length})`,
      getGithubRepoMenu(job)),
    ...menuSection(
      `Code mods (${job.mods.length})`,
      getCodeModMenu(job)),
    ...menuSection('Job', getJobMenu(job))
  ]
}

export function getDirectoryMenu (job) {
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

export function getGithubRepoMenu (job) {
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

export function getCodeModMenu (job) {
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

export function getJobMenu (job) {
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

export async function selectFromMenu (job) {
  return ask({
    type: 'list',
    message: 'What should we do?',
    choices: getMenuActions(job)
  })
}
