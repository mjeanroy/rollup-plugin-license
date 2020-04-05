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

const fs = require('fs');
const gulp = require('gulp');
const git = require('gulp-git');
const bump = require('gulp-bump');
const log = require('../log');
const config = require('../config');

/**
 * Update version in number in `package.json` file.
 *
 * @param {string} level The semver level identifier (`major`, `minor` or `patch`).
 * @return {WritableStream} The stream pipeline.
 */
function bumpLevel(level) {
  return gulp.src(config.pkg)
      .pipe(bump({type: level}))
      .on('error', (e) => log.error(e))
      .pipe(gulp.dest(config.root));
}

/**
 * Commit the current changes:
 * - The `dist` directory containing final bundle.
 * - The `package.json` containing the new version number.
 *
 * @return {WritableStream} The stream pipeline.
 */
function performRelease() {
  return gulp.src([config.pkg, config.dist])
      .pipe(git.add({args: '-f'}))
      .pipe(git.commit('release: release version'));
}

/**
 * Prepare the next release cycle:
 * - Remove the `dist` directory containing bundle tagged on given version.
 * - Create a new commit preparing the next release.
 *
 * @return {WritableStream} The stream pipeline.
 */
function prepareNextRelease() {
  return gulp.src(config.dist)
      .pipe(git.rm({args: '-r'}))
      .pipe(git.commit('release: prepare next release'));
}

/**
 * Tag current version: the tag name will be extracted from
 * the `version` field in the `package.json` file.
 *
 * @param {function} done The `done` callback.
 * @return {void}
 */
function tagRelease(done) {
  fs.readFile(config.pkg, 'utf-8', (err, content) => {
    if (err) {
      done(err);
      return;
    }

    const pkg = JSON.parse(content);
    const version = pkg.version;
    git.tag(`v${version}`, `release: tag version ${version}`, done);
  });
}

/**
 * Create the release task.
 *
 * @param {string} level The version level upgrade.
 * @return {function} The release task function.
 */
function createReleaseTask(level) {
  /**
   * Prepare the release: upgrade version number according to
   * the specified level.
   *
 * @return {WritableStream} The stream pipeline.
   */
  function prepareRelease() {
    return bumpLevel(level);
  }

  return gulp.series(
      prepareRelease,
      performRelease,
      tagRelease,
      prepareNextRelease
  );
}

module.exports = {
  patch: createReleaseTask('patch'),
  minor: createReleaseTask('minor'),
  major: createReleaseTask('major'),
};
