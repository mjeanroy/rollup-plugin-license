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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs');

var path = require('path');

var mkdirp = require('mkdirp');

var _ = require('lodash');

var moment = require('moment');

var MagicString = require('magic-string');

var Dependency = require('./dependency.js');

var generateBlockComment = require('./generate-block-comment.js');

var EOL = require('./eol.js');
/**
 * The list of avaiilable options.
 * @type {Set<string>}
 */


var OPTIONS = new Set(['cwd', 'debug', 'sourcemap', 'banner', 'thirdParty']);
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

var COMMENT_STYLES = {
  regular: {
    start: '/**',
    body: ' *',
    end: ' */'
  },
  ignored: {
    start: '/*!',
    body: ' *',
    end: ' */'
  },
  slash: {
    start: '//',
    body: '//',
    end: '//'
  },
  none: null
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
  var trimmedText = text.trim();
  var start = trimmedText.slice(0, 3);
  var startWithComment = start === '/**' || start === '/*!';
  return startWithComment ? 'none' : 'regular';
}
/**
 * The plugin name.
 * @type {string}
 */


var PLUGIN_NAME = 'rollup-plugin-license';
/**
 * Print for deprecated or unknown options according to the `OPTIONS`
 * set defined below.
 *
 * @param {Object} options The initialization option.
 * @return {void}
 */

function validateOptions(options) {
  var notSupported = _.reject(_.keys(options), function (key) {
    return OPTIONS.has(key);
  });

  if (notSupported.length > 0) {
    console.warn("[".concat(PLUGIN_NAME, "] Options ").concat(notSupported, " are not supported, use following options: ").concat(Array.from(OPTIONS)));
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
  var newOptions = _.omitBy(options, function (value, key) {
    return key === 'sourceMap';
  }); // If the old `sourceMap` key is used, set it to `sourcemap` key.


  if (_.hasIn(options, 'sourceMap')) {
    console.warn("[".concat(PLUGIN_NAME, "] sourceMap has been deprecated, please use sourcemap instead."));

    if (!_.hasIn(newOptions, 'sourcemap')) {
      newOptions.sourcemap = options.sourceMap;
    }
  } // Validate options.


  validateOptions(newOptions);
  return newOptions;
}
/**
 * Rollup Plugin.
 */


module.exports =
/*#__PURE__*/
function () {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  function LicensePlugin() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LicensePlugin);

    // Plugin name, used by rollup.
    this.name = PLUGIN_NAME; // Initialize main options.

    this._options = fixSourceMapOptions(options);
    this._cwd = this._options.cwd || process.cwd();
    this._dependencies = {};
    this._pkg = require(path.join(this._cwd, 'package.json'));
    this._debug = this._options.debug || false; // SourceMap can now be disable/enable on the plugin.

    this._sourcemap = this._options.sourcemap !== false; // This is a cache storing a directory path to associated package.
    // This is an improvement to avoid looking for package information for
    // already scanned directory.

    this._cache = {};
  }
  /**
   * Enable source map.
   *
   * @return {void}
   */


  _createClass(LicensePlugin, [{
    key: "disableSourceMap",
    value: function disableSourceMap() {
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

  }, {
    key: "scanDependency",
    value: function scanDependency(id) {
      var _this = this;

      if (id.startsWith('\0')) {
        id = id.replace(/^\0/, '');
        this.debug("scanning internal module ".concat(id));
      }

      this.debug("scanning ".concat(id)); // Look for the `package.json` file

      var dir = path.parse(id).dir;
      var pkg = null;
      var scannedDirs = [];

      while (dir && dir !== this._cwd) {
        // Try the cache.
        if (_.has(this._cache, dir)) {
          pkg = this._cache[dir];

          if (pkg) {
            this.debug("found package.json in cache (package: ".concat(pkg.name, ")"));
            this.addDependency(pkg);
          }

          break;
        }

        scannedDirs.push(dir);
        var pkgPath = path.join(dir, 'package.json');
        var exists = fs.existsSync(pkgPath);

        if (exists) {
          this.debug("found package.json at: ".concat(pkgPath, ", read it")); // Read `package.json` file

          pkg = require(pkgPath); // Add the new dependency to the set of third-party dependencies.

          this.addDependency(pkg); // We can stop now.

          break;
        } // Go up in the directory tree.


        dir = path.normalize(path.join(dir, '..'));
      } // Update the cache


      _.forEach(scannedDirs, function (scannedDir) {
        _this._cache[scannedDir] = pkg;
      });
    }
    /**
     * Hook triggered by `rollup` to load code from given path file.
     *
     * @param {Object} dependencies List of modules included in the final bundle.
     * @return {void}
     */

  }, {
    key: "scanDependencies",
    value: function scanDependencies(dependencies) {
      var _this2 = this;

      this.debug("Scanning: ".concat(dependencies));

      _.forEach(dependencies, function (dependency) {
        _this2.scanDependency(dependency);
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

  }, {
    key: "prependBanner",
    value: function prependBanner(code, sourcemap) {
      // Create a magicString: do not manipulate the string directly since it
      // will be used to generate the sourcemap.
      var magicString = new MagicString(code);
      var banner = this._options.banner;

      var content = this._readBanner(banner);

      if (content) {
        magicString.prepend(EOL);
        magicString.prepend(this._generateBanner(content, banner));
      }

      var result = {
        code: magicString.toString()
      };

      if (this._sourcemap !== false && sourcemap !== false) {
        result.map = magicString.generateMap({
          hires: true
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

  }, {
    key: "addDependency",
    value: function addDependency(pkg) {
      var name = pkg.name;

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

  }, {
    key: "exportThirdParties",
    value: function exportThirdParties() {
      var thirdParty = this._options.thirdParty;

      if (!thirdParty) {
        return;
      }

      var output = thirdParty.output;

      if (output) {
        this.debug("exporting third-party summary to ".concat(output)); // Create directory if it does not already exist.

        mkdirp(path.parse(output).dir);
        var includePrivate = thirdParty.includePrivate;

        var text = _.chain(this._dependencies).values().filter(function (dependency) {
          return includePrivate || !dependency["private"];
        }).map(function (dependency) {
          return dependency.text();
        }).join("".concat(EOL).concat(EOL, "---").concat(EOL).concat(EOL)).trim().value();

        var encoding = thirdParty.encoding || 'utf-8';
        this.debug("use encoding: ".concat(encoding));
        fs.writeFileSync(output, text || 'No third parties dependencies', {
          encoding: encoding
        });
      }
    }
    /**
     * Log debug message if debug mode is enabled.
     *
     * @param {string} msg Log message.
     * @return {void}
     */

  }, {
    key: "debug",
    value: function debug(msg) {
      if (this._debug) {
        console.log("[".concat(this.name, "] -- ").concat(msg));
      }
    }
    /**
     * Read banner from given options and returns it.
     *
     * @param {Object|string} banner Banner as a raw string, or banner options.
     * @return {string} The banner template.
     * @private
     */

  }, {
    key: "_readBanner",
    value: function _readBanner(banner) {
      if (!banner) {
        return '';
      }

      if (_.isString(banner)) {
        this.debug('prepend banner from template');
        return banner;
      }

      var file = banner.file;
      this.debug("prepend banner from file: ".concat(file));
      var filePath = path.resolve(file);
      var exists = fs.existsSync(filePath);

      if (!exists) {
        this.debug('template file does not exist, skip.');
        return '';
      }

      var encoding = banner.encoding || 'utf-8';
      this.debug("use encoding: ".concat(encoding));
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

  }, {
    key: "_generateBanner",
    value: function _generateBanner(content, banner) {
      // Create the template function with lodash.
      var tmpl = _.template(content); // Generate the banner.


      var pkg = this._pkg;

      var dependencies = _.values(this._dependencies);

      var data = banner.data ? _.result(banner, 'data') : {};
      var text = tmpl({
        _: _,
        moment: moment,
        pkg: pkg,
        dependencies: dependencies,
        data: data
      }); // Compute comment style to use.

      var style = _.has(banner, 'commentStyle') ? banner.commentStyle : computeDefaultCommentStyle(text); // Ensure given style name is valid.

      if (!_.has(COMMENT_STYLES, style)) {
        throw new Error("Unknown comment style ".concat(style, ", please use one of: ").concat(_.keys(COMMENT_STYLES)));
      }

      this.debug("generate banner using comment style: ".concat(style));
      return COMMENT_STYLES[style] ? generateBlockComment(text, COMMENT_STYLES[style]) : text;
    }
  }]);

  return LicensePlugin;
}();