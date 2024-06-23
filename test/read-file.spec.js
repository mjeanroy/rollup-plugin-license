/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2024 Mickael Jeanroy
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

import path from 'path';
import fs from 'fs';
import tmp from 'tmp';
import { readFile } from '../src/read-file';

describe('readFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('should read file using exact name', () => {
    const dir = path.join(__dirname, 'fixtures', 'fake-package-2');
    const name = 'LICENSE.md';
    const content = readFile(dir, name);
    expect(content).toEqual('LICENSE.md file');
  });

  it('should read file using exact name following symlink', () => {
    const dirName = 'fake-package-2';
    const dir = path.join(__dirname, 'fixtures', dirName);
    const dirLink = path.join(tmpDir.name, `link-to-${dirName}`);

    fs.symlinkSync(dir, dirLink, 'dir');

    const name = 'LICENSE.md';
    const content = readFile(dirLink, name);
    expect(content).toEqual('LICENSE.md file');
  });

  it('should read file using non matching case name', () => {
    const dir = path.join(__dirname, 'fixtures', 'fake-package-2');
    const name = 'license.md';
    const content = readFile(dir, name);
    expect(content).toEqual('LICENSE.md file');
  });

  it('should read file using name without extension', () => {
    const dir = path.join(__dirname, 'fixtures', 'fake-package-2');
    const name = 'license';
    const content = readFile(dir, name);
    expect(content).toEqual('LICENSE.md file');
  });
});
