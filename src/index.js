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
const Q = require('q');
const _ = require('lodash');
const moment = require('moment');
const MagicString = require('magic-string');

const EOL = '\n';

module.exports = function (options) {
  return {
    transformBundle(code) {
      const file = path.resolve(options.file);

      const deferred = Q.defer();

      fs.readFile(file, 'utf-8', (error, content) => {
        if (error) {
          return deferred.reject(error);
        }

        // Create the template function with lodash.
        const tmpl = _.template(content);

        // Generate the banner.
        let banner = tmpl({_, moment});

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
        if (options.sourceMap !== false) {
          result.map = magicString.generateMap({
            hires: true,
          });
        }

        // Everything is ok.
        return deferred.resolve(result);
      });

      return deferred.promise;
    },
  };
};
