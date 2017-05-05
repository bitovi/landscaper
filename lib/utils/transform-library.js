'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jscodeshift = require('../transform/jscodeshift');

var _jscodeshift2 = _interopRequireDefault(_jscodeshift);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TransformLibrary = function () {
  function TransformLibrary(tranforms) {
    (0, _classCallCheck3.default)(this, TransformLibrary);

    this._tranforms = tranforms;
  }

  (0, _createClass3.default)(TransformLibrary, [{
    key: 'getTransform',
    value: function getTransform(name) {
      return this._tranforms[name];
    }
  }, {
    key: 'getMod',
    value: function getMod(scriptPath) {
      var mod = require(scriptPath);
      if (typeof mod === 'function') {
        if (mod.transform !== 'jscodeshift') {
          console.warn('Landscaper: Intepreting mod as jscodeshift script...');
        }
        return (0, _jscodeshift2.default)(mod, scriptPath);
      }
      if (!mod.transform) {
        return mod;
      }
      var transform = this.getTransform(mod.transform);
      if (!transform) {
        throw new Error('Transform "' + mod.transform + '" not found');
      }
      var wrapperMod = transform(mod, scriptPath);
      return wrapperMod;
    }
  }], [{
    key: 'auto',
    value: function auto() {
      return new TransformLibrary({
        jscodeshift: _jscodeshift2.default
      });
    }
  }]);
  return TransformLibrary;
}();

exports.default = TransformLibrary;
//# sourceMappingURL=transform-library.js.map
