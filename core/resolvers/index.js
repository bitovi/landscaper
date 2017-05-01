const github = require('./github')
const gist = require('./gist')
const unpkg = require('./unpkg')

const resolvers = [github, gist, unpkg]

module.exports = {
    /*
        Returns a shape:
        {
            name: string
            description: string,
            options: {...descriptors}
        }
    */
    getInfoForUrl (url) {
        const resolver = resolvers.find(r => r.isMatch(url))
        if (!resolver) {
            return Promise.reject(new Error(`No resolver found for URL: ${url}`))
        }
        return resolver.getInfoForUrl(url)
    },

    /*
        Returns a function which will accept the root of the project
        and the mod options and return a promise for when the mod is complete
    */
    getExecutorForUrl (url) {
        const resolver = resolvers.find(r => r.isMatch(url))
        if (!resolver) {
            return Promise.reject(new Error(`No resolver found for URL: ${url}`))
        }
        return resolver.getExecutorForUrl(url)
    }
}
