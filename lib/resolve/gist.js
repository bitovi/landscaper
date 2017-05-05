'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.getFilenames = getFilenames;
exports.getGistId = getGistId;
exports.isRawGistUrl = isRawGistUrl;
exports.githubHeaders = githubHeaders;
exports.getGist = getGist;
exports.getGistFile = getGistFile;
exports.compileModule = compileModule;
exports.getPrimaryFile = getPrimaryFile;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getFilenames(hash) {
  if (!(hash && hash.startsWith('file-'))) {
    return [];
  }
  var segments = hash.slice(5).split('-');
  return segments.reduce(function (filesnames, segment, index, segments) {
    var nextIndex = index + 1;
    var basename = segments.slice(0, nextIndex).join('-');
    var ext = segments.slice(nextIndex);
    var extension = ext.length ? '.' + ext.join('.') : '';
    return filesnames.concat('' + basename + extension);
  }, []);
}

var gistWithOwnerAndId = /https:\/\/gist\.github\.com\/(?:.*)\/(.*)/;
function getGistId(url) {
  var match = url.match(gistWithOwnerAndId);
  if (match) {
    var _match = (0, _slicedToArray3.default)(match, 2),
        id = _match[1];

    var _id$split = id.split('#'),
        _id$split2 = (0, _slicedToArray3.default)(_id$split, 2),
        gistId = _id$split2[0],
        hash = _id$split2[1];

    var filenames = getFilenames(hash);
    return [gistId, filenames];
  }
}

var rawGistUrl = /https:\/\/gist\.githubusercontent\.com\/(.*)\/(.*)\/raw\/(.*)\/(.*)/;
function isRawGistUrl(url) {
  return rawGistUrl.test(url);
}

var baseHeaders = {
  'User-Agent': 'Landscaper'
};

function githubHeaders(accessToken) {
  if (!accessToken) {
    return baseHeaders;
  }
  return (0, _extends3.default)({}, baseHeaders, {
    'Authorization': 'token ' + accessToken
  });
}

function getGist(id, options) {
  var url = 'https://api.github.com/gists/' + id;
  return new _promise2.default(function (resolve, reject) {
    (0, _request2.default)({
      url: url,
      headers: githubHeaders(options.accessToken),
      json: true
    }, function (error, res, data) {
      error ? reject(error) : resolve(data);
    });
  });
}

function getGistFile(url, options) {
  return new _promise2.default(function (resolve, reject) {
    (0, _request2.default)({
      url: url,
      headers: githubHeaders(options.accessToken)
    }, function (error, res, body) {
      error ? reject(error) : resolve(body);
    });
  });
}

function compileModule(code) {
  var globals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var exports = {};
  var module = { exports: exports };
  var globalNames = (0, _keys2.default)(globals);
  var keys = ['module', 'exports', 'require'].concat((0, _toConsumableArray3.default)(globalNames));
  var values = [module, exports, require].concat((0, _toConsumableArray3.default)(globalNames.map(function (key) {
    return globals[key];
  })));
  /* eslint-disable no-new-func */
  new Function(keys.join(), code).apply(exports, values);
  return module.exports;
}

function getPrimaryFile(gist, filenames) {
  var files = gist.files;

  if (!files) {
    return;
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(filenames), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _filename = _step.value;

      var file = files[_filename];
      if (file) {
        return file.raw_url;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var index = files['index.js'];
  if (index) {
    return index.raw_url;
  }
  for (var filename in files) {
    return files[filename].raw_url;
  }
}

exports.default = {
  isMatch: function isMatch(url) {
    return !!(getGistId(url) || isRawGistUrl(url));
  },
  getInfo: function getInfo(url, resolveOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
      var fileUrl, description, _getGistId, _getGistId2, id, filenames, gist, _path$basename$split, _path$basename$split2, name, script, cache, transforms, _ref, scriptPath, cleanup, options;

      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              fileUrl = void 0;
              description = void 0;

              if (!isRawGistUrl(url)) {
                _context.next = 7;
                break;
              }

              fileUrl = url;
              description = 'Raw github gist';
              _context.next = 13;
              break;

            case 7:
              _getGistId = getGistId(url), _getGistId2 = (0, _slicedToArray3.default)(_getGistId, 2), id = _getGistId2[0], filenames = _getGistId2[1];
              _context.next = 10;
              return getGist(id, resolveOptions);

            case 10:
              gist = _context.sent;

              fileUrl = getPrimaryFile(gist, filenames);
              description = gist.description;

            case 13:
              if (fileUrl) {
                _context.next = 15;
                break;
              }

              throw new Error('Gist did not have any files');

            case 15:
              _path$basename$split = _path2.default.basename(fileUrl).split('#'), _path$basename$split2 = (0, _slicedToArray3.default)(_path$basename$split, 1), name = _path$basename$split2[0];
              _context.next = 18;
              return getGistFile(fileUrl, resolveOptions);

            case 18:
              script = _context.sent;
              cache = resolveOptions.cache, transforms = resolveOptions.transforms;
              _context.next = 22;
              return cache.saveGist(fileUrl, script);

            case 22:
              _ref = _context.sent;
              scriptPath = _ref.scriptPath;
              cleanup = _ref.cleanup;
              options = transforms.getMod(scriptPath).getOptions();
              _context.next = 28;
              return cleanup();

            case 28:
              return _context.abrupt('return', { name: name, description: description, options: options });

            case 29:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  getExecutor: function getExecutor(url, resolveOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var fileUrl, _getGistId3, _getGistId4, id, filenames, gist, script, cache, transforms, _ref2, scriptPath, cleanup, runner;

      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              fileUrl = url;

              if (isRawGistUrl(url)) {
                _context2.next = 7;
                break;
              }

              _getGistId3 = getGistId(url), _getGistId4 = (0, _slicedToArray3.default)(_getGistId3, 2), id = _getGistId4[0], filenames = _getGistId4[1];
              _context2.next = 5;
              return getGist(id, resolveOptions);

            case 5:
              gist = _context2.sent;

              fileUrl = getPrimaryFile(gist, filenames);

            case 7:
              if (fileUrl) {
                _context2.next = 9;
                break;
              }

              throw new Error('Gist did not have any files');

            case 9:
              _context2.next = 11;
              return getGistFile(fileUrl, resolveOptions);

            case 11:
              script = _context2.sent;
              cache = resolveOptions.cache, transforms = resolveOptions.transforms;
              _context2.next = 15;
              return cache.saveGist(fileUrl, script);

            case 15:
              _ref2 = _context2.sent;
              scriptPath = _ref2.scriptPath;
              cleanup = _ref2.cleanup;
              runner = transforms.getMod(scriptPath);
              _context2.next = 21;
              return cleanup();

            case 21:
              return _context2.abrupt('return', function execute(root, options) {
                return runner.run(root, options);
              });

            case 22:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
};
//# sourceMappingURL=gist.js.map
