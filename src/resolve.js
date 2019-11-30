/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Mickael Jeanroy
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

const path = require('path');
const fs = require('fs');

/**
 * Resolve path using node resolution algorithm.
 *
 * @param {string} id Module id.
 * @return {string} The absolute path.
 */
function nodeResolve(id) {
  try {
    return require.resolve(id);
  } catch (e) {
    return null;
  }
}

/**
 * Resolve path of given module id relatively to given
 * importer.
 *
 * @param {string} id Module id.
 * @param {string} relativeTo The importer.
 * @return {string} The absolute path.
 */
function pathResolve(id, relativeTo) {
  const dir = path.dirname(relativeTo);
  const fullPath = path.resolve(dir, id);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fullPath;
}

module.exports = function resolve(id, importer) {
  // This is an absolute path: returns it.
  if (path.isAbsolute(id)) {
    return id;
  }

  // Resolve relative path.
  if (id.charAt(0) === '.') {
    return pathResolve(id, importer);
  }

  // We have a module id, we have no choice but using node resolution.
  return nodeResolve(id);
};
