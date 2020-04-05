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

import {validators} from '../src/schema-validators.js';

describe('schema validators', () => {
  it('should validate string', () => {
    const stringValidator = validators.string();

    expect(stringValidator.type).toBe('object.type.string');
    expect(stringValidator.message).toBe('must be a string');

    expect(stringValidator.test('')).toBe(true);
    expect(stringValidator.test(String(''))).toBe(true);
    expect(stringValidator.test(null)).toBe(false);
    expect(stringValidator.test(undefined)).toBe(false);
    expect(stringValidator.test(false)).toBe(false);
  });

  it('should validate boolean', () => {
    const booleanValidator = validators.boolean();

    expect(booleanValidator.type).toBe('object.type.boolean');
    expect(booleanValidator.message).toBe('must be a boolean');

    expect(booleanValidator.test(true)).toBe(true);
    expect(booleanValidator.test(false)).toBe(true);
    expect(booleanValidator.test(null)).toBe(false);
    expect(booleanValidator.test(undefined)).toBe(false);
    expect(booleanValidator.test('false')).toBe(false);
    expect(booleanValidator.test('true')).toBe(false);
  });

  it('should validate function', () => {
    const funcValidator = validators.func();

    expect(funcValidator.type).toBe('object.type.func');
    expect(funcValidator.message).toBe('must be a function');

    expect(funcValidator.test(() => {})).toBe(true);
    expect(funcValidator.test(function test() {})).toBe(true);
    expect(funcValidator.test(null)).toBe(false);
    expect(funcValidator.test(undefined)).toBe(false);
    expect(funcValidator.test('')).toBe(false);
  });

  it('should validate array', () => {
    const arrayValidator = validators.array();

    expect(arrayValidator.type).toBe('object.type.array');
    expect(arrayValidator.message).toBe('must be an array');

    expect(arrayValidator.test([])).toBe(true);
    expect(arrayValidator.test(null)).toBe(false);
    expect(arrayValidator.test(undefined)).toBe(false);
    expect(arrayValidator.test('')).toBe(false);
    expect(arrayValidator.test({})).toBe(false);
  });

  it('should validate object', () => {
    const objectValidator = validators.object();

    expect(objectValidator.type).toBe('object.type.object');
    expect(objectValidator.message).toBe('must be an object');

    expect(objectValidator.test({})).toBe(true);
    expect(objectValidator.test(null)).toBe(false);
    expect(objectValidator.test(undefined)).toBe(false);
    expect(objectValidator.test('')).toBe(false);
    expect(objectValidator.test([])).toBe(false);
    expect(objectValidator.test(1)).toBe(false);
  });

  it('should validate any', () => {
    const anyValidator = validators.any();

    expect(anyValidator.type).toBe('object.any');
    expect(anyValidator.message).toBeNull();

    expect(anyValidator.test([])).toBe(true);
    expect(anyValidator.test(null)).toBe(true);
    expect(anyValidator.test(undefined)).toBe(true);
    expect(anyValidator.test('')).toBe(true);
    expect(anyValidator.test({})).toBe(true);
  });
});
