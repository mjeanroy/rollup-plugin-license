/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2023 Mickael Jeanroy
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

const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const gulp = require('gulp');
const log = require('../log');
const config = require('../config');

/**
 * Run command with a pre-configured `cwd` (current working directory)
 * and an encoding set to `utf-8'.
 *
 * @param {string} cmd Command to run.
 * @return {Promise<void>} A promise resolved when the command has been executed.
 */
function run(cmd) {
  log.debug(`  ${cmd}...`);
  return exec(cmd, {
    cwd: config.root,
    encoding: 'utf-8',
  });
}

/**
 * Update version in number in `package.json` file.
 *
 * @param {'major'|'minor'|'patch'} type The semver level identifier (`major`, `minor` or `patch`).
 * @return {Promise<void>} A promise resolved when the version bumped has been executed.
 */
function bumpVersion(type) {
  return run(`git add -f "${config.dist}"`).then(() => (
    run(`npm version "${type}" -f -m 'release: release version'`)
  ));
}

/**
 * Prepare the next release cycle:
 * - Remove the `dist` directory containing bundle tagged on given version.
 * - Create a new commit preparing the next release.
 *
 * @return {Promise<void>} A promise resolved when the task has been executed.
 */
function prepareNextRelease() {
  return run(`git rm -r "${config.dist}"`).then(() => (
    run(`git commit -m 'release: prepare next release'`)
  ));
}

/**
 * Create the release task.
 *
 * @param {'major'|'minor'|'patch'} level The version level upgrade.
 * @return {function} The release task function.
 */
function createReleaseTask(level) {
  /**
   * Prepare the release: upgrade version number according to
   * the specified level.
   *
   * @return {Promise<void>} A promise resolved when the release is done.
   */
  function doRelease() {
    return bumpVersion(level);
  }

  return gulp.series(
    doRelease,
    prepareNextRelease
  );
}

module.exports = {
  patch: createReleaseTask('patch'),
  minor: createReleaseTask('minor'),
  major: createReleaseTask('major'),
};
