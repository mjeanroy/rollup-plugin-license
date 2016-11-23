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
const formatAuthor = require('./format-author.js');
const EOL = require('./eol.js');

/**
 * Format dependency data to a single string.
 *
 * @param {Object} dependency Dependency to format.
 * @return {string} The output string.
 */
module.exports = function formatDependency(dependency) {
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
    lines.push(`Author: ${formatAuthor(dependency.author)}`);
  }

  if (dependency.contributors) {
    lines.push(`Contributors:${EOL}${_.chain(dependency.contributors)
      .map(formatAuthor)
      .map((line) => `  ${line}`)
      .value()
      .join(EOL)}`);
  }

  return lines.join(EOL);
};
