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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

/**
 * Person, defined by:
 * - A name.
 * - An email (optional).
 * - An URL (optional).
 */

var Person = function () {
  /**
   * Create the person.
   *
   * If parameter is a string, it will be automatically parsed according to
   * this format: NAME <EMAIL> (URL) (where email and url are optional).
   *
   * @param {string|object} person The person identity.
   * @constructor
   */
  function Person(person) {
    _classCallCheck(this, Person);

    if (_.isString(person)) {
      var o = {};

      var current = 'name';

      for (var i = 0, size = person.length; i < size; ++i) {
        var character = person.charAt(i);
        if (character === '<') {
          current = 'email';
        } else if (character === '(') {
          current = 'url';
        } else if (character !== ')' && character !== '>') {
          o[current] = (o[current] || '') + character;
        }
      }

      _.forEach(['name', 'email', 'url'], function (prop) {
        if (_.has(o, prop)) {
          o[prop] = _.trim(o[prop]);
        }
      });

      person = o;
    }

    _.extend(this, person);
  }

  /**
   * Serialize the person to a string with the following format:
   *   NAME <EMAIL> (URL)
   *
   * @param {string} prefix Optional prefix prepended to the output string.
   * @param {string} suffix Optional suffix appended to the output string.
   * @return {string} The person as a string.
   */


  _createClass(Person, [{
    key: 'text',
    value: function text() {
      var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var suffix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var text = '' + this.name;

      if (this.email) {
        text += ' <' + this.email + '>';
      }

      if (this.url) {
        text += ' (' + this.url + ')';
      }

      return '' + prefix + text + suffix;
    }
  }]);

  return Person;
}();

module.exports = Person;