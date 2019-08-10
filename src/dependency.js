/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2018 Mickael Jeanroy
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

const _ = require('lodash');
const EOL = require('./eol.js');
const Person = require('./person.js');

/**
 * Dependency structure.
 */
module.exports = class Dependency {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @constructor
   */
  constructor(pkg) {
    this.name = pkg.name || null;
    this.maintainers = pkg.maintainers || [];
    this.version = pkg.version || null;
    this.description = pkg.description || null;
    this.repository = pkg.repository || null;
    this.homepage = pkg.homepage || null;
    this.private = pkg.private || false;
    this.license = pkg.license || null;
    this.licenseText = pkg.licenseText || null;

    // Parse the author field to get an object.
    this.author = pkg.author ? new Person(pkg.author) : null;

    // Parse the contributor array.
    this.contributors = _.map(_.castArray(pkg.contributors || []), (contributor) => (
      new Person(contributor)
    ));

    // The `licenses` field is deprecated but may be used in some packages.
    // Map it to a standard license field.
    if (!this.license && pkg.licenses) {
      // Map it to a valid license field.
      // See: https://docs.npmjs.com/files/package.json#license
      this.license = `(${_.chain(pkg.licenses)
          .map((license) => license.type || license)
          .join(' OR ')
          .value()})`;
    }
  }

  /**
   * Serialize dependency as a string.
   *
   * @param {string} prefix Optional prefix prepended to the output string.
   * @param {suffix} suffix Optional suffix appended to the output string.
   * @param {string} joiner Optional character used to join all the lines.
   * @return {string} The dependency correctly formatted.
   */
  text(prefix = '', suffix = '', joiner = EOL) {
    const lines = [];

    lines.push(`${prefix}Name: ${this.name}${suffix}`);
    lines.push(`${prefix}Version: ${this.version}${suffix}`);
    lines.push(`${prefix}License: ${this.license}${suffix}`);
    lines.push(`${prefix}Private: ${this.private}${suffix}`);

    if (this.description) {
      lines.push(`${prefix}Description: ${this.description || false}${suffix}`);
    }

    if (this.repository) {
      lines.push(`${prefix}Repository: ${this.repository.url}${suffix}`);
    }

    if (this.homepage) {
      lines.push(`${prefix}Homepage: ${this.homepage}${suffix}`);
    }

    if (this.author) {
      lines.push(`${prefix}Author: ${this.author.text()}${suffix}`);
    }

    if (!_.isEmpty(this.contributors)) {
      lines.push(`${prefix}Contributors:${suffix}`);

      const allContributors = _.chain(this.contributors)
          .map((contributor) => contributor.text())
          .map((line) => `${prefix}  ${line}${suffix}`)
          .value();

      lines.push(...allContributors);
    }

    return lines.join(joiner);
  }
};
