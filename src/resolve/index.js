import gist from './gist'
import npm from './npm'

const resolvers = [gist, npm]

export function getInfo (modName, options) {
  const resolver = resolvers.find(r => r.isMatch(modName))
  if (!resolver) {
    return Promise.reject(new Error(`No resolver found for URL: ${modName}`))
  }
  return resolver.getInfo(modName, options)
}

export function getExecutor (modName, options) {
  const resolver = resolvers.find(r => r.isMatch(modName))
  if (!resolver) {
    return Promise.reject(new Error(`No resolver found for URL: ${modName}`))
  }
  return resolver.getExecutor(modName, options)
}
