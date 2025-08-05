import {expect} from 'chai';

import {normalizeUrlPath, parseUrlList} from '../../src/core/url-list.js';

describe('url list parsing', () => {
  it('normalizes absolute and relative URLs', () => {
    const content = ['/foo', 'bar', 'https://example.com/baz?x=1#y', ''].join('\n');
    const paths = parseUrlList(content);
    expect(paths).to.deep.equal(['/foo', '/bar', '/baz?x=1#y']);
  });

  it('returns null for empty lines', () => {
    expect(normalizeUrlPath('   ')).to.equal(null);
  });
});
