/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
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

const parseDependency = require('../dist/parse-dependency.js');

describe('parseDependency', () => {
  it('should should extract package fields', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      main: 'src/index.js',
      private: false,
      description: 'Desc',
      homepage: 'https://github.com/mjeanroy',
      repository: {type: 'GIT', url: 'git@github.com/mjeanroy'},
      author: {name: 'Mickael Jeanroy'},
      contributors: [
        {name: 'Mickael Jeanroy'},
        {name: 'John Doe'},
      ],
    };

    const dependency = parseDependency(pkg);

    expect(dependency).toBeDefined();
    expect(dependency).not.toBe(pkg);
    expect(dependency).toEqual({
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      description: 'Desc',
      private: false,
      homepage: 'https://github.com/mjeanroy',
      repository: {type: 'GIT', url: 'git@github.com/mjeanroy'},
      author: {name: 'Mickael Jeanroy'},
      contributors: [
        {name: 'Mickael Jeanroy'},
        {name: 'John Doe'},
      ],
    });
  });

  it('should should parse author field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      main: 'src/index.js',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
    };

    const dependency = parseDependency(pkg);

    expect(dependency).toEqual(jasmine.objectContaining({
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
        url: 'https://mjeanroy.com',
      },
    }));
  });

  it('should should parse contributors field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      main: 'src/index.js',
      contributors: [
        'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      ],
    };

    const dependency = parseDependency(pkg);

    expect(dependency).toEqual(jasmine.objectContaining({
      contributors: [{
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
        url: 'https://mjeanroy.com',
      }],
    }));
  });

  it('should should parse deprecated licenses field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      main: 'src/index.js',
      licenses: [
        {type: 'MIT'},
        {type: 'Apache 2.0'},
      ],
    };

    const dependency = parseDependency(pkg);

    expect(dependency.licenses).not.toBeDefined();
    expect(dependency).toEqual(jasmine.objectContaining({
      license: '(MIT OR Apache 2.0)',
    }));
  });
});
