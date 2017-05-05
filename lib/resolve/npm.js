'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toArray2 = require('babel-runtime/helpers/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

exports.isValidPackage = isValidPackage;
exports.getNameAndPath = getNameAndPath;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _validateNpmPackageName = require('validate-npm-package-name');

var _validateNpmPackageName2 = _interopRequireDefault(_validateNpmPackageName);

var _registry = require('../utils/registry');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isValidPackage(name) {
  return (0, _validateNpmPackageName2.default)(name).validForNewPackages;
}

function getNameAndPath(modName) {
  if (modName.includes('://')) {
    return;
  }

  var _modName$split = modName.split('/'),
      _modName$split2 = (0, _toArray3.default)(_modName$split),
      scope = _modName$split2[0],
      name = _modName$split2[1],
      parts = _modName$split2.slice(2);

  if (scope.charAt(0) === '@') {
    name = scope + '/' + name;
  } else {
    parts.unshift(name);
    name = scope;
  }
  if (!isValidPackage(name)) {
    return;
  }
  var path = parts.join('/');
  if (!path) {
    return [name];
  }
  return [name, path];
}

exports.default = {
  isMatch: function isMatch(modName) {
    return !!getNameAndPath(modName);
  },
  getInfo: function getInfo(modName, _ref) {
    var _this = this;

    var cache = _ref.cache,
        transforms = _ref.transforms;
    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
      var _getNameAndPath, _getNameAndPath2, packageName, packagePath, _ref2, name, description, packageDir, requirePath, options;

      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _getNameAndPath = getNameAndPath(modName), _getNameAndPath2 = (0, _slicedToArray3.default)(_getNameAndPath, 2), packageName = _getNameAndPath2[0], packagePath = _getNameAndPath2[1];
              _context.next = 3;
              return (0, _registry.getInfoForPackage)(packageName);

            case 3:
              _ref2 = _context.sent;
              name = _ref2.name;
              description = _ref2.description;
              _context.next = 8;
              return cache.getPackage(packageName);

            case 8:
              packageDir = _context.sent;
              requirePath = _path2.default.join(packageDir, packagePath || '');
              options = transforms.getMod(requirePath).getOptions();
              return _context.abrupt('return', { name: name, description: description, options: options });

            case 12:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  getExecutor: function getExecutor(modName, _ref3) {
    var _this2 = this;

    var cache = _ref3.cache,
        transforms = _ref3.transforms;
    return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var _getNameAndPath3, _getNameAndPath4, packageName, packagePath, packageDir, requirePath, runner;

      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _getNameAndPath3 = getNameAndPath(modName), _getNameAndPath4 = (0, _slicedToArray3.default)(_getNameAndPath3, 2), packageName = _getNameAndPath4[0], packagePath = _getNameAndPath4[1];
              _context2.next = 3;
              return cache.getPackage(packageName);

            case 3:
              packageDir = _context2.sent;
              requirePath = _path2.default.join(packageDir, packagePath || '');
              runner = transforms.getMod(requirePath);
              return _context2.abrupt('return', function (root, options) {
                return runner.run(root, options);
              });

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
};
//# sourceMappingURL=npm.js.map
