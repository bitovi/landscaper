#!/usr/bin/env node
import inquirer from 'inquirer'
import {getInfoForMod, run} from './index'
import gist from './resolve/gist'
import pkg from '../package.json'

const args = process.argv.slice(2)
const arg = args[0]

const PackageCache = require('../lib/utils/package-cache').default
const cache = PackageCache.auto()

function version () {
  console.log('\n' + pkg.name + '@' + pkg.version + '\n')
}

function help () {
  console.log([
    '',
    'USAGE:',
    pkg.name + ' [directory]',
    '  runs landscaper on the directory (current directory by default)',
    '',
    'FLAGS:',
    '-v, -V, --version: version information',
    '-h, -H, --help: command documentation',
    ''
  ].map(x => '  ' + x).join('\n'))
}

async function landscape ([directory]) {
  directory = directory || process.cwd()
  const {agree} = await inquirer.prompt([{
    name: 'agree',
    type: 'confirm',
    message: 'Landscape "' + directory + '"?'
  }])
  if (!agree) {
    return console.log('Okay, take your time')
  }

  const {mods, accessToken} = await collectMods()
  const {apply} = await inquirer.prompt([{
    name: 'apply',
    type: 'confirm',
    message: 'Apply mods?'
  }])
  if (!apply) {
    return console.log('Wow, what a let down...')
  }

  const reporter = run(directory, mods, {accessToken, cache})
  reporter.on('log', ({type, data}) => {
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

    console.log(msg)
  })

  await new Promise((resolve, reject) => {
    reporter.on('error', reject)
    reporter.on('done', resolve)
  })

  console.log('Landscaping complete!')
}

function collectMods (mods = [], accessToken) {
  return addMod(accessToken).then(function ({mod, accessToken}) {
    mods = mods.concat(mod)
    return inquirer.prompt([{
      name: 'another',
      type: 'confirm',
      message: 'Would you like to add another mod?'
    }]).then(({another}) => {
      if (!another) {
        return {mods, accessToken}
      }
      return collectMods(mods, accessToken)
    })
  })
}

async function getToken (modName, accessToken) {
  const {token} = await inquirer.prompt([{
    name: 'token',
    type: 'input',
    message: 'Please provide a personal access token to access gists:'
  }])

  return token
}

async function addMod (accessToken) {
  let {modName} = await inquirer.prompt([{
    name: 'modName',
    type: 'input',
    message: 'Please enter a NPM or Gist mod:'
  }])
  modName = modName.trim()
  if (!modName) {
    return addMod(accessToken)
  }

  console.log('Fetching options for "' + modName + '"')
  let info
  try {
    info = await getInfoForMod(modName, {accessToken, cache})
  } catch (error) {
    if (!accessToken && gist.isMatch(modName)) {
      console.log('Error accessing gist:', error)
      accessToken = await getToken(modName, accessToken)
    } else {
      console.log('Error:', error)
    }
    return addMod(accessToken)
  }
  console.log('Mod name: ' + info.name)
  console.log('Mod description: ' + info.description)
  const options = await inquirer.prompt(info.options)
  return {mod: {id: modName, options}, accessToken}
}

const commands = {
  '--version': version,
  '-V': version,
  '-v': version,

  '--help': help,
  '-H': help,
  '-h': help,

  default: landscape
}

const command = commands[arg]
if (command) {
  command(args.slice(1))
} else {
  commands.default(args)
}
