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

const path = require('node:path');
const { parseArgs } = require('node:util');
const config = require('../config');

/**
 * Read optional command line flags shared by the gulp tasks:
 * - `--file <path>` (repeatable): restrict the task to the given files (or directories / globs).
 * - `--filter <regex>`: restrict the test run to the specs whose full name matches.
 *
 * Paths may be absolute or relative to the project root; they are returned relative to the
 * project root, using forward slashes (as expected by both Jasmine and ESLint).
 *
 * @return {{files: Array<string>, filter: (string|undefined)}} The parsed options.
 */
function readCliOptions() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    strict: false,
    options: {
      file: { type: 'string', multiple: true },
      filter: { type: 'string' },
    },
  });

  const files = (values.file || []).map((file) => (
    path.relative(config.root, path.resolve(config.root, file)).split(path.sep).join('/')
  ));

  return {
    files,
    filter: values.filter,
  };
}

module.exports = {
  readCliOptions,
};
