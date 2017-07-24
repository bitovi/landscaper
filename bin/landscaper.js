#!/usr/bin/env node
var cli = require('../lib/new-cli')
cli.default(process.argv.slice(2)).catch(error => {
  console.log('Failed with error:', error.message)
})
