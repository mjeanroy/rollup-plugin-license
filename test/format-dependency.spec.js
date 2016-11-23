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

const formatDependency = require('../dist/format-dependency.js');

describe('formatDependency', () => {
  it('should format dependency with name, version, and license fields', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false`
    );
  });

  it('should format dependency with optional description fied', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      description: 'Desc',
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Description: ${dependency.description}`
    );
  });

  it('should format dependency with optional author fied', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Author: ${dependency.author.name} <${dependency.author.email}>`
    );
  });

  it('should format dependency with optional repository field', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      repository: {
        type: 'GIT',
        url: 'git@github.com/mjeanroy',
      },
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Repository: ${dependency.repository.url}`
    );
  });

  it('should format dependency with optional homepage field', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      homepage: 'https://github.com/mjeanroy',
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Homepage: ${dependency.homepage}`
    );
  });

  it('should format dependency with optional contributors field', () => {
    const dependency = {
      name: 'foo',
      version: '1.0.0',
      license: 'MIT',
      contributors: [
        {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        {name: 'John Doe'},
      ],
    };

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Contributors:\n` +
      `  ${dependency.contributors[0].name} <${dependency.contributors[0].email}>\n` +
      `  ${dependency.contributors[1].name}`
    );
  });

  it('should format dependency with all optional fields', () => {
    const dependency = {
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

    const txt = formatDependency(dependency);

    expect(txt).toEqual(
      `Name: ${dependency.name}\n` +
      `Version: ${dependency.version}\n` +
      `License: ${dependency.license}\n` +
      `Private: false\n` +
      `Description: ${dependency.description}\n` +
      `Repository: ${dependency.repository.url}\n` +
      `Homepage: ${dependency.homepage}\n` +
      `Author: ${dependency.author.name} <${dependency.author.email}>\n` +
      `Contributors:\n` +
      `  ${dependency.contributors[0].name} <${dependency.contributors[0].email}>\n` +
      `  ${dependency.contributors[1].name}`
    );
  });
});
