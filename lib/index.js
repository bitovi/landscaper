'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInfoForMod = getInfoForMod;
exports.run = run;
exports.createTransformLibrary = createTransformLibrary;
exports.createPackageCache = createPackageCache;

var _execute = require('./execute');

var _execute2 = _interopRequireDefault(_execute);

var _resolve = require('./resolve');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _packageCache = require('./utils/package-cache');

var _packageCache2 = _interopRequireDefault(_packageCache);

var _transformLibrary = require('./utils/transform-library');

var _transformLibrary2 = _interopRequireDefault(_transformLibrary);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
    getInfoForMod(modName, options: {[cache]})

    @params
    modName string
      string which can be a Gist URL or NPM require
    options object
      accessToken string
        access token for using the Github gist API
      cache PackageCache: npm install directory
        [optional] default is self-cleanup post-run
      transforms TransformLibrary
        [optional] default contains included transforms

    @returns
    Promise.resolve({
      name: string,
      description: string,
      options: [{
        name: string (i.e. field name),
        type: string (i.e. field input type),
        message: string, (i.e. field label)
        default: any, (i.e. field placeholder)
        choices: [any] (used for selects/radios/checkboxes)
        // see https://github.com/SBoudrias/Inquirer.js/#question
      }]
    })
*/
function getInfoForMod(modName) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!options.transforms) {
    options.transforms = _transformLibrary2.default.auto();
  }
  if (!options.cache) {
    var cache = options.cache = _packageCache2.default.auto();
    return (0, _resolve.getInfo)(modName, options).then(function (info) {
      cache.empty();
      return info;
    }, function (error) {
      cache.empty();
      throw error;
    });
  }

  return (0, _resolve.getInfo)(modName, options);
}

/*
  run(directory, mods[, cache])

  @params
  directory string
    directory containing the project
  mods Array<Object{id: string, options: object}>
    transforms (id is a url or require path)
    options is a map of <inquirer.name, supplied value>
  options object
    accessToken string
      access token for using the Github gist API
    cache PackageCache: npm install directory
      [optional] default is self-cleanup post-run
    transforms TransformLibrary
      [optional] default contains included transforms

  @returns
  reporter EventEmitter
    events:
      mod/
        resolving: mod begins loading
        not-found: mod not found error, skips to next
        resolved: mod found, nothing on to next
        applying: mod is being applied
        apply-failed: mod rejected with an error
        applied: mod has been applied, moving on to next
*/
function run(directory, mods) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var reporter = new _events2.default();
  if (!options.cache) {
    var cache = options.cache = _packageCache2.default.auto();
    reporter.on('done', function () {
      cache.empty();
    });
  }
  if (!options.transforms) {
    options.transforms = _transformLibrary2.default.auto();
  }
  (0, _execute2.default)({
    directory: directory,
    reporter: reporter,
    mods: mods,
    options: options
  }).catch(function (error) {
    reporter.emit('error', error);
  });
  return reporter;
}

function createTransformLibrary(transforms) {
  return new _transformLibrary2.default(transforms);
}

function createPackageCache(directory) {
  return new _packageCache2.default(directory);
}
//# sourceMappingURL=index.js.map
