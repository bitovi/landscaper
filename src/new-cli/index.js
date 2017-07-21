import pkg from '../../package'
import begin from './begin'
import sentry from './sentry'

/*
var job = {
  directories: [{
    path: String,
    gitOptions: {
      pullRequest: Boolean,
      pullRequestMessage: String,
      baseBranch: String
    },
    mods: [{
      name: String,
      options: Object
    }]
  }]
}
*/

/*
# First-time use

> landscaper
Hello! Let's start landscaping!

First, we need to create a landscaping "job" which is
a JSON file describing:
  - The directories we will modify
  - The mods we will run in each directory
  - The configuration options for each mod

You can view/edit/commit this file if you want.
Don't worry, I'll try to do most of the legwork.
What should we name this job?
>

Where should we save our "<job name>".json? (current directory is default)
>

Job name has been successfully saved in <directory>.
If at any point you want to pause or quit crafting this job,
just re-run `landscaper <path/to/job>` and we'll pick back up.

The next step is up to you, we can start adding directories or
adding mods (via npm package name or gist URL).
@ Add directories
@ Add mods

>> If add directories

*/

const helpMessage = `
${pkg.name}@${pkg.version}

USAGE:
  ${pkg.name}
    Start Landscaper and create a job from scratch
  ${pkg.name} <job-file>
    Start Landscaper with an existing job file

FLAGS:
  -v, -V, --version: version information
  -h, -H, --help: command documentation
`

function log () {
  console.log.apply(console, arguments)
}

function version () {
  log(pkg.version)
}

function help () {
  log(helpMessage)
}

const flags = {
  '-v': version,
  '-V': version,
  '--version': 'version',

  '-h': help,
  '-H': help,
  '--help': help
}

export default async function main (args) {
  if (args.length >= 2) {
    log('Landscaper only accepts zero or one argument.')
    log(helpMessage)
  }
  const [firstArg] = args
  const command = flags[firstArg]
  if (command) {
    return command()
  }

  return begin(firstArg)
    .then(({filepath, job}) => sentry(filepath, job))
}
