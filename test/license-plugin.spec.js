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

const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const moment = require('moment');
const join = require('./utils/join.js');
const licensePlugin = require('../dist/license-plugin.js');

describe('LicensePlugin', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should initialize instance', () => {
    const plugin = licensePlugin();
    expect(plugin._cwd).toBeDefined();
    expect(plugin._pkg).toBeDefined();
    expect(plugin._sourcemap).toBe(true);
    expect(plugin._dependencies).toEqual({});
  });

  it('should initialize instance with custom cwd', () => {
    const cwd = path.join(__dirname, 'fixtures', 'fake-package-1');
    const plugin = licensePlugin({
      cwd,
    });

    expect(plugin._cwd).toBeDefined();
    expect(plugin._cwd).toBe(cwd);
  });

  it('should initialize instance with sourcemap = false (lowercase)', () => {
    const plugin = licensePlugin({
      sourcemap: false,
    });

    expect(plugin._cwd).toBeDefined();
    expect(plugin._pkg).toBeDefined();
    expect(plugin._sourcemap).toBe(false);
    expect(plugin._dependencies).toEqual({});
  });

  it('should print warning when plugin is used with sourceMap (camelcase)', () => {
    const warn = spyOn(console, 'warn');

    licensePlugin({
      sourceMap: false,
    });

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "sourceMap" has been deprecated and will be removed in a future version, ' +
        'please use "sourcemap" instead.'
    );
  });

  it('should print warning with unknown options', () => {
    const warn = spyOn(console, 'warn');

    licensePlugin({
      foobar: false,
    });

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- Unknown property: "foobar", allowed options are: sourcemap, debug, cwd, banner, thirdParty.'
    );
  });

  it('should disable source map', () => {
    const plugin = licensePlugin();
    expect(plugin._sourcemap).toBe(true);

    plugin.disableSourceMap();
    expect(plugin._sourcemap).toBe(false);
  });

  it('should load pkg', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependency(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: null,
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });
  });

  it('should load pkg including license text from LICENSE.md file', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package-2', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependency(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: 'LICENSE.md file',
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });
  });

  it('should load pkg including license text from LICENSE.txt file', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package-3', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependency(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: 'LICENSE.txt file',
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });
  });

  it('should load pkg including license text from LICENSE file', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package-4', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependency(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: 'LICENSE file',
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });
  });

  it('should load pkg dependencies', () => {
    const plugin = licensePlugin();
    const modules = [
      path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js'),
    ];

    spyOn(plugin, 'scanDependency').and.callThrough();
    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependencies(modules);

    expect(result).not.toBeDefined();
    expect(plugin.scanDependency).toHaveBeenCalledWith(modules[0]);
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: null,
        private: true,
        repository: null,
        homepage: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });
  });

  it('should load pkg and stop on cwd', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, '..', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.scanDependency(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).not.toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({});
  });

  it('should load pkg and update cache', () => {
    const plugin = licensePlugin();
    const fakePackage = path.join(__dirname, 'fixtures', 'fake-package-1');
    const id = path.join(fakePackage, 'src', 'index.js');
    const pkg = require(path.join(fakePackage, 'package.json'));

    plugin.scanDependency(id);

    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: null,
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });

    expect(plugin._cache).toEqual({
      [path.join(__dirname, 'fixtures', 'fake-package-1', 'src')]: pkg,
      [path.join(__dirname, 'fixtures', 'fake-package-1')]: pkg,
    });
  });

  it('should load pkg and put null without package', () => {
    const plugin = licensePlugin();
    const id = path.join(__dirname, '..', 'src', 'index.js');

    plugin.scanDependency(id);

    expect(plugin._dependencies).toEqual({});
    expect(plugin._cache).toEqual({
      [path.normalize(path.join(__dirname, '..', 'src'))]: null,
    });
  });

  it('should try to load pkg without leading NULL character ', () => {
    const plugin = licensePlugin();
    const fakePackage = path.join(__dirname, 'fixtures', 'fake-package-1');
    const idNoNull = path.join(fakePackage, 'src', 'index.js');
    const id = '\0' + idNoNull;
    const pkg = require(path.join(fakePackage, 'package.json'));

    plugin.scanDependency(id);

    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        licenseText: null,
        private: true,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    });

    expect(plugin._cache).toEqual({
      [path.join(__dirname, 'fixtures', 'fake-package-1', 'src')]: pkg,
      [path.join(__dirname, 'fixtures', 'fake-package-1')]: pkg,
    });
  });

  it('should load pkg and use the cache if available', () => {
    const plugin = licensePlugin();
    const fakePackage = path.join(__dirname, 'fixtures', 'fake-package-1');
    const id = path.join(fakePackage, 'src', 'index.js');

    plugin._cache[path.join(fakePackage, 'src')] = null;
    plugin._cache[fakePackage] = null;

    spyOn(fs, 'existsSync').and.callThrough();

    plugin.scanDependency(id);

    expect(plugin._dependencies).toEqual({});
    expect(fs.existsSync).not.toHaveBeenCalled();
  });

  it('should add dependency', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
      contributors: [
        {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
        },
      ],
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).not.toBe(pkg);
    expect(plugin._dependencies).toEqual({
      foo: {
        name: 'foo',
        version: '0.0.0',
        description: 'Fake Description',
        license: 'MIT',
        licenseText: null,
        homepage: 'https://www.google.fr',
        private: true,
        maintainers: [],
        repository: {
          type: 'GIT',
          url: 'https://github.com/npm/npm.git',
        },
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
        contributors: [
          {
            name: 'Mickael Jeanroy',
            email: 'mickael.jeanroy@gmail.com',
            url: null,
          },
        ],
      },
    });
  });

  it('should add dependency and parse author field', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo.author).toEqual({
      name: 'Mickael Jeanroy',
      url: 'https://mjeanroy.com',
      email: 'mickael.jeanroy@gmail.com',
    });
  });

  it('should add dependency and parse contributors field as a string', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      contributors: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo.contributors).toBeDefined();
    expect(plugin._dependencies.foo.contributors.length).toBe(1);
    expect(plugin._dependencies.foo.contributors[0]).toEqual({
      name: 'Mickael Jeanroy',
      url: 'https://mjeanroy.com',
      email: 'mickael.jeanroy@gmail.com',
    });
  });

  it('should add dependency and parse contributors field', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
      contributors: [
        'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
        {
          name: 'John Doe',
          email: 'johndoe@doe.com',
        },
      ],
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo.contributors).toBeDefined();
    expect(plugin._dependencies.foo.contributors.length).toBe(2);

    expect(plugin._dependencies.foo.contributors[0]).toEqual({
      name: 'Mickael Jeanroy',
      url: 'https://mjeanroy.com',
      email: 'mickael.jeanroy@gmail.com',
    });

    expect(plugin._dependencies.foo.contributors[1]).toEqual({
      name: 'John Doe',
      email: 'johndoe@doe.com',
      url: null,
    });
  });

  it('should add dependency and parse licenses field', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      description: 'Fake Description',
      main: 'src/index.js',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
      licenses: [
        {
          type: 'MIT',
          url: 'http://www.opensource.org/licenses/mit-license.php',
        },
        {
          type: 'Apache-2.0',
          url: 'http://opensource.org/licenses/apache2.0.php',
        },
      ],
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo.licenses).not.toBeDefined();
    expect(plugin._dependencies.foo.license).toBe('(MIT OR Apache-2.0)');
  });

  it('should not add dependency twice', () => {
    const plugin = licensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
      contributors: [
        {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
        },
      ],
      repository: {
        type: 'GIT',
        url: 'https://github.com/npm/npm.git',
      },
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).not.toBe(pkg);
    expect(plugin._dependencies).toEqual({
      foo: jasmine.anything(),
    });

    // Try to add the same pkg id

    plugin.addDependency(pkg);

    expect(plugin._dependencies).toEqual({
      foo: jasmine.anything(),
    });
  });

  it('should prepend banner to bundle from a file', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.js'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should prepend banner to bundle with custom encoding', () => {
    const readFileSync = spyOn(fs, 'readFileSync').and.callThrough();
    const encoding = 'ascii';
    const code = 'var foo = 0;';
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.js'),
          encoding,
        },
      },
    });

    const result = instance.prependBanner(code);

    expect(readFileSync).toHaveBeenCalledWith(jasmine.any(String), encoding);
    expect(result).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should prepend banner to bundle from (deprecated) file option', () => {
    const warn = spyOn(console, 'warn');
    const code = 'var foo = 0;';
    const instance = licensePlugin({
      banner: {
        file: path.join(__dirname, 'fixtures', 'banner.js'),
      },
    });


    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.file" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.file" instead.'
    );
  });

  it('should prepend banner to bundle with (deprecated) custom encoding option', () => {
    const readFileSync = spyOn(fs, 'readFileSync').and.callThrough();
    const warn = spyOn(console, 'warn');

    const encoding = 'ascii';
    const instance = licensePlugin({
      banner: {
        file: path.join(__dirname, 'fixtures', 'banner.js'),
        encoding,
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(readFileSync).toHaveBeenCalledWith(jasmine.any(String), encoding);
    expect(result).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.file" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.file" instead.'
    );
  });

  it('should fail to prepend banner without any content', () => {
    const instance = licensePlugin({
      banner: {
        commentStyle: 'regular',
        content: {
        },
      },
    });

    expect(() => instance.prependBanner('var foo = 0;')).toThrow(new Error(
        '[rollup-plugin-license] -- Cannot find banner content, please specify an inline content, or a path to a file'
    ));
  });

  it('should prepend banner to bundle with template', () => {
    const file = path.join(__dirname, 'fixtures', 'banner.js');
    const tmpl = fs.readFileSync(file, 'utf-8');
    const instance = licensePlugin({
      banner: tmpl,
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should prepend banner to bundle without source map', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.js'),
        },
      },
    });

    instance.disableSourceMap();

    const code = 'var foo = 0;';
    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.map).not.toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should not prepend default banner to bundle', () => {
    const instance = licensePlugin();

    const code = 'var foo = 0;';
    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toBe(code);
  });

  it('should fail if banner file does not exist', () => {
    const file = path.join(__dirname, 'fixtures', 'dummy');
    const instance = licensePlugin({
      banner: {
        content: {
          file,
        },
      },
    });

    expect(() => instance.prependBanner('var foo = 0;')).toThrow(new Error(
        `[rollup-plugin-license] -- Template file ${file} does not exist, or cannot be read`
    ));
  });

  it('should prepend banner and create block comment', () => {
    const code = 'var foo = 0;';
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.txt'),
        },
      },
    });

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should prepend banner and create block comment with a custom style', () => {
    const instance = licensePlugin({
      banner: {
        commentStyle: 'ignored',
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.txt'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/*!',
      ' * Test banner.',
      ' *',
      ' * With a second line.',
      ' */',
      '',
      code,
    ]));
  });

  it('should prepend banner and create comment with slash style', () => {
    const instance = licensePlugin({
      banner: {
        commentStyle: 'slash',
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.txt'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '//',
      '// Test banner.',
      '//',
      '// With a second line.',
      '//',
      '',
      code,
    ]));
  });

  it('should prepend banner and create block comment without any style at all', () => {
    const instance = licensePlugin({
      banner: {
        commentStyle: 'none',
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.txt'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      'Test banner.',
      '',
      'With a second line.',
      '',
      code,
    ]));
  });

  it('should fail to prepend banner if comment style option is unknown', () => {
    const instance = licensePlugin({
      banner: {
        commentStyle: 'foobar',
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.txt'),
        },
      },
    });

    expect(() => instance.prependBanner('var foo = 0;')).toThrow(new Error(
        'Unknown comment style foobar, please use one of: regular,ignored,slash,none'
    ));
  });

  it('should prepend banner to bundle and create sourceMap', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner.js'),
        },
      },
    });

    const code = 'var foo = 0;';
    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should prepend banner and replace moment variables', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner-with-moment.js'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ` * Date: ${moment().format('YYYY-MM-DD')}`,
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should prepend banner and replace custom data object', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner-with-data.js'),
        },
        data: {
          foo: 'bar',
          bar: 'baz',
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Foo: bar',
      ' * Bar: baz',
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should prepend banner and replace custom data function', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner-with-data.js'),
        },
        data() {
          return {
            foo: 'bar',
            bar: 'baz',
          };
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Foo: bar',
      ' * Bar: baz',
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should prepend banner and replace package variables', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner-with-pkg.js'),
        },
      },
    });

    const code = 'var foo = 0;';

    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Name: rollup-plugin-license',
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should prepend banner and replace dependencies placeholders', () => {
    const instance = licensePlugin({
      banner: {
        content: {
          file: path.join(__dirname, 'fixtures', 'banner-with-dependencies.js'),
        },
      },
    });

    // Load a dependency
    instance.scanDependency(path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js'));

    const code = 'var foo = 0;';
    const result = instance.prependBanner(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(join([
      '/**',
      ' * Name: rollup-plugin-license',
      ' *',
      ' * Dependencies:',
      ' * ',
      ' *   fake-package -- MIT',
      ' * ',
      ' */',
      '',
      'var foo = 0;',
    ]));
  });

  it('should export single dependency', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
      ]));

      done();
    });
  });

  it('should export single dependency and create directory if needed', (done) => {
    const file = path.join(tmpDir.name, 'output', 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    const result = instance.scanThirdParties();
    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        console.log('Error reading file');
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
      ]));

      done();
    });
  });

  it('should export list of dependencies to given file', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: false,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
        '',
        '---',
        '',
        'Name: bar',
        'Version: 2.0.0',
        'License: Apache 2.0',
        'Private: false',
        'Description: Bar Package',
      ]));

      done();
    });
  });

  it('should export list of dependencies with custom encoding to given file', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const encoding = 'base64';
    const instance = licensePlugin({
      thirdParty: {
        output: {
          file,
          encoding,
        },
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, encoding, (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      expect(content).toBeDefined();
      expect(content).toContain('foo');

      done();
    });
  });

  it('should export list of dependencies with (deprecated) custom encoding to given file', (done) => {
    const warn = spyOn(console, 'warn');
    const output = path.join(tmpDir.name, 'third-party.txt');
    const encoding = 'base64';
    const instance = licensePlugin({
      thirdParty: {
        output,
        encoding,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(output, encoding, (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      expect(content).toBeDefined();
      expect(content).toContain('foo');
      expect(warn).toHaveBeenCalledWith(
          '[rollup-plugin-license] -- "thirdParty.encoding" has been deprecated and will be removed in a future version, ' +
          'please use "thirdParty.output.encoding" instead.'
      );

      done();
    });
  });

  it('should export default message without any dependencies', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance._dependencies = {};

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual('No third parties dependencies');
      done();
    });
  });

  it('should not export private dependencies by default', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
      ]));

      done();
    });
  });

  it('should export dependencies to output file if enabled', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = licensePlugin({
      thirdParty: {
        output: file,
        includePrivate: true,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
        '',
        '---',
        '',
        'Name: bar',
        'Version: 2.0.0',
        'License: Apache 2.0',
        'Private: true',
        'Description: Bar Package',
      ]));

      done();
    });
  });

  it('should export list of dependencies to output file using given template', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const template =
      '<% _.forEach(dependencies, function (dependency) {%>' +
        '<%= dependency.name %> => <%= dependency.version %> (<%= dependency.license %>)' +
      '<% }) %>';

    const instance = licensePlugin({
      thirdParty: {
        output: {
          template,
          file,
        },
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual('foo => 1.0.0 (MIT)');

      done();
    });
  });

  it('should export list of dependencies to output JSON file using given template', (done) => {
    const file = path.join(tmpDir.name, 'third-party.json');
    const template = jasmine.createSpy('template').and.callFake((dependencies) => JSON.stringify(dependencies));
    const instance = licensePlugin({
      thirdParty: {
        output: {
          template,
          file,
        },
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      const json = JSON.parse(txt);

      expect(json).toBeDefined();
      expect(json.length).toBe(1);
      expect(json[0].name).toBe('foo');

      done();
    });
  });

  it('should export list of dependencies to output file using given template function', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const template = jasmine.createSpy('template').and.callFake((dependencies) => (
      dependencies.map((dependency) => `${dependency.name} => ${dependency.version} (${dependency.license})`).join('\n')
    ));

    const instance = licensePlugin({
      thirdParty: {
        output: {
          template,
          file,
        },
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual('foo => 1.0.0 (MIT)');
      expect(template).toHaveBeenCalled();

      done();
    });
  });

  it('should not try to export dependencies without output configuration', () => {
    const instance = licensePlugin();

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    spyOn(fs, 'writeFileSync').and.callThrough();

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should export list of non-private dependencies to thirdParty function', () => {
    const thirdParty = jasmine.createSpy('output');
    const instance = licensePlugin({
      thirdParty,
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();
    expect(thirdParty).toHaveBeenCalledWith([
      {
        name: 'foo',
        version: '1.0.0',
        description: 'Foo Package',
        license: 'MIT',
        licenseText: null,
        private: false,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    ]);
  });

  it('should export list of non-private dependencies to output function', () => {
    const output = jasmine.createSpy('output');
    const instance = licensePlugin({
      thirdParty: {
        output,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();
    expect(output).toHaveBeenCalledWith([
      {
        name: 'foo',
        version: '1.0.0',
        description: 'Foo Package',
        license: 'MIT',
        licenseText: null,
        private: false,
        homepage: null,
        repository: null,
        maintainers: [],
        contributors: [],
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
    ]);
  });

  it('should export list of dependencies to output function including private if enabled', () => {
    const output = jasmine.createSpy('output');
    const includePrivate = true;
    const instance = licensePlugin({
      thirdParty: {
        output,
        includePrivate,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    });

    const result = instance.scanThirdParties();

    expect(result).not.toBeDefined();
    expect(output).toHaveBeenCalledWith([
      {
        name: 'foo',
        version: '1.0.0',
        description: 'Foo Package',
        license: 'MIT',
        licenseText: null,
        private: false,
        maintainers: [],
        contributors: [],
        repository: null,
        homepage: null,
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
          url: null,
        },
      },
      {
        name: 'bar',
        version: '2.0.0',
        description: 'Bar Package',
        license: 'Apache 2.0',
        licenseText: null,
        maintainers: [],
        contributors: [],
        author: null,
        repository: null,
        homepage: null,
        private: true,
      },
    ]);
  });

  it('should not warn without any license violations', () => {
    const warn = spyOn(console, 'warn');
    const allow = '(Apache-2.0 OR MIT)';
    const instance = licensePlugin({
      thirdParty: {
        allow,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'Apache-2.0',
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'MIT',
    });

    instance.scanThirdParties();

    expect(warn).not.toHaveBeenCalled();
  });

  it('should warn for license violations', () => {
    const warn = spyOn(console, 'warn');
    const allow = 'MIT';
    const instance = licensePlugin({
      thirdParty: {
        allow,
      },
    });

    instance.addDependency({
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'Apache-2.0',
    });

    instance.addDependency({
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'MIT',
    });

    instance.scanThirdParties();

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- ' +
        'Dependency "foo" has a license (Apache-2.0) which is not compatible with requirement (MIT), ' +
        'looks like a license violation to fix.'
    );
  });

  it('should warn for unlicensed dependencies', () => {
    const warn = spyOn(console, 'warn');
    const allow = '(Apache-2.0 OR MIT)';
    const instance = licensePlugin({
      thirdParty: {
        allow,
      },
    });

    instance.addDependency({
      name: 'baz',
      version: '3.0.0',
      description: 'Baz Package',
    });

    instance.scanThirdParties();

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- Dependency "baz" does not specify any license.'
    );
  });
});
