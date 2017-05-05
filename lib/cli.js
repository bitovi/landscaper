#!/usr/bin/env node
'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var landscape = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(_ref2) {
    var _ref3 = (0, _slicedToArray3.default)(_ref2, 1),
        directory = _ref3[0];

    var _ref4, agree, _ref5, mods, accessToken, _ref6, apply, reporter;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = directory || process.cwd();
            _context.next = 3;
            return _inquirer2.default.prompt([{
              name: 'agree',
              type: 'confirm',
              message: 'Landscape "' + directory + '"?'
            }]);

          case 3:
            _ref4 = _context.sent;
            agree = _ref4.agree;

            if (agree) {
              _context.next = 7;
              break;
            }

            return _context.abrupt('return', console.log('Okay, take your time'));

          case 7:
            _context.next = 9;
            return collectMods();

          case 9:
            _ref5 = _context.sent;
            mods = _ref5.mods;
            accessToken = _ref5.accessToken;
            _context.next = 14;
            return _inquirer2.default.prompt([{
              name: 'apply',
              type: 'confirm',
              message: 'Apply mods?'
            }]);

          case 14:
            _ref6 = _context.sent;
            apply = _ref6.apply;

            if (apply) {
              _context.next = 18;
              break;
            }

            return _context.abrupt('return', console.log('Wow, what a let down...'));

          case 18:
            reporter = (0, _index.run)(directory, mods, { accessToken: accessToken, cache: cache });

            reporter.on('log', function (_ref7) {
              var type = _ref7.type,
                  data = _ref7.data;

              if (type === 'error' || type === 'done') {
                return;
              }
              var msg = '  ';
              if (data.mod) {
                msg += '[' + data.mod.name + '] ';
              }
              msg += type.slice(4);
              if (data.error) {
                msg += ' ' + data.error;
              }

              console.log(msg);
            });

            _context.next = 22;
            return new _promise2.default(function (resolve, reject) {
              reporter.on('error', reject);
              reporter.on('done', resolve);
            });

          case 22:

            console.log('Landscaping complete!');

          case 23:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function landscape(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getToken = function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(modName, accessToken) {
    var _ref11, token;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _inquirer2.default.prompt([{
              name: 'token',
              type: 'input',
              message: 'Please provide a personal access token to access gists:'
            }]);

          case 2:
            _ref11 = _context2.sent;
            token = _ref11.token;
            return _context2.abrupt('return', token);

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getToken(_x3, _x4) {
    return _ref10.apply(this, arguments);
  };
}();

var addMod = function () {
  var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(accessToken) {
    var _ref13, modName, info, options;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _inquirer2.default.prompt([{
              name: 'modName',
              type: 'input',
              message: 'Please enter a NPM or Gist mod:'
            }]);

          case 2:
            _ref13 = _context3.sent;
            modName = _ref13.modName;

            modName = modName.trim();

            if (modName) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt('return', addMod(accessToken));

          case 7:

            console.log('Fetching options for "' + modName + '"');
            info = void 0;
            _context3.prev = 9;
            _context3.next = 12;
            return (0, _index.getInfoForMod)(modName, { accessToken: accessToken, cache: cache });

          case 12:
            info = _context3.sent;
            _context3.next = 26;
            break;

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3['catch'](9);

            if (!(!accessToken && _gist2.default.isMatch(modName))) {
              _context3.next = 24;
              break;
            }

            console.log('Error accessing gist:', _context3.t0);
            _context3.next = 21;
            return getToken(modName, accessToken);

          case 21:
            accessToken = _context3.sent;
            _context3.next = 25;
            break;

          case 24:
            console.log('Error:', _context3.t0);

          case 25:
            return _context3.abrupt('return', addMod(accessToken));

          case 26:
            console.log('Mod name: ' + info.name);
            console.log('Mod description: ' + info.description);
            _context3.next = 30;
            return _inquirer2.default.prompt(info.options);

          case 30:
            options = _context3.sent;
            return _context3.abrupt('return', { mod: { id: modName, options: options }, accessToken: accessToken });

          case 32:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[9, 15]]);
  }));

  return function addMod(_x5) {
    return _ref12.apply(this, arguments);
  };
}();

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _index = require('./index');

var _gist = require('./resolve/gist');

var _gist2 = _interopRequireDefault(_gist);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = process.argv.slice(2);
var arg = args[0];

var PackageCache = require('../lib/utils/package-cache').default;
var cache = PackageCache.auto();

function version() {
  console.log('\n' + _package2.default.name + '@' + _package2.default.version + '\n');
}

function help() {
  console.log(['', 'USAGE:', _package2.default.name + ' [directory]', '  runs landscaper on the directory (current directory by default)', '', 'FLAGS:', '-v, -V, --version: version information', '-h, -H, --help: command documentation', ''].map(function (x) {
    return '  ' + x;
  }).join('\n'));
}

function collectMods() {
  var mods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var accessToken = arguments[1];

  return addMod(accessToken).then(function (_ref8) {
    var mod = _ref8.mod,
        accessToken = _ref8.accessToken;

    mods = mods.concat(mod);
    return _inquirer2.default.prompt([{
      name: 'another',
      type: 'confirm',
      message: 'Would you like to add another mod?'
    }]).then(function (_ref9) {
      var another = _ref9.another;

      if (!another) {
        return { mods: mods, accessToken: accessToken };
      }
      return collectMods(mods, accessToken);
    });
  });
}

var commands = {
  '--version': version,
  '-V': version,
  '-v': version,

  '--help': help,
  '-H': help,
  '-h': help,

  default: landscape
};

var command = commands[arg];
if (command) {
  command(args.slice(1));
} else {
  commands.default(args);
}
//# sourceMappingURL=cli.js.map
