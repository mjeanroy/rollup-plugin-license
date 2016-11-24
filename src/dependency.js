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
   * @param {string} joiner Optional character used to join all the lines.
   * @param {string} prefix Optional prefix prepended to the output string.
   * @param {suffix} suffix Optional suffix appended to the output string.
   * @return {string} The dependency correctly formatted.
   */
  text(joiner = EOL, prefix = '', suffix = '') {
    return `${prefix}${formatDependency(this, joiner)}${suffix}`;
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
 * @param {string} joiner Optional character used to join all the lines.
 * @param {string} prefix Optional prefix prepended to the output string.
 * @param {suffix} suffix Optional suffix appended to the output string.
 * @return {string} The output string.
 */
function formatDependency(dependency, joiner = EOL, prefix = '', suffix = '') {
  const lines = [];

  lines.push(`${prefix}Name: ${dependency.name}${suffix}`);
  lines.push(`${prefix}Version: ${dependency.version}${suffix}`);
  lines.push(`${prefix}License: ${dependency.license}${suffix}`);
  lines.push(`${prefix}Private: ${dependency.private || false}${suffix}`);

  if (dependency.description) {
    lines.push(`${prefix}Description: ${dependency.description || false}${suffix}`);
  }

  if (dependency.repository) {
    lines.push(`${prefix}Repository: ${dependency.repository.url}${suffix}`);
  }

  if (dependency.homepage) {
    lines.push(`${prefix}Homepage: ${dependency.homepage}${suffix}`);
  }

  if (dependency.author) {
    lines.push(`${prefix}Author: ${dependency.author.text(prefix, suffix)}${suffix}`);
  }

  if (dependency.contributors) {
    lines.push(`${prefix}Contributors:${suffix}`);

    const allContributors = _.chain(dependency.contributors)
      .map((contributor) => contributor.text(prefix, suffix))
      .map((line) => `${prefix}  ${line}${suffix}`)
      .value();

    lines.push(...allContributors);
  }

  return lines.join(joiner);
}

module.exports = Dependency;
