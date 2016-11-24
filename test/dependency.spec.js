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

const Dependency = require('../dist/dependency.js');

describe('Dependency', () => {
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

    const dependency = new Dependency(pkg);

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

    const dependency = new Dependency(pkg);

    expect(dependency.author).toEqual({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
      url: 'https://mjeanroy.com',
    });
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

    const dependency = new Dependency(pkg);

    expect(dependency.contributors.length).toBe(1);
    expect(dependency.contributors[0]).toEqual({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
      url: 'https://mjeanroy.com',
    });
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

    const dependency = new Dependency(pkg);

    expect(dependency.licenses).not.toBeDefined();
    expect(dependency.license).toBe('(MIT OR Apache 2.0)');
  });

  it('should format dependency with name, version, and license fields', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false`
    );
  });

  it('should format dependency with optional description fied', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      description: 'Desc',
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Description: ${pkg.description}`
    );
  });

  it('should format dependency with optional author fied', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Author: ${pkg.author.name} <${pkg.author.email}>`
    );
  });

  it('should format dependency with optional repository field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      repository: {
        type: 'GIT',
        url: 'git@github.com/mjeanroy',
      },
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Repository: ${pkg.repository.url}`
    );
  });

  it('should format dependency with optional homepage field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      homepage: 'https://github.com/mjeanroy',
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Homepage: ${pkg.homepage}`
    );
  });

  it('should format dependency with optional contributors field', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      contributors: [
        {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        {name: 'John Doe'},
      ],
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Contributors:\n` +
      `  ${pkg.contributors[0].name} <${pkg.contributors[0].email}>\n` +
      `  ${pkg.contributors[1].name}`
    );
  });

  it('should format dependency with all optional fields', () => {
    const pkg = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      description: 'Desc',
      homepage: 'https://github.com/mjeanroy',
      repository: {type: 'GIT', url: 'git@github.com/mjeanroy'},
      author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
      contributors: [
        {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        {name: 'John Doe'},
      ],
    };

    const dependency = new Dependency(pkg);

    expect(dependency.toString()).toEqual(
      `Name: ${pkg.name}\n` +
      `Version: ${pkg.version}\n` +
      `License: ${pkg.license}\n` +
      `Private: false\n` +
      `Description: ${pkg.description}\n` +
      `Repository: ${pkg.repository.url}\n` +
      `Homepage: ${pkg.homepage}\n` +
      `Author: ${pkg.author.name} <${pkg.author.email}>\n` +
      `Contributors:\n` +
      `  ${pkg.contributors[0].name} <${pkg.contributors[0].email}>\n` +
      `  ${pkg.contributors[1].name}`
    );
  });
});
