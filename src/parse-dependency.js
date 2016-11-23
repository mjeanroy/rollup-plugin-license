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
const parseAuthor = require('parse-author');

/**
 * Parse package description and generate an uniform dependency object:
 * - Parse author field if needed.
 * - Parse contributors array if needed.
 * - Parse deprecated licenses field if needed.
 *
 * @param {Object} pkg Package description.
 * @return {Object} Dependency description.
 */
module.exports = function parseDependency(pkg) {
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
  if (_.isString(dependency.author)) {
    dependency.author = parseAuthor(dependency.author);
  }

  // Parse the contributor array.
  if (dependency.contributors) {
    // Translate to an array if it is not already.
    if (_.isString(dependency.contributors)) {
      dependency.contributors = [dependency.contributors];
    }

    // Parse each contributor to produce a single object for each person.
    dependency.contributors = _.map(dependency.contributors, (contributor) => {
      return _.isString(contributor) ? parseAuthor(contributor) : contributor;
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
};
