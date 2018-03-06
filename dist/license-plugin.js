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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
 * Rollup Plugin.
 */

var LicensePlugin = function () {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  function LicensePlugin() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LicensePlugin);

    // Plugin name, used by rollup.
    this.name = 'rollup-plugin-license';

    this._options = options;
    this._cwd = process.cwd();
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


  _createClass(LicensePlugin, [{
    key: 'disableSourceMap',
    value: function disableSourceMap() {
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

  }, {
    key: 'scanDependency',
    value: function scanDependency(id) {
      var _this = this;

      this.debug('scanning ' + id);

      // Look for the `package.json` file
      var dir = path.parse(id).dir;
      var pkg = null;

      var scannedDirs = [];

      while (dir && dir !== this._cwd) {
        // Try the cache.
        if (_.has(this._cache, dir)) {
          pkg = this._cache[dir];
          if (pkg) {
            this.debug('found package.json in cache (package: ' + pkg.name + ')');
            this.addDependency(pkg);
          }

          break;
        }

        scannedDirs.push(dir);

        var pkgPath = path.join(dir, 'package.json');
        var exists = fs.existsSync(pkgPath);
        if (exists) {
          this.debug('found package.json at: ' + pkgPath + ', read it');

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
      _.forEach(scannedDirs, function (scannedDir) {
        _this._cache[scannedDir] = pkg;
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

  }, {
    key: 'prependBanner',
    value: function prependBanner(code) {
      // Create a magicString: do not manipulate the string directly since it
      // will be used to generate the sourcemap.
      var magicString = new MagicString(code);

      var banner = this._options.banner;

      var content = void 0;
      if (_.isString(banner)) {
        this.debug('prepend banner from template');
        content = banner;
      } else if (banner) {
        var file = banner.file;
        this.debug('prepend banner from file: ' + file);

        var filePath = path.resolve(file);
        var exists = fs.existsSync(filePath);
        if (exists) {
          var encoding = banner.encoding || 'utf-8';
          this.debug('use encoding: ' + encoding);
          content = fs.readFileSync(filePath, encoding);
        } else {
          this.debug('template file does not exist, skip.');
        }
      }

      if (content) {
        // Create the template function with lodash.
        var tmpl = _.template(content);

        // Generate the banner.
        var pkg = this._pkg;
        var dependencies = _.values(this._dependencies);
        var text = tmpl({ _: _, moment: moment, pkg: pkg, dependencies: dependencies });

        // Make a block comment if needed
        var trimmedBanner = text.trim();
        var start = trimmedBanner.slice(0, 3);
        if (start !== '/**' && start !== '/*!') {
          text = generateBlockComment(text);
        }

        // Prepend the banner.
        magicString.prepend('' + text + EOL);
      }

      var result = {
        code: magicString.toString()
      };

      if (this._sourceMap) {
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
    key: 'addDependency',
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
    key: 'exportThirdParties',
    value: function exportThirdParties() {
      var thirdParty = this._options.thirdParty;
      if (!thirdParty) {
        return;
      }

      var output = thirdParty.output;
      if (output) {
        this.debug('exporting third-party summary to ' + output);

        // Create directory if it does not already exist.
        mkdirp(path.parse(output).dir);

        var includePrivate = thirdParty.includePrivate;
        var text = _.chain(this._dependencies).values().filter(function (dependency) {
          return includePrivate || !dependency.private;
        }).map(function (dependency) {
          return dependency.text();
        }).join('' + EOL + EOL + '---' + EOL + EOL).trim().value();

        var encoding = thirdParty.encoding || 'utf-8';
        this.debug('use encoding: ' + encoding);

        fs.writeFileSync(output, text || 'No third parties dependencies', {
          encoding: encoding
        });
      }
    }

    /**
     * Log debug message if debug mode is enabled.
     *
     * @param {string} msg Log message.
     */

  }, {
    key: 'debug',
    value: function debug(msg) {
      if (this._debug) {
        console.log('[' + this.name + '] -- ' + msg);
      }
    }
  }]);

  return LicensePlugin;
}();

module.exports = LicensePlugin;