/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Mickael Jeanroy
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
import {formatPath} from './format-path.js';

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
 * Validate given object against given schema.
 *
 * @param {Object} obj Object to validate.
 * @param {Object} schema The schema against the given object will be validated.
 * @param {Array<string>} current The current path context of given object, useful to validate against subobject.
 * @return {Array<Object>} Found errors.
 */
export function validateSchema(obj, schema, current) {
  return validate(obj, schema, current);
}
