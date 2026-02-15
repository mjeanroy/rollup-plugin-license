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
const gulp = require('gulp');
const Jasmine = require('jasmine');
const config = require('../config');

function loadJasmine() {
  const runner = new Jasmine();

  runner.loadConfig({
    failSpecWithNoExpectations: false,
    jsLoader: 'require',
    spec_dir: path.basename(config.test),
    spec_files: [
      '**/*-spec.js',
      '**/*.spec.js',
    ],
  });

  runner.exitOnCompletion = false;
  return runner.execute.bind(runner);
}

function deleteRequireCache() {
  Object.keys(require.cache).forEach((id) => {
    delete require.cache[id];
  });
}

/**
 * Run unit test suite and exit.
 *
 * @return {Promise} A promise resolved when the test suite succeeds, rejected otherwise.
 */
function test() {
  return loadJasmine()().then((result) => {
    if (result.overallStatus !== 'passed') {
      throw new Error('JasmineError');
    }
  });
}

/**
 * Watch files and run unit test suite every time a change is detected.
 *
 * @param {function} done The `done` function.
 * @return {void}
 */
function tdd(done) {
  const inputs = [
    path.join(config.src, '**', '*.js'),
    path.join(config.test, '**', '*.js'),
  ];

  gulp.watch(inputs, () => {
    // Usually, the require.cache is not a problem, because the process should exit after load.
    // But in tdd mode, the process never exit.
    // So, when it runs a second time, jasmine does not detect anything because the cache is
    // already bloated, and jasmine does not detect any changes, or load outdated files.
    deleteRequireCache();
    return loadJasmine()();
  });

  done();
}

module.exports = {
  tdd,
  test,
};
