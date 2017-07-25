#!/usr/bin/env node
var cli = require('../lib/cli')
cli.default(process.argv.slice(2)).catch(function (error) {
  console.log('Failed with error:', error.message)
})
