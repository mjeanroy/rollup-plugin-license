# rollup-plugin-license

[![Greenkeeper badge](https://badges.greenkeeper.io/mjeanroy/rollup-plugin-license.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/mjeanroy/rollup-plugin-license.svg?branch=master)](https://travis-ci.org/mjeanroy/rollup-plugin-license)
[![Npm version](https://badge.fury.io/js/rollup-plugin-license.svg)](https://badge.fury.io/js/rollup-plugin-license)

Rollup plugin that can be used to:
- Prepend a banner from a file.
- Create a file containing all third-parties used in the bundle (and display the license of each dependency).

## How to use

Install the plugin with NPM:

```npm install --save-dev rollup-plugin-license```

Then add it to your rollup configuration:

```javascript
const path = require('path');
const license = require('rollup-plugin-license');

module.exports = {
  plugins: [
    license({
      sourcemap: true,
      cwd: '.', // Default is process.cwd()

      banner: {
        file: path.join(__dirname, 'LICENSE'),
        encoding: 'utf-8', // Default is utf-8

        // Optional, may be an object or a function returning an object.
        data() {
          return {
            foo: 'foo',
          };
        },
      },

      thirdParty: {
        output: path.join(__dirname, 'dist', 'dependencies.txt'),
        includePrivate: true, // Default is false.
        encoding: 'utf-8', // Default is utf-8.
      },
    }),
  ],
}
```

Since version 0.3.0, `banner` can be a simple string that will be used directly:

```javascript
const path = require('path');
const license = require('rollup-plugin-license');

module.exports = {
  plugins: [
    license({
      banner: `Copyright <%= moment().format('YYYY') %>`,
    }),
  ],
}
```

## Banner file

The banner file can be a text file and it will be converted to a block comment automatically if needed.

Note that the content will be translated to a lodash template with the following data model:
- `pkg`: The content of the project `package.json`.
- `dependencies`: An array of all the dependencies included in the bundle.
- `moment`: The `moment` object.
- `_`: The lodash object.
- `data` A custom data object, defined in banner options.

Here is a valid banner:

```text
Bundle of <%= pkg.name %>
Generated: <%= moment().format('YYYY-MM-DD') %>
Version: <%= pkg.version %>
Dependencies:
<% _.forEach(dependencies, function (dependency) { %>
  <%= dependency.name %> -- <%= dependency.version %>
<% }) %>
```

## Dependencies output

A file containing a summary of all dependencies can be generated automatically using the following options:

```javascript
license({
  thirdParty: {
    output: path.join(__dirname, 'dist', 'dependencies.txt'),
    includePrivate: true, // Default is false.
  },
})
```

## Comment style

Since version 0.10.0, it is possible to customize banner style using the `commentStyle` option:

```javascript
license({
  banner: {
    file: path.join(__dirname, 'LICENSE'),
    commentStyle: 'regular', // The default
  },
})
```

Following options are available:

- `regular`: "classic" comment block is used (this is the default), for example:

```javascript
/**
 * This is the `regular` style.
 */
```

- `ignored`: a comment block with prefix ignored by minifiers, for example:

```javascript
/*!
 * This is the `ignored` style.
 */
```

- `slash`: banner is prepended using "slash" comments, for example:

```javascript
//
// This is the `slash` style.
//
```

- `none`: nothing done, be careful to prepenbd a banner already "commented".

## Changelogs

- 0.10.0
  - Support different comment style for banner (see [#308](https://github.com/mjeanroy/rollup-plugin-license/issues/308)).
  - Do not include tree shaken dependencies (see [#380](https://github.com/mjeanroy/rollup-plugin-license/issues/380))
  - Various dependency updates.
- 0.9.0
  - Fix for `NULL` character (see [#1](https://github.com/mjeanroy/rollup-plugin-license/issues/1)).
  - Various dependency updates.
- 0.8.1
  - Add rollup as a peer dependency.
- 0.8.0
  - Deprecate `sourceMap` option (use `sourcemap` option in lowercase) to keep it consistent with rollup.
  - Fix deprecate call with rollup >= 1, keep compatibility with legacy versions of rollup.
  - Upgrade dependencies.
- 0.7.0
  - Add a way to specify custom data object when rendering banner.
  - Add `cwd` option to specify custom working directory (optional option).
  - Upgrade dependencies.
- 0.6.0
  - Upgrade `commenting` dependency.
- 0.5.0
  - Feat: Sourcemap is now enable by default to ensure compatibility with other rollup plugins.
  - Fix: Add compatibility with rollup >= 0.48.0 (the new `sourcemap` option).
  - Fix: Ensure plugin `sourcemp` is used instead of the "global" one in rollup options.
  - Chore: dependency updates.
- 0.4.0
  - Dependency update (`moment`).
  - Dependency update (`magic-string`).
- 0.3.0
  - Add encoding option for banner and third-party output file.
  - Banner can be a simple string.

## License

MIT License (MIT)

## Contributing

If you find a bug or think about enhancement, feel free to contribute and submit an issue or a pull request.
