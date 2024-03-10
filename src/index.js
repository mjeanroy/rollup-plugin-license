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

import {licensePlugin} from './license-plugin.js';

/**
 * Create rollup plugin compatible with rollup >= 1.0.0
 *
 * @param {Object} options Plugin options.
 * @return {Object} Plugin instance.
 */
export default function rollupPluginLicense(options = {}) {
  const plugin = licensePlugin(options);

  return {
    /**
     * Name of the plugin, used automatically by rollup.
     * @type {string}
     */
    name: plugin.name,

    /**
     * Function called by rollup when the final bundle is generated: it is used
     * to prepend the banner file on the generated bundle.
     *
     * @param {string} code Bundle content.
     * @param {Object} chunk The chunk being generated.
     * @param {Object} outputOptions The options for the generated output.
     * @return {void}
     */
    renderChunk(code, chunk, outputOptions = {}) {
      const dependencies = [];

      if (chunk.modules) {
        Object.keys(chunk.modules).forEach((id) => {
          const mod = chunk.modules[id];
          if (mod && !mod.isAsset && mod.renderedLength > 0) {
            dependencies.push(id);
          }
        });
      }

      plugin.scanDependencies(
          dependencies,
      );

      return plugin.prependBanner(code, outputOptions.sourcemap !== false);
    },

    /**
     * Function called by rollup when the final bundle will be written on disk: it
     * is used to generate a file containing a summary of all third-party dependencies
     * with license information.
     *
     * @return {void}
     */
    generateBundle() {
      plugin.scanThirdParties();
    },
  };
}
