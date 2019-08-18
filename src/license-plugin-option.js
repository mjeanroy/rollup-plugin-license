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
const PLUGIN_NAME = require('./license-plugin-name.js');

const validators = {
  string() {
    return {
      type: 'object.type.string',
      message: 'must be a string',
      schema: null,
      test(value) {
        return _.isString(value);
      },
    };
  },

  boolean() {
    return {
      type: 'object.type.boolean',
      message: 'must be a boolean',
      schema: null,
      test(value) {
        return _.isBoolean(value);
      },
    };
  },

  func() {
    return {
      type: 'object.type.func',
      message: 'must be a function',
      schema: null,
      test(value) {
        return _.isFunction(value);
      },
    };
  },

  object(schema) {
    return {
      type: 'object.type.object',
      message: 'must be an object',
      schema,
      test(value) {
        return _.isObject(value) &&
          !_.isArray(value) &&
          !_.isFunction(value) &&
          !_.isNil(value) &&
          !_.isString(value) &&
          !_.isNumber(value);
      },
    };
  },

  array(schema) {
    return {
      type: 'object.type.array',
      message: 'must be an array',
      schema,
      test(value) {
        return _.isArray(value);
      },
    };
  },

  any() {
    return {
      type: 'object.any',
      message: null,
      schema: null,
      test: () => true,
    };
  },
};

/**
 * Format given array of path to a human readable path.
 *
 * @param {Array<string|number>} paths List of paths.
 * @return {string} The full path.
 */
function formatPath(paths) {
  let str = '';

  _.forEach(paths, (p) => {
    if (_.isNumber(p)) {
      str += `[${p}]`;
    } else if (!str) {
      str += p;
    } else {
      str += `.${p}`;
    }
  });

  return str;
}

/**
 * Validate value against given schema.
 * It is assumed that `value` will not be `null` or `undefined`.
 *
 * @param {*} value The value being validated.
 * @param {Array<Object>|Object} schema The validation schema.
 * @param {Array<string|number>} path The path being validated.
 * @returns {Array<Object>} Found errors.
 */
function doItemValidation(value, schema, path) {
  const validators = _.castArray(schema);
  const matchedValidators = _.filter(validators, (validator) => validator.test(value));

  // No one matched, we can stop here and return an error with a proper message.
  if (_.isEmpty(matchedValidators)) {
    return [
      {
        path,
        message: _.map(validators, (validator) => `"${formatPath(path)}" ${validator.message}`).join(' OR '),
      },
    ];
  }

  // Run "sub-validators"
  return _.chain(matchedValidators)
      .filter((validator) => validator.schema)
      .map((validator) => validate(value, validator.schema, path))
      .flatten()
      .value();
}

/**
 * Validate object against given schema.
 * Note that `null` or `undefined` is allowed and do not produce an error.
 *
 * @param {Object} obj The object to validate.
 * @param {Array<Object>|Object} schema The validation schema.
 * @param {Array<string|number>} current The current path being validated.
 * @returns {Array<Object>} Found errors.
 */
function validateObject(obj, schema, current) {
  const errors = [];

  _.forEach(obj, (value, k) => {
    if (_.isNil(value)) {
      return;
    }

    const path = [...current, k];

    if (!_.has(schema, k)) {
      errors.push({type: 'object.allowUnknown', path});
    } else {
      errors.push(...doItemValidation(value, schema[k], path));
    }
  });

  return errors;
}

/*
 * Validate element of an array.
 *
 * Instead of "classic" object validation, `null` and `undefined` will produce
 * an error here.
 *
 * @returns {Array<Object} Found errors.
 */

/**
 * Validate element of an array.
 *
 * Instead of "classic" object validation, `null` and `undefined` will produce
 * an error here.
 *
 * @param {*} item The item to validate.
 * @param {number} idx The index of item in original array.
 * @param {Array<Object>|Object} schema The validation schema.
 * @param {Array<string|number>} current The path being validated.
 * @return {Array<Object>} Found errors.
 */
function validateArrayItem(item, idx, schema, current) {
  const path = [...current, idx];

  if (_.isUndefined(item)) {
    return [{path, message: `"${formatPath(path)}" is undefined.`}];
  }

  if (_.isNull(item)) {
    return [{path, message: `"${formatPath(path)}" is null.`}];
  }

  return doItemValidation(item, schema, path);
}

/**
 * Validate all elements of given array against given schema (or array of schemas).
 *
 * @param {Array<*>} array Array of elements to validate.
 * @param {Array<Object>|Object} schema The schema to use for validation.
 * @param {string} current The path being validated.
 * @return {Array<Object>} Found errors.
 */
function validateArray(array, schema, current) {
  return _.chain(array)
      .map((item, idx) => validateArrayItem(item, idx, schema, current))
      .flatten()
      .value();
}

/**
 * Validate given object against given schema.
 *
 * Note that the very first version used `@hapi/joi` but this package does not support node < 8 in its latest version.
 * Since I don't want to depends on deprecated and non maintained packages, and I want to keep compatibility with
 * Node 6, I re-implemented the small part I needed here.
 *
 * Once node 6 will not be supported (probably with rollup >= 2), it will be time to drop this in favor of `@hapi/joi`
 * for example.
 *
 * @param {Object} obj Object to validate.
 * @param {Object} schema The schema against the given object will be validated.
 * @param {Array<string>} current The current path context of given object, useful to validate against subobject.
 * @return {Array<Object>} Found errors.
 */
function validate(obj, schema, current = []) {
  return _.isArray(obj) ? validateArray(obj, schema, current) : validateObject(obj, schema, current);
}

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
      allow: validators.string(),
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
 * Print a warning related to deprecated property.
 *
 * @param {string} deprecatedName The deprecated property name.
 * @param {*} name The new, non deprecated, name.
 * @return {void}
 */
function warnDeprecated(deprecatedName, name) {
  warn(
      `"${deprecatedName}" has been deprecated and will be removed in a future version, please use "${name}" instead.`
  );
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
  warnDeprecated('sourceMap', 'sourcemap');

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
    warnDeprecated('banner.file', 'banner.content.file');
  }

  // Print a warning to inform consumers that this option has been deprecated.
  if (containsDeprecatedEncoding) {
    warnDeprecated('banner.encoding', 'banner.content.encoding');
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

  warnDeprecated('thirdParty.encoding', 'thirdParty.output.encoding');

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
 * @return {Array} An array of all errors.
 */
function doValidation(options) {
  return validate(options, SCHEMA);
}

/**
 * Validate option object according to pre-defined schema.
 *
 * @param {Object} options Option object.
 * @return {void}
 */
function validateOptions(options) {
  const errors = doValidation(options);
  if (_.isEmpty(errors)) {
    return;
  }

  const messages = [];

  _.forEach(errors, (e) => {
    if (e.type === 'object.allowUnknown') {
      warn(`Unknown property: "${formatPath(e.path)}", allowed options are: ${_.keys(SCHEMA).join(', ')}.`);
    } else {
      messages.push(e.message);
    }
  });

  if (!_.isEmpty(messages)) {
    throw new Error(
        `[${PLUGIN_NAME}] -- Error during validation of option object: ${messages.join(' ; ')}`
    );
  }
}

/**
 * Normalize and validate option object.
 *
 * @param {Object} options Option object to validate.
 * @return {Object} New normalized options.
 */
module.exports = function licensePluginOption(options) {
  const normalizedOptions = normalizeOptions(options);

  validateOptions(normalizedOptions);

  return normalizedOptions;
};
