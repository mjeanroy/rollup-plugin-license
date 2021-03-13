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
 */

import type { Plugin } from "rollup";

interface Person {
    readonly name: string,
    readonly email: string | null,
    readonly url: string | null,

    /**
     * Turns the person into a formatted string
     * @returns formatted person info
     */
    text: ()=> string,
}

export type CommentStyle = "regular" | "ignored" | "slash";

export type Banner = string | {

    /**
     * @see {@link https://github.com/mjeanroy/rollup-plugin-license#comment-style}
     */
    commentStyle?: CommentStyle,
    content: string | (()=> string) | {

        /**
         * File to get banner content from
         */
        file: string,

        /**
         * @default utf-8
         */
        encoding?: string,
    },
    data?: {[key: string]: string} | (()=> {[key: string]: string}),
};

/**
 * Dependency information is derived from the package.json file
 */
interface Dependency {
    readonly name: string,
    readonly maintainers: string[],
    readonly version: string,
    readonly description: string,
    readonly repository: {
        readonly url: string,
        readonly type: string,
    },
    readonly homepage: string,

    /**
     * If dependency is private
     */
    readonly private: boolean,

    /**
     * SPDX License short ID
     */
    readonly license: string,

    /**
     * Full License file text
     */
    readonly licenseText: string,

    /**
     * Author information
     */
    readonly author: Person,
    readonly contributors: Person[],

    /**
     * Turns the dependency into a formatted string
     * @returns formatted dependency license info
     */
    text: ()=> string,
}

export type ThirdPartyOutput = string | ((dependencies: Dependency[])=> void) | {

    /**
     * Name of file to write licenses to
     */
    file: string,

    /**
     * @default utf-8
     */
    encoding?: string,

    /**
     * @example
     * // Template function that can be defined to customize report output
     * template(dependencies) {
     *      return dependencies.map((dependency) => (
     *          `${dependency.name}:${dependency.version} -- ${dependency.license}`).join('\n')
     *      );
     * },
     * 
     * // Lodash template that can be defined to customize report output
     * template: `
     *      <% _.forEach(dependencies, function (dependency) { %>
     *          <%= dependency.name %>:<%= dependency.version%> -- <%= dependency.license %>
     *      <% }) %>
     * `
     */
    template?: ((dependencies: Dependency[])=> string[] | string) | string,
};

export type ThirdParty = ((dependencies: Dependency[])=> void) | {

    /**
     * If private dependencies should be allowed (`private: true` in package.json)
     * @default false
     */
    includePrivate?: boolean,

    /**
     * Ensures that dependencies does not violate any license restriction.
     * For example, suppose you want to limit dependencies with MIT or Apache-2.0
     * licenses, simply define the restriction such as:
     * @example
     * {allow: '(MIT OR Apache-2.0)'}
     * 
     * allow(dependency) {
     *      return dependency.license === 'MIT';
     * }
     */
    allow?: string | ((dependency: Dependency)=> boolean) | {

        /**
         * Testing if the license if valid
         */
        test: string | ((dependency: Dependency)=> boolean),

        /**
         * Fail if a dependency does not specify any licenses
         * @default false
         */
        failOnUnlicensed?: boolean,
    
        /**
         * Fail if a dependency specify a license that does not match given requirement
         * @default false
         */
        failOnViolation?: boolean,
    },

    /**
     * Output file for 
     */
    output: ThirdPartyOutput | ThirdPartyOutput[],
};

export type Options = {
    sourcemap?: boolean | string,

    /**
     * Debug mode
     * @default false
     */
    debug?: boolean,

    /**
     * Current Working Directory
     * @default process.cwd()
     */
    cwd?: string,

    /**
     * License banner to place at the top of your bundle
     */
    banner?: Banner,

    /**
     * For third party dependencies.
     * Creates a file containing a summary of all dependencies can be generated
     * automatically
     */
    thirdParty?: ThirdParty,
}

declare function rollupPluginLicense(options: Options): Plugin;

export default rollupPluginLicense
