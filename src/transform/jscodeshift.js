import fs from 'fs'
import path from 'path'
import Runner from 'jscodeshift/dist/Runner'

export default function (mod, modFilePath) {
  // duplicate and clean up seperately
  const fixedPath = modFilePath + '-fixed'
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
        type: 'list',
        message: 'Paths to transform'
      }].concat(modOptions)
    },

    run (directory, options) {
      const codeOptions = {
        path: options.path.map(file => path.join(directory, file)),
        transform: fixedPath,
        babel: true,
        extensions: 'js',
        runInBand: false,
        silent: true,
        parser: 'babel',
        landscaper: options
      }

      return Runner.run(fixedPath, options.path, codeOptions)
        .then(() => {
          fs.unlinkSync(fixedPath)
        })
    }
  }
}
