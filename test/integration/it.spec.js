/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2022 Mickael Jeanroy
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

import path from 'path';
import tmp from 'tmp';
import fs from 'fs';
import _ from 'lodash';
import * as rollup from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import licensePlugin from '../../src/index.js';
import {join} from '../utils/join.js';

describe('rollup-plugin-license', () => {
  let warn;
  let tmpDir;

  beforeEach(() => {
    warn = spyOn(console, 'warn');
  });

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should generate bundle with dependency output', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(thirdPartyOutput, done, (data) => {
        expect(data.toString()).toContain('lodash');
      });
    });
  });

  it('should generate bundle with dependency output as an object', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: {
          file: thirdPartyOutput,
        },
      },
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(thirdPartyOutput, done, (data) => {
        expect(data.toString()).toContain('lodash');
      });
    });
  });

  it('should generate bundle with dependency output as a JSON file', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.json');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: {
          file: thirdPartyOutput,
          template(dependencies) {
            return JSON.stringify(dependencies);
          },
        },
      },
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(thirdPartyOutput, done, (data) => {
        const content = data.toString();
        const json = JSON.parse(content);
        expect(json).toBeDefined();
        expect(json.length).toBe(1);
        expect(json[0].name).toBe('lodash');
      });
    });
  });

  it('should generate bundle with dependency output as a JSON & a text file', (done) => {
    const jsonOutput = path.join(tmpDir.name, 'dependencies.json');
    const txtOutput = path.join(tmpDir.name, 'dependencies.json');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: [
          {
            file: txtOutput,
          },
          {
            file: jsonOutput,
            template(dependencies) {
              return JSON.stringify(dependencies);
            },
          },
        ],
      },
    });

    writeBundle(rollupConfig).then(() => {
      const onDone = _.after(2, () => done());
      onDone.fail = (err) => done.fail(err);

      verifyFile(jsonOutput, onDone, (data) => {
        const content = data.toString();
        const json = JSON.parse(content);
        expect(json).toBeDefined();
        expect(json.length).toBe(1);
        expect(json[0].name).toBe('lodash');
      });

      verifyFile(txtOutput, onDone, (data) => {
        const content = data.toString();
        expect(content).toBeDefined();
        expect(content).toContain('lodash');
      });
    });
  });

  it('should generate bundle and export dependencies to given function', (done) => {
    const thirdPartyOutput = jasmine.createSpy('thirdPartyOutput');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    writeBundle(rollupConfig).then(() => {
      expect(thirdPartyOutput).toHaveBeenCalledWith([
        jasmine.objectContaining({
          name: 'lodash',
        }),
      ]);

      done();
    });
  });

  it('should generate bundle with license header', (done) => {
    const banner = 'test banner';
    const rollupConfig = createRollupConfig({
      banner,
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(rollupConfig.output.file, done, (data) => {
        expect(data.toString()).toContain(join([
          `/**`,
          ` * ${banner}`,
          ` */`,
        ]));
      });
    });
  });

  it('should generate bundle with license header from content as a raw string', (done) => {
    const content = 'Banner from inline content';
    const banner = {content};
    const rollupConfig = createRollupConfig({
      banner,
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(rollupConfig.output.file, done, (data) => {
        expect(warn).not.toHaveBeenCalled();
        expect(data.toString()).toContain(join([
          `/**`,
          ` * ${content}`,
          ` */`,
        ]));
      });
    });
  });

  it('should generate bundle with license header from content as a string returned from function', (done) => {
    const content = 'Banner from inline content';
    const banner = {
      content() {
        return content;
      },
    };

    const rollupConfig = createRollupConfig({
      banner,
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(rollupConfig.output.file, done, (data) => {
        expect(warn).not.toHaveBeenCalled();
        expect(data.toString()).toContain(join([
          `/**`,
          ` * ${content}`,
          ` */`,
        ]));
      });
    });
  });

  it('should generate bundle with license header from given content file', (done) => {
    const banner = {
      content: {
        file: path.join(__dirname, '..', 'fixtures', 'banner.txt'),
        encoding: 'utf-8',
      },
    };

    const rollupConfig = createRollupConfig({
      banner,
    });

    writeBundle(rollupConfig).then(() => {
      verifyFile(rollupConfig.output.file, done, (data) => {
        expect(warn).not.toHaveBeenCalled();
        expect(data.toString()).toContain(join([
          '/**',
          ' * Test banner.',
          ' *',
          ' * With a second line.',
          ' */',
        ]));
      });
    });
  });

  function createRollupConfig(licensePluginOptions) {
    return {
      input: path.join(__dirname, 'bundle.js'),

      output: {
        file: path.join(tmpDir.name, 'bundle.js'),
        format: 'es',
      },

      plugins: [
        nodeResolve(),
        commonjs(),
        licensePlugin(
            licensePluginOptions
        ),
      ],
    };
  }

  function writeBundle(rollupConfig) {
    return rollup.rollup(rollupConfig).then((bundle) => bundle.write(rollupConfig.output));
  }

  function verifyFile(file, done, test) {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        done.fail(err);
      }

      test(data);
      done();
    });
  }
});
