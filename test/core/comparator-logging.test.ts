import {expect} from 'chai';
import fs from 'node:fs/promises';
import {PNG} from 'pngjs';

import {compareSites} from '../../src/core/comparator.js';

describe('compareSites logging', () => {
  it('handles screenshot size mismatch without errors', async () => {
    const small = new PNG({height: 1, width: 1});
    const large = new PNG({height: 2, width: 2});
    large.data[0] = 255; // make it visually different
    large.data[3] = 255;
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

    const diffFile = 'diff_output/_diff.png';
    const reportFile = 'tmp-report.html';

    try {
      await compareSites(prodPages, testPages, {imageThreshold: 0, outputPath: reportFile}, ['/']);
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }

    const stat = await fs.stat(diffFile);
    expect(stat.isFile()).to.be.true;
    await fs.unlink(diffFile);
    await fs.rm('diff_output', {force: true, recursive: true});
    await fs.unlink(reportFile);

    expect(warns.some(w => w.includes('Screenshot size mismatch'))).to.be.true;
    expect(errors).to.be.empty;
  });
});
