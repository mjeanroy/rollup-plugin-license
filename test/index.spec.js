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

const path = require('path');
const LicensePlugin = require('../dist/license-plugin.js');
const plugin = require('../dist/index.js');

describe('rollup-plugin-license', () => {
  it('should return new plugin instance', () => {
    const instance = plugin();
    expect(instance.name).toBe('rollup-plugin-license');
  });

  it('should scan dependency on load', () => {
    spyOn(LicensePlugin.prototype, 'scanDependency').and.callThrough();

    const instance = plugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package', 'src', 'index.js');

    const result = instance.load(id);

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.scanDependency).toHaveBeenCalledWith(id);
  });

  it('should enable sourceMap if options.sourceMap is true', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options({
      sourceMap: true,
    });

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).not.toHaveBeenCalled();
  });

  it('should enable sourceMap if options.sourcemap (lowercase) is true', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options({
      sourcemap: true,
    });

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).not.toHaveBeenCalled();
  });

  it('should not enable sourceMap if options.sourceMap is false', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options({
      sourceMap: false,
    });

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).toHaveBeenCalledWith();
  });

  it('should not enable sourceMap if options.sourcemap (lowercase) is false', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options({
      sourcemap: false,
    });

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).toHaveBeenCalledWith();
  });

  it('should enable sourceMap by default', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options({});

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).not.toHaveBeenCalled();
  });

  it('should enable sourceMap if options is not set', () => {
    spyOn(LicensePlugin.prototype, 'disableSourceMap').and.callThrough();

    const instance = plugin();
    const result = instance.options();

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.disableSourceMap).not.toHaveBeenCalled();
  });

  it('should prepend banner when bundle is transformed', () => {
    spyOn(LicensePlugin.prototype, 'prependBanner').and.callThrough();

    const instance = plugin();
    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(LicensePlugin.prototype.prependBanner).toHaveBeenCalledWith(code);
  });

  it('should create third-parties file when bundle is generated', () => {
    spyOn(LicensePlugin.prototype, 'exportThirdParties').and.callThrough();

    const instance = plugin();

    const result = instance.ongenerate();

    expect(result).not.toBeDefined();
    expect(LicensePlugin.prototype.exportThirdParties).toHaveBeenCalledWith();
  });
});
