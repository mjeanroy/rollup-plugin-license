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
import fs from 'fs';
import tmp from 'tmp';
import rollupPluginLicense from '../src/index';
import { join } from './utils/join';

describe('rollup-plugin-license', () => {
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
    const instance = rollupPluginLicense();
    expect(instance.name).toBe('rollup-plugin-license');
  });

  it('should scan dependencies when chunk is rendered', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const instance = rollupPluginLicense({
      thirdParty: {
        includePrivate: true,
        output: thirdPartyOutput,
      },
    });

    const moduleId = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');
    const modules = {
      [moduleId]: {
        renderedExports: [],
        removedExports: [],
        renderedLength: 10,
        originalLength: 100,
      },
    };

    const code = 'var foo = 0;';
    const chunk = { code, modules };
    const outputOptions = {};

    instance.renderChunk(code, chunk, outputOptions);
    instance.generateBundle();

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

  it('should scan dependencies when chunk is rendered and skip tree-shaken modules', (done) => {
    const thirdPartyOutput = path.join(tmpDir.name, 'dependencies.txt');
    const instance = rollupPluginLicense({
      thirdParty: {
        includePrivate: true,
        output: thirdPartyOutput,
      },
    });

    const moduleId1 = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');
    const moduleId2 = path.join(__dirname, '..', 'node_modules', 'lodash', 'index.js');

    const modules = {
      [moduleId1]: {
        renderedExports: [],
        removedExports: [],
        renderedLength: 10,
        originalLength: 100,
      },

      [moduleId2]: {
        renderedExports: [],
        removedExports: [],
        renderedLength: 0,
        originalLength: 100,
      },
    };

    const code = 'var foo = 0;';
    const chunk = { code, modules };
    const outputOptions = {};

    instance.renderChunk(code, chunk, outputOptions);
    instance.generateBundle();

    fs.readFile(thirdPartyOutput, 'utf8', (err, data) => {
      if (err) {
        done.fail(err);
      }

      const content = data.toString();
      expect(content).toBeDefined();
      expect(content).toContain('fake-package');
      expect(content).not.toContain('lodash');
      done();
    });
  });

  it('should prepend banner when bundle is transformed', () => {
    const banner = 'test banner';
    const instance = rollupPluginLicense({
      banner,
    });

    const code = 'var foo = 0;';
    const chunk = {};
    const outputOptions = {};

    const result = instance.renderChunk(code, chunk, outputOptions);

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
    const instance = rollupPluginLicense({
      thirdParty: {
        output: thirdPartyOutput,
      },
    });

    const moduleId = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');
    const modules = {
      [moduleId]: {
        renderedExports: [],
        removedExports: [],
        renderedLength: 10,
        originalLength: 100,
      },
    };

    const code = 'var foo = 0;';
    const chunk = { code, modules };
    const outputOptions = {};

    instance.renderChunk(code, chunk, outputOptions);
    instance.generateBundle();

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

  it('should initialize plugin with sourcemap option', () => {
    const instance = rollupPluginLicense({
      sourcemap: true,
    });

    const code = 'var foo = 0;';
    const chunk = {};
    const outputOptions = {};
    const result = instance.renderChunk(code, chunk, outputOptions);

    expect(instance).toBeDefined();
    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should enable sourcemap by default', () => {
    const instance = rollupPluginLicense();

    const code = 'var foo = 0;';
    const chunk = {};
    const outputOptions = {};
    const result = instance.renderChunk(code, chunk, outputOptions);

    expect(instance).toBeDefined();
    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should disbable sourcemap (lowercase) in plugin options', () => {
    const instance = rollupPluginLicense({
      sourcemap: false,
    });

    const code = 'var foo = 0;';
    const chunk = {};
    const outputOptions = {};
    const result = instance.renderChunk(code, chunk, outputOptions);

    expect(instance).toBeDefined();
    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });

  it('should disable sourcemap using output options', () => {
    const instance = rollupPluginLicense();

    const code = 'var foo = 0;';
    const chunk = {};
    const outputOptions = {
      sourcemap: false,
    };

    const result = instance.renderChunk(code, chunk, outputOptions);

    expect(instance).toBeDefined();
    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });
});
