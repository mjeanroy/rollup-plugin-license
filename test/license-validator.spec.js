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
 */

import {licenseValidator} from '../src/license-validator.js';

describe('licenseValidator', () => {
  it('should check for unlicensed dependency', () => {
    expect(licenseValidator.isUnlicensed({})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: null})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: ''})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: 'UNLICENSED'})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: 'unlicensed'})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: '  UNLICENSED  '})).toBe(true);
    expect(licenseValidator.isUnlicensed({license: 'MIT'})).toBe(false);
  });

  it('should check for valid dependency', () => {
    expect(licenseValidator.isValid({license: 'MIT'}, 'MIT')).toBe(true);
    expect(licenseValidator.isValid({license: '  MIT  '}, 'MIT')).toBe(true);
    expect(licenseValidator.isValid({license: 'MIT'}, '(MIT OR Apache-2.0)')).toBe(true);
    expect(licenseValidator.isValid({license: 'GPL'}, '(MIT OR Apache-2.0)')).toBe(false);
  });
});
