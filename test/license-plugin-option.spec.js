/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2022 Mickael Jeanroy
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

import {licensePluginOptions} from '../src/license-plugin-option.js';

describe('licensePluginOptions', () => {
  it('should validate option', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      sourcemap: true,
      cwd: '.',
      banner: {
        commentStyle: 'regular',
        content() {
          return 'Banner';
        },
      },
    };

    const result = licensePluginOptions(options);

    expect(result).toEqual(options);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should print a warning for unknown properties', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      foo: true,
      banner: {
        bar: false,
        commentStyle: 'regular',
        content() {
          return 'Banner';
        },
      },
    };

    const result = licensePluginOptions(options);

    expect(result).toEqual(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- Unknown property: "foo", allowed options are: sourcemap, debug, cwd, banner, thirdParty.',
    );

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- Unknown property: "banner.bar", allowed options are: sourcemap, debug, cwd, banner, thirdParty.',
    );
  });

  it('should fail with invalid option', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      debug: 'true',
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: "debug" must be a boolean',
    ));

    expect(warn).not.toHaveBeenCalledWith();
  });

  it('should fail and display all invalid options', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      debug: 'true',
      cwd: true,
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: "debug" must be a boolean ; "cwd" must be a string',
    ));

    expect(warn).not.toHaveBeenCalledWith();
  });

  it('should validate option object when output is an array', () => {
    const options = {
      thirdParty: {
        output: [
          'ThirdParty.txt',
        ],
      },
    };

    const result = licensePluginOptions(options);

    expect(result).toEqual({
      thirdParty: {
        output: [
          'ThirdParty.txt',
        ],
      },
    });
  });

  it('should validate option object and fail when output array contains null', () => {
    const options = {
      thirdParty: {
        output: [
          null,
        ],
      },
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: "thirdParty.output[0]" is null.',
    ));
  });

  it('should validate option object and fail when output array contains undefined', () => {
    const options = {
      thirdParty: {
        output: [
          undefined,
        ],
      },
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: "thirdParty.output[0]" is undefined.',
    ));
  });

  it('should validate option object and fail when output array contains invalid value', () => {
    const options = {
      thirdParty: {
        output: [
          true,
        ],
      },
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: ' +
        '"thirdParty.output[0]" must be a function OR ' +
        '"thirdParty.output[0]" must be a string OR ' +
        '"thirdParty.output[0]" must be an object',
    ));
  });
});
