/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Mickael Jeanroy
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
 *
 */

"use strict";

function _interopDefault(ex) {
  return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
}

var rollup = require("rollup");
var _ = _interopDefault(require("lodash"));
var fs = _interopDefault(require("fs"));
var path = _interopDefault(require("path"));
var mkdirp = _interopDefault(require("mkdirp"));
var moment = _interopDefault(require("moment"));
var MagicString = _interopDefault(require("magic-string"));
var glob = _interopDefault(require("glob"));
var commenting = _interopDefault(require("commenting"));
var spdxExpressionValidate = _interopDefault(
  require("spdx-expression-validate")
);
var spdxSatisfies = _interopDefault(require("spdx-satisfies"));

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _toConsumableArray(arr) {
  return (
    _arrayWithoutHoles(arr) ||
    _iterableToArray(arr) ||
    _unsupportedIterableToArray(arr) ||
    _nonIterableSpread()
  );
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter))
    return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(n);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError(
    "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}

var EOL = "\n";

/**
 * Person, defined by:
 * - A name.
 * - An email (optional).
 * - An URL (optional).
 */

var Person = /*#__PURE__*/ (function() {
  /**
   * Create the person.
   *
   * If parameter is a string, it will be automatically parsed according to
   * this format: NAME <EMAIL> (URL) (where email and url are optional).
   *
   * @param {string|object} person The person identity.
   * @constructor
   */
  function Person(person) {
    _classCallCheck(this, Person);

    if (_.isString(person)) {
      var o = {};
      var current = "name";

      for (var i = 0, size = person.length; i < size; ++i) {
        var character = person.charAt(i);

        if (character === "<") {
          current = "email";
        } else if (character === "(") {
          current = "url";
        } else if (character !== ")" && character !== ">") {
          o[current] = (o[current] || "") + character;
        }
      }

      _.forEach(["name", "email", "url"], function(prop) {
        if (_.has(o, prop)) {
          o[prop] = _.trim(o[prop]);
        }
      });

      person = o;
    }

    this.name = person.name || null;
    this.email = person.email || null;
    this.url = person.url || null;
  }
  /**
   * Serialize the person to a string with the following format:
   *   NAME <EMAIL> (URL)
   *
   * @param {string} prefix Optional prefix prepended to the output string.
   * @param {string} suffix Optional suffix appended to the output string.
   * @return {string} The person as a string.
   */

  _createClass(Person, [
    {
      key: "text",
      value: function text() {
        var text = "".concat(this.name);

        if (this.email) {
          text += " <".concat(this.email, ">");
        }

        if (this.url) {
          text += " (".concat(this.url, ")");
        }

        return text;
      }
    }
  ]);

  return Person;
})();

/**
 * Dependency structure.
 */

var Dependency = /*#__PURE__*/ (function() {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @constructor
   */
  function Dependency(pkg) {
    _classCallCheck(this, Dependency);

    this.name = pkg.name || null;
    this.maintainers = pkg.maintainers || [];
    this.version = pkg.version || null;
    this.description = pkg.description || null;
    this.repository = pkg.repository || null;
    this.homepage = pkg.homepage || null;
    this["private"] = pkg["private"] || false;
    this.license = pkg.license || null;
    this.licenseText = pkg.licenseText || null; // Parse the author field to get an object.

    this.author = pkg.author ? new Person(pkg.author) : null; // Parse the contributor array.

    this.contributors = _.map(_.castArray(pkg.contributors || []), function(
      contributor
    ) {
      return new Person(contributor);
    }); // The `licenses` field is deprecated but may be used in some packages.
    // Map it to a standard license field.

    if (!this.license && pkg.licenses) {
      // Map it to a valid license field.
      // See: https://docs.npmjs.com/files/package.json#license
      this.license = "(".concat(
        _.chain(pkg.licenses)
          .map(function(license) {
            return license.type || license;
          })
          .join(" OR ")
          .value(),
        ")"
      );
    }
  }
  /**
   * Serialize dependency as a string.
   *
   * @return {string} The dependency correctly formatted.
   */

  _createClass(Dependency, [
    {
      key: "text",
      value: function text() {
        var lines = [];
        lines.push("Name: ".concat(this.name));
        lines.push("Version: ".concat(this.version));
        lines.push("License: ".concat(this.license));
        lines.push("Private: ".concat(this["private"]));

        if (this.description) {
          lines.push("Description: ".concat(this.description || false));
        }

        if (this.repository) {
          lines.push("Repository: ".concat(this.repository.url));
        }

        if (this.homepage) {
          lines.push("Homepage: ".concat(this.homepage));
        }

        if (this.author) {
          lines.push("Author: ".concat(this.author.text()));
        }

        if (!_.isEmpty(this.contributors)) {
          lines.push("Contributors:");

          var allContributors = _.chain(this.contributors)
            .map(function(contributor) {
              return contributor.text();
            })
            .map(function(line) {
              return "  ".concat(line);
            })
            .value();

          lines.push.apply(lines, _toConsumableArray(allContributors));
        }

        if (this.licenseText) {
          lines.push("License Copyright:");
          lines.push("===");
          lines.push("");
          lines.push(this.licenseText);
        }

        return lines.join(EOL);
      }
    }
  ]);

  return Dependency;
})();

/**
 * Generate block comment from given text content.
 *
 * @param {string} text Text content.
 * @param {Object} commentStyle The comment style setting.
 * @return {string} Block comment.
 */

function generateBlockComment(text, commentStyle) {
  var options = {
    extension: ".js"
  };

  if (commentStyle) {
    options.style = new commenting.Style(
      commentStyle.body,
      commentStyle.start,
      commentStyle.end
    );
  }

  return commenting(text.trim(), options);
}

/**
 * The plugin name.
 * @type {string}
 */
var PLUGIN_NAME = "rollup-plugin-license";

/**
 * Check if given value is a `string`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is a string, `false` otherwise.
 */

function isString(value) {
  return _.isString(value);
}
/**
 * Check if given value is a `boolean`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is a boolean, `false` otherwise.
 */

function isBoolean(value) {
  return _.isBoolean(value);
}
/**
 * Check if given value is a `function`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is a function, `false` otherwise.
 */

function isFunction(value) {
  return _.isFunction(value);
}
/**
 * Check if given value is a `number`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is a number, `false` otherwise.
 */

function isNumber(value) {
  return _.isNumber(value);
}
/**
 * Check if given value is `null` or `undefined`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is `null` or `undefined`, `false` otherwise.
 */

function isNil(value) {
  return _.isNil(value);
}
/**
 * Check if given value is an `array`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is an array, `false` otherwise.
 */

function isArray(value) {
  return _.isArray(value);
}
/**
 * Check if given value is an plain object.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is a plain object, `false` otherwise.
 */

function isObject(value) {
  return (
    _.isObject(value) &&
    !isArray(value) &&
    !isFunction(value) &&
    !isNil(value) &&
    !isString(value) &&
    !isNumber(value)
  );
}

var validators = {
  string: function string() {
    return {
      type: "object.type.string",
      message: "must be a string",
      schema: null,
      test: isString
    };
  },
  boolean: function boolean() {
    return {
      type: "object.type.boolean",
      message: "must be a boolean",
      schema: null,
      test: isBoolean
    };
  },
  func: function func() {
    return {
      type: "object.type.func",
      message: "must be a function",
      schema: null,
      test: isFunction
    };
  },
  object: function object(schema) {
    return {
      type: "object.type.object",
      message: "must be an object",
      schema: schema,
      test: isObject
    };
  },
  array: function array(schema) {
    return {
      type: "object.type.array",
      message: "must be an array",
      schema: schema,
      test: isArray
    };
  },
  any: function any() {
    return {
      type: "object.any",
      message: null,
      schema: null,
      test: function test() {
        return true;
      }
    };
  }
};

/**
 * Format given array of path to a human readable path.
 *
 * @param {Array<string|number>} paths List of paths.
 * @return {string} The full path.
 */

function formatPath(paths) {
  var str = "";

  _.forEach(paths, function(p) {
    if (_.isNumber(p)) {
      str += "[".concat(p, "]");
    } else if (!str) {
      str += p;
    } else {
      str += ".".concat(p);
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
  var validators = _.castArray(schema);

  var matchedValidators = _.filter(validators, function(validator) {
    return validator.test(value);
  }); // No one matched, we can stop here and return an error with a proper message.

  if (_.isEmpty(matchedValidators)) {
    return [
      {
        path: path,
        message: _.map(validators, function(validator) {
          return '"'.concat(formatPath(path), '" ').concat(validator.message);
        }).join(" OR ")
      }
    ];
  } // Run "sub-validators"

  return _.chain(matchedValidators)
    .filter(function(validator) {
      return validator.schema;
    })
    .map(function(validator) {
      return validate(value, validator.schema, path);
    })
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
  var errors = [];

  _.forEach(obj, function(value, k) {
    if (_.isNil(value)) {
      return;
    }

    var path = [].concat(_toConsumableArray(current), [k]);

    if (!_.has(schema, k)) {
      errors.push({
        type: "object.allowUnknown",
        path: path
      });
    } else {
      errors.push.apply(
        errors,
        _toConsumableArray(doItemValidation(value, schema[k], path))
      );
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
  var path = [].concat(_toConsumableArray(current), [idx]);

  if (_.isUndefined(item)) {
    return [
      {
        path: path,
        message: '"'.concat(formatPath(path), '" is undefined.')
      }
    ];
  }

  if (_.isNull(item)) {
    return [
      {
        path: path,
        message: '"'.concat(formatPath(path), '" is null.')
      }
    ];
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
    .map(function(item, idx) {
      return validateArrayItem(item, idx, schema, current);
    })
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

function validate(obj, schema) {
  var current =
    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  return _.isArray(obj)
    ? validateArray(obj, schema, current)
    : validateObject(obj, schema, current);
}
/**
 * Validate given object against given schema.
 *
 * @param {Object} obj Object to validate.
 * @param {Object} schema The schema against the given object will be validated.
 * @param {Array<string>} current The current path context of given object, useful to validate against subobject.
 * @return {Array<Object>} Found errors.
 */

function validateSchema(obj, schema, current) {
  return validate(obj, schema, current);
}

/**
 * The option object schema.
 * @type {Object}
 */

var SCHEMA = {
  sourcemap: [validators.string(), validators["boolean"]()],
  debug: validators["boolean"](),
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
          encoding: validators.string()
        })
      ]
    })
  ],
  thirdParty: [
    validators.func(),
    validators.object({
      includePrivate: validators["boolean"](),
      allow: [
        validators.string(),
        validators.func(),
        validators.object({
          test: [validators.string(), validators.func()],
          failOnUnlicensed: validators["boolean"](),
          failOnViolation: validators["boolean"]()
        })
      ],
      output: [
        validators.func(),
        validators.string(),
        validators.object({
          file: validators.string(),
          encoding: validators.string(),
          template: [validators.string(), validators.func()]
        }),
        validators.array([
          validators.func(),
          validators.string(),
          validators.object({
            file: validators.string(),
            encoding: validators.string(),
            template: [validators.string(), validators.func()]
          })
        ])
      ]
    })
  ]
};
/**
 * Print warning message to the console.
 *
 * @param {string} msg Message to log.
 * @return {void}
 */

function warn(msg) {
  console.warn("[".concat(PLUGIN_NAME, "] -- ").concat(msg));
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
    '"'
      .concat(
        deprecatedName,
        '" has been deprecated and will be removed in a future version, please use "'
      )
      .concat(name, '" instead.')
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
  if (!_.hasIn(options, "sourceMap")) {
    return options;
  } // Print a warning to inform consumers that this option has been deprecated.

  warnDeprecated("sourceMap", "sourcemap"); // Create new options object without the deprecated `sourceMap` entry.

  var newOptions = _.omitBy(options, function(value, key) {
    return key === "sourceMap";
  }); // If the old `sourceMap` key is used, set it to `sourcemap` key.
  // Be careful, do not override `sourcemap` if it already exists.

  if (!_.hasIn(newOptions, "sourcemap")) {
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
  if (!_.hasIn(options, "banner")) {
    return options;
  }

  var banner = options.banner;

  var containsDeprecatedFile = _.hasIn(banner, "file");

  var containsDeprecatedEncoding = _.hasIn(banner, "encoding"); // No need to do anything.

  if (!containsDeprecatedFile && !containsDeprecatedEncoding) {
    return options;
  } // Print a warning to inform consumers that this option has been deprecated.

  if (containsDeprecatedFile) {
    warnDeprecated("banner.file", "banner.content.file");
  } // Print a warning to inform consumers that this option has been deprecated.

  if (containsDeprecatedEncoding) {
    warnDeprecated("banner.encoding", "banner.content.encoding");
  } // Create new banner object without deprecated entries.

  var newBanner = _.omitBy(banner, function(value, key) {
    return key === "file" || key === "encoding";
  }); // Migrate deprecated properties to their new versions.

  if (!_.hasIn(newBanner, "content")) {
    newBanner.content = _.pick(banner, ["file", "encoding"]);
  }

  return _.extend({}, options, {
    banner: newBanner
  });
}
/**
 * Fix option object, replace `thirdParty.encoding` with `thirdParty.output.encoding`.
 *
 * @param {Object} options Original option object.
 * @return {Object} The new fixed option object.
 */

function fixThirdPartyOptions(options) {
  if (!_.hasIn(options, "thirdParty")) {
    return options;
  }

  var thirdParty = options.thirdParty;

  if (!_.hasIn(thirdParty, "encoding")) {
    return options;
  }

  warnDeprecated("thirdParty.encoding", "thirdParty.output.encoding");

  var newThirdParty = _.omitBy(thirdParty, function(value, key) {
    return key === "encoding";
  });

  if (_.isString(thirdParty.output)) {
    newThirdParty.output = {
      file: thirdParty.output,
      encoding: thirdParty.encoding
    };
  }

  return _.extend({}, options, {
    thirdParty: newThirdParty
  });
}
/**
 * Normalize option object by removing deprecated options and migrate these to the new version.
 *
 * @param {Object} options Option object.
 * @return {Object} Normalized option object.
 */

function normalizeOptions(options) {
  return _.reduce(
    [fixSourceMapOptions, fixBannerOptions, fixThirdPartyOptions],
    function(acc, fn) {
      return fn(acc);
    },
    options
  );
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
  var errors = doValidation(options);

  if (_.isEmpty(errors)) {
    return;
  }

  var messages = [];

  _.forEach(errors, function(e) {
    if (e.type === "object.allowUnknown") {
      warn(
        'Unknown property: "'
          .concat(formatPath(e.path), '", allowed options are: ')
          .concat(_.keys(SCHEMA).join(", "), ".")
      );
    } else {
      messages.push(e.message);
    }
  });

  if (!_.isEmpty(messages)) {
    throw new Error(
      "["
        .concat(PLUGIN_NAME, "] -- Error during validation of option object: ")
        .concat(messages.join(" ; "))
    );
  }
}
/**
 * Normalize and validate option object.
 *
 * @param {Object} options Option object to validate.
 * @return {Object} New normalized options.
 */

function licensePluginOptions(options) {
  var normalizedOptions = normalizeOptions(options);
  validateOptions(normalizedOptions);
  return normalizedOptions;
}

/**
 * Normalize license name:
 * - Returns `UNLICENSED` for nil parameter.
 * - Trim license value.
 *
 * @param {string} license The license name.
 * @return {string} The normalized license name.
 */

function normalizeLicense(license) {
  if (!license) {
    return "UNLICENSED";
  }

  return license.trim();
}
/**
 * Check if given license name is the `UNLICENSED` value.
 *
 * @param {string} license The license to check.
 * @return {boolean} `true` if `license` is the UNLICENSED one, `false` otherwise.
 */

function checkUnlicensed(license) {
  return license.toUpperCase() === "UNLICENSED";
}
/**
 * Check if dependency is unlicensed, or not.
 *
 * @param {Object} dependency The dependency.
 * @return {boolean} `true` if dependency does not have any license, `false` otherwise.
 */

function isUnlicensed(dependency) {
  var license = normalizeLicense(dependency.license);
  return checkUnlicensed(license);
}
/**
 * Check if license dependency is valid according to given SPDX validator pattern.
 *
 * @param {Object} dependency The dependency.
 * @param {string} allow The validator as a SPDX pattern.
 * @return {boolean} `true` if dependency license is valid, `false` otherwise.
 */

function isValid(dependency, allow) {
  var license = normalizeLicense(dependency.license);

  if (checkUnlicensed(license)) {
    return false;
  }

  return spdxExpressionValidate(license) && spdxSatisfies(license, allow);
}

var licenseValidator = {
  isUnlicensed: isUnlicensed,
  isValid: isValid
};

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
    start: "/**",
    body: " *",
    end: " */"
  },
  ignored: {
    start: "/*!",
    body: " *",
    end: " */"
  },
  slash: {
    start: "//",
    body: "//",
    end: "//"
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
  var startWithComment = start === "/**" || start === "/*!";
  return startWithComment ? "none" : "regular";
}
/**
 * Rollup Plugin.
 * @class
 */

var LicensePlugin = /*#__PURE__*/ (function() {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  function LicensePlugin() {
    var options =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LicensePlugin);

    // Plugin name, used by rollup.
    this.name = PLUGIN_NAME; // Initialize main options.

    this._options = options;
    this._cwd = this._options.cwd || process.cwd();
    this._dependencies = {};
    this._pkg = require(path.join(this._cwd, "package.json"));
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

  _createClass(LicensePlugin, [
    {
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
    },
    {
      key: "scanDependency",
      value: function scanDependency(id) {
        var _this = this;

        if (id.startsWith("\0")) {
          id = id.replace(/^\0/, "");
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
              this.debug(
                "found package.json in cache (package: ".concat(pkg.name, ")")
              );
              this.addDependency(pkg);
            }

            break;
          }

          scannedDirs.push(dir);
          var pkgPath = path.join(dir, "package.json");
          var exists = fs.existsSync(pkgPath);

          if (exists) {
            this.debug("found package.json at: ".concat(pkgPath, ", read it")); // Read `package.json` file

            pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")); // Read license file, if it exists.

            var licenseFile = glob.sync(path.join(dir, "LICENSE*"))[0];

            if (licenseFile) {
              pkg.licenseText = fs.readFileSync(licenseFile, "utf-8");
            } // Add the new dependency to the set of third-party dependencies.

            this.addDependency(pkg); // We can stop now.

            break;
          } // Go up in the directory tree.

          dir = path.normalize(path.join(dir, ".."));
        } // Update the cache

        _.forEach(scannedDirs, function(scannedDir) {
          _this._cache[scannedDir] = pkg;
        });
      }
      /**
       * Hook triggered by `rollup` to load code from given path file.
       *
       * @param {Object} dependencies List of modules included in the final bundle.
       * @return {void}
       */
    },
    {
      key: "scanDependencies",
      value: function scanDependencies(dependencies) {
        var _this2 = this;

        this.debug("Scanning: ".concat(dependencies));

        _.forEach(dependencies, function(dependency) {
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
    },
    {
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
    },
    {
      key: "addDependency",
      value: function addDependency(pkg) {
        var name = pkg.name;

        if (!_.has(this._dependencies, name)) {
          this._dependencies[name] = new Dependency(pkg);
        }
      }
      /**
       * Scan third-party dependencies, and:
       * - Warn for license violations.
       * - Generate summary.
       *
       * @param {boolean} includePrivate Flag that can be used to include / exclude private dependencies.
       * @return {void}
       */
    },
    {
      key: "scanThirdParties",
      value: function scanThirdParties() {
        var thirdParty = this._options.thirdParty;

        if (!thirdParty) {
          return;
        }

        var includePrivate = thirdParty.includePrivate || false;

        var outputDependencies = _.chain(this._dependencies)
          .values()
          .filter(function(dependency) {
            return includePrivate || !dependency["private"];
          })
          .value();

        if (_.isFunction(thirdParty)) {
          return thirdParty(outputDependencies);
        }

        var allow = thirdParty.allow;

        if (allow) {
          this._scanLicenseViolations(outputDependencies, allow);
        }

        var output = thirdParty.output;

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
    },
    {
      key: "debug",
      value: function debug(msg) {
        if (this._debug) {
          console.debug("[".concat(this.name, "] -- ").concat(msg));
        }
      }
      /**
       * Log warn message.
       *
       * @param {string} msg Log message.
       * @return {void}
       */
    },
    {
      key: "warn",
      value: function warn(msg) {
        console.warn("[".concat(this.name, "] -- ").concat(msg));
      }
      /**
       * Read banner from given options and returns it.
       *
       * @param {Object|string} banner Banner as a raw string, or banner options.
       * @return {string|null} The banner template.
       * @private
       */
    },
    {
      key: "_readBanner",
      value: function _readBanner(banner) {
        if (_.isNil(banner)) {
          return null;
        } // Banner can be defined as a simple inline string.

        if (_.isString(banner)) {
          this.debug("prepend banner from raw string");
          return banner;
        } // Extract banner content.

        var content = _.result(banner, "content"); // Content can be an inline string.

        if (_.isString(content)) {
          this.debug("prepend banner from content raw string");
          return content;
        } // Otherwise, file must be defined (if not, that's an error).

        if (!_.has(content, "file")) {
          throw new Error(
            "[".concat(
              this.name,
              "] -- Cannot find banner content, please specify an inline content, or a path to a file"
            )
          );
        }

        var file = content.file;
        var encoding = content.encoding || "utf-8";
        this.debug("prepend banner from file: ".concat(file));
        this.debug("use encoding: ".concat(encoding));
        var filePath = path.resolve(file);
        var exists = fs.existsSync(filePath); // Fail fast if file does not exist.

        if (!exists) {
          throw new Error(
            "["
              .concat(this.name, "] -- Template file ")
              .concat(filePath, " does not exist, or cannot be read")
          );
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
    },
    {
      key: "_generateBanner",
      value: function _generateBanner(content, banner) {
        // Create the template function with lodash.
        var tmpl = _.template(content); // Generate the banner.

        var pkg = this._pkg;

        var dependencies = _.values(this._dependencies);

        var data = banner.data ? _.result(banner, "data") : {};
        var text = tmpl({
          _: _,
          moment: moment,
          pkg: pkg,
          dependencies: dependencies,
          data: data
        }); // Compute comment style to use.

        var style = _.has(banner, "commentStyle")
          ? banner.commentStyle
          : computeDefaultCommentStyle(text); // Ensure given style name is valid.

        if (!_.has(COMMENT_STYLES, style)) {
          throw new Error(
            "Unknown comment style "
              .concat(style, ", please use one of: ")
              .concat(_.keys(COMMENT_STYLES))
          );
        }

        this.debug("generate banner using comment style: ".concat(style));
        return COMMENT_STYLES[style]
          ? generateBlockComment(text, COMMENT_STYLES[style])
          : text;
      }
      /**
       * Scan for dependency violations and print a warning if some violations are found.
       *
       * @param {Array<Object>} outputDependencies The dependencies to scan.
       * @param {string} allow The allowed licenses as a SPDX pattern.
       * @return {void}
       */
    },
    {
      key: "_scanLicenseViolations",
      value: function _scanLicenseViolations(outputDependencies, allow) {
        var _this3 = this;

        _.forEach(outputDependencies, function(dependency) {
          _this3._scanLicenseViolation(dependency, allow);
        });
      }
      /**
       * Scan dependency for a dependency violation.
       *
       * @param {Object} dependency The dependency to scan.
       * @param {string|function|object} allow The allowed licenses as a SPDX pattern, or a validator function.
       * @return {void}
       */
    },
    {
      key: "_scanLicenseViolation",
      value: function _scanLicenseViolation(dependency, allow) {
        var testFn =
          _.isString(allow) || _.isFunction(allow) ? allow : allow.test;
        var isValid = _.isFunction(testFn)
          ? testFn(dependency)
          : licenseValidator.isValid(dependency, testFn);

        if (!isValid) {
          var failOnUnlicensed = allow.failOnUnlicensed === true;
          var failOnViolation = allow.failOnViolation === true;

          this._handleInvalidLicense(
            dependency,
            failOnUnlicensed,
            failOnViolation
          );
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
    },
    {
      key: "_handleInvalidLicense",
      value: function _handleInvalidLicense(
        dependency,
        failOnUnlicensed,
        failOnViolation
      ) {
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
    },
    {
      key: "_handleUnlicensedDependency",
      value: function _handleUnlicensedDependency(dependency, fail) {
        var message = 'Dependency "'.concat(
          dependency.name,
          '" does not specify any license.'
        );

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
    },
    {
      key: "_handleLicenseViolation",
      value: function _handleLicenseViolation(dependency, fail) {
        var message =
          'Dependency "'
            .concat(dependency.name, '" has a license (')
            .concat(dependency.license, ") which is not compatible with ") +
          "requirement, looks like a license violation to fix.";

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
    },
    {
      key: "_exportThirdParties",
      value: function _exportThirdParties(outputDependencies, outputs) {
        var _this4 = this;

        _.forEach(_.castArray(outputs), function(output) {
          _this4._exportThirdPartiesToOutput(outputDependencies, output);
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
    },
    {
      key: "_exportThirdPartiesToOutput",
      value: function _exportThirdPartiesToOutput(outputDependencies, output) {
        if (_.isFunction(output)) {
          return output(outputDependencies);
        } // Default is to export to given file.
        // Allow custom formatting of output using given template option.

        var template = _.isString(output.template)
          ? function(dependencies) {
              return _.template(output.template)({
                dependencies: dependencies,
                _: _,
                moment: moment
              });
            }
          : output.template;

        var defaultTemplate = function defaultTemplate(dependencies) {
          return _.isEmpty(dependencies)
            ? "No third parties dependencies"
            : _.map(dependencies, function(d) {
                return d.text();
              }).join(
                ""
                  .concat(EOL)
                  .concat(EOL, "---")
                  .concat(EOL)
                  .concat(EOL)
              );
        };

        var text = _.isFunction(template)
          ? template(outputDependencies)
          : defaultTemplate(outputDependencies);

        var isOutputFile = _.isString(output);

        var file = isOutputFile ? output : output.file;
        var encoding = isOutputFile ? "utf-8" : output.encoding || "utf-8";
        this.debug("exporting third-party summary to ".concat(file));
        this.debug("use encoding: ".concat(encoding)); // Create directory if it does not already exist.

        mkdirp.sync(path.parse(file).dir);
        fs.writeFileSync(file, (text || "").trim(), {
          encoding: encoding
        });
      }
    }
  ]);

  return LicensePlugin;
})();
/**
 * Create new `rollup-plugin-license` instance with given
 * options.
 *
 * @param {Object} options Option object.
 * @return {LicensePlugin} The new instance.
 */

function licensePlugin(options) {
  return new LicensePlugin(licensePluginOptions(options));
}

/**
 * Create rollup plugin compatible with rollup < 1.0.0
 *
 * @param {Object} options Plugin options.
 * @return {Object} Plugin instance.
 */

function licensePluginLegacy() {
  var _options =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var plugin = licensePlugin(_options);
  return {
    /**
     * Name of the plugin, used automatically by rollup.
     * @type {string}
     */
    name: plugin.name,

    /**
     * Function called by rollup when a JS file is loaded: it is used to scan
     * third-party dependencies.
     *
     * @param {string} id JS file path.
     * @return {void}
     */
    load: function load(id) {
      plugin.scanDependency(id);
    },

    /**
     * Function called by rollup to read global options: if source map parameter
     * is truthy, enable it on the plugin.
     *
     * @param {object} opts Rollup options.
     * @return {void}
     */
    options: function options(opts) {
      if (!opts) {
        return;
      }

      if (_.has(_options, "sourceMap") || _.has(_options, "sourcemap")) {
        // SourceMap has been set on the plugin itself.
        return;
      } // Rollup >= 0.48 replace `sourceMap` with `sourcemap`.
      // If `sourcemap` is disabled globally, disable it on the plugin.

      if (opts.sourceMap === false || opts.sourcemap === false) {
        plugin.disableSourceMap();
      }
    },

    /**
     * Function called by rollup when the final bundle is generated: it is used
     * to prepend the banner file on the generated bundle.
     *
     * @param {string} code Bundle content.
     * @param {Object} outputOptions The options for this output.
     * @return {void}
     */
    transformBundle: function transformBundle(code) {
      var outputOptions =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var sourcemap =
        outputOptions.sourcemap !== false || outputOptions.sourceMap !== false;
      return plugin.prependBanner(code, sourcemap);
    },

    /**
     * Function called by rollup when the final bundle will be written on disk: it
     * is used to generate a file containing a summary of all third-party dependencies
     * with license information.
     *
     * @return {void}
     */
    ongenerate: function ongenerate() {
      plugin.scanThirdParties();
    }
  };
}

/**
 * Create rollup plugin compatible with rollup >= 1.0.0
 *
 * @param {Object} options Plugin options.
 * @return {Object} Plugin instance.
 */

function licensePluginStable() {
  var options =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var plugin = licensePlugin(options);
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
    renderChunk: function renderChunk(code, chunk) {
      var outputOptions =
        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      plugin.scanDependencies(
        _.chain(chunk.modules)
          .toPairs()
          .reject(function(mod) {
            return mod[1].isAsset;
          })
          .filter(function(mod) {
            return mod[1].renderedLength > 0;
          })
          .map(function(mod) {
            return mod[0];
          })
          .value()
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
    generateBundle: function generateBundle() {
      plugin.scanThirdParties();
    }
  };
}

var VERSION = rollup.VERSION;
var MAJOR_VERSION = VERSION ? Number(VERSION.split(".")[0]) : 0;
var IS_ROLLUP_LEGACY = MAJOR_VERSION === 0;
var plugin = IS_ROLLUP_LEGACY ? licensePluginLegacy : licensePluginStable;

module.exports = plugin;
