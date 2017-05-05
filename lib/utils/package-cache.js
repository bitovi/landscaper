'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _npmi = require('npmi');

var _npmi2 = _interopRequireDefault(_npmi);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isExistingDirectory(path) {
  return new _promise2.default(function (resolve, reject) {
    _fs2.default.stat(path, function (error, stats) {
      resolve(!error && stats.isDirectory());
    });
  });
}

// we need this to fix problems with npmlog and inquirer
function silence(promise) {
  var stdout = console._stdout;
  console._stdout = {
    write: function write() {}
  };
  return promise().then(function (x) {
    return new _promise2.default(function (resolve) {
      setTimeout(function () {
        return resolve(x);
      }, 100);
    });
  }).then(function (x) {
    console._stdout = stdout;
    return x;
  }, function (error) {
    console._stdout = stdout;
    throw error;
  });
}

function npmInstall(directory, packageName) {
  return silence(function () {
    return new _promise2.default(function (resolve, reject) {
      (0, _npmi2.default)({
        name: packageName,
        path: directory,
        npmLoad: {
          loglevel: 'silent',
          progress: false
        }
      }, function (error, result) {
        error ? reject(error) : resolve(result);
      });
    });
  });
}

var PackageCache = function () {
  function PackageCache(directory) {
    (0, _classCallCheck3.default)(this, PackageCache);

    this._directory = directory;
    this.gistCounter = 0;
  }

  (0, _createClass3.default)(PackageCache, [{
    key: 'getPackage',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(packageName) {
        var packagePath, isInstalled;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                packagePath = _path2.default.join(this._directory, 'node_modules', packageName);
                _context.next = 3;
                return isExistingDirectory(packagePath);

              case 3:
                isInstalled = _context.sent;

                if (isInstalled) {
                  _context.next = 7;
                  break;
                }

                _context.next = 7;
                return npmInstall(this._directory, packageName);

              case 7:
                return _context.abrupt('return', packagePath);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getPackage(_x) {
        return _ref.apply(this, arguments);
      }

      return getPackage;
    }()
  }, {
    key: 'saveGist',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(rawGistUrl, scriptText) {
        var filename, filepath, cleanup;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                filename = _path2.default.basename(rawGistUrl).split('#')[0];
                filepath = _path2.default.join(this._directory, filename + '-' + this.gistCounter++);
                _context2.next = 4;
                return new _promise2.default(function (resolve, reject) {
                  _fs2.default.writeFile(filepath, scriptText, function (error) {
                    return error ? reject(error) : resolve();
                  });
                });

              case 4:
                cleanup = function cleanup() {
                  return new _promise2.default(function (resolve, reject) {
                    _fs2.default.unlink(filepath, function (error) {
                      error ? reject(error) : resolve();
                    });
                  });
                };

                return _context2.abrupt('return', { scriptPath: filepath, cleanup: cleanup });

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function saveGist(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return saveGist;
    }()
  }], [{
    key: 'auto',
    value: function auto() {
      var cachePath = _path2.default.join(_path2.default.dirname(__dirname), 'cache');
      var cache = new PackageCache(cachePath);
      cache.empty = function () {
        _rimraf2.default.sync(cachePath);
      };
      cache.empty();
      _fs2.default.mkdirSync(cachePath);
      return cache;
    }
  }]);
  return PackageCache;
}();

exports.default = PackageCache;
//# sourceMappingURL=package-cache.js.map
