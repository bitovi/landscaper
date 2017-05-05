'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.getInfo = getInfo;
exports.getExecutor = getExecutor;

var _gist = require('./gist');

var _gist2 = _interopRequireDefault(_gist);

var _npm = require('./npm');

var _npm2 = _interopRequireDefault(_npm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var resolvers = [_gist2.default, _npm2.default];

function getInfo(modName, options) {
  var resolver = resolvers.find(function (r) {
    return r.isMatch(modName);
  });
  if (!resolver) {
    return _promise2.default.reject(new Error('No resolver found for URL: ' + modName));
  }
  return resolver.getInfo(modName, options);
}

function getExecutor(modName, options) {
  var resolver = resolvers.find(function (r) {
    return r.isMatch(modName);
  });
  if (!resolver) {
    return _promise2.default.reject(new Error('No resolver found for URL: ' + modName));
  }
  return resolver.getExecutor(modName, options);
}
//# sourceMappingURL=index.js.map
