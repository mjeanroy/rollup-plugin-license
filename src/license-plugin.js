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
const mkdirp = require('mkdirp');
const _ = require('lodash');
const moment = require('moment');
const MagicString = require('magic-string');
const Dependency = require('./dependency.js');
const generateBlockComment = require('./generate-block-comment.js');
const EOL = require('./eol.js');

/**
 * The list of avaiilable options.
 * @type {Set<string>}
 */
const OPTIONS = new Set([
  'cwd',
  'debug',
  'sourcemap',
  'banner',
  'thirdParty',
]);

/**
 * Pre-Defined comment style:
 *
 * - `regular` stands for "classic" block comment.
 * - `ignored` stands for block comment starting with standard prefix ignored by minifier.
 * - `slash` stands for "inline" style (i.e `//`).
 * - `none` stands for no comment style at all.
 *
 * @type {Object<string, Object>}
 */
const COMMENT_STYLES = {
  regular: {
    start: '/**',
    body: ' *',
    end: ' */',
  },

  ignored: {
    start: '/*!',
    body: ' *',
    end: ' */',
  },

  slash: {
    start: '//',
    body: '//',
    end: '//',
  },

  none: null,
};

/**
 * The plugin name.
 * @type {string}
 */
const PLUGIN_NAME = 'rollup-plugin-license';

/**
 * Print for deprecated or unknown options according to the `OPTIONS`
 * set defined below.
 *
 * @param {Object} options The initialization option.
 * @return {void}
 */
function validateOptions(options) {
  const notSupported = _.reject(_.keys(options), (key) => (
    OPTIONS.has(key)
  ));

  if (notSupported.length > 0) {
    console.warn(`[${PLUGIN_NAME}] Options ${notSupported} are not supported, use following options: ${Array.from(OPTIONS)}`);
  }
}

/**
 * Fix option object, replace `sourceMap` with `sourcemap` if needed.
 *
 * @param {Object} options Original option object.
 * @return {Object} The new fixed option object.
 */
function fixSourceMapOptions(options) {
  // Rollup <= 0.48 used `sourceMap` in camelcase, so this plugin used
  // this convention at the beginning.
  // Now, the `sourcemap` key should be used, but legacy version should still
  // be able to use the `sourceMap` key.
  const newOptions = _.omitBy(options, (value, key) => (
    key === 'sourceMap'
  ));

  // If the old `sourceMap` key is used, set it to `sourcemap` key.
  if (_.hasIn(options, 'sourceMap')) {
    console.warn(`[${PLUGIN_NAME}] sourceMap has been deprecated, please use sourcemap instead.`);
    if (!_.hasIn(newOptions, 'sourcemap')) {
      newOptions.sourcemap = options.sourceMap;
    }
  }

  // Validate options.
  validateOptions(newOptions);

  return newOptions;
}

/**
 * Rollup Plugin.
 */
module.exports = class LicensePlugin {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  constructor(options = {}) {
    // Plugin name, used by rollup.
    this.name = PLUGIN_NAME;

    // Initialize main options.
    this._options = fixSourceMapOptions(options);
    this._cwd = this._options.cwd || process.cwd();
    this._dependencies = {};
    this._pkg = require(path.join(this._cwd, 'package.json'));
    this._debug = this._options.debug || false;

    // SourceMap can now be disable/enable on the plugin.
    this._sourcemap = this._options.sourcemap !== false;

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
    this._sourcemap = false;
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
    if (id.startsWith('\0')) {
      id = id.replace(/^\0/, '');
      this.debug(`scanning internal module ${id}`);
    }

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
   * Hook triggered by `rollup` to load code from given path file.
   *
   * @param {Object} dependencies List of modules included in the final bundle.
   * @return {void}
   */
  scanDependencies(dependencies) {
    this.debug(`Scanning: ${dependencies}`);

    _.forEach(dependencies, (dependency) => {
      this.scanDependency(dependency);
    });
  }

  /**
   * Hook triggered by `rollup` to transform the final generated bundle.
   * This hook is used here to prepend the license banner to the final bundle.
   *
   * @param {string} code The bundle content.
   * @param {boolean} sourcemap If sourcemap must be generated.
   * @return {Object} The result containing the code and, optionnally, the source map
   *                  if it has been enabled (using `enableSourceMap` method).
   */
  prependBanner(code, sourcemap) {
    // Create a magicString: do not manipulate the string directly since it
    // will be used to generate the sourcemap.
    const magicString = new MagicString(code);

    const banner = this._options.banner;
    const content = this._readBanner(banner);
    if (content) {
      magicString.prepend(EOL);
      magicString.prepend(this._generateBanner(content, banner));
    }

    const result = {
      code: magicString.toString(),
    };

    if (this._sourcemap !== false && sourcemap !== false) {
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
   * @return {void}
   */
  debug(msg) {
    if (this._debug) {
      console.log(`[${this.name}] -- ${msg}`);
    }
  }

  /**
   * Read banner from given options and returns it.
   *
   * @param {Object|string} banner Banner as a raw string, or banner options.
   * @return {string} The banner template.
   * @private
   */
  _readBanner(banner) {
    if (!banner) {
      return '';
    }

    if (_.isString(banner)) {
      this.debug('prepend banner from template');
      return banner;
    }

    const file = banner.file;
    this.debug(`prepend banner from file: ${file}`);

    const filePath = path.resolve(file);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      this.debug('template file does not exist, skip.');
      return '';
    }

    const encoding = banner.encoding || 'utf-8';
    this.debug(`use encoding: ${encoding}`);
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * Generate banner output from given raw string and given options.
   *
   * Banner output will be a JavaScript comment block, comment style may be customized using
   * the `commentStyle` option.
   *
   * @param {string} content Banner content, as a raw string.
   * @param {Object} banner Banner options.
   * @return {string} The banner output.
   * @private
   */
  _generateBanner(content, banner) {
    // Create the template function with lodash.
    const tmpl = _.template(content);

    // Generate the banner.
    const pkg = this._pkg;
    const dependencies = _.values(this._dependencies);
    const data = banner.data ? _.result(banner, 'data') : {};
    const text = tmpl({
      _,
      moment,
      pkg,
      dependencies,
      data,
    });

    // Make a block comment if needed
    const trimmedBanner = text.trim();
    const start = trimmedBanner.slice(0, 3);
    const startWithComment = start === '/**' || start === '/*!';

    if (!startWithComment) {
      const style = _.has(banner, 'commentStyle') ? banner.commentStyle : 'regular';
      if (!_.has(COMMENT_STYLES, style)) {
        throw new Error(`Unknown comment style ${style}, please use one of: ${_.keys(COMMENT_STYLES)}`);
      }

      const commentStyle = COMMENT_STYLES[style];
      if (commentStyle) {
        return generateBlockComment(text, commentStyle);
      }
    }

    return text;
  }
};
