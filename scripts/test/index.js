/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Mickael Jeanroy
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
const gulp = require('gulp');
const Jasmine = require('jasmine');
const config = require('../config');

/**
 * Run unit tests and exit.
 *
 * @return {WritableStream} The gulp pipe stream.
 */
function test() {
  return createJasmine().execute().then((result) => {
    if (result.overallStatus !== 'passed') {
      throw new Error('Failing tests');
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
  const test = () => (
    createJasmine().execute()
  );

  gulp.watch(path.join(config.src, '**', '*.js'), test);
  gulp.watch(path.join(config.test, '**', '*.js'), test);
  done();
}

/**
 * Initialize Jasmine instance.
 *
 * @returns {Object} The jasmine instance.
 */
function createJasmine() {
  // Override the default loader to be sure it loads file using cache invalidation (useful for hot-reload).
  // jasmine/lib/loader.js is not exported, nor is in the `"exports`" field of `jasmine/package.json`
  // The only way is load it using an absolute path...
  const jasmineDir = path.dirname(require.resolve('jasmine'));
  const Loader = require(path.join(jasmineDir, 'loader.js'));
  const jasmine = new Jasmine({
    loader: new Loader({
      requireShim: requireNoCache,
    }),
  });

  jasmine.exitOnCompletion = false;

  jasmine.loadConfig({
    // Without this config, the default loader will use `import` instead of `require`
    // With import loading, it is impossible to make cache invalidation
    // See: https://github.com/nodejs/modules/issues/307
    jsLoader: 'require',

    spec_dir: config.test,
    spec_files: [
      path.join(config.test, 'base.spec.js'),
      path.join(config.test, '**', '*.spec.js'),
    ],

    env: {
      failSpecWithNoExpectations: false,
      stopSpecOnExpectationFailure: false,
      stopOnSpecFailure: false,
      random: false,
    },
  });

  jasmine.configureDefaultReporter({
    timer: new jasmine.jasmine.Timer(),
    showColors: true,
    verbose: false,
  });

  return jasmine;
}

/**
 * Require given module by removing it from the require cache before.
 * The idea here is to be sure that a given module is always loaded on each require call,
 * instead of being resolved from the cache.
 *
 * @param {string} key Module id.
 * @returns {*} The module.
 */
function requireNoCache(key) {
  delete require.cache[
      require.resolve(key)
  ];

  return require(key);
}

module.exports = {
  tdd,
  test,
};

