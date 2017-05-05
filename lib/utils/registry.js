'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.packageUrl = packageUrl;
exports.makeJsonRequest = makeJsonRequest;
exports.getInfoForPackage = getInfoForPackage;

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function packageUrl(name) {
  return 'https://registry.npmjs.com/' + name;
}

function makeJsonRequest(https, url) {
  return new _promise2.default(function (resolve, reject) {
    var fail = function fail(msg) {
      return reject(new Error(url + ': ' + msg));
    };

    https.get(url, function (res) {
      if (res.statusCode >= 400) {
        return fail('NPM registry returning status code ' + res.statusCode);
      }

      var body = '';
      res.on('data', function (text) {
        body += text.toString();
      });
      res.on('end', function () {
        if (!body.length) {
          return fail('No registry info');
        }

        try {
          var result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          fail('Registry not returning valid JSON: ' + error);
        }
      });
    }).on('error', reject);
  });
}

function getInfoForPackage(name) {
  return makeJsonRequest(_https2.default, packageUrl(name));
}
//# sourceMappingURL=registry.js.map
