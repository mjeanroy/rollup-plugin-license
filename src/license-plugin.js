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

import fs from 'fs';
import path from 'path';
import {mkdirp} from 'mkdirp';
import _ from 'lodash';
import moment from 'moment';
import MagicString from 'magic-string';
import packageNameRegex from 'package-name-regex';

import {Dependency} from './dependency.js';
import {generateBlockComment} from './generate-block-comment.js';
import {licensePluginOptions} from './license-plugin-option.js';
import {licenseValidator} from './license-validator';
import {readFile} from './read-file';
import {PLUGIN_NAME} from './license-plugin-name.js';
import {EOL} from './eol.js';

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
    this._dependencies = new Map();
    this._pkg = require(path.join(this._cwd, 'package.json'));
    this._debug = this._options.debug || false;

    // SourceMap can now be disable/enable on the plugin.
    this._sourcemap = this._options.sourcemap !== false;

    // This is a cache storing a directory path to associated package.
    // This is an improvement to avoid looking for package information for
    // already scanned directory.
    this._cache = new Map();
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

    if (id.indexOf('virtual:') === 0) {
      this.debug(`skipping virtual module: ${id}`);
      return;
    }

    this.debug(`scanning ${id}`);

    // Look for the `package.json` file
    let dir = path.resolve(path.parse(id).dir);
    let pkg = null;

    const scannedDirs = new Set();

    this.debug(`iterative over directory tree, starting with: ${dir}`);

    while (dir && dir !== this._cwd && !scannedDirs.has(dir)) {
      // Try the cache.
      if (this._cache.has(dir)) {
        pkg = this._cache.get(dir);
        if (pkg) {
          this.debug(`found package.json in cache (package: ${pkg.name})`);
          this.addDependency(pkg);
        }

        break;
      }

      scannedDirs.add(dir);

      this.debug(`looking for package.json file in: ${dir}`);
      const pkgPath = path.join(dir, 'package.json');
      const exists = fs.existsSync(pkgPath);
      if (exists) {
        this.debug(`found package.json at: ${pkgPath}, read it`);

        // Read `package.json` file
        const pkgJson = JSON.parse(
            fs.readFileSync(pkgPath, 'utf-8'),
        );

        // We are probably in a package.json specifying the type of package (module, cjs).
        // Nevertheless, if the package name is not defined, we must not use this `package.json` descriptor.
        const license = pkgJson.license || pkgJson.licenses;
        const hasLicense = license && license.length > 0;
        const name = pkgJson.name;
        const version = pkgJson.version;
        const isValidPackageName = name && packageNameRegex.test(name);
        if ((isValidPackageName && version) || hasLicense) {
          // We found it!
          pkg = pkgJson;

          // Read license & notice files, if it exists.
          const cwd = this._cwd || process.cwd();

          const licenseText = readFile(dir, cwd, ['license', 'licence']);
          if (licenseText) {
            pkg.licenseText = licenseText;
          }

          const noticeText = readFile(dir, cwd, 'notice');
          if (noticeText) {
            pkg.noticeText = noticeText;
          }

          // Add the new dependency to the set of third-party dependencies.
          this.addDependency(pkg);

          // We can stop now.
          break;
        }
      }

      // Go up in the directory tree.
      dir = path.resolve(path.join(dir, '..'));
      this.debug(`going up in the directory tree: ${dir}`);
    }

    // Update the cache
    scannedDirs.forEach((scannedDir) => {
      this._cache.set(scannedDir, pkg);
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

    dependencies.forEach((dependency) => {
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
    const name = pkg.name || '';
    if (!name) {
      this.warn('Trying to add dependency without any name, skipping it.');
      return;
    }

    const version = pkg.version || '';
    const key = this._options.thirdParty?.multipleVersions ? `${name}@${version}` : name;
    if (!this._dependencies.has(key)) {
      this._dependencies.set(key, new Dependency(pkg));
    }
  }

  /**
   * Scan third-party dependencies, and:
   * - Warn for license violations.
   * - Generate summary.
   *
   * @return {void}
   */
  scanThirdParties() {
    const thirdParty = this._options.thirdParty;
    if (!thirdParty) {
      return;
    }

    const includePrivate = thirdParty.includePrivate || false;
    const outputDependencies = [...this._dependencies.values()].filter((dependency) => (
      includePrivate || !dependency.private
    ));

    if (_.isFunction(thirdParty)) {
      thirdParty(outputDependencies);
      return;
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
    if (banner == null) {
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
    const dependencies = [...this._dependencies.values()];
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
    outputDependencies.forEach((dependency) => {
      this._scanLicenseViolation(dependency, allow);
    });
  }

  /**
   * Scan dependency for a dependency violation.
   *
   * @param {Object} dependency The dependency to scan.
   * @param {string|function|object} allow The allowed licenses as a SPDX pattern, or a validator function.
   * @return {void}
   */
  _scanLicenseViolation(dependency, allow) {
    const testFn = _.isString(allow) || _.isFunction(allow) ? allow : allow.test;
    const isValid = _.isFunction(testFn) ? testFn(dependency) : licenseValidator.isValid(dependency, testFn);
    if (!isValid) {
      const failOnUnlicensed = allow.failOnUnlicensed === true;
      const failOnViolation = allow.failOnViolation === true;
      this._handleInvalidLicense(dependency, failOnUnlicensed, failOnViolation);
    }
  }

  /**
   * Handle invalid dependency:
   * - Print a warning for unlicensed dependency.
   * - Print a warning for dependency violation.
   *
   * @param {Object} dependency The dependency to scan.
   * @param {boolean} failOnUnlicensed `true` to fail on unlicensed dependency, `false` otherwise.
   * @param {boolean} failOnViolation `true` to fail on license violation, `false` otherwise.
   * @return {void}
   */
  _handleInvalidLicense(dependency, failOnUnlicensed, failOnViolation) {
    if (licenseValidator.isUnlicensed(dependency)) {
      this._handleUnlicensedDependency(dependency, failOnUnlicensed);
    } else {
      this._handleLicenseViolation(dependency, failOnViolation);
    }
  }

  /**
   * Handle unlicensed dependency: print a warning to the console to alert for the dependency
   * that should be fixed.
   *
   * @param {Object} dependency The dependency.
   * @param {boolean} fail `true` to fail instead of emitting a simple warning.
   * @return {void}
   */
  _handleUnlicensedDependency(dependency, fail) {
    const message = `Dependency "${dependency.name}" does not specify any license.`;

    if (!fail) {
      this.warn(message);
    } else {
      throw new Error(message);
    }
  }

  /**
   * Handle license violation: print a warning to the console to alert about the violation.
   *
   * @param {Object} dependency The dependency.
   * @param {boolean} fail `true` to fail instead of emitting a simple warning.
   * @return {void}
   */
  _handleLicenseViolation(dependency, fail) {
    const message =
      `Dependency "${dependency.name}" has a license (${dependency.license}) which is not compatible with ` +
      `requirement, looks like a license violation to fix.`;

    if (!fail) {
      this.warn(message);
    } else {
      throw new Error(message);
    }
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
    _.castArray(outputs).forEach((output) => {
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
      output(outputDependencies);
      return;
    }

    // Default is to export to given file.

    // Allow custom formatting of output using given template option.
    const template = _.isString(output.template) ? (dependencies) => _.template(output.template)({dependencies, _, moment}) : output.template;
    const defaultTemplate = (dependencies) => (
      dependencies.length === 0 ? 'No third parties dependencies' : dependencies.map((d) => d.text()).join(`${EOL}${EOL}---${EOL}${EOL}`)
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
export function licensePlugin(options) {
  return new LicensePlugin(
      licensePluginOptions(options),
  );
}
