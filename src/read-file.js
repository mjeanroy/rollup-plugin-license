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

const pathsMatch = (target) => {
  const targetLower = target.toLowerCase();

  return (p) => {
    const pLower = p.toLowerCase();
    return pLower === targetLower ||
      pLower.slice(0, pLower.lastIndexOf('.')) === targetLower;
  };
};
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
  // eslint-disable-next-line new-cap
  const finder = new fdir();

  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const absolutePath = path.join(dir, input);
    const relativeToCwd = path.relative(cwd, absolutePath);

    const findings = finder
      .withRelativePaths()
      .filter(pathsMatch(relativeToCwd))
      .crawl(cwd)
      .sync();

    const firstPath = findings[0];

    if (firstPath) {
      const file = path.join(cwd, firstPath);
      return fs.readFileSync(file, 'utf-8');
    }
  }

  return null;
}
