/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Mickael Jeanroy
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

import {validateSchema} from '../src/schema-validator.js';
import {validators} from '../src/schema-validators.js';

describe('validateSchema', () => {
  it('should validate simple object', () => {
    const schema = {
      id: validators.string(),
      active: validators.boolean(),
      test: validators.func(),
    };

    const o = {
      id: '123',
      active: true,
      test: () => true,
    };

    expect(validateSchema(o, schema)).toEqual([]);
  });

  it('should validate and return errors', () => {
    const schema = {
      id: validators.string(),
      active: validators.boolean(),
      test: validators.func(),
    };

    const o = {
      id: 1,
      active: 'foo',
      test: true,
    };

    expect(validateSchema(o, schema)).toEqual([
      {path: ['id'], message: '"id" must be a string'},
      {path: ['active'], message: '"active" must be a boolean'},
      {path: ['test'], message: '"test" must be a function'},
    ]);
  });

  it('should validate sub object and return errors', () => {
    const schema = {
      person: validators.object({
        id: validators.string(),
        active: validators.boolean(),
        test: validators.func(),
      }),
    };

    const o = {
      person: {
        id: 1,
        active: 'foo',
        test: true,
      },
    };

    expect(validateSchema(o, schema)).toEqual([
      {path: ['person', 'id'], message: '"person.id" must be a string'},
      {path: ['person', 'active'], message: '"person.active" must be a boolean'},
      {path: ['person', 'test'], message: '"person.test" must be a function'},
    ]);
  });

  it('should validate array of options', () => {
    const schema = {
      id: validators.string(),
      active: validators.boolean(),
      test: [
        validators.boolean(),
        validators.func(),
      ],
    };

    const o = {
      id: '1',
      active: true,
      test: true,
    };

    expect(validateSchema(o, schema)).toEqual([]);
  });

  it('should fail with unknown properties', () => {
    const schema = {
      id: validators.string(),
      active: validators.boolean(),
      test: [
        validators.boolean(),
        validators.func(),
      ],
    };

    const o = {
      id: '1',
      active: true,
      test: true,
      name: 'John Doe',
    };

    expect(validateSchema(o, schema)).toEqual([
      {path: ['name'], type: 'object.allowUnknown'},
    ]);
  });
});
