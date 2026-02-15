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

import path from 'path';
import tmp from 'tmp';
import fs from 'fs/promises';
import * as rollup from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import licensePlugin from '../../src/index';
import { join } from '../utils/join';

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

  it('should generate bundle with dependency output', async () => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    await writeBundle(rollupConfig);
    await verifyFile(thirdPartyOutput, (data) => {
      expect(data).toContain('lodash');
      expect(data).not.toContain('rollup-plugin-license');
    });
  });

  it('should generate bundle with dependency output as an object', async () => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: {
          file: thirdPartyOutput,
        },
      },
    });

    await writeBundle(rollupConfig);
    await verifyFile(thirdPartyOutput, (data) => {
      expect(data).toContain('lodash');
    });
  });

  it('should generate bundle with dependency output as a JSON file', async () => {
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

    await writeBundle(rollupConfig);
    await verifyFile(thirdPartyOutput, (data) => {
      const json = JSON.parse(data);
      expect(json).toBeDefined();
      expect(json.length).toBe(1);
      expect(json[0].name).toBe('lodash');
    });
  });

  it('should generate bundle with dependency output as a JSON & a text file', async () => {
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

    await writeBundle(rollupConfig);

    await verifyFile(jsonOutput, (data) => {
      const json = JSON.parse(data);
      expect(json).toBeDefined();
      expect(json.length).toBe(1);
      expect(json[0].name).toBe('lodash');
    });

    await verifyFile(txtOutput, (data) => {
      expect(data).toBeDefined();
      expect(data).toContain('lodash');
    });
  });

  it('should generate bundle and export dependencies to given function', async () => {
    const thirdPartyOutput = jasmine.createSpy('thirdPartyOutput');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    await writeBundle(rollupConfig);

    expect(thirdPartyOutput).toHaveBeenCalledWith([
      jasmine.objectContaining({
        name: 'lodash',
      }),
    ]);
  });

  it('should generate bundle with license header', async () => {
    const banner = 'test banner';
    const rollupConfig = createRollupConfig({
      banner,
    });

    await writeBundle(rollupConfig);
    await verifyFile(rollupConfig.output.file, (data) => {
      expect(data).toContain(join([
        '/**',
        ` * ${banner}`,
        ' */',
      ]));
    });
  });

  it('should generate bundle with license header ignoring virtual modules', async () => {
    const banner = 'test banner';
    const rollupConfig = {
      input: path.join(__dirname, 'bundle-virtual.js'),

      output: {
        file: path.join(tmpDir.name, 'bundle-virtual.js'),
        format: 'es',
      },

      plugins: [
        virtual({
          'lodash/reduce': `
            export default () => {};
          `,
        }),
        licensePlugin({
          banner,
        }),
      ],
    };

    await writeBundle(rollupConfig);
    await verifyFile(rollupConfig.output.file, (data) => {
      expect(data).toContain(join([
        '/**',
        ` * ${banner}`,
        ' */',
      ]));
    });
  });

  it('should generate bundle with license header from content as a raw string', async () => {
    const content = 'Banner from inline content';
    const banner = { content };
    const rollupConfig = createRollupConfig({
      banner,
    });

    await writeBundle(rollupConfig);
    await verifyFile(rollupConfig.output.file, (data) => {
      expect(warn).not.toHaveBeenCalled();
      expect(data).toContain(join([
        '/**',
        ` * ${content}`,
        ' */',
      ]));
    });
  });

  it('should generate bundle with license header from content as a string returned from function', async () => {
    const content = 'Banner from inline content';
    const banner = {
      content() {
        return content;
      },
    };

    const rollupConfig = createRollupConfig({
      banner,
    });

    await writeBundle(rollupConfig);
    await verifyFile(rollupConfig.output.file, (data) => {
      expect(warn).not.toHaveBeenCalled();
      expect(data).toContain(join([
        '/**',
        ` * ${content}`,
        ' */',
      ]));
    });
  });

  it('should generate bundle with license header from given content file', async () => {
    const banner = {
      content: {
        file: path.join(__dirname, '..', 'fixtures', 'banner.txt'),
        encoding: 'utf-8',
      },
    };

    const rollupConfig = createRollupConfig({
      banner,
    });

    await writeBundle(rollupConfig);
    await verifyFile(rollupConfig.output.file, (data) => {
      expect(warn).not.toHaveBeenCalled();
      expect(data).toContain(join([
        '/**',
        ' * Test banner.',
        ' *',
        ' * With a second line.',
        ' */',
      ]));
    });
  });

  it('should generate bundle with multipleVersion flag', async () => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        includePrivate: false,
        multipleVersions: true,
        output: {
          file: thirdPartyOutput,
        },
      },
    });

    await writeBundle(rollupConfig);
    await verifyFile(thirdPartyOutput, (data) => {
      expect(warn).not.toHaveBeenCalled();
      expect(data).toContain('lodash');
    });
  });

  it('should include self dependency', async () => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const rollupConfig = createRollupConfig({
      thirdParty: {
        includeSelf: true,
        output: {
          file: thirdPartyOutput,
        },
      },
    });

    await writeBundle(rollupConfig);
    await verifyFile(thirdPartyOutput, (data) => {
      expect(warn).not.toHaveBeenCalled();
      expect(data).toContain('rollup-plugin-license');
      expect(data).toContain('lodash');
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
          licensePluginOptions,
        ),
      ],
    };
  }

  async function writeBundle(rollupConfig) {
    const bundle = await rollup.rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
  }

  async function verifyFile(file, test) {
    const data = await fs.readFile(file, 'utf8');
    test(data.toString());
  }
});
