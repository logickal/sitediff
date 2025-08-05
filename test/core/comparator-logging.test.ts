import {expect} from 'chai';
import {PNG} from 'pngjs';

import {compareSites} from '../../src/core/comparator.js';

describe('compareSites logging', () => {
  it('logs screenshot size info when dimensions differ', async () => {
    const small = new PNG({height: 1, width: 1});
    const large = new PNG({height: 2, width: 2});
    const smallBuf = PNG.sync.write(small);
    const largeBuf = PNG.sync.write(large);

    const prodPages = {'/': {html: '<a>prod</a>', screenshot: smallBuf}};
    const testPages = {'/': {html: '<a>test</a>', screenshot: largeBuf}};

    const warns: string[] = [];
    const errors: string[] = [];
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = (msg?: unknown) => {warns.push(String(msg));};
    console.error = (msg?: unknown) => {errors.push(String(msg));};
    try {
      await compareSites(prodPages, testPages, {}, ['/']);
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }

    expect(warns.some(w => w.includes('Screenshot size mismatch'))).to.be.true;
    expect(errors.some(e => e.includes('prod: 1x1') && e.includes('test: 2x2'))).to.be.true;
  });
});
