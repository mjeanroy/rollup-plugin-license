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

const Person = require('../dist/person.js');

describe('Person', () => {
  it('should parse author name', () => {
    const str = 'Mickael Jeanroy';
    const person = new Person(str);
    expect(person).toEqual({
      name: 'Mickael Jeanroy',
    });
  });

  it('should parse name and email', () => {
    const str = 'Mickael Jeanroy <mickael.jeanroy@gmail.com>';
    const person = new Person(str);
    expect(person).toEqual({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
    });
  });

  it('should parse name and url', () => {
    const str = 'Mickael Jeanroy (https://mjeanroy.com)';
    const person = new Person(str);
    expect(person).toEqual({
      name: 'Mickael Jeanroy',
      url: 'https://mjeanroy.com',
    });
  });

  it('should parse name, email and url', () => {
    const str = 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)';
    const person = new Person(str);
    expect(person).toEqual({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
      url: 'https://mjeanroy.com',
    });
  });

  it('should create person from object', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
    });

    expect(person).toEqual({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
    });
  });

  it('should format person with a name', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
    });

    expect(person.text()).toBe('Mickael Jeanroy');
  });

  it('should format person with a name and an email', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
    });

    expect(person.text()).toBe('Mickael Jeanroy <mickael.jeanroy@gmail.com>');
  });

  it('should format person with a name and an url', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
      url: 'https://mjeanroy.com',
    });

    expect(person.text()).toBe('Mickael Jeanroy (https://mjeanroy.com)');
  });

  it('should format person with a name, an email and an url', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
      url: 'https://mjeanroy.com',
    });

    expect(person.text()).toBe(
        'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)'
    );
  });

  it('should format person with a suffix and a prefix', () => {
    const person = new Person({
      name: 'Mickael Jeanroy',
      email: 'mickael.jeanroy@gmail.com',
      url: 'https://mjeanroy.com',
    });

    expect(person.text('-- ', ' --')).toBe(
        '-- Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com) --'
    );
  });
});
