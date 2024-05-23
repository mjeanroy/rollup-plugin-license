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

import type { Plugin } from 'rollup';

type FilePath = string;
type FileEncoding = string;
type FactoryFn<T> = () => T;
type Factory<T> = T | FactoryFn<T>;

/**
 * A person, as described in NPM documentation.
 *
 * @see https://docs.npmjs.com/cli/v7/configuring-npm/package-json#people-fields-author-contributors
 */
export interface Person {
  /**
   * Person Name.
   */
  readonly name: string;

  /**
   * Person Email.
   */
  readonly email: string | null;

  /**
   * Person URL.
   */
   readonly url: string | null;

  /**
   * Turns the person into a formatted string
   * @returns formatted person info
   */
  text: () => string;
}

/**
 * @see {@link https://github.com/mjeanroy/rollup-plugin-license#comment-style}
 */
export type CommentStyle = 'regular' | 'ignored' | 'slash' | 'none';

/**
 * Banner content descriptor.
 */
interface BannerContentOptions {
  /**
   * File to get banner content from.
   */
  file: FilePath;

  /**
   * File encoding.
   * @default utf-8
   */
  encoding?: FileEncoding;
}

/**
 * Banner content, can be:
 * - A raw string, evaluated as a (lodash) template.
 * - A file description, the content being read and evaluated as a (lodash) template.
 */
type BannerContent = string | BannerContentOptions;

/**
 * Data injected during banner "rendering" (i.e evaluated as template
 * model).
 */
interface BannerContentData {
  [key: string]: any;
}

/**
 * Banner Options.
 */
interface BannerOptions {
  content: Factory<BannerContent>;
  commentStyle?: CommentStyle;
  data?: Factory<BannerContentData>;
}

export type Banner = string | BannerOptions;

/**
 * Dependency Repository Description.
 */
interface DependencyRepository {
  /**
   * Repository URL.
   */
  readonly url: string;

  /**
   * Repository Type (git, svn, etc.).
   */
  readonly type: string;
}

/**
 * Dependency information is derived from the package.json file
 */
export interface Dependency {
  /**
   * Dependency Name.
   */
  readonly name: string | null;

  /**
   * Dependency Maintainers list.
   */
  readonly maintainers: string[];

  /**
   * Dependency Version.
   */
  readonly version: string | null;

  /**
   * Dependency Description.
   */
  readonly description: string | null;

  /**
   * Dependency Repository Location.
   */
  readonly repository: string | DependencyRepository | null;

  /**
   * Repository Public Homepage.
   */
  readonly homepage: string | null;

  /**
   * If dependency is private.
   */
  readonly private: boolean;

  /**
   * SPDX License short ID.
   */
  readonly license: string | null;

  /**
   * Full License file text.
   */
  readonly licenseText: string | null;

  /**
   * Full notice file text.
   */
  readonly noticeText: string | null;

  /**
   * Author information.
   */
  readonly author: Person | null;

  /**
   * Dependency Contributes list.
   */
  readonly contributors: Person[];

  /**
   * Turns the dependency into a formatted string
   * @returns formatted dependency license info
   */
  text: () => string;
}

/**
 * SPDX Licence Identifier.
 */
type SpdxId = string;

/**
 * Function checking dependency license validity.
 */
type ThirdPartyDependencyValidatorFn = (dependency: Dependency) => boolean;

type ThirdPartyValidator = SpdxId | ThirdPartyDependencyValidatorFn;

interface ThirdPartyAllowOptions {
  /**
   * Testing if the license if valid
   */
  test: ThirdPartyValidator;

  /**
   * Fail if a dependency does not specify any licenses
   * @default false
   */
  failOnUnlicensed?: boolean;

  /**
   * Fail if a dependency specify a license that does not match given requirement
   * @default false
   */
  failOnViolation?: boolean;
}

/**
 * Output generator: may write a file to disk, or something else as long as it is a
 * synchronous operation.
 */
type ThirdPartyOutputGeneratorFn = (dependencies: Dependency[]) => void;

/**
 * Template as a raw string.
 */
type ThirdPartyOutputTemplate = string;

/**
 * Template function.
 */
type ThirdPartyOutputTemplateFn = (dependencies: Dependency[]) => void;

/**
 * Third Party output options object.
 */
interface ThirdPartyOutputOptions {
  /**
   * Name of file to write licenses to
   */
  file: FilePath;

  /**
   * @default utf-8
   */
  encoding?: FileEncoding;

  /**
   * Template function that can be defined to customize report output.
   *
   * @example
   *   template(dependencies) {
   *     return dependencies.map((dependency) => (
   *       `${dependency.name}:${dependency.version} -- ${dependency.license}`).join('\n')
   *     );
   *   },
   *
   *   // Lodash template that can be defined to customize report output
   *   template: `
   *     <% _.forEach(dependencies, function (dependency) { %>
   *       <%= dependency.name %>:<%= dependency.version%> -- <%= dependency.license %>
   *     <% }) %>
   *   `
   */
  template?: ThirdPartyOutputTemplate | ThirdPartyOutputTemplateFn;
}

type ThirdPartyOutput = FilePath | ThirdPartyOutputGeneratorFn | ThirdPartyOutputOptions;

interface ThirdPartyOptions {
  /**
   * Output for third party report.
   */
  output: ThirdPartyOutput | ThirdPartyOutput[];

  /**
   * If private dependencies should be checked (`private: true` in package.json)
   * @default false
   */
  includePrivate?: boolean;

  /**
   * If "self" should be checked and included in the output.
   * In this context, "self" means the package being built.
   * @default false
   */
  includeSelf?: boolean;

  /**
   * Ensures that dependencies does not violate any license restriction.
   *
   * For example, suppose you want to limit dependencies with MIT or Apache-2.0
   * licenses, simply define the restriction:
   *
   * @example
   *   {
   *     allow: '(MIT OR Apache-2.0)'
   *   }
   *
   *   allow(dependency) {
   *     return dependency.license === 'MIT';
   *   }
   */
  allow?: ThirdPartyValidator | ThirdPartyAllowOptions;

  /**
   * Track each dependency version as a different dependency.
   * Particularly useful when a dependency changed its licensing between versions.
   * Default is `false` far backward compatibility.
   */
  multipleVersions?: boolean;
}

export type ThirdParty = ThirdPartyOutputGeneratorFn | ThirdPartyOptions;

export interface Options {
  sourcemap?: boolean | string;

  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;

  /**
   * Current Working Directory
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * License banner to place at the top of your bundle
   */
  banner?: Factory<Banner>;

  /**
   * For third party dependencies.
   * Creates a file containing a summary of all dependencies can be generated
   * automatically
   */
  thirdParty?: ThirdParty;
}

declare function rollupPluginLicense(options: Options): Plugin;

export default rollupPluginLicense;
