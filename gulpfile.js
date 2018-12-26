/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2018 Mickael Jeanroy
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

const gulp = require('gulp');
const clean = require('./scripts/clean');
const lint = require('./scripts/lint');
const build = require('./scripts/build');
const test = require('./scripts/test');
const release = require('./scripts/release');
const changelog = require('./scripts/changelog');

const prebuild = gulp.series(clean, lint);
const pretest = gulp.series(prebuild, build);
const prerelease = gulp.series(pretest, test);

module.exports = {
  'clean': clean,
  'lint': lint,
  'build': gulp.series(prebuild, build),
  'test': gulp.series(pretest, test),
  'changelog': changelog,
  'release:patch': gulp.series(prerelease, release.patch),
  'release:minor': gulp.series(prerelease, release.minor),
  'release:major': gulp.series(prerelease, release.major),
};
