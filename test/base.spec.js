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

import _ from 'lodash';
import {Dependency} from '../src/dependency.js';
import {Person} from '../src/person.js';

beforeEach(() => {
  jasmine.addCustomEqualityTester((first, second) => {
    if ((first instanceof Person) || (second instanceof Person)) {
      const o1 = _.toPlainObject(first);
      const o2 = _.toPlainObject(second);
      return _.isEqual(o1, o2);
    }
  });

  jasmine.addCustomEqualityTester((first, second) => {
    if ((first instanceof Dependency) || (second instanceof Dependency)) {
      const o1 = _.toPlainObject(first);
      const o2 = _.toPlainObject(second);

      if (o1.author) {
        o1.author = _.toPlainObject(o1.author);
      }
      if (o1.contributors) {
        o1.contributors = _.map(o1.contributors, _.toPlainObject);
      }

      if (o2.author) {
        o2.author = _.toPlainObject(o2.author);
      }
      if (o2.contributors) {
        o2.contributors = _.map(o2.contributors, _.toPlainObject);
      }

      return _.isEqual(o1, o2);
    }
  });
});
