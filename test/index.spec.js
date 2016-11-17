/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
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
const moment = require('moment');
const plugin = require('../dist/index.js');

describe('rollup-plugin-license', () => {
  it('should prepend banner to bundle', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toEqual(
        `/**\n` +
        ` * Test banner.\n` +
        ` *\n` +
        ` * With a second line.\n` +
        ` */\n` +
        `\n` +
        `${code}`
      );

      done();
    });
  });

  it('should prepend default LICENSE file banner to bundle', (done) => {
    const instance = plugin();

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.code).toContain('The MIT License (MIT)');
      done();
    });
  });

  it('should not fail if banner file does not exist', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'dummy'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.code).toBe(code);
      done();
    });
  });

  it('should prepend banner and create block comment', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'banner.txt'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toEqual(
        `/**\n` +
        ` * Test banner.\n` +
        ` *\n` +
        ` * With a second line.\n` +
        ` */\n` +
        `\n` +
        `${code}`
      );

      done();
    });
  });

  it('should prepend banner to bundle and create sourceMap', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.map).toBeDefined();
      done();
    });
  });

  it('should prepend banner to bundle and do not create sourceMap', (done) => {
    const instance = plugin({
      sourceMap: false,
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.map).not.toBeDefined();
      done();
    });
  });

  it('should prepend banner and replace moment variables', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'banner-with-moment.js'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toEqual(
        `/**\n` +
        ` * Date: ${moment().format('YYYY-MM-DD')}\n` +
        ` */\n` +
        `\n` +
        `var foo = 0;`
      );

      done();
    });
  });

  it('should prepend banner and replace package variables', (done) => {
    const instance = plugin({
      file: path.join(__dirname, 'fixtures', 'banner-with-pkg.js'),
    });

    const code = 'var foo = 0;';

    const promise = instance.transformBundle(code);

    promise.then((result) => {
      expect(result).toBeDefined();
      expect(result.code).toEqual(
        `/**\n` +
        ` * Name: rollup-plugin-license\n` +
        ` */\n` +
        `\n` +
        `var foo = 0;`
      );

      done();
    });
  });
});
