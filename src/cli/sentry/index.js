import {selectFromMenu} from './menu'
import {
  addDirectory,
  editDirectory,
  removeDirectory
} from './directory'
import {
  addRepo,
  editRepo,
  removeRepo
} from './repo'
import {
  addMod,
  editMod,
  removeMod
} from './mod'
import {
  runJob,
  deleteJob,
  previewJob
} from './job'

const actionMap = {
  'directory/add': addDirectory,
  'directory/edit': editDirectory,
  'directory/remove': removeDirectory,
  'repo/add': addRepo,
  'repo/edit': editRepo,
  'repo/remove': removeRepo,
  'mod/add': addMod,
  'mod/edit': editMod,
  'mod/remove': removeMod,
  'job/preview': previewJob,
  'job/delete': deleteJob,
  'job/run': runJob
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
