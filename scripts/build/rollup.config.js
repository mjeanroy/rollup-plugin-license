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

// Required with prettier >= 2.3.0 with node 11
require('globalthis').shim();

const path = require('path');
const fs = require('fs');
const commenting = require('commenting');
const babel = require('@rollup/plugin-babel').default;
const stripBanner = require('rollup-plugin-strip-banner');
const prettier = require('rollup-plugin-prettier');

const config = require('../config');
const pkg = require('../../package.json');
const license = fs.readFileSync(path.join(config.root, 'LICENSE'), 'utf-8');

module.exports = {
  input: path.join(config.src, 'index.js'),

  output: [
    {
      format: 'cjs',
      file: path.join(config.dist, 'index.js'),
      exports: 'default',
      banner: commenting(license, {
        extension: '.js',
      }),
    },
  ],

  plugins: [
    stripBanner(),

    babel({
      envName: 'rollup',
      babelHelpers: 'bundled',
    }),

    prettier({
      parser: 'babel',
    }),
  ],

  external: [
    'fs',
    'path',

    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
};
