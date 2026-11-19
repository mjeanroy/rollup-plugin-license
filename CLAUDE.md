# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`rollup-plugin-license`: a Rollup plugin (peer: rollup 1–4) that (1) prepends a license banner to each generated chunk and (2) scans bundled modules to produce a third-party license summary and/or check licenses against an SPDX allow-list. Package manager is **pnpm** (CI pins 10.33.0). Use a recent version, because older versions silently ignore the supply-chain settings in `pnpm-workspace.yaml` such as `minimumReleaseAge`. Don't add `engines.pnpm`: it is published with the package and would affect plugin users; the source is ES modules compiled by Babel to a CommonJS `dist/index.js` (Node ≥ 14 target).

## Commands

All npm scripts go through gulp (`gulpfile.js` → `scripts/<task>/index.js`):

- `pnpm test`: clean → lint → build → run the Jasmine suite. **Lint errors and warnings both fail the test run**, and so does a build failure.
- `pnpm run lint`: ESLint (airbnb-base + `valid-jsdoc`, max line length 150) over root, `src`, `test`, `scripts`.
- `pnpm run lint --file src/person.js --file test`: lint only the given files, directories or globs (repeatable, relative to the repo root). Use it to check edited files quickly. Only the standalone `lint` task reads `--file`. When lint runs as part of `build`, `test` or a release, it always covers the whole project.
- `pnpm run build`: clean → lint → Rollup bundle to `dist/index.js`, and copies `src/index.d.ts` to `dist/`.
- `pnpm run tdd`: build once, then re-run the specs whenever a file changes.

Jasmine is configured inline in `scripts/test/index.js` (specs `test/**/*.spec.js`, helpers `test/helpers/**`, CommonJS loader; `@babel/register` comes from `gulpfile.js`). Specs import `src/` directly, so `pnpm run test:unit` (gulp `test:unit`) skips lint and build:

- `pnpm run test:unit`: whole suite.
- `pnpm run test:unit --file test/person.spec.js`: one file. `--file` can be repeated, and paths are relative to the repo root (or absolute), even when run from a subdirectory.
- `pnpm run test:unit --file test/person.spec.js --filter "should parse name and email"`: specs whose full name matches the filter (a regex).

`pnpm test` also accepts `--file`/`--filter`, but it still lints the whole project and builds first. Command-line flags are parsed in `scripts/cli/index.js`.

Global setup for every spec (custom equality testers for `Person`/`Dependency`) goes in `test/helpers/`, not in a spec file. Otherwise it won't load when a single file is run.

## Architecture

- `src/index.js`: the Rollup plugin adapter. `renderChunk` collects the ids of the chunk's rendered, non-asset modules, calls `scanDependencies`, then `prependBanner` (returns code plus a MagicString sourcemap unless `sourcemap: false`). `generateBundle` calls `scanThirdParties`.
- `src/license-plugin.js`: the `LicensePlugin` class, which holds the logic:
  - `scanDependency(id)` walks up from each module's directory to find the nearest `package.json` that has a valid name and version, or a license. That filters out `package.json` files that only set `"type"`. It reads `LICENSE`/`LICENCE`/`NOTICE` files through `read-file.js` (fdir, case-insensitive) and caches each directory it visits to its package. The walk stops at `cwd` (the project itself) unless `thirdParty.includeSelf` is set. Ids that start with `\0` are unprefixed, and ids that start with `virtual:` are skipped.
  - Dependencies are keyed by name, or by `name@version` when `thirdParty.multipleVersions` is set.
  - The banner is rendered as a lodash template with `pkg`, `dependencies`, `moment`, `_` and `data`, then wrapped in a comment using the `commenting` lib (`generate-block-comment.js`).
  - `scanThirdParties` filters out private packages and self (both opt-in), runs the license check (`license-validator.js`, spdx-satisfies), then writes the output files or calls the output callbacks.
- `src/license-plugin-option.js` + `schema-validator.js`/`schema-validators.js`: a small custom schema validator for the plugin options. Any new option must be added to `SCHEMA` there, or validation warns/fails. When adding an option, also update `src/index.d.ts` (the public typings, shipped as-is) and the README.
- `src/dependency.js` / `person.js`: normalized dependency model (author, contributors, maintainers, licenseText, noticeText, …) that gets exposed to templates and callbacks.

### Compatibility of the shipped code

`src/` is published for **Node ≥ 14** (`engines`) and **Rollup 1–4** (`peerDependencies`), but CI only tests on Node 18+ with the Rollup version in devDependencies, so a break would not be caught:

- Babel (`.babelrc`, target node 14) transpiles syntax only, not runtime APIs. Don't use Node APIs that Node 14 lacks (e.g. `util.parseArgs`, `fs.cp`, `structuredClone`, `Array.prototype.at`). Import core modules without the `node:` prefix (`import fs from 'fs'`), because the prefix needs Node 14.18+. This only applies to `src/`: `scripts/` and `test/` are dev-only and can use newer APIs.
- The plugin only relies on what Rollup 1 already offered: the `renderChunk` and `generateBundle` hooks, plus `chunk.modules` (with `renderedLength` / `isAsset`). Warnings go through `console.warn`, not the plugin context (`this.warn`). Keep new hooks and APIs within that baseline, or guard them.
- New runtime dependencies must also support Node 14 and be added to `dependencies`, which are kept external in `scripts/build/rollup.config.js`.

### Tests

- Unit specs mirror `src/` files one-to-one.
- `test/fixtures/fake-package-*` are fake `node_modules`-style packages used to exercise `package.json`/license lookup.
- `test/integration/it.spec.js` runs real Rollup bundles (with node-resolve, commonjs and virtual plugins) into a tmp dir.

## Conventions

- Every source/script/test file starts with the MIT license header block (the build strips it from inputs and adds the LICENSE file as the dist banner).
- `dist/` is not committed on master. The release task (`gulp release:*`, run from the GitHub `Release` workflow) force-adds `dist`, runs `npm version`, then removes `dist` again in a follow-up "prepare next release" commit.
- Commit messages follow Conventional Commits (`CHANGELOG.md` is generated by `gulp changelog`).
- CI tests on Node 18–26 on Linux, macOS and Windows, so keep filesystem path handling cross-platform. `format-path.js` is unrelated to filesystem paths: it formats option paths like `thirdParty.output[0]` in validation messages.
