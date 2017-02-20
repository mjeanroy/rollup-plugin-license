# rollup-plugin-license

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

module.exports ={
  plugins: [
    license({
      sourceMap: true,

      banner: {
        file: path.join(__dirname, 'LICENSE'),
      },

      thirdParty: {
        output: path.join(__dirname, 'dist', 'dependencies.txt'),
        includePrivate: true, // Default is false.
      },
    })
  ]
}
```

## Banner file

The banner file can be a text file and it will be converted to a block comment automatically if needed.

Note that the content will be translated to a lodash template with the following data model:
- `pkg`: The content of the project `package.json`.
- `dependencies`: An array of all the dependencies included in the bundle.
- `moment`: The `moment` object.
- `_`: The lodash object.

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

## License

MIT License (MIT)

## Contributing

If you find a bug or think about enhancement, feel free to contribute and submit an issue or a pull request.
