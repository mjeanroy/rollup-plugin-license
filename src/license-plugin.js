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
const glob = require('glob');
const spdxExpressionValidate = require('spdx-expression-validate');
const spdxSatisfies = require('spdx-satisfies');

const Dependency = require('./dependency.js');
const generateBlockComment = require('./generate-block-comment.js');
const licensePluginOptions = require('./license-plugin-option.js');
const PLUGIN_NAME = require('./license-plugin-name.js');
const EOL = require('./eol.js');

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
 * Compute the comment style to use for given text:
 * - If text starts with a block comment, nothing is done (i.e use `none`).
 * - Otherwise, use the `regular` style.
 *
 * @param {string} text The text to comment.
 * @return {string} The comment style name.
 */
function computeDefaultCommentStyle(text) {
  const trimmedText = text.trim();
  const start = trimmedText.slice(0, 3);
  const startWithComment = start === '/**' || start === '/*!';
  return startWithComment ? 'none' : 'regular';
}

/**
 * Rollup Plugin.
 * @class
 */
class LicensePlugin {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  constructor(options = {}) {
    // Plugin name, used by rollup.
    this.name = PLUGIN_NAME;

    // Initialize main options.
    this._options = options;
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
        pkg = JSON.parse(
            fs.readFileSync(pkgPath, 'utf-8')
        );

        // Read license file, if it exists.
        const licenseFile = glob.sync(path.join(dir, 'LICENSE*'))[0];
        if (licenseFile) {
          pkg.licenseText = fs.readFileSync(licenseFile, 'utf-8');
        }

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
   * Scan third-party dependencies, and:
   * - Warn for license violations.
   * - Generate summary.
   *
   * @param {boolean} includePrivate Flag that can be used to include / exclude private dependencies.
   * @return {void}
   */
  scanThirdParties() {
    const thirdParty = this._options.thirdParty;
    if (!thirdParty) {
      return;
    }

    const includePrivate = thirdParty.includePrivate || false;
    const outputDependencies = _.chain(this._dependencies)
        .values()
        .filter((dependency) => includePrivate || !dependency.private)
        .value();

    if (_.isFunction(thirdParty)) {
      return thirdParty(outputDependencies);
    }

    const allow = thirdParty.allow;
    if (allow) {
      this._scanLicenseViolations(outputDependencies, allow);
    }

    const output = thirdParty.output;
    if (output) {
      this._exportThirdParties(outputDependencies, output);
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
      console.debug(`[${this.name}] -- ${msg}`);
    }
  }

  /**
   * Log warn message.
   *
   * @param {string} msg Log message.
   * @return {void}
   */
  warn(msg) {
    console.warn(`[${this.name}] -- ${msg}`);
  }

  /**
   * Read banner from given options and returns it.
   *
   * @param {Object|string} banner Banner as a raw string, or banner options.
   * @return {string|null} The banner template.
   * @private
   */
  _readBanner(banner) {
    if (_.isNil(banner)) {
      return null;
    }

    // Banner can be defined as a simple inline string.
    if (_.isString(banner)) {
      this.debug('prepend banner from raw string');
      return banner;
    }

    // Extract banner content.
    const content = _.result(banner, 'content');

    // Content can be an inline string.
    if (_.isString(content)) {
      this.debug('prepend banner from content raw string');
      return content;
    }

    // Otherwise, file must be defined (if not, that's an error).
    if (!_.has(content, 'file')) {
      throw new Error(`[${this.name}] -- Cannot find banner content, please specify an inline content, or a path to a file`);
    }

    const file = content.file;
    const encoding = content.encoding || 'utf-8';

    this.debug(`prepend banner from file: ${file}`);
    this.debug(`use encoding: ${encoding}`);

    const filePath = path.resolve(file);
    const exists = fs.existsSync(filePath);

    // Fail fast if file does not exist.
    if (!exists) {
      throw new Error(`[${this.name}] -- Template file ${filePath} does not exist, or cannot be read`);
    }

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
    const text = tmpl({_, moment, pkg, dependencies, data});

    // Compute comment style to use.
    const style = _.has(banner, 'commentStyle') ? banner.commentStyle : computeDefaultCommentStyle(text);

    // Ensure given style name is valid.
    if (!_.has(COMMENT_STYLES, style)) {
      throw new Error(`Unknown comment style ${style}, please use one of: ${_.keys(COMMENT_STYLES)}`);
    }

    this.debug(`generate banner using comment style: ${style}`);

    return COMMENT_STYLES[style] ? generateBlockComment(text, COMMENT_STYLES[style]) : text;
  }

  /**
   * Scan for dependency violations and print a warning if some violations are found.
   *
   * @param {Array<Object>} outputDependencies The dependencies to scan.
   * @param {string} allow The allowed licenses as a SPDX pattern.
   * @return {void}
   */
  _scanLicenseViolations(outputDependencies, allow) {
    _.forEach(outputDependencies, (dependency) => {
      this._scanLicenseViolation(dependency, allow);
    });
  }

  /**
   * Scan dependency for a dependency violation.
   *
   * @param {Object} dependency The dependency to scan.
   * @param {string} allow The allowed licenses as a SPDX pattern.
   * @return {void}
   */
  _scanLicenseViolation(dependency, allow) {
    const license = dependency.license || 'UNLICENSED';
    if (license === 'UNLICENSED') {
      this._handleUnlicensedDependency(dependency);
    } else if (!spdxExpressionValidate(license) || !spdxSatisfies(license, allow)) {
      this._handleLicenseViolation(dependency, allow);
    }
  }

  /**
   * Handle unlicensed dependency: print a warning to the console to alert for the dependency
   * that should be fixed.
   *
   * @param {Object} dependency The dependency.
   * @return {void}
   */
  _handleUnlicensedDependency(dependency) {
    this.warn(
        `Dependency "${dependency.name}" does not specify any license.`
    );
  }

  /**
   * Handle license violation: print a warning to the console to alert about the violation.
   *
   * @param {Object} dependency The dependency.
   * @param {*} allow The allowed expression.
   * @return {void}
   */
  _handleLicenseViolation(dependency, allow) {
    this.warn(
        `Dependency "${dependency.name}" has a license (${dependency.license}) which is not compatible with requirement (${allow}), ` +
        `looks like a license violation to fix.`
    );
  }

  /**
   * Export scanned third party dependencies to a destination output (a function, a
   * file written to disk, etc.).
   *
   * @param {Array<Object>} outputDependencies The dependencies to include in the output.
   * @param {Object|function|string|Array} outputs The output (or the array of output) destination.
   * @return {void}
   */
  _exportThirdParties(outputDependencies, outputs) {
    _.forEach(_.castArray(outputs), (output) => {
      this._exportThirdPartiesToOutput(outputDependencies, output);
    });
  }

  /**
   * Export scanned third party dependencies to a destination output (a function, a
   * file written to disk, etc.).
   *
   * @param {Array<Object>} outputDependencies The dependencies to include in the output.
   * @param {Array} output The output destination.
   * @return {void}
   */
  _exportThirdPartiesToOutput(outputDependencies, output) {
    if (_.isFunction(output)) {
      return output(outputDependencies);
    }

    // Default is to export to given file.

    // Allow custom formatting of output using given template option.
    const template = _.isString(output.template) ? (dependencies) => _.template(output.template)({dependencies, _, moment}) : output.template;
    const defaultTemplate = (dependencies) => (
      _.isEmpty(dependencies) ? 'No third parties dependencies' : _.map(dependencies, (d) => d.text()).join(`${EOL}${EOL}---${EOL}${EOL}`)
    );

    const text = _.isFunction(template) ? template(outputDependencies) : defaultTemplate(outputDependencies);
    const isOutputFile = _.isString(output);
    const file = isOutputFile ? output : output.file;
    const encoding = isOutputFile ? 'utf-8' : (output.encoding || 'utf-8');

    this.debug(`exporting third-party summary to ${file}`);
    this.debug(`use encoding: ${encoding}`);

    // Create directory if it does not already exist.
    mkdirp.sync(path.parse(file).dir);

    fs.writeFileSync(file, (text || '').trim(), {
      encoding,
    });
  }
}

/**
 * Create new `rollup-plugin-license` instance with given
 * options.
 *
 * @param {Object} options Option object.
 * @return {LicensePlugin} The new instance.
 */
module.exports = function licensePlugin(options) {
  return new LicensePlugin(
      licensePluginOptions(options)
  );
};
