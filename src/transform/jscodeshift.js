import fs from 'fs'
import path from 'path'
import globby from 'globby'
import Runner from 'jscodeshift/dist/Runner'

export default function (mod, modFilePath) {
  // duplicate and clean up seperately
  const fixedPath = modFilePath + '-fixed.js'
  const text = fs.readFileSync(modFilePath, {encoding: 'utf8'})
  fs.writeFileSync(fixedPath, text)

  return {
    getOptions () {
      let modOptions = []
      if (typeof mod.getOptions === 'function') {
        modOptions = mod.getOptions()
      }
      return [{
        name: 'path',
        type: 'input',
        message: 'Paths to transform'
      }].concat(modOptions)
    },

    run (directory, options) {
      const paths = typeof options.path === 'string' ? options.path.split(',') : options.path
      const codeOptions = {
        path: globby.sync(paths, { cwd: directory }).map(file => path.join(directory, file)),
        transform: fixedPath,
        babel: true,
        extensions: 'js',
        runInBand: false,
        silent: false,
        parser: 'babel',
        landscaper: options
      }

      return Runner.run(fixedPath, codeOptions.path, codeOptions)
        .then(() => {
          fs.unlinkSync(fixedPath)
        })
    }
  }
}
