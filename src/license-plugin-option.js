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

const _ = require('lodash');
const Joi = require('@hapi/joi');
const PLUGIN_NAME = require('./license-plugin-name.js');

const SCHEMA = {
  sourcemap: [
    Joi.string(),
    Joi.boolean(),
  ],

  debug: Joi.boolean(),
  cwd: Joi.string(),

  banner: [
    Joi.func(),
    Joi.string(),
    Joi.object().keys({
      commentStyle: Joi.string(),
      data: Joi.any(),
      content: [
        Joi.func(),
        Joi.string(),
        Joi.object().keys({
          file: Joi.string(),
          encoding: Joi.string(),
        }),
      ],
    }),
  ],

  thirdParty: [
    Joi.func(),
    Joi.object().keys({
      includePrivate: Joi.boolean(),
      output: [
        Joi.func(),
        Joi.string(),
        Joi.object().keys({
          file: Joi.string(),
          encoding: Joi.string(),
          template: [
            Joi.string(),
            Joi.func(),
          ],
        }),
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
 * Fix option object, replace `sourceMap` with `sourcemap` if needed.
 *
 * Rollup <= 0.48 used `sourceMap` in camelcase, so this plugin used
 * this convention at the beginning.
 * Now, the `sourcemap` key should be used, but legacy version should still
 * be able to use the `sourceMap` key.
 *
 * @param {Object} options Original option object.
 * @return {Object} The new fixed option object.
 */
function fixSourceMapOptions(options) {
  if (!_.hasIn(options, 'sourceMap')) {
    return options;
  }

  // Print a warning to inform consumers that this option has been deprecated.
  warn(`"sourceMap" has been deprecated and will be removed in a future version, please use "sourcemap" instead.`);

  // Create new options object without the deprecated `sourceMap` entry.
  const newOptions = _.omitBy(options, (value, key) => (
    key === 'sourceMap'
  ));

  // If the old `sourceMap` key is used, set it to `sourcemap` key.
  // Be careful, do not override `sourcemap` if it already exists.
  if (!_.hasIn(newOptions, 'sourcemap')) {
    newOptions.sourcemap = options.sourceMap;
  }

  return newOptions;
}

/**
 * Fix option object, replace `banner.file` with `banner.content.file`
 * and `banner.encoding` with `banner.content.encoding` if needed.
 *
 * @param {Object} options Original option object.
 * @return {Object} The new fixed option object.
 */
function fixBannerOptions(options) {
  if (!_.hasIn(options, 'banner')) {
    return options;
  }

  const banner = options.banner;
  const containsDeprecatedFile = _.hasIn(banner, 'file');
  const containsDeprecatedEncoding = _.hasIn(banner, 'encoding');

  // No need to do anything.
  if (!containsDeprecatedFile && !containsDeprecatedEncoding) {
    return options;
  }

  // Print a warning to inform consumers that this option has been deprecated.
  if (containsDeprecatedFile) {
    warn(`"banner.file" has been deprecated and will be removed in a future version, please use "banner.content.file" instead.`);
  }

  // Print a warning to inform consumers that this option has been deprecated.
  if (containsDeprecatedEncoding) {
    warn(`"banner.encoding" has been deprecated and will be removed in a future version, please use "banner.content.encoding" instead.`);
  }

  // Create new banner object without deprecated entries.
  const newBanner = _.omitBy(banner, (value, key) => (
    key === 'file' || key === 'encoding'
  ));

  // Migrate deprecated properties to their new versions.
  if (!_.hasIn(newBanner, 'content')) {
    newBanner.content = _.pick(banner, ['file', 'encoding']);
  }

  return _.extend({}, options, {
    banner: newBanner,
  });
}

/**
 * Fix option object, replace `thirdParty.encoding` with `thirdParty.output.encoding`.
 *
 * @param {Object} options Original option object.
 * @return {Object} The new fixed option object.
 */
function fixThirdPartyOptions(options) {
  if (!_.hasIn(options, 'thirdParty')) {
    return options;
  }

  const thirdParty = options.thirdParty;
  if (!_.hasIn(thirdParty, 'encoding')) {
    return options;
  }

  warn(
      '"thirdParty.encoding" has been deprecated and will be removed in a future version, ' +
      'please use "thirdParty.output.encoding" instead.'
  );

  const newThirdParty = _.omitBy(thirdParty, (value, key) => (
    key === 'encoding'
  ));

  if (_.isString(thirdParty.output)) {
    newThirdParty.output = {
      file: thirdParty.output,
      encoding: thirdParty.encoding,
    };
  }

  return _.extend({}, options, {
    thirdParty: newThirdParty,
  });
}

/**
 * Normalize option object by removing deprecated options and migrate these to the new version.
 *
 * @param {Object} options Option object.
 * @return {Object} Normalized option object.
 */
function normalizeOptions(options) {
  return _.reduce([fixSourceMapOptions, fixBannerOptions, fixThirdPartyOptions], (acc, fn) => fn(acc), options);
}

/**
 * Validate given option object.
 *
 * @param {Object} options Option object.
 * @param {boolean} allowUnknown A flag to check if unknown options should results in an error.
 * @return {Array} An array of all errors.
 */
function doValidation(options, allowUnknown) {
  const result = Joi.validate(options, SCHEMA, {
    abortEarly: false,
    convert: false,
    allowUnknown,
  });

  const err = result.error;
  if (!err) {
    return [];
  }

  return err.details;
}

/**
 * Print a warning for each unknown option entries.
 *
 * @param {Object} options Option object.
 * @return {void}
 */
function printForUnknownProperties(options) {
  const errors = doValidation(options, false);
  if (errors.length === 0) {
    return;
  }

  const allowUnknownErrors = _.filter(errors, (e) => e.type === 'object.allowUnknown');
  if (allowUnknownErrors.length > 0) {
    _.forEach(allowUnknownErrors, (e) => (
      warn(`Unknown property: "${e.path.join('.')}", allowed options are: ${_.keys(SCHEMA).join(', ')}.`))
    );
  }
}

/**
 * Validate option object according to pre-defined schema.
 *
 * @param {Object} options Option object.
 * @return {void}
 */
function validateOptions(options) {
  const errors = doValidation(options, true);
  if (errors.length === 0) {
    return;
  }

  const messages = _.map(errors, (e) => e.message).join(' ; ');
  const message = `[${PLUGIN_NAME}] -- Error during validation of option object: ${messages}`;
  throw new Error(message);
}

/**
 * Normalize and validate option object.
 *
 * @param {Object} options Option object to validate.
 * @return {Object} New normalized options.
 */
module.exports = function licensePluginOption(options) {
  const normalizedOptions = normalizeOptions(options);

  printForUnknownProperties(normalizedOptions);
  validateOptions(normalizedOptions);

  return normalizedOptions;
};
