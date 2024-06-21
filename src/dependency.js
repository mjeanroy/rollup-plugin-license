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
import {EOL} from './eol.js';
import {Person} from './person.js';

/**
 * Dependency structure.
 */
export class Dependency {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @param {boolean} self If the package is the "self" package.
   * @constructor
   */
  constructor(pkg, self) {
    this.self = self || false;

    this.name = pkg.name || null;
    this.maintainers = pkg.maintainers || [];
    this.version = pkg.version || null;
    this.description = pkg.description || null;
    this.repository = pkg.repository || null;
    this.homepage = pkg.homepage || null;
    this.private = pkg.private || false;
    this.license = pkg.license || null;
    this.licenseText = pkg.licenseText || null;
    this.noticeText = pkg.noticeText || null;

    // Parse the author field to get an object.
    this.author = pkg.author ? new Person(pkg.author) : null;

    // Parse the contributor array.
    this.contributors = _.castArray(pkg.contributors || []).map((contributor) => (
      new Person(contributor)
    ));

    // The `licenses` field is deprecated but may be used in some packages.
    // Map it to a standard license field.
    if (!this.license && pkg.licenses) {
      // Map it to a valid license field.
      // See: https://docs.npmjs.com/files/package.json#license
      this.license = `(${pkg.licenses.map((license) => license.type || license).join(' OR ')})`;
    }
  }

  /**
   * Serialize dependency as a string.
   *
   * @return {string} The dependency correctly formatted.
   */
  text() {
    const lines = [];

    lines.push(`Name: ${this.name}`);
    lines.push(`Version: ${this.version}`);
    lines.push(`License: ${this.license}`);
    lines.push(`Private: ${this.private}`);

    if (this.description) {
      lines.push(`Description: ${this.description || false}`);
    }

    if (this.repository) {
      lines.push(`Repository: ${this.repository.url}`);
    }

    if (this.homepage) {
      lines.push(`Homepage: ${this.homepage}`);
    }

    if (this.author) {
      lines.push(`Author: ${this.author.text()}`);
    }

    if (this.contributors.length > 0) {
      lines.push(`Contributors:`);
      lines.push(
          ...this.contributors.map((contributor) => `  ${contributor.text()}`),
      );
    }

    if (this.licenseText) {
      lines.push('License Copyright:');
      lines.push('===');
      lines.push('');
      lines.push(this.licenseText);
      lines.push('');
    }

    if (this.noticeText) {
      lines.push('Notice:');
      lines.push('===');
      lines.push('');
      lines.push(this.noticeText);
      lines.push('');
    }

    return lines.join(EOL).trim();
  }
}
