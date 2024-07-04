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

import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { fdir } from 'fdir';

/**
 * Find file and returns its content if file exists.
 *
 * @param {string} dir File directory.
 * @param {string|Array<string>} names Potential filenames.
 * @returns {string|null} File content, or `null` if file does not exist.
 */
export function readFile(dir, names) {
  const inputs = _.castArray(names);
  // eslint-disable-next-line new-cap
  const finder = new fdir();

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const absolutePath = path.join(dir, input);
    const relativeToDir = path.relative(dir, absolutePath);

    const findings = finder
      .withRelativePaths()
      .withSymlinks()
      .withMaxDepth(input.split(path.sep).length)
      .filter(pathsMatch(relativeToDir))
      .crawl(dir)
      .sync();

    const firstPath = findings[0];
    if (firstPath) {
      const file = path.join(dir, firstPath);
      return fs.readFileSync(file, 'utf-8');
    }
  }

  return null;
}

/**
 * Returns a predicate function that returns `true` if the given path matches the target path.
 *
 * @param {string} target Target path.
 * @returns {function(*): boolean} Predicate function.
 */
function pathsMatch(target) {
  const targetRegExp = generatePattern(target);
  return (p) => (
    targetRegExp.test(p)
  );
}

/**
 * Generate a pattern where all regexp special characters are escaped.
 * @param {string} input Input.
 * @returns {string} Escaped input.
 */
function escapeRegExp(input) {
  return input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const FILE_FORBIDDEN_CHARACTERS = ['#', '%', '&', '*', ':', '<', '>', '?', '/', path.sep, '{', '|', '}'].map((c) => (
  escapeRegExp(c)
));

const FILE_SUFFIX_PTN = `[^${FILE_FORBIDDEN_CHARACTERS.join('')}]`;

/**
 * Generate filename pattern for the given input: the generated regexp will match any file
 * starting with `input` (case insensitively).
 *
 * @param {string} input Input.
 * @returns {RegExp} Generated pattern.
 */
function generatePattern(input) {
  return new RegExp(`^${input}(${FILE_SUFFIX_PTN})*$`, 'i');
}
