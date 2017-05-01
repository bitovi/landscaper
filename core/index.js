const EventEmitter = require('events')
const execute = require('./executor')
const getInfoForUrl = require('./resolvers')

function run (queue, data) {
    const reporter = new EventEmitter()
    execute(reporter, data)
    return reporter
}

module.exports = {
    getInfoForUrl,
    run
}
