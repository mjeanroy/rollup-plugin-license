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

export type CommentStyle = "regular" | "ignored" | "slash";

export type Banner = string | {
    commentStyle: CommentStyle,
    content: string | {

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

interface Dependency {
    name: string,
    maintainers: string[],
    version: string,
    description: string,
    repository: {
        url: string,
        type: string,
    },
    homepage: string,
    private: boolean,

    /**
     * SPDX License short ID
     */
    license: string,
    licenseText: string,
    author: {
        name: string,
        email: string | null,
        url: string,
        text: ()=> string,
    },
    contributors: {
        name: string,
        email: string | null,
        url: string,
        text: ()=> string,
    }[],
}

export type ThirdPartyOutput = string | {

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
    template: ((dependencies: Dependency[])=> string[] | string) | string,

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
    allow?: string | ((dependency: Dependency)=> boolean),

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
};

export type ThirdParty = {

    /**
     * @default false
     */
    includePrivate?: boolean

    /**
     * Output file for 
     */
    output: ThirdPartyOutput,
};

export interface Options {
    sourcemap?: boolean,

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
