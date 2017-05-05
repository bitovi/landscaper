'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyMods = exports.loadMods = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var loadMods = exports.loadMods = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(mods, options, emit) {
    var modMap, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, mod;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            modMap = {};
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 4;
            _iterator = (0, _getIterator3.default)(mods);

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 23;
              break;
            }

            mod = _step.value;

            emit('mod/resolving', { mod: mod });
            _context.prev = 9;
            _context.next = 12;
            return (0, _resolve.getExecutor)(mod.name, options);

          case 12:
            modMap[mod._id] = _context.sent;
            _context.next = 19;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context['catch'](9);

            emit('mod/not-found', { mod: mod, error: _context.t0 });
            throw _context.t0;

          case 19:
            emit('mod/resolved', { mod: mod });

          case 20:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 23:
            _context.next = 29;
            break;

          case 25:
            _context.prev = 25;
            _context.t1 = _context['catch'](4);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 29:
            _context.prev = 29;
            _context.prev = 30;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(29);

          case 37:
            return _context.abrupt('return', modMap);

          case 38:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 25, 29, 37], [9, 15], [30,, 32, 36]]);
  }));

  return function loadMods(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var applyMods = exports.applyMods = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(directory, mods, modMap, emit) {
    var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, mod, executor;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context2.prev = 3;
            _iterator2 = (0, _getIterator3.default)(mods);

          case 5:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context2.next = 22;
              break;
            }

            mod = _step2.value;
            executor = modMap[mod._id];

            emit('mod/applying', { mod: mod });
            _context2.prev = 9;
            _context2.next = 12;
            return executor(directory, mod.options);

          case 12:
            _context2.next = 18;
            break;

          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2['catch'](9);

            emit('mod/apply-failed', { mod: mod, error: _context2.t0 });
            throw _context2.t0;

          case 18:
            emit('mod/applied', { mod: mod });

          case 19:
            _iteratorNormalCompletion2 = true;
            _context2.next = 5;
            break;

          case 22:
            _context2.next = 28;
            break;

          case 24:
            _context2.prev = 24;
            _context2.t1 = _context2['catch'](3);
            _didIteratorError2 = true;
            _iteratorError2 = _context2.t1;

          case 28:
            _context2.prev = 28;
            _context2.prev = 29;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 31:
            _context2.prev = 31;

            if (!_didIteratorError2) {
              _context2.next = 34;
              break;
            }

            throw _iteratorError2;

          case 34:
            return _context2.finish(31);

          case 35:
            return _context2.finish(28);

          case 36:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[3, 24, 28, 36], [9, 14], [29,, 31, 35]]);
  }));

  return function applyMods(_x4, _x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

var _resolve = require('./resolve');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(_ref4) {
    var directory = _ref4.directory,
        reporter = _ref4.reporter,
        mods = _ref4.mods,
        options = _ref4.options;
    var emit, modMap;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            emit = function emit(type, data) {
              data.type = type;
              reporter.emit(type, data);
              reporter.emit('log', { type: type, data: data });
            };

            _context3.next = 3;
            return loadMods(mods, options, emit);

          case 3:
            modMap = _context3.sent;
            _context3.next = 6;
            return applyMods(directory, mods, modMap, emit);

          case 6:
            emit('done', { directory: directory, mods: mods });

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  function execute(_x8) {
    return _ref3.apply(this, arguments);
  }

  return execute;
}();
//# sourceMappingURL=execute.js.map
