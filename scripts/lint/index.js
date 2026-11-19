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
const log = require('../log');
const config = require('../config');
const { readCliOptions } = require('../cli');

const ALL_INPUTS = [
  path.join(config.root, '*.js'),
  path.join(config.src, '**', '*.js'),
  path.join(config.test, '**', '*.js'),
  path.join(config.scripts, '**', '*.js'),

  path.join(config.root, '*.ts'),
  path.join(config.src, '**', '*.ts'),
  path.join(config.test, '**', '*.ts'),
  path.join(config.scripts, '**', '*.ts'),
];

/**
 * Lint the whole project.
 *
 * @return {Promise<void>} A promise resolved when lint succeeds, rejected otherwise.
 */
function lint() {
  return runEslint(ALL_INPUTS, false);
}

/**
 * Lint the files given with `--file <path>` (repeatable, may be a directory or a glob),
 * or the whole project if none is given, e.g:
 *
 *   pnpm run lint --file src/person.js --file test/person.spec.js
 *
 * @return {Promise<void>} A promise resolved when lint succeeds, rejected otherwise.
 */
function lintCli() {
  const { files } = readCliOptions();
  return files.length > 0 ? runEslint(files, true) : lint();
}

/**
 * Run ESLint on given inputs, and fail if any warning or error is reported.
 *
 * @param {Array<string>} inputs Files, directories or globs to lint.
 * @param {boolean} errorOnUnmatchedPattern Fail if an input does not match any file.
 * @return {Promise<void>} A promise resolved when lint succeeds, rejected otherwise.
 */
function runEslint(inputs, errorOnUnmatchedPattern) {
  const nodeVersion = process.versions.node;
  const major = Number(nodeVersion.split('.')[0]);
  if (major <= 14) {
    log.debug(`Skipping ESLint because of node version compatibility (currenly in used: ${nodeVersion})`);
    return Promise.resolve();
  }

  log.debug('Linting files: ');

  inputs.forEach((input) => (
    log.debug(`  ${input}`)
  ));

  // eslint-disable-next-line global-require
  const { ESLint } = require('eslint');

  // eslint-disable-next-line global-require
  const fancyLog = require('fancy-log');

  const eslint = new ESLint({
    errorOnUnmatchedPattern,
  });

  const lintFiles = eslint.lintFiles(inputs);
  const loadFormatter = eslint.loadFormatter('stylish');

  return Promise.all([lintFiles, loadFormatter]).then(([results, formatter]) => {
    for (let i = 0; i < results.length; i++) {
      const lintResult = results[i];
      if (lintResult.warningCount > 0 || lintResult.errorCount > 0 || lintResult.fatalErrorCount > 0) {
        fancyLog(formatter.format(results));
        throw new Error('ESLintError');
      }
    }
  });
}

module.exports = {
  lint,
  lintCli,
};
