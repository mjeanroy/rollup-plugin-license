/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2023 Mickael Jeanroy
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

var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var moment = require("moment");
var MagicString = require("magic-string");
var packageNameRegex = require("package-name-regex");
var commenting = require("commenting");
var spdxExpressionValidate = require("spdx-expression-validate");
var spdxSatisfies = require("spdx-satisfies");
var fdir = require("fdir");

const EOL = "\n";

/**
 * Person, defined by:
 * - A name.
 * - An email (optional).
 * - An URL (optional).
 */
class Person {
  /**
   * Create the person.
   *
   * If parameter is a string, it will be automatically parsed according to
   * this format: NAME <EMAIL> (URL) (where email and url are optional).
   *
   * @param {string|object} person The person identity.
   * @constructor
   */
  constructor(person) {
    let result = person;
    if (_.isString(result)) {
      const o = {};
      let current = "name";
      for (let i = 0, size = result.length; i < size; ++i) {
        const character = result.charAt(i);
        if (character === "<") {
          current = "email";
        } else if (character === "(") {
          current = "url";
        } else if (character !== ")" && character !== ">") {
          o[current] = (o[current] || "") + character;
        }
      }
      ["name", "email", "url"].forEach((prop) => {
        if (_.has(o, prop)) {
          o[prop] = _.trim(o[prop]);
        }
      });
      result = o;
    }
    this.name = result.name || null;
    this.email = result.email || null;
    this.url = result.url || null;
  }

  /**
   * Serialize the person to a string with the following format:
   *   NAME <EMAIL> (URL)
   *
   * @return {string} The person as a string.
   */
  text() {
    let text = `${this.name}`;
    if (this.email) {
      text += ` <${this.email}>`;
    }
    if (this.url) {
      text += ` (${this.url})`;
    }
    return text;
  }
}

/**
 * Dependency structure.
 */
class Dependency {
  /**
   * Create new dependency from package description.
   *
   * @param {Object} pkg Package description.
   * @param {boolean} self If the package is the "self" package.
   * @constructor
   */
  constructor(pkg, self) {
    this.self = self || false;
    this.name = pkg.name || null;
    this.maintainers = pkg.maintainers || [];
    this.version = pkg.version || null;
    this.description = pkg.description || null;
    this.repository = pkg.repository || null;
    this.homepage = pkg.homepage || null;
    this.private = pkg.private || false;
    this.license = pkg.license || null;
    this.licenseText = pkg.licenseText || null;
    this.noticeText = pkg.noticeText || null;

    // Parse the author field to get an object.
    this.author = pkg.author ? new Person(pkg.author) : null;

    // Parse the contributor array.
    this.contributors = _.castArray(pkg.contributors || []).map(
      (contributor) => new Person(contributor),
    );

    // The `licenses` field is deprecated but may be used in some packages.
    // Map it to a standard license field.
    if (!this.license && pkg.licenses) {
      // Map it to a valid license field.
      // See: https://docs.npmjs.com/files/package.json#license
      this.license = `(${pkg.licenses.map((license) => license.type || license).join(" OR ")})`;
    }
  }

  /**
   * Serialize dependency as a string.
   *
   * @return {string} The dependency correctly formatted.
   */
  text() {
    const lines = [];
    lines.push(`Name: ${this.name}`);
    lines.push(`Version: ${this.version}`);
    lines.push(`License: ${this.license}`);
    lines.push(`Private: ${this.private}`);
    if (this.description) {
      lines.push(`Description: ${this.description || false}`);
    }
    if (this.repository) {
      lines.push(`Repository: ${this.repository.url}`);
    }
    if (this.homepage) {
      lines.push(`Homepage: ${this.homepage}`);
    }
    if (this.author) {
      lines.push(`Author: ${this.author.text()}`);
    }
    if (this.contributors.length > 0) {
      lines.push("Contributors:");
      lines.push(
        ...this.contributors.map((contributor) => `  ${contributor.text()}`),
      );
    }
    if (this.licenseText) {
      lines.push("License Copyright:");
      lines.push("===");
      lines.push("");
      lines.push(this.licenseText);
      lines.push("");
    }
    if (this.noticeText) {
      lines.push("Notice:");
      lines.push("===");
      lines.push("");
      lines.push(this.noticeText);
      lines.push("");
    }
    return lines.join(EOL).trim();
  }
}

/**
 * Generate block comment from given text content.
 *
 * @param {string} text Text content.
 * @param {Object} commentStyle The comment style setting.
 * @return {string} Block comment.
 */
function generateBlockComment(text, commentStyle) {
  const options = {
    extension: ".js",
  };
  if (commentStyle) {
    options.style = new commenting.Style(
      commentStyle.body,
      commentStyle.start,
      commentStyle.end,
    );
  }
  return commenting(text.trim(), options);
}

/**
 * The plugin name.
 * @type {string}
 */
const PLUGIN_NAME = "rollup-plugin-license";

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
  return value == null;
}

/**
 * Check if given value is an `array`.
 *
 * @param {*} value The value to check.
 * @return {boolean} `true` if `value` is an array, `false` otherwise.
 */
function isArray(value) {
  return Array.isArray(value);
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
const validators = {
  string() {
    return {
      type: "object.type.string",
      message: "must be a string",
      schema: null,
      test: isString,
    };
  },
  boolean() {
    return {
      type: "object.type.boolean",
      message: "must be a boolean",
      schema: null,
      test: isBoolean,
    };
  },
  func() {
    return {
      type: "object.type.func",
      message: "must be a function",
      schema: null,
      test: isFunction,
    };
  },
  object(schema) {
    return {
      type: "object.type.object",
      message: "must be an object",
      schema,
      test: isObject,
    };
  },
  array(schema) {
    return {
      type: "object.type.array",
      message: "must be an array",
      schema,
      test: isArray,
    };
  },
  any() {
    return {
      type: "object.any",
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
  let str = "";
  paths.forEach((p) => {
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
  const matchedValidators = validators.filter((validator) =>
    validator.test(value),
  );

  // No one matched, we can stop here and return an error with a proper message.
  if (matchedValidators.length === 0) {
    return [
      {
        path,
        message: validators
          .map((validator) => `"${formatPath(path)}" ${validator.message}`)
          .join(" OR "),
      },
    ];
  }
  const outputs = [];
  for (let i = 0; i < matchedValidators.length; ++i) {
    const validator = matchedValidators[i];
    if (validator.schema) {
      outputs.push(...validate(value, validator.schema, path));
    }
  }
  return outputs;
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
  if (!obj) {
    return errors;
  }
  Object.keys(obj).forEach((k) => {
    const value = obj[k];
    if (value == null) {
      return;
    }
    const path = [...current, k];
    if (!_.has(schema, k)) {
      errors.push({
        type: "object.allowUnknown",
        path,
      });
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
  if (typeof item === "undefined") {
    return [
      {
        path,
        message: `"${formatPath(path)}" is undefined.`,
      },
    ];
  }
  if (item === null) {
    return [
      {
        path,
        message: `"${formatPath(path)}" is null.`,
      },
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
  const outputs = [];
  for (let idx = 0; idx < array.length; ++idx) {
    outputs.push(...validateArrayItem(array[idx], idx, schema, current));
  }
  return outputs;
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
  return Array.isArray(obj)
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
const SCHEMA = {
  sourcemap: [validators.string(), validators.boolean()],
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
      includeSelf: validators.boolean(),
      multipleVersions: validators.boolean(),
      allow: [
        validators.string(),
        validators.func(),
        validators.object({
          test: [validators.string(), validators.func()],
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
          template: [validators.string(), validators.func()],
        }),
        validators.array([
          validators.func(),
          validators.string(),
          validators.object({
            file: validators.string(),
            encoding: validators.string(),
            template: [validators.string(), validators.func()],
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
    if (e.type === "object.allowUnknown") {
      warn(
        `Unknown property: "${formatPath(e.path)}", allowed options are: ${_.keys(SCHEMA).join(", ")}.`,
      );
    } else {
      messages.push(e.message);
    }
  });
  if (messages.length > 0) {
    throw new Error(
      `[${PLUGIN_NAME}] -- Error during validation of option object: ${messages.join(" ; ")}`,
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
  validateOptions(options);
  return options;
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
  const license = normalizeLicense(dependency.license);
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
  const license = normalizeLicense(dependency.license);
  if (checkUnlicensed(license)) {
    return false;
  }
  return spdxExpressionValidate(license) && spdxSatisfies(license, allow);
}
const licenseValidator = {
  isUnlicensed,
  isValid,
};

/**
 * Find file and returns its content if file exists.
 *
 * @param {string} dir File directory.
 * @param {string|Array<string>} names Potential filenames.
 * @returns {string|null} File content, or `null` if file does not exist.
 */
function readFile(dir, names) {
  const inputs = _.castArray(names);
  // eslint-disable-next-line new-cap
  const finder = new fdir.fdir();
  for (let i = 0; i < inputs.length; ++i) {
    const input = inputs[i];
    const absolutePath = path.join(dir, input);
    const relativeToDir = path.relative(dir, absolutePath);
    const findings = finder
      .withRelativePaths()
      .withSymlinks()
      .withMaxDepth(input.split(path.sep).length)
      .filter(pathsMatch(relativeToDir))
      .crawl(dir)
      .sync();
    const firstPath = findings[0];
    if (firstPath) {
      const file = path.join(dir, firstPath);
      return fs.readFileSync(file, "utf-8");
    }
  }
  return null;
}

/**
 * Returns a predicate function that returns `true` if the given path matches the target path.
 *
 * @param {string} target Target path.
 * @returns {function(*): boolean} Predicate function.
 */
function pathsMatch(target) {
  const targetRegExp = generatePattern(target);
  return (p) => targetRegExp.test(p);
}

/**
 * Generate a pattern where all regexp special characters are escaped.
 * @param {string} input Input.
 * @returns {string} Escaped input.
 */
function escapeRegExp(input) {
  return input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
const FILE_FORBIDDEN_CHARACTERS = [
  "#",
  "%",
  "&",
  "*",
  ":",
  "<",
  ">",
  "?",
  "/",
  path.sep,
  "{",
  "|",
  "}",
].map((c) => escapeRegExp(c));
const FILE_SUFFIX_PTN = `[^${FILE_FORBIDDEN_CHARACTERS.join("")}]`;

/**
 * Generate filename pattern for the given input: the generated regexp will match any file
 * starting with `input` (case insensitively).
 *
 * @param {string} input Input.
 * @returns {RegExp} Generated pattern.
 */
function generatePattern(input) {
  return new RegExp(`^${input}(${FILE_SUFFIX_PTN})*$`, "i");
}

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
const COMMENT_STYLES = {
  regular: {
    start: "/**",
    body: " *",
    end: " */",
  },
  ignored: {
    start: "/*!",
    body: " *",
    end: " */",
  },
  slash: {
    start: "//",
    body: "//",
    end: "//",
  },
  none: null,
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
  const trimmedText = text.trim();
  const start = trimmedText.slice(0, 3);
  const startWithComment = start === "/**" || start === "/*!";
  return startWithComment ? "none" : "regular";
}

/**
 * Rollup Plugin.
 * @class
 */
class LicensePlugin {
  /**
   * Initialize plugin.
   *
   * @param {Object} options Plugin options.
   */
  constructor(options = {}) {
    // Plugin name, used by rollup.
    this.name = PLUGIN_NAME;

    // Initialize main options.
    this._options = options;
    this._cwd = this._options.cwd || process.cwd();
    this._dependencies = new Map();
    this._debug = this._options.debug || false;

    // eslint-disable-next-line import/no-dynamic-require, global-require
    this._pkg = require(path.join(this._cwd, "package.json"));

    // SourceMap can now be disable/enable on the plugin.
    this._sourcemap = this._options.sourcemap !== false;

    // This is a cache storing a directory path to associated package.
    // This is an improvement to avoid looking for package information for
    // already scanned directory.
    this._cache = new Map();
  }

  /**
   * Enable source map.
   *
   * @return {void}
   */
  disableSourceMap() {
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
  scanDependency(id) {
    var _this$_options$thirdP;
    if (id.startsWith("\0")) {
      // eslint-disable-next-line no-param-reassign
      id = id.replace(/^\0/, "");
      this.debug(`scanning internal module ${id}`);
    }
    if (id.indexOf("virtual:") === 0) {
      this.debug(`skipping virtual module: ${id}`);
      return;
    }
    this.debug(`scanning ${id}`);

    // Look for the `package.json` file
    let dir = path.resolve(path.parse(id).dir);
    let pkg = null;
    const includeSelf = !!(
      (_this$_options$thirdP = this._options.thirdParty) !== null &&
      _this$_options$thirdP !== void 0 &&
      _this$_options$thirdP.includeSelf
    );
    const scannedDirs = new Set();
    this.debug(`iterative over directory tree, starting with: ${dir}`);
    while (dir) {
      const isSelf = dir === this._cwd;
      if (isSelf && !includeSelf) {
        // No need to scan "self" if it's not explicitly allowed.
        break;
      }

      // Try the cache.
      if (this._cache.has(dir)) {
        pkg = this._cache.get(dir);
        if (pkg) {
          this.debug(`found package.json in cache (package: ${pkg.name})`);
          this.addDependency(pkg, isSelf);
        }
        break;
      }
      scannedDirs.add(dir);
      this.debug(`looking for package.json file in: ${dir}`);
      const pkgPath = path.join(dir, "package.json");
      const exists = fs.existsSync(pkgPath);
      if (exists) {
        this.debug(`found package.json at: ${pkgPath}, read it`);

        // Read `package.json` file
        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

        // We are probably in a package.json specifying the type of package (module, cjs).
        // Nevertheless, if the package name is not defined, we must not use this `package.json` descriptor.
        const license = pkgJson.license || pkgJson.licenses;
        const hasLicense = license && license.length > 0;
        const { name, version } = pkgJson;
        const isValidPackageName = name && packageNameRegex.test(name);
        if ((isValidPackageName && version) || hasLicense) {
          // We found it!
          pkg = pkgJson;
          const licenseText = readFile(dir, ["license", "licence"]);
          if (licenseText) {
            pkg.licenseText = licenseText;
          }
          const noticeText = readFile(dir, "notice");
          if (noticeText) {
            pkg.noticeText = noticeText;
          }

          // Add the new dependency to the set of third-party dependencies.
          this.addDependency(pkg, isSelf);

          // We can stop now.
          break;
        }
      }
      if (isSelf) {
        // If "self" has been scanned, no need to go up in the directory tree.
        break;
      }

      // Go up in the directory tree.
      dir = path.resolve(path.join(dir, ".."));
      if (!dir || scannedDirs.has(dir)) {
        break;
      }
      this.debug(`going up in the directory tree: ${dir}`);
    }

    // Update the cache
    scannedDirs.forEach((scannedDir) => {
      this._cache.set(scannedDir, pkg);
    });
  }

  /**
   * Hook triggered by `rollup` to load code from given path file.
   *
   * @param {Object} dependencies List of modules included in the final bundle.
   * @return {void}
   */
  scanDependencies(dependencies) {
    this.debug(`Scanning: ${dependencies}`);
    dependencies.forEach((dependency) => {
      this.scanDependency(dependency);
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
  prependBanner(code, sourcemap) {
    // Create a magicString: do not manipulate the string directly since it
    // will be used to generate the sourcemap.
    const magicString = new MagicString(code);
    const { banner } = this._options;
    const content = this._readBanner(banner);
    if (content) {
      magicString.prepend(EOL);
      magicString.prepend(this._generateBanner(content, banner));
    }
    const result = {
      code: magicString.toString(),
    };
    if (this._sourcemap !== false && sourcemap !== false) {
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
   * @param {boolean} self If the package is the "self" package.
   * @return {void}
   */
  addDependency(pkg, self) {
    var _this$_options$thirdP2;
    const name = pkg.name || "";
    if (!name) {
      this.warn("Trying to add dependency without any name, skipping it.");
      return;
    }
    const version = pkg.version || "";
    const key =
      (_this$_options$thirdP2 = this._options.thirdParty) !== null &&
      _this$_options$thirdP2 !== void 0 &&
      _this$_options$thirdP2.multipleVersions
        ? `${name}@${version}`
        : name;
    if (!this._dependencies.has(key)) {
      this._dependencies.set(key, new Dependency(pkg, self));
    }
  }

  /**
   * Scan third-party dependencies, and:
   * - Warn for license violations.
   * - Generate summary.
   *
   * @return {void}
   */
  scanThirdParties() {
    const { thirdParty } = this._options;
    if (!thirdParty) {
      return;
    }
    const includePrivate = thirdParty.includePrivate || false;
    const includeSelf = thirdParty.includeSelf || false;
    const outputDependencies = [...this._dependencies.values()].filter(
      (dependency) => {
        if (dependency.self && includeSelf) {
          return true;
        }
        if (!dependency.private) {
          return true;
        }
        return includePrivate;
      },
    );
    if (_.isFunction(thirdParty)) {
      thirdParty(outputDependencies);
      return;
    }
    const { allow, output } = thirdParty;
    if (allow) {
      this._scanLicenseViolations(outputDependencies, allow);
    }
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
  debug(msg) {
    if (this._debug) {
      console.debug(`[${this.name}] -- ${msg}`);
    }
  }

  /**
   * Log warn message.
   *
   * @param {string} msg Log message.
   * @return {void}
   */
  warn(msg) {
    console.warn(`[${this.name}] -- ${msg}`);
  }

  /**
   * Read banner from given options and returns it.
   *
   * @param {Object|string} banner Banner as a raw string, or banner options.
   * @return {string|null} The banner template.
   * @private
   */
  _readBanner(banner) {
    if (banner == null) {
      return null;
    }

    // Banner can be defined as a simple inline string.
    if (_.isString(banner)) {
      this.debug("prepend banner from raw string");
      return banner;
    }

    // Extract banner content.
    const content = _.result(banner, "content");

    // Content can be an inline string.
    if (_.isString(content)) {
      this.debug("prepend banner from content raw string");
      return content;
    }

    // Otherwise, file must be defined (if not, that's an error).
    if (!_.has(content, "file")) {
      throw new Error(
        `[${this.name}] -- Cannot find banner content, please specify an inline content, or a path to a file`,
      );
    }
    const { file } = content;
    const encoding = content.encoding || "utf-8";
    this.debug(`prepend banner from file: ${file}`);
    this.debug(`use encoding: ${encoding}`);
    const filePath = path.resolve(file);
    const exists = fs.existsSync(filePath);

    // Fail fast if file does not exist.
    if (!exists) {
      throw new Error(
        `[${this.name}] -- Template file ${filePath} does not exist, or cannot be read`,
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
  _generateBanner(content, banner) {
    // Create the template function with lodash.
    const tmpl = _.template(content);

    // Generate the banner.
    const pkg = this._pkg;
    const dependencies = [...this._dependencies.values()];
    const data = banner.data ? _.result(banner, "data") : {};
    const text = tmpl({
      _,
      moment,
      pkg,
      dependencies,
      data,
    });

    // Compute comment style to use.
    const style = _.has(banner, "commentStyle")
      ? banner.commentStyle
      : computeDefaultCommentStyle(text);

    // Ensure given style name is valid.
    if (!_.has(COMMENT_STYLES, style)) {
      throw new Error(
        `Unknown comment style ${style}, please use one of: ${_.keys(COMMENT_STYLES)}`,
      );
    }
    this.debug(`generate banner using comment style: ${style}`);
    return COMMENT_STYLES[style]
      ? generateBlockComment(text, COMMENT_STYLES[style])
      : text;
  }

  /**
   * Scan for dependency violations and print a warning if some violations are found.
   *
   * @param {Array<Dependency>} outputDependencies The dependencies to scan.
   * @param {string} allow The allowed licenses as a SPDX pattern.
   * @return {void}
   */
  _scanLicenseViolations(outputDependencies, allow) {
    outputDependencies.forEach((dependency) => {
      this._scanLicenseViolation(dependency, allow);
    });
  }

  /**
   * Scan dependency for a dependency violation.
   *
   * @param {Dependency} dependency The dependency to scan.
   * @param {string|function|object} allow The allowed licenses as a SPDX pattern, or a validator function.
   * @return {void}
   */
  _scanLicenseViolation(dependency, allow) {
    if (dependency.self) {
      // Do not validate license for the "self" package.
      // It's likely this package will use a private/proprietary license, and we only want to detect
      // violations for third party dependencies.
      return;
    }
    const testFn =
      _.isString(allow) || _.isFunction(allow) ? allow : allow.test;
    const isValid = _.isFunction(testFn)
      ? testFn(dependency)
      : licenseValidator.isValid(dependency, testFn);
    if (!isValid) {
      const failOnUnlicensed = allow.failOnUnlicensed === true;
      const failOnViolation = allow.failOnViolation === true;
      this._handleInvalidLicense(dependency, failOnUnlicensed, failOnViolation);
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
  _handleInvalidLicense(dependency, failOnUnlicensed, failOnViolation) {
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
  _handleUnlicensedDependency(dependency, fail) {
    const message = `Dependency "${dependency.name}" does not specify any license.`;
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
  _handleLicenseViolation(dependency, fail) {
    const message =
      `Dependency "${dependency.name}" has a license (${dependency.license}) which is not compatible with ` +
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
  _exportThirdParties(outputDependencies, outputs) {
    _.castArray(outputs).forEach((output) => {
      this._exportThirdPartiesToOutput(outputDependencies, output);
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
  _exportThirdPartiesToOutput(outputDependencies, output) {
    if (_.isFunction(output)) {
      output(outputDependencies);
      return;
    }

    // Default is to export to given file.

    // Allow custom formatting of output using given template option.
    const template = _.isString(output.template)
      ? (dependencies) =>
          _.template(output.template)({
            dependencies,
            _,
            moment,
          })
      : output.template;
    const defaultTemplate = (dependencies) =>
      dependencies.length === 0
        ? "No third parties dependencies"
        : dependencies.map((d) => d.text()).join(`${EOL}${EOL}---${EOL}${EOL}`);
    const text = _.isFunction(template)
      ? template(outputDependencies)
      : defaultTemplate(outputDependencies);
    const isOutputFile = _.isString(output);
    const file = isOutputFile ? output : output.file;
    const encoding = isOutputFile ? "utf-8" : output.encoding || "utf-8";
    this.debug(`exporting third-party summary to ${file}`);
    this.debug(`use encoding: ${encoding}`);

    // Create directory if it does not already exist.
    fs.mkdirSync(path.parse(file).dir, {
      recursive: true,
    });
    fs.writeFileSync(file, (text || "").trim(), {
      encoding,
    });
  }
}

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
 * Create rollup plugin compatible with rollup >= 1.0.0
 *
 * @param {Object} options Plugin options.
 * @return {Object} Plugin instance.
 */
function rollupPluginLicense(options = {}) {
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
      plugin.scanDependencies(dependencies);
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

module.exports = rollupPluginLicense;
