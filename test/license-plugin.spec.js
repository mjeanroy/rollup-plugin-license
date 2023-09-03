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

import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import moment from 'moment';
import {licensePlugin} from '../src/license-plugin.js';
import {join} from './utils/join.js';

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

  describe('on initialization', () => {
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
  });

  describe('when scanning dependency', () => {
    let plugin;
    let addDependency;
    let scanDependency;
    let fakePackage;

    beforeEach(() => {
      plugin = licensePlugin();
      addDependency = spyOn(plugin, 'addDependency').and.callThrough();
      scanDependency = spyOn(plugin, 'scanDependency').and.callThrough();
      fakePackage = {
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
      };
    });

    it('should load pkg', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });
    });

    it('should load pkg with version in key when multipleVersions option is truthy', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js');

      plugin._options = {
        thirdParty: {
          multipleVersions: true,
        },
      };

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        [`${fakePackage.name}@${fakePackage.version}`]: fakePackage,
      });
    });

    it('should load pkg and going up directories until a package name is found', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-5', 'esm', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });
    });

    it('should load pkg and going up directories until a valid package name is found', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-6', 'internal', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });
    });

    it('should load pkg and going up directories until a package name with a license is found even with a non valid package name', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-7', 'internal', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        '@fake-package/core/internal': {
          name: '@fake-package/core/internal',
          maintainers: [],
          version: null,
          description: null,
          repository: null,
          homepage: null,
          private: true,
          license: 'MIT',
          licenseText: null,
          author: null,
          contributors: [],
        },
      });
    });

    it('should load pkg including license text from LICENSE.md file', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-2', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: 'LICENSE.md file',
        }),
      });
    });

    it('should load pkg and do not fail with license directory', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-9', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: null,
        }),
      });
    });

    it('should load pkg and find license file instead of directory', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-10', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: 'license.md file',
        }),
      });
    });

    it('should load pkg including license text from license.md file ignoring case of license file', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-8', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: 'license.md file',
        }),
      });
    });

    it('should load pkg including license text from LICENSE.txt file', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-3', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: 'LICENSE.txt file',
        }),
      });
    });

    it('should load pkg including license text from LICENSE file', () => {
      const id = path.join(__dirname, 'fixtures', 'fake-package-4', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': Object.assign(fakePackage, {
          licenseText: 'LICENSE file',
        }),
      });
    });

    it('should load pkg dependencies', () => {
      const modules = [
        path.join(__dirname, 'fixtures', 'fake-package-1', 'src', 'index.js'),
      ];

      plugin.scanDependencies(modules);

      expect(scanDependency).toHaveBeenCalledWith(modules[0]);
      expect(addDependency).toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });
    });

    it('should load pkg and stop on cwd', () => {
      const id = path.join(__dirname, '..', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(addDependency).not.toHaveBeenCalled();
      expect(plugin._dependencies).toEqual({});
    });

    it('should load pkg and update cache', () => {
      const pkgPath = path.join(__dirname, 'fixtures', 'fake-package-1');
      const id = path.join(pkgPath, 'src', 'index.js');
      const pkg = require(path.join(pkgPath, 'package.json'));

      plugin.scanDependency(id);

      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });

      expect(plugin._cache).toEqual({
        [path.join(__dirname, 'fixtures', 'fake-package-1', 'src')]: pkg,
        [path.join(__dirname, 'fixtures', 'fake-package-1')]: pkg,
      });
    });

    it('should load pkg and put null without package', () => {
      const id = path.join(__dirname, '..', 'src', 'index.js');

      plugin.scanDependency(id);

      expect(plugin._dependencies).toEqual({});
      expect(plugin._cache).toEqual({
        [path.normalize(path.join(__dirname, '..', 'src'))]: null,
      });
    });

    it('should try to load pkg without leading NULL character ', () => {
      const pkgPath = path.join(__dirname, 'fixtures', 'fake-package-1');
      const idNoNull = path.join(pkgPath, 'src', 'index.js');
      const id = '\0' + idNoNull;
      const pkg = require(path.join(pkgPath, 'package.json'));

      plugin.scanDependency(id);

      expect(plugin._dependencies).toEqual({
        'fake-package': fakePackage,
      });

      expect(plugin._cache).toEqual({
        [path.join(__dirname, 'fixtures', 'fake-package-1', 'src')]: pkg,
        [path.join(__dirname, 'fixtures', 'fake-package-1')]: pkg,
      });
    });

    it('should load pkg and use the cache if available', () => {
      const existsSync = spyOn(fs, 'existsSync').and.callThrough();
      const pkgPath = path.join(__dirname, 'fixtures', 'fake-package-1');
      const id = path.join(pkgPath, 'src', 'index.js');

      plugin._cache[path.join(pkgPath, 'src')] = null;
      plugin._cache[pkgPath] = null;

      plugin.scanDependency(id);

      expect(plugin._dependencies).toEqual({});
      expect(existsSync).not.toHaveBeenCalled();
    });

    it('should not run into an infinite loop for relative paths starting with a slash', () => {
      const id = '/abc/efg';

      plugin.scanDependency(id);
    });
  });

  describe('when adding dependencies', () => {
    let warn;
    let plugin;
    let pkg;

    beforeEach(() => {
      warn = spyOn(console, 'warn');
      plugin = licensePlugin();
      pkg = {
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
    });

    it('should add dependency', () => {
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

    it('should warn when adding dependency without name', () => {
      plugin.addDependency({
        type: 'module',
      });

      expect(plugin._dependencies).toEqual({});
      expect(warn).toHaveBeenCalledWith(
          '[rollup-plugin-license] -- Trying to add dependency without any name, skipping it.'
      );
    });

    it('should add dependency and parse author field', () => {
      const dependency = Object.assign(pkg, {
        author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      });

      plugin.addDependency(dependency);

      expect(plugin._dependencies.foo).toBeDefined();
      expect(plugin._dependencies.foo.author).toEqual({
        name: 'Mickael Jeanroy',
        url: 'https://mjeanroy.com',
        email: 'mickael.jeanroy@gmail.com',
      });
    });

    it('should add dependency and parse contributors field as a string', () => {
      const dependency = Object.assign(pkg, {
        contributors: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      });

      plugin.addDependency(dependency);

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
      const contributor1 = 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)';
      const contributor2 = {name: 'John Doe', email: 'johndoe@doe.com'};
      const dependency = Object.assign(pkg, {
        contributors: [
          contributor1,
          contributor2,
        ],
      });

      plugin.addDependency(dependency);

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
      const mit = {type: 'MIT', url: 'http://www.opensource.org/licenses/mit-license.php'};
      const apache2 = {type: 'Apache-2.0', url: 'http://opensource.org/licenses/apache2.0.php'};
      const dependency = Object.assign(pkg, {
        license: null,
        licenses: [
          mit,
          apache2,
        ],
      });

      plugin.addDependency(dependency);

      expect(plugin._dependencies.foo).toBeDefined();
      expect(plugin._dependencies.foo.licenses).not.toBeDefined();
      expect(plugin._dependencies.foo.license).toBe('(MIT OR Apache-2.0)');
    });

    it('should not add dependency twice', () => {
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
  });

  describe('with banner option', () => {
    let code;
    let bannerJs;
    let bannerTxt;

    beforeEach(() => {
      code = 'var foo = 0;';
      bannerJs = path.join(__dirname, 'fixtures', 'banner.js');
      bannerTxt = path.join(__dirname, 'fixtures', 'banner.txt');
    });

    it('should prepend banner to bundle from a file', () => {
      const instance = licensePlugin({
        banner: {
          content: {
            file: bannerJs,
          },
        },
      });

      const result = instance.prependBanner(code);

      verifyResult(result);
    });

    it('should prepend banner to bundle with custom encoding', () => {
      const readFileSync = spyOn(fs, 'readFileSync').and.callThrough();
      const encoding = 'ascii';
      const instance = licensePlugin({
        banner: {
          content: {
            file: bannerJs,
            encoding,
          },
        },
      });

      const result = instance.prependBanner(code);

      verifyResult(result);
      expect(readFileSync).toHaveBeenCalledWith(jasmine.any(String), encoding);
    });

    it('should fail to prepend banner without any content', () => {
      const instance = licensePlugin({
        banner: {
          commentStyle: 'regular',
          content: {},
        },
      });

      expect(() => instance.prependBanner('var foo = 0;')).toThrow(new Error(
          '[rollup-plugin-license] -- Cannot find banner content, please specify an inline content, or a path to a file'
      ));
    });

    it('should prepend banner to bundle with template', () => {
      const tmpl = fs.readFileSync(bannerJs, 'utf-8');
      const instance = licensePlugin({
        banner: tmpl,
      });

      const result = instance.prependBanner(code);

      verifyResult(result);
    });

    it('should prepend banner to bundle without source map', () => {
      const instance = licensePlugin({
        banner: {
          content: {
            file: bannerJs,
          },
        },
      });

      instance.disableSourceMap();

      const result = instance.prependBanner(code);

      verifyBanner(result);
      expect(result.map).not.toBeDefined();
    });

    it('should not prepend default banner to bundle', () => {
      const instance = licensePlugin();
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

      expect(() => instance.prependBanner(code)).toThrow(new Error(
          `[rollup-plugin-license] -- Template file ${file} does not exist, or cannot be read`
      ));
    });

    it('should prepend banner and create block comment', () => {
      const instance = licensePlugin({
        banner: {
          content: {
            file: bannerTxt,
          },
        },
      });

      const result = instance.prependBanner(code);

      verifyBanner(result);
    });

    it('should prepend banner and create block comment with a custom style', () => {
      const instance = licensePlugin({
        banner: {
          commentStyle: 'ignored',
          content: {
            file: bannerTxt,
          },
        },
      });

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
            file: bannerTxt,
          },
        },
      });

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
            file: bannerTxt,
          },
        },
      });

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
            file: bannerTxt,
          },
        },
      });

      expect(() => instance.prependBanner(code)).toThrow(new Error(
          'Unknown comment style foobar, please use one of: regular,ignored,slash,none'
      ));
    });

    it('should prepend banner to bundle and create sourceMap', () => {
      const instance = licensePlugin({
        banner: {
          content: {
            file: bannerJs,
          },
        },
      });

      const result = instance.prependBanner(code);

      verifyResult(result);
    });

    it('should prepend banner and replace moment variables', () => {
      const instance = licensePlugin({
        banner: {
          content: {
            file: path.join(__dirname, 'fixtures', 'banner-with-moment.js'),
          },
        },
      });

      const result = instance.prependBanner(code);

      expect(result).toBeDefined();
      expect(result.code).toEqual(join([
        '/**',
        ` * Date: ${moment().format('YYYY-MM-DD')}`,
        ' */',
        '',
        code,
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

      const result = instance.prependBanner(code);

      expect(result).toBeDefined();
      expect(result.code).toEqual(join([
        '/**',
        ' * Foo: bar',
        ' * Bar: baz',
        ' */',
        '',
        code,
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

      const result = instance.prependBanner(code);

      expect(result).toBeDefined();
      expect(result.code).toEqual(join([
        '/**',
        ' * Foo: bar',
        ' * Bar: baz',
        ' */',
        '',
        code,
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

      const result = instance.prependBanner(code);

      expect(result).toBeDefined();
      expect(result.code).toEqual(join([
        '/**',
        ' * Name: rollup-plugin-license',
        ' */',
        '',
        code,
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
        code,
      ]));
    });

    function verifyResult(result) {
      verifyBanner(result);
      expect(result.map).toBeDefined();
    }

    function verifyBanner(result) {
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
    }
  });

  describe('when scanning third parties', () => {
    let pkg1;
    let pkg2;

    beforeEach(() => {
      pkg1 = {
        name: 'foo',
        version: '1.0.0',
        description: 'Foo Package',
        license: 'MIT',
        private: false,
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
        },
      };

      pkg2 = {
        name: 'bar',
        version: '2.0.0',
        description: 'Bar Package',
        license: 'Apache 2.0',
        private: false,
      };
    });

    it('should export single dependency', (done) => {
      const file = path.join(tmpDir.name, 'third-party.txt');
      const instance = licensePlugin({
        thirdParty: {
          output: file,
        },
      });

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        verifyDefaultOutput(content);
      });
    });

    it('should export single dependency and create directory if needed', (done) => {
      const file = path.join(tmpDir.name, 'output', 'third-party.txt');
      const instance = licensePlugin({
        thirdParty: {
          output: file,
        },
      });

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        verifyDefaultOutput(content);
      });
    });


    it('should export list of dependencies to given file', (done) => {
      const file = path.join(tmpDir.name, 'third-party.txt');
      const instance = licensePlugin({
        thirdParty: {
          output: file,
        },
      });

      instance.addDependency(pkg1);
      instance.addDependency(pkg2);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        expect(content).toEqual(join([
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

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFileWithEncoding(file, encoding, done, (content) => {
        expect(content).toContain('foo');
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
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        expect(content).toEqual('No third parties dependencies');
      });
    });

    it('should not export private dependencies by default', (done) => {
      const file = path.join(tmpDir.name, 'third-party.txt');
      const instance = licensePlugin({
        thirdParty: {
          output: file,
        },
      });

      instance.addDependency(pkg1);
      instance.addDependency(Object.assign(pkg2, {
        private: true,
      }));

      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        verifyDefaultOutput(content);
      });
    });

    it('should export private dependencies to output file if enabled', (done) => {
      const file = path.join(tmpDir.name, 'third-party.txt');
      const instance = licensePlugin({
        thirdParty: {
          output: file,
          includePrivate: true,
        },
      });

      instance.addDependency(pkg1);
      instance.addDependency(Object.assign(pkg2, {
        private: true,
      }));

      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        expect(content).toEqual(join([
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

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        expect(content).toEqual('foo => 1.0.0 (MIT)');
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

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        const json = JSON.parse(content);
        expect(json).toBeDefined();
        expect(json.length).toBe(1);
        expect(json[0].name).toBe('foo');
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

      instance.addDependency(pkg1);
      instance.scanThirdParties();

      verifyFile(file, done, (content) => {
        expect(content).toEqual('foo => 1.0.0 (MIT)');
        expect(template).toHaveBeenCalled();
      });
    });

    it('should not try to export dependencies without output configuration', () => {
      const writeFileSync = spyOn(fs, 'writeFileSync').and.callThrough();
      const instance = licensePlugin();

      instance.addDependency(pkg1);
      instance.addDependency(pkg2);
      instance.scanThirdParties();

      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should export list of non-private dependencies to thirdParty function', () => {
      const thirdParty = jasmine.createSpy('output');
      const instance = licensePlugin({
        thirdParty,
      });

      instance.addDependency(pkg1);
      instance.addDependency(Object.assign(pkg2, {
        private: true,
      }));

      instance.scanThirdParties();

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

      instance.addDependency(pkg1);
      instance.addDependency(Object.assign(pkg2, {
        private: true,
      }));

      instance.scanThirdParties();

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

      instance.addDependency(pkg1);
      instance.addDependency(Object.assign(pkg2, {
        private: true,
      }));

      instance.scanThirdParties();

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

    function verifyFile(filePath, done, cb) {
      verifyFileWithEncoding(filePath, 'utf-8', done, cb);
    }

    function verifyFileWithEncoding(filePath, encoding, done, cb) {
      fs.readFile(filePath, encoding, (err, content) => {
        if (err) {
          done.fail(err);
          return;
        }

        cb(content.toString());
        done();
      });
    }

    function verifyDefaultOutput(content) {
      expect(content).toEqual(join([
        'Name: foo',
        'Version: 1.0.0',
        'License: MIT',
        'Private: false',
        'Description: Foo Package',
        'Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>',
      ]));
    }
  });

  describe('with license checker', () => {
    let warn;
    let mitDependency;
    let apache2Dependency;
    let unlicensedDependency;

    beforeEach(() => {
      warn = spyOn(console, 'warn');

      mitDependency = {
        name: 'bar',
        version: '2.0.0',
        description: 'Bar Package',
        license: 'MIT',
      };

      apache2Dependency = {
        name: 'foo',
        version: '1.0.0',
        description: 'Foo Package',
        license: 'Apache-2.0',
      };

      unlicensedDependency = {
        name: 'baz',
        version: '3.0.0',
        description: 'Baz Package',
      };
    });

    it('should not warn without any license violations', () => {
      const allow = '(Apache-2.0 OR MIT)';
      const instance = licensePlugin({
        thirdParty: {
          allow,
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);
      instance.scanThirdParties();

      expect(warn).not.toHaveBeenCalled();
    });

    it('should warn for license violations', () => {
      const allow = 'MIT';
      const instance = licensePlugin({
        thirdParty: {
          allow,
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);
      instance.scanThirdParties();

      verifyWarnAboutApache2License();
    });

    it('should warn for unlicensed dependencies', () => {
      const allow = '(Apache-2.0 OR MIT)';
      const instance = licensePlugin({
        thirdParty: {
          allow,
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(unlicensedDependency);
      instance.scanThirdParties();

      verifyWarnAboutUnlicensedLicense();
    });

    it('should warn for invalid dependencies using validator function', () => {
      const allow = jasmine.createSpy('allow').and.callFake((dependency) => dependency.license === 'MIT');
      const instance = licensePlugin({
        thirdParty: {
          allow,
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);
      instance.scanThirdParties();

      verifyWarnAboutApache2License();
    });

    it('should check for invalid dependencies using object definition option', () => {
      const test = 'MIT';
      const instance = licensePlugin({
        thirdParty: {
          allow: {
            test,
          },
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);
      instance.scanThirdParties();

      verifyWarnAboutApache2License();
    });

    it('should check for invalid dependencies using object definition option and validator function', () => {
      const test = jasmine.createSpy('allow').and.callFake((dependency) => dependency.license === 'MIT');
      const instance = licensePlugin({
        thirdParty: {
          allow: {
            test,
          },
        },
      });

      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);
      instance.scanThirdParties();

      verifyWarnAboutApache2License();
    });

    it('should fail with unlicensed dependencies if enabled', () => {
      const instance = licensePlugin({
        thirdParty: {
          allow: {
            test: '(Apache-2.0 OR MIT)',
            failOnUnlicensed: true,
            failOnViolation: true,
          },
        },
      });

      instance.addDependency(unlicensedDependency);
      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);

      expect(() => instance.scanThirdParties()).toThrow(new Error(
          'Dependency "baz" does not specify any license.'
      ));
    });

    it('should fail with license violation if enabled', () => {
      const instance = licensePlugin({
        thirdParty: {
          allow: {
            test: 'MIT',
            failOnUnlicensed: false,
            failOnViolation: true,
          },
        },
      });

      instance.addDependency(unlicensedDependency);
      instance.addDependency(apache2Dependency);
      instance.addDependency(mitDependency);

      expect(() => instance.scanThirdParties()).toThrow(new Error(
          'Dependency "foo" has a license (Apache-2.0) which is not compatible with requirement, looks like a license violation to fix.'
      ));
    });

    function verifyWarnAboutApache2License() {
      expect(warn).toHaveBeenCalledWith(
          '[rollup-plugin-license] -- ' +
          'Dependency "foo" has a license (Apache-2.0) which is not compatible with requirement, ' +
          'looks like a license violation to fix.'
      );
    }

    function verifyWarnAboutUnlicensedLicense() {
      expect(warn).toHaveBeenCalledWith(
          '[rollup-plugin-license] -- Dependency "baz" does not specify any license.'
      );
    }
  });
});
