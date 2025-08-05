import {expect} from 'chai';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';

import {compareSites} from '../../src/core/comparator.js';

describe('compareSites paths handling', () => {
  it('includes every provided path in the report', async () => {
    const png = new PNG({height: 1, width: 1});
    const buf = PNG.sync.write(png);
    const prodPages = {'/present': {html: '<html></html>', screenshot: buf}};
    const testPages = {'/present': {html: '<html></html>', screenshot: buf}};
    const paths = ['/present', '/missing'];
    const out = path.join('tmp-all-paths.html');

    await compareSites(prodPages, testPages, {outputPath: out}, paths);

    const report = await fs.readFile(out, 'utf8');
    expect(report).to.include('/present');
    expect(report).to.include('/missing');

    await fs.unlink(out);
  });
});

