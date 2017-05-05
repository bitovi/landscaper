'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (mod, modFilePath) {
  // duplicate and clean up seperately
  var fixedPath = modFilePath + '-fixed.js';
  var text = _fs2.default.readFileSync(modFilePath, { encoding: 'utf8' });
  _fs2.default.writeFileSync(fixedPath, text);

  return {
    getOptions: function getOptions() {
      var modOptions = [];
      if (typeof mod.getOptions === 'function') {
        modOptions = mod.getOptions();
      }
      return [{
        name: 'path',
        type: 'input',
        message: 'Paths to transform'
      }].concat(modOptions);
    },
    run: function run(directory, options) {
      var paths = typeof options.path === 'string' ? options.path.split(',') : options.path;
      var codeOptions = {
        path: _globby2.default.sync(paths, { cwd: directory }).map(function (file) {
          return _path2.default.join(directory, file);
        }),
        transform: fixedPath,
        babel: true,
        extensions: 'js',
        runInBand: false,
        silent: false,
        parser: 'babel',
        landscaper: options
      };

      return _Runner2.default.run(fixedPath, codeOptions.path, codeOptions).then(function () {
        _fs2.default.unlinkSync(fixedPath);
      });
    }
  };
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var _Runner = require('jscodeshift/dist/Runner');

var _Runner2 = _interopRequireDefault(_Runner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=jscodeshift.js.map
