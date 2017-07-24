import execute from './execute'
import {getInfo} from './resolve'
import EventEmitter from 'events'
import PackageCache from './utils/package-cache'
import TransformLibrary from './utils/transform-library'

/*
    getInfoForMod(modName, options: {[cache]})

    @params
    modName string
      string which can be a Gist URL or NPM require
    options object
      accessToken string
        access token for using the Github gist API
      cache PackageCache: npm install directory
        [optional] default is self-cleanup post-run
      transforms TransformLibrary
        [optional] default contains included transforms

    @returns
    Promise.resolve({
      name: string,
      description: string,
      options: [{
        name: string (i.e. field name),
        type: string (i.e. field input type),
        message: string, (i.e. field label)
        default: any, (i.e. field placeholder)
        choices: [any] (used for selects/radios/checkboxes)
        // see https://github.com/SBoudrias/Inquirer.js/#question
      }]
    })
*/
export function getInfoForMod (modName, options = {}) {
  if (!options.transforms) {
    options.transforms = TransformLibrary.auto()
  }
  if (!options.cache) {
    const cache = options.cache = PackageCache.auto()
    return getInfo(modName, options)
      .then(info => {
        cache.empty()
        return info
      }, error => {
        cache.empty()
        throw error
      })
  }

  return getInfo(modName, options)
}

/*
  run(directory, mods[, cache])

  @params
  directory string
    directory containing the project
  mods Array<Object{name: string, options: object}>
    transforms (name is a url or require path)
    options is a map of <inquirer.name, supplied value>
  options object
    accessToken string
      access token for using the Github gist API
    cache PackageCache: npm install directory
      [optional] default is self-cleanup post-run
    transforms TransformLibrary
      [optional] default contains included transforms

  @returns
  reporter EventEmitter
    events:
      mod/
        resolving: mod begins loading
        not-found: mod not found error, skips to next
        resolved: mod found, nothing on to next
        applying: mod is being applied
        apply-failed: mod rejected with an error
        applied: mod has been applied, moving on to next
*/
export function run (directory, mods, options = {}) {
  const reporter = new EventEmitter()
  if (!options.cache) {
    const cache = options.cache = PackageCache.auto()
    reporter.on('done', () => {
      cache.empty()
    })
  }
  if (!options.transforms) {
    options.transforms = TransformLibrary.auto()
  }
  execute({
    directory,
    reporter,
    mods,
    options
  }).catch(error => {
    reporter.emit('error', error)
  })
  return reporter
}

export function createTransformLibrary (transforms) {
  return new TransformLibrary(transforms)
}

export function createPackageCache (directory) {
  return new PackageCache(directory)
}
