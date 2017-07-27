const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')

function log () {
  console.log.apply(console, arguments)
}

async function ask (question) {
  const {x} = await inquirer.prompt([{
    ...question,
    name: 'x'
  }])
  return x
}

function saveJob (filepath, job) {
  return new Promise((resolve, reject) => {
    const text = JSON.stringify(job, null, 2)
    fs.writeFile(filepath, text, error =>
      error ? reject(error) : resolve()
    )
  })
}

function humanList (items) {
  if (items.length === 1) {
    return items[0]
  }
  if (items.length === 2) {
    const [first, second] = items
    return `${first} and ${second}`
  }
  const last = items.pop()
  return `${items.join(', ')}, and ${last}`
}

async function isGitRepo (directory) {
  return fs.existsSync(path.join(directory, '.git'))
}

module.exports = {ask, log, saveJob, humanList, isGitRepo}
