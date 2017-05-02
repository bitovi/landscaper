import execute from './execute'
import {getInfo} from './resolve'
import EventEmitter from 'events'
import PackageCache from './package-cache'

/*
    getInfoForMod(modName, options: {[cache]})

    @params
    modName string
        string which can be a Gist URL or NPM require
    options object
        cache PackageCache: cache to use

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
export function getInfoForMod (modName, options) {
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
  mods Array<Object{id: string, options: object}>
      transforms (id is a url or require path)
      options is a map of <inquirer.name, supplied value>
  cache PackageCache: npm install directory
      [optional] default is self-cleanup post-run

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
export function run (directory, mods, cache) {
  const reporter = new EventEmitter()
  if (!cache) {
    cache = PackageCache.auto()
    reporter.on('done', () => {
      cache.empty()
    })
  }
  execute({
    directory,
    reporter,
    mods,
    cache
  }).catch(error => {
    reporter.emit('error', error)
  })
  return reporter
}

export function createPackageCache (directory) {
  return new PackageCache(directory)
}
