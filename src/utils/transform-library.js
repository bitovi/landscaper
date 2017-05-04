import JSCodeShiftTransform from '../transform/jscodeshift'

export default class TransformLibrary {
  constructor (tranforms) {
    this._tranforms = tranforms
  }

  getTransform (name) {
    return this._tranforms[name]
  }

  getMod (scriptPath) {
    const mod = require(scriptPath)
    if (typeof mod === 'function') {
      if (mod.transform !== 'jscodeshift') {
        console.warn('Landscaper: Intepreting mod as jscodeshift script...')
      }
      return JSCodeShiftTransform(mod, scriptPath)
    }
    if (!mod.transform) {
      return mod
    }
    const transform = this.getTransform(mod.transform)
    if (!transform) {
      throw new Error(`Transform "${mod.transform}" not found`)
    }
    const wrapperMod = transform(mod, scriptPath)
    return wrapperMod
  }

  static auto () {
    return new TransformLibrary({
      jscodeshift: JSCodeShiftTransform
    })
  }
}
