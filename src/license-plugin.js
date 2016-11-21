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

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const parseAuthor = require('parse-author');
const MagicString = require('magic-string');
const EOL = '\n';

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
    this._options = options;
    this._cwd = process.cwd();
    this._dependencies = {};
    this._pkg = require(path.join(this._cwd, 'package.json'));

    // This is a cache storing a directory path to associated package.
    // This is an improvement to avoid looking for package information for
    // already scanned directory.
    this._cache = {};
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
  load(id) {
    // Look for the `package.json` file
    let dir = path.parse(id).dir;
    let pkg = null;

    const scannedDirs = [];

    while (dir && dir !== this._cwd) {
      // Try the cache.
      if (_.has(this._cache, dir)) {
        pkg = this._cache[dir];
        if (pkg) {
          this.addDependency(pkg);
        }

        break;
      }

      scannedDirs.push(dir);

      const pkgPath = path.join(dir, 'package.json');
      const exists = fs.existsSync(pkgPath);
      if (exists) {
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
   * @return {Object} The result containing the code and, optionnally, the source map.
   */
  transformBundle(code) {
    const file = this._options.file || 'LICENSE';
    const filePath = path.resolve(file);

    const exists = fs.existsSync(filePath);
    if (!exists) {
      return {code};
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Create the template function with lodash.
    const tmpl = _.template(content);

    // Generate the banner.
    let banner = tmpl({
      _,
      moment,
      pkg: this._pkg,
      dependencies: _.values(this._dependencies),
    });

    // Make a block comment if needed
    const trimmedBanner = banner.trim();
    const start = trimmedBanner.slice(0, 3);
    if (start !== '/**') {
      const bannerContent = trimmedBanner
        .split(`${EOL}`)
        .map((line) => _.trimEnd(` * ${line}`))
        .join(`${EOL}`);

      banner = `/**${EOL}${bannerContent}${EOL} */${EOL}`;
    }

    // Create a magicString: do not manipulate the string directly since it
    // will be used to generate the sourcemap.
    const magicString = new MagicString(code);

    // Prepend the banner.
    magicString.prepend(`${banner}${EOL}`);

    // Create the result object.
    const result = {
      code: magicString.toString(),
    };

    // Add sourceMap information if it is enabled.
    if (this._options.sourceMap !== false) {
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
      const dependency = _.pick(pkg, [
        'name',
        'author',
        'contributors',
        'maintainers',
        'version',
        'description',
        'license',
        'licenses',
        'repository',
        'homepage',
        'private',
      ]);

      // Parse the author field to get an object.
      if (_.isString(dependency.author)) {
        dependency.author = parseAuthor(dependency.author);
      }

      // Parse the contributor array.
      if (dependency.contributors) {
        // Translate to an array if it is not already.
        if (_.isString(dependency.contributors)) {
          dependency.contributors = [dependency.contributors];
        }

        // Parse each contributor to produce a single object for each person.
        dependency.contributors = _.map(dependency.contributors, (contributor) => {
          return _.isString(contributor) ? parseAuthor(contributor) : contributor;
        });
      }

      // The `licenses` field is deprecated but may be used in some packages.
      // Map it to a standard license field.
      if (!dependency.license && dependency.licenses) {
        // Map it to a valid license field.
        // See: https://docs.npmjs.com/files/package.json#license
        dependency.license = `(${_.chain(dependency.licenses)
          .map((license) => license.type || license)
          .value()
          .join(' OR ')})`;

        // Remove it.
        delete dependency.licenses;
      }

      this._dependencies[name] = dependency;
    }
  }
}

module.exports = LicensePlugin;
