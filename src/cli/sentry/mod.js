import inquirer from 'inquirer'

import {getInfoForMod} from '../../index'
import PackageCache from '../../utils/package-cache'
import {log, ask, saveJob, humanList} from '../util'

const cache = PackageCache.auto()
process.on('beforeExit', function () {
  cache.empty()
})

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

export async function addMod (filepath, job) {
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
    info.shortName = info.name
    info.name = modName
  } catch (error) {
    log('Error:', error.message)
    return addMod(filepath, job)
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
  return addMod(filepath, newJob)
}

export async function removeMod (filepath, job) {
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

export async function editMod (filepath, job) {
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
    return editMod(filepath, job)
  }

  const optionValues = await inquirer.prompt(mod.options)
  Object.assign(mod, {optionValues})

  await saveJob(filepath, job)
  log(`Modifed "${mod.name}"`)
  return editMod(filepath, job)
}
