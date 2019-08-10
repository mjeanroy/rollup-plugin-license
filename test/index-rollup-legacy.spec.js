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

const path = require('path');
const fs = require('fs');
const tmp = require('tmp');
const join = require('./utils/join.js');
const plugin = require('../dist/index-rollup-legacy.js');

describe('rollup-plugin-license [rollup legacy]', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should return new plugin instance', () => {
    const instance = plugin();
    expect(instance.name).toBe('rollup-plugin-license');
  });

  it('should enable sourceMap if `options.sourceMap` (camelcase) is true', () => {
    const instance = plugin();
    const sourceMap = true;
    instance.options({sourceMap});

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should enable sourceMap if `options.sourcemap` (lowercase) is true', () => {
    const instance = plugin();
    const sourcemap = true;
    instance.options({sourcemap});

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should not enable sourceMap if `options.sourceMap` (camelcase) is false', () => {
    const instance = plugin();
    const sourceMap = false;
    instance.options({sourceMap});

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });

  it('should not enable sourceMap if options.sourcemap (lowercase) is false', () => {
    const instance = plugin();
    const sourcemap = false;
    instance.options({sourcemap});

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });

  it('should not try to disable sourceMap if `sourceMap` (camelcase) is set in plugin options', () => {
    const instance = plugin({
      sourcemap: true,
    });

    instance.options({
      sourceMap: false,
    });

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should not try to disable sourceMap if sourcemap (lowercase) is set in plugin options', () => {
    const instance = plugin({
      sourcemap: true,
    });

    instance.options({
      sourcemap: false,
    });

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should enable sourceMap by default', () => {
    const instance = plugin();

    instance.options({});

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should disable sourcemap (lowercase) in plugin options', () => {
    const instance = plugin({
      sourcemap: false,
    });

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });

  it('should disable sourceMap (camelcase) in plugin options', () => {
    const warn = spyOn(console, 'warn');
    const instance = plugin({
      sourceMap: false,
    });

    const code = 'var foo = 0;';
    const outputOptions = {};
    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "sourceMap" has been deprecated and will be removed in a future version, ' +
        'please use "sourcemap" instead.'
    );
  });

  it('should scan dependency on load', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const instance = plugin({
      thirdParty: {
        includePrivate: true,
        output: thirdPartyOutput,
      },
    });

    const id = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');

    instance.load(id);
    instance.ongenerate();

    fs.readFile(thirdPartyOutput, 'utf8', (err, data) => {
      if (err) {
        done.fail(err);
      }

      const content = data.toString();
      expect(content).toBeDefined();
      expect(content).toContain('fake-package');
      done();
    });
  });

  it('should prepend banner when bundle is transformed', () => {
    const banner = 'test banner';
    const instance = plugin({banner});

    const code = 'var foo = 0;';
    const outputOptions = {};

    const result = instance.transformBundle(code, outputOptions);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.code).toBe(join([
      '/**',
      ' * test banner',
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should create third-parties file when bundle is generated', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const instance = plugin({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    instance.ongenerate();

    fs.readFile(thirdPartyOutput, 'utf8', (err, data) => {
      if (err) {
        done.fail(err);
      }

      const content = data.toString();
      expect(content).toBeDefined();
      expect(content.length).not.toBe(0);
      done();
    });
  });
});
