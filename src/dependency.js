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

const _ = require('lodash');
const EOL = require('./eol.js');
const Person = require('./person.js');

/**
 * Dependency structure.
 */
class Dependency {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @constructor
   */
  constructor(pkg) {
    _.extend(this, parseDependency(pkg));
  }

  /**
   * Serialize dependency as a string.
   *
   * @return {string} The dependency correctly formatted.
   */
  toString() {
    return formatDependency(this);
  }
}

/**
 * Parse package description and generate an uniform dependency object:
 * - Parse author field if needed.
 * - Parse contributors array if needed.
 * - Parse deprecated licenses field if needed.
 *
 * @param {Object} pkg Package description.
 * @return {Object} Dependency description.
 */
function parseDependency(pkg) {
  const dependency = _.pick(pkg, [
    'name',
    'author',
    'contributors',
    'maintainers',
    'version',
    'description',
    'license',
    'licenses',
    'repository',
    'homepage',
    'private',
  ]);

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
    dependency.contributors = _.map(dependency.contributors, (contributor) => {
      return new Person(contributor);
    });
  }

  // The `licenses` field is deprecated but may be used in some packages.
  // Map it to a standard license field.
  if (!dependency.license && dependency.licenses) {
    // Map it to a valid license field.
    // See: https://docs.npmjs.com/files/package.json#license
    dependency.license = `(${_.chain(dependency.licenses)
      .map((license) => license.type || license)
      .join(' OR ')
      .value()})`;

    // Remove it.
    delete dependency.licenses;
  }

  return dependency;
}

/**
 * Format dependency data to a single string.
 *
 * @param {Object} dependency Dependency to format.
 * @return {string} The output string.
 */
function formatDependency(dependency) {
  const lines = [];

  lines.push(`Name: ${dependency.name}`);
  lines.push(`Version: ${dependency.version}`);
  lines.push(`License: ${dependency.license}`);
  lines.push(`Private: ${dependency.private || false}`);

  if (dependency.description) {
    lines.push(`Description: ${dependency.description || false}`);
  }

  if (dependency.repository) {
    lines.push(`Repository: ${dependency.repository.url}`);
  }

  if (dependency.homepage) {
    lines.push(`Homepage: ${dependency.homepage}`);
  }

  if (dependency.author) {
    lines.push(`Author: ${dependency.author.toString()}`);
  }

  if (dependency.contributors) {
    lines.push(`Contributors:${EOL}${_.chain(dependency.contributors)
      .map((contributor) => contributor.toString())
      .map((line) => `  ${line}`)
      .value()
      .join(EOL)}`);
  }

  return lines.join(EOL);
}

module.exports = Dependency;
