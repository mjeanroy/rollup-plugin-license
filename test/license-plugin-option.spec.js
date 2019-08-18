/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2018 Mickael Jeanroy
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

'use strict';

const licensePluginOptions = require('../dist/license-plugin-option.js');

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
        '[rollup-plugin-license] -- Unknown property: "foo", allowed options are: sourcemap, debug, cwd, banner, thirdParty.'
    );

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- Unknown property: "banner.bar", allowed options are: sourcemap, debug, cwd, banner, thirdParty.'
    );
  });

  it('should fail with invalid option', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      debug: 'true',
    };

    expect(() => licensePluginOptions(options)).toThrow(new Error(
        '[rollup-plugin-license] -- Error during validation of option object: "debug" must be a boolean'
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
        '[rollup-plugin-license] -- Error during validation of option object: "debug" must be a boolean ; "cwd" must be a string'
    ));

    expect(warn).not.toHaveBeenCalledWith();
  });

  it('should normalize option object and fix deprecated "sourceMap" entry', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      sourceMap: true,
    };

    const result = licensePluginOptions(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "sourceMap" has been deprecated and will be removed in a future version, ' +
        'please use "sourcemap" instead.'
    );

    expect(result).toEqual({
      sourcemap: true,
    });
  });

  it('should normalize option object and fix deprecated "banner.file" entry', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      banner: {
        file: 'LICENSE.md',
      },
    };

    const result = licensePluginOptions(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.file" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.file" instead.'
    );

    expect(result).toEqual({
      banner: {
        content: {
          file: 'LICENSE.md',
        },
      },
    });

    // Ensure original option object has not changed
    expect(options).toEqual({
      banner: {
        file: 'LICENSE.md',
      },
    });
  });

  it('should normalize option object and fix deprecated "thirdParty.encoding" entry', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      thirdParty: {
        output: 'ThirdParty.txt',
        encoding: 'utf-16',
      },
    };

    const result = licensePluginOptions(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "thirdParty.encoding" has been deprecated and will be removed in a future version, ' +
        'please use "thirdParty.output.encoding" instead.'
    );

    expect(result).toEqual({
      thirdParty: {
        output: {
          file: 'ThirdParty.txt',
          encoding: 'utf-16',
        },
      },
    });

    // Ensure original option object has not changed
    expect(options).toEqual({
      thirdParty: {
        output: 'ThirdParty.txt',
        encoding: 'utf-16',
      },
    });
  });

  it('should normalize option object and fix deprecated "banner.encoding" entry', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      banner: {
        encoding: 'utf-16',
      },
    };

    const result = licensePluginOptions(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.encoding" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.encoding" instead.'
    );

    expect(result).toEqual({
      banner: {
        content: {
          encoding: 'utf-16',
        },
      },
    });

    // Ensure original option object has not changed
    expect(options).toEqual({
      banner: {
        encoding: 'utf-16',
      },
    });
  });

  it('should normalize option object, fix and warn about all deprecated properties', () => {
    const warn = spyOn(console, 'warn');
    const options = {
      sourceMap: true,
      cwd: '.',
      debug: true,

      banner: {
        file: 'LICENSE.md',
        encoding: 'utf-16',
        commentStyle: 'regular',
      },

      thirdParty: {
        output: 'ThirdParty.txt',
        encoding: 'utf-8',
      },
    };

    const result = licensePluginOptions(options);

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "sourceMap" has been deprecated and will be removed in a future version, ' +
        'please use "sourcemap" instead.'
    );

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.file" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.file" instead.'
    );

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "banner.encoding" has been deprecated and will be removed in a future version, ' +
        'please use "banner.content.encoding" instead.'
    );

    expect(warn).toHaveBeenCalledWith(
        '[rollup-plugin-license] -- "thirdParty.encoding" has been deprecated and will be removed in a future version, ' +
        'please use "thirdParty.output.encoding" instead.'
    );

    expect(result).toEqual({
      sourcemap: true,
      cwd: '.',
      debug: true,

      banner: {
        commentStyle: 'regular',
        content: {
          file: 'LICENSE.md',
          encoding: 'utf-16',
        },
      },

      thirdParty: {
        output: {
          file: 'ThirdParty.txt',
          encoding: 'utf-8',
        },
      },
    });

    // Ensure original option object has not changed
    expect(options).toEqual({
      sourceMap: true,
      cwd: '.',
      debug: true,
      banner: {
        file: 'LICENSE.md',
        encoding: 'utf-16',
        commentStyle: 'regular',
      },
      thirdParty: {
        output: 'ThirdParty.txt',
        encoding: 'utf-8',
      },
    });
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
        '[rollup-plugin-license] -- Error during validation of option object: "thirdParty.output[0]" is null.'
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
        '[rollup-plugin-license] -- Error during validation of option object: "thirdParty.output[0]" is undefined.'
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
        '"thirdParty.output[0]" must be an object'
    ));
  });
});
