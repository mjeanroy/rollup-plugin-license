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

import _ from 'lodash';
import {PLUGIN_NAME} from './license-plugin-name.js';
import {validators} from './schema-validators.js';
import {validateSchema} from './schema-validator.js';
import {formatPath} from './format-path.js';

/**
 * The option object schema.
 * @type {Object}
 */
const SCHEMA = {
  sourcemap: [
    validators.string(),
    validators.boolean(),
  ],

  debug: validators.boolean(),
  cwd: validators.string(),

  banner: [
    validators.func(),
    validators.string(),
    validators.object({
      commentStyle: validators.string(),
      data: validators.any(),
      content: [
        validators.func(),
        validators.string(),
        validators.object({
          file: validators.string(),
          encoding: validators.string(),
        }),
      ],
    }),
  ],

  thirdParty: [
    validators.func(),
    validators.object({
      includePrivate: validators.boolean(),

      allow: [
        validators.string(),
        validators.func(),
        validators.object({
          test: [
            validators.string(),
            validators.func(),
          ],

          failOnUnlicensed: validators.boolean(),
          failOnViolation: validators.boolean(),
        }),
      ],

      output: [
        validators.func(),
        validators.string(),
        validators.object({
          file: validators.string(),
          encoding: validators.string(),
          template: [
            validators.string(),
            validators.func(),
          ],
        }),

        validators.array([
          validators.func(),
          validators.string(),
          validators.object({
            file: validators.string(),
            encoding: validators.string(),
            template: [
              validators.string(),
              validators.func(),
            ],
          }),
        ]),
      ],
    }),
  ],
};

/**
 * Print warning message to the console.
 *
 * @param {string} msg Message to log.
 * @return {void}
 */
function warn(msg) {
  console.warn(`[${PLUGIN_NAME}] -- ${msg}`);
}

/**
 * Validate given option object.
 *
 * @param {Object} options Option object.
 * @return {Array} An array of all errors.
 */
function doValidation(options) {
  return validateSchema(options, SCHEMA);
}

/**
 * Validate option object according to pre-defined schema.
 *
 * @param {Object} options Option object.
 * @return {void}
 */
function validateOptions(options) {
  const errors = doValidation(options);
  if (errors.length === 0) {
    return;
  }

  const messages = [];

  errors.forEach((e) => {
    if (e.type === 'object.allowUnknown') {
      warn(`Unknown property: "${formatPath(e.path)}", allowed options are: ${_.keys(SCHEMA).join(', ')}.`);
    } else {
      messages.push(e.message);
    }
  });

  if (messages.length > 0) {
    throw new Error(
        `[${PLUGIN_NAME}] -- Error during validation of option object: ${messages.join(' ; ')}`,
    );
  }
}

/**
 * Normalize and validate option object.
 *
 * @param {Object} options Option object to validate.
 * @return {Object} New normalized options.
 */
export function licensePluginOptions(options) {
  validateOptions(options);
  return options;
}
