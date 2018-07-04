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

'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const moment = require('moment');
const MagicString = require('magic-string');
const Dependency = require('./dependency.js');
const generateBlockComment = require('./generate-block-comment.js');
const EOL = require('./eol.js');

/**
 * Rollup Plugin.
 */
class LicensePlugin {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  constructor(options = {}) {
    // Plugin name, used by rollup.
    this.name = 'rollup-plugin-license';

    this._options = options;
    this._cwd = options.cwd || process.cwd();
    this._dependencies = {};
    this._pkg = require(path.join(this._cwd, 'package.json'));
    this._debug = options.debug || false;

    // SourceMap can now be disable/enable on the plugin.
    this._sourceMap = options.sourceMap !== false && options.sourcemap !== false;

    // This is a cache storing a directory path to associated package.
    // This is an improvement to avoid looking for package information for
    // already scanned directory.
    this._cache = {};
  }

  /**
   * Enable source map.
   *
   * @return {void}
   */
  disableSourceMap() {
    this._sourceMap = false;
  }

  /**
   * Hook triggered by `rollup` to load code from given path file.
   *
   * This hook is used here to analyze a JavaScript file to extract
   * associated `package.json` file and store the main information about
   * it (license, author, etc.).
   *
   * This method is used to analyse all the files added to the final bundle
   * to extract license informations.
   *
   * @param {string} id Module identifier.
   * @return {void}
   */
  scanDependency(id) {
    this.debug(`scanning ${id}`);

    // Look for the `package.json` file
    let dir = path.parse(id).dir;
    let pkg = null;

    const scannedDirs = [];

    while (dir && dir !== this._cwd) {
      // Try the cache.
      if (_.has(this._cache, dir)) {
        pkg = this._cache[dir];
        if (pkg) {
          this.debug(`found package.json in cache (package: ${pkg.name})`);
          this.addDependency(pkg);
        }

        break;
      }

      scannedDirs.push(dir);

      const pkgPath = path.join(dir, 'package.json');
      const exists = fs.existsSync(pkgPath);
      if (exists) {
        this.debug(`found package.json at: ${pkgPath}, read it`);

        // Read `package.json` file
        pkg = require(pkgPath);

        // Add the new dependency to the set of third-party dependencies.
        this.addDependency(pkg);

        // We can stop now.
        break;
      }

      // Go up in the directory tree.
      dir = path.normalize(path.join(dir, '..'));
    }

    // Update the cache
    _.forEach(scannedDirs, (scannedDir) => {
      this._cache[scannedDir] = pkg;
    });
  }

  /**
   * Hook triggered by `rollup` to transform the final generated bundle.
   * This hook is used here to prepend the license banner to the final bundle.
   *
   * @param {string} code The bundle content.
   * @return {Object} The result containing the code and, optionnally, the source map
   *                  if it has been enabled (using `enableSourceMap` method).
   */
  prependBanner(code) {
    // Create a magicString: do not manipulate the string directly since it
    // will be used to generate the sourcemap.
    const magicString = new MagicString(code);

    const banner = this._options.banner;

    let content;
    if (_.isString(banner)) {
      this.debug('prepend banner from template');
      content = banner;
    } else if (banner) {
      const file = banner.file;
      this.debug(`prepend banner from file: ${file}`);

      const filePath = path.resolve(file);
      const exists = fs.existsSync(filePath);
      if (exists) {
        const encoding = banner.encoding || 'utf-8';
        this.debug(`use encoding: ${encoding}`);
        content = fs.readFileSync(filePath, encoding);
      } else {
        this.debug('template file does not exist, skip.');
      }
    }

    if (content) {
      // Create the template function with lodash.
      const tmpl = _.template(content);

      // Generate the banner.
      const pkg = this._pkg;
      const dependencies = _.values(this._dependencies);
      const data = banner.data ? _.result(banner, 'data') : {};

      let text = tmpl({_, moment, pkg, dependencies, data});

      // Make a block comment if needed
      const trimmedBanner = text.trim();
      const start = trimmedBanner.slice(0, 3);
      if (start !== '/**' && start !== '/*!') {
        text = generateBlockComment(text);
      }

      // Prepend the banner.
      magicString.prepend(`${text}${EOL}`);
    }

    const result = {
      code: magicString.toString(),
    };

    if (this._sourceMap) {
      result.map = magicString.generateMap({
        hires: true,
      });
    }

    return result;
  }

  /**
   * Add new dependency to the bundle descriptor.
   *
   * @param {Object} pkg Dependency package information.
   * @return {void}
   */
  addDependency(pkg) {
    const name = pkg.name;
    if (!_.has(this._dependencies, name)) {
      this._dependencies[name] = new Dependency(pkg);
    }
  }

  /**
   * Generate third-party dependencies summary.
   *
   * @param {boolean} includePrivate Flag that can be used to include / exclude private dependencies.
   * @return {void}
   */
  exportThirdParties() {
    const thirdParty = this._options.thirdParty;
    if (!thirdParty) {
      return;
    }

    const output = thirdParty.output;
    if (output) {
      this.debug(`exporting third-party summary to ${output}`);

      // Create directory if it does not already exist.
      mkdirp(path.parse(output).dir);

      const includePrivate = thirdParty.includePrivate;
      const text = _.chain(this._dependencies)
        .values()
        .filter((dependency) => includePrivate || !dependency.private)
        .map((dependency) => dependency.text())
        .join(`${EOL}${EOL}---${EOL}${EOL}`)
        .trim()
        .value();

      const encoding = thirdParty.encoding || 'utf-8';
      this.debug(`use encoding: ${encoding}`);

      fs.writeFileSync(output, text || 'No third parties dependencies', {
        encoding,
      });
    }
  }

  /**
   * Log debug message if debug mode is enabled.
   *
   * @param {string} msg Log message.
   */
  debug(msg) {
    if (this._debug) {
      console.log(`[${this.name}] -- ${msg}`);
    }
  }
}

module.exports = LicensePlugin;
