/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var EOL = require('./eol.js');
var Person = require('./person.js');

/**
 * Dependency structure.
 */

var Dependency = function () {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @constructor
   */
  function Dependency(pkg) {
    _classCallCheck(this, Dependency);

    var dependency = _.pick(pkg, ['name', 'author', 'contributors', 'maintainers', 'version', 'description', 'license', 'licenses', 'repository', 'homepage', 'private']);

    // Parse the author field to get an object.
    if (dependency.author) {
      dependency.author = new Person(dependency.author);
    }

    // Parse the contributor array.
    if (dependency.contributors) {
      // Translate to an array if it is not already.
      if (_.isString(dependency.contributors)) {
        dependency.contributors = [dependency.contributors];
      }

      // Parse each contributor to produce a single object for each person.
      dependency.contributors = _.map(dependency.contributors, function (contributor) {
        return new Person(contributor);
      });
    }

    // The `licenses` field is deprecated but may be used in some packages.
    // Map it to a standard license field.
    if (!dependency.license && dependency.licenses) {
      // Map it to a valid license field.
      // See: https://docs.npmjs.com/files/package.json#license
      dependency.license = '(' + _.chain(dependency.licenses).map(function (license) {
        return license.type || license;
      }).join(' OR ').value() + ')';

      // Remove it.
      delete dependency.licenses;
    }

    _.extend(this, dependency);
  }

  /**
   * Serialize dependency as a string.
   *
   * @param {string} prefix Optional prefix prepended to the output string.
   * @param {suffix} suffix Optional suffix appended to the output string.
   * @param {string} joiner Optional character used to join all the lines.
   * @return {string} The dependency correctly formatted.
   */


  _createClass(Dependency, [{
    key: 'text',
    value: function text() {
      var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var suffix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var joiner = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EOL;

      var lines = [];

      lines.push(prefix + 'Name: ' + this.name + suffix);
      lines.push(prefix + 'Version: ' + this.version + suffix);
      lines.push(prefix + 'License: ' + this.license + suffix);
      lines.push(prefix + 'Private: ' + (this.private || false) + suffix);

      if (this.description) {
        lines.push(prefix + 'Description: ' + (this.description || false) + suffix);
      }

      if (this.repository) {
        lines.push(prefix + 'Repository: ' + this.repository.url + suffix);
      }

      if (this.homepage) {
        lines.push(prefix + 'Homepage: ' + this.homepage + suffix);
      }

      if (this.author) {
        lines.push(prefix + 'Author: ' + this.author.text() + suffix);
      }

      if (this.contributors) {
        lines.push(prefix + 'Contributors:' + suffix);

        var allContributors = _.chain(this.contributors).map(function (contributor) {
          return contributor.text();
        }).map(function (line) {
          return prefix + '  ' + line + suffix;
        }).value();

        lines.push.apply(lines, _toConsumableArray(allContributors));
      }

      return lines.join(joiner);
    }
  }]);

  return Dependency;
}();

module.exports = Dependency;