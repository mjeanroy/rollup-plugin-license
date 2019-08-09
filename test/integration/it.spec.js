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

'use strict';

const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const join = require('../utils/join.js');
const licensePlugin = require('../../dist/index.js');

describe('Dependency', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should generate bundle with dependency output', (done) => {
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),

        licensePlugin({
          thirdParty: {
            output: thirdPartyOutput,
          },
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(thirdPartyOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain('lodash');
            done();
          });
        });
  });

  it('should generate bundle and export dependencies to given function', (done) => {
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const thirdPartyOutput = jasmine.createSpy('thirdPartyOutput');

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),

        licensePlugin({
          thirdParty: {
            output: thirdPartyOutput,
          },
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          expect(thirdPartyOutput).toHaveBeenCalledWith([
            jasmine.objectContaining({
              name: 'lodash',
            }),
          ]);

          done();
        });
  });

  it('should generate bundle with license header', (done) => {
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const banner = 'test banner';

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin({banner}),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(bundleOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain(join([
              `/**`,
              ` * ${banner}`,
              ` */`,
            ]));

            done();
          });
        });
  });

  it('should generate bundle with license header from given file', (done) => {
    const warn = spyOn(console, 'warn');
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const banner = {
      file: path.join(__dirname, '..', 'fixtures', 'banner.txt'),
      encoding: 'utf-8',
    };

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin({
          banner,
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(bundleOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain(join([
              '/**',
              ' * Test banner.',
              ' *',
              ' * With a second line.',
              ' */',
            ]));

            expect(warn).toHaveBeenCalledWith(
                '[rollup-plugin-license] -- "banner.file" has been deprecated and will be removed in a future version, ' +
                'please use "banner.content.file" instead.'
            );

            done();
          });
        });
  });

  it('should generate bundle with license header from content as a raw string', (done) => {
    const warn = spyOn(console, 'warn');
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const content = 'Banner from inline content';
    const banner = {
      content,
    };

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin({
          banner,
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(bundleOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain(join([
              `/**`,
              ` * ${content}`,
              ` */`,
            ]));

            expect(warn).not.toHaveBeenCalled();

            done();
          });
        });
  });

  it('should generate bundle with license header from content as a string returned from function', (done) => {
    const warn = spyOn(console, 'warn');
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const content = 'Banner from inline content';
    const banner = {
      content() {
        return content;
      },
    };

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin({
          banner,
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(bundleOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain(join([
              `/**`,
              ` * ${content}`,
              ` */`,
            ]));

            expect(warn).not.toHaveBeenCalled();

            done();
          });
        });
  });

  it('should generate bundle with license header from given content file', (done) => {
    const warn = spyOn(console, 'warn');
    const bundleOutput = path.join(tmpDir.name, 'bundle.js');
    const banner = {
      content: {
        file: path.join(__dirname, '..', 'fixtures', 'banner.txt'),
        encoding: 'utf-8',
      },
    };

    const rollupConfig = {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: bundleOutput,
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin({
          banner,
        }),
      ],
    };

    rollup.rollup(rollupConfig)
        .then((bundle) => bundle.write(rollupConfig.output))
        .then(() => {
          fs.readFile(bundleOutput, 'utf8', (err, data) => {
            if (err) {
              done.fail(err);
            }

            expect(data.toString()).toContain(join([
              '/**',
              ' * Test banner.',
              ' *',
              ' * With a second line.',
              ' */',
            ]));

            expect(warn).not.toHaveBeenCalled();

            done();
          });
        });
  });
});
