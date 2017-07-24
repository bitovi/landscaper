import dedent from 'dedent'
import pkg from '../../package'
import begin from './begin'
import sentry from './sentry'
import {log} from './util'

const helpMessage = dedent`
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

function version () {
  log(pkg.version)
}

function help () {
  log(helpMessage)
}

const flags = {
  '-v': version,
  '-V': version,
  '--version': version,

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
