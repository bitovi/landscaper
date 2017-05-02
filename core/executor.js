const clone = require('git-clone')
const {createDir, removeDir} = require('./tempdir')
const {getExecutorForUrl} = require('./resolvers')

function cloneProject (githubUrl, branch, destination) {
    return new Promise((resolve, reject) => {
        const options = {
            shallow: true,
            checkout: branch
        }
        clone(githubUrl, destination, options, function (error) {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}

module.exports = async function executor (reporter, data) {
    function emit (type, data) {
        data.type = type
        reporter.emit(type, data)
    }

    /*
    1. Create working directory
    2. Download unique mods
        Emit "mod-resolving"
            {
                type: 'mod-resolving',
                url: string
            }
        Emit "mod-resolved"
            {
                type: 'mod-resolved',
                url: string
            }
    3. For each repo
        1. Clone repo/branch into dir (repo-(cloning|cloned|failed) events)
        2. For each mod, apply change (mod-(applying|applied|failed) events)
        3. Emit "done" event
            {
                type: 'done',
                repo: string,
                root: string // folder containing the modded project
            }
    */

    const directory = await createDir(__dirname)
    const uniqueMods = data.repos
        .map(repo => repo.mods.map(mod => mod.url))
        .reduce((x, y) => x.concat(y))
        .reduce((list, item) => (
            list.includes(item) ? list : list.concat(item)
        ))
    const modMap = {}
    for (const modUrl of uniqueMods) {
        emit('mod/resolving', {modUrl})
        try {
            modMap[mod.url] = await getExecutorForUrl(url)
        } catch (error) {
            emit('mod/not-found', {modUrl})
            throw error
        }
        emit('mod/resolved', {modUrl})
    }
    for (const repo of data.repos) {
        const {repoOwner, repoName, repoBaseBranch} = repo
        const repoDirectory = await createDir(directory)
        const emitData = {repoName, repoOwner, repoBaseBranch}
        emit('repo/cloning', emitData)
        let failed = false
        try {
            const gitUrl = `https://github.com/${repoOwner}/${repoName}.git`
            await cloneProject(gitUrl, branch, repoDirectory)
        } catch (error) {
            failed = true
        }
        emit(failed ? 'repo/clone-failed' : 'repo/cloned', emitData)
        if (!failed) {
            for (const mod of repo.mods) {
                const executor = modMap[mod.url]
                const modEmitData = {repo: emitData, mod: mod.url}
                emit('mod/applying', modEmitData)
                let modFailed = false
                try {
                    await executor(repoDirectory, repo.options)
                } catch (error) {
                    modFailed = true
                }
                emit(modFailed ? 'mod/apply-failed' : 'mod/applied', modEmitData)
            }
        }
    }
    await removeDir(directory)
    emit('done', data)
    return Promise.resolve()
}
