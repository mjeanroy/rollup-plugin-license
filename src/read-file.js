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
import glob from 'glob';

/**
 * Find file and returns its content if file exists.
 *
 * @param {string} dir File directory.
 * @param {string} cwd Working directory.
 * @param {string|Array<string>} names Potential filenames.
 * @returns {string|null} File content, or `null` if file does not exist.
 */
export function readFile(dir, cwd, names) {
  const inputs = _.castArray(names);

  for (let i = 0; i < inputs.length; ++i) {
    const input = generatePattern(inputs[i]);
    const absolutePath = path.join(dir, input);
    const relativeToCwd = path.relative(cwd, absolutePath);

    const findings = glob.sync(relativeToCwd, {cwd});
    for (let j = 0; j < findings.length; ++j) {
      const file = path.join(cwd, findings[j]);
      if (isFile(file)) {
        return fs.readFileSync(file, 'utf-8');
      }
    }
  }

  return null;
}

/**
 * Check that given file exists, and is a real file.
 *
 * @param {string} file File path.
 * @returns {boolean} `true` if `file` is a file, `false` otherwise.
 */
function isFile(file) {
  return !!fs.existsSync(file) && !!fs.lstatSync(file).isFile();
}

/**
 * Generate glob pattern for given input.
 *
 * @param {string} input Given input.
 * @returns {string} Glob pattern.
 */
function generatePattern(input) {
  let pattern = '';

  for (let i = 0; i < input.length; ++i) {
    const c = input[i];
    const up = c.toUpperCase();
    const low = c.toLowerCase();
    pattern += up !== low ? `[${low}${up}]` : low;
  }

  return pattern + '*';
}
