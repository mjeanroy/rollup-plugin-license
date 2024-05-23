/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2024 Mickael Jeanroy
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

import _ from 'lodash';

/**
 * Person, defined by:
 * - A name.
 * - An email (optional).
 * - An URL (optional).
 */
export class Person {
  /**
   * Create the person.
   *
   * If parameter is a string, it will be automatically parsed according to
   * this format: NAME <EMAIL> (URL) (where email and url are optional).
   *
   * @param {string|object} person The person identity.
   * @constructor
   */
  constructor(person) {
    let result = person;

    if (_.isString(result)) {
      const o = {};

      let current = 'name';

      for (let i = 0, size = result.length; i < size; ++i) {
        const character = result.charAt(i);
        if (character === '<') {
          current = 'email';
        } else if (character === '(') {
          current = 'url';
        } else if (character !== ')' && character !== '>') {
          o[current] = (o[current] || '') + character;
        }
      }

      ['name', 'email', 'url'].forEach((prop) => {
        if (_.has(o, prop)) {
          o[prop] = _.trim(o[prop]);
        }
      });

      result = o;
    }

    this.name = result.name || null;
    this.email = result.email || null;
    this.url = result.url || null;
  }

  /**
   * Serialize the person to a string with the following format:
   *   NAME <EMAIL> (URL)
   *
   * @return {string} The person as a string.
   */
  text() {
    let text = `${this.name}`;

    if (this.email) {
      text += ` <${this.email}>`;
    }

    if (this.url) {
      text += ` (${this.url})`;
    }

    return text;
  }
}
