import {expect} from 'chai';
import fs from 'node:fs/promises';
import {PNG} from 'pngjs';

import {compareSites} from '../../src/core/comparator.js';

describe('compareSites missing pages', () => {
  it('reports paths missing on both sites', async () => {
    const png = new PNG({height: 1, width: 1});
    const buf = PNG.sync.write(png);

    const prod = {'/present': {html: '<a>prod</a>', screenshot: buf}};
    const test = {'/present': {html: '<a>prod</a>', screenshot: buf}};
    const paths = ['/present', '/absent'];
    const out = 'tmp-missing-report.html';

    await compareSites(prod, test, {outputPath: out}, paths);
    const report = await fs.readFile(out, 'utf8');
    await fs.unlink(out);

    expect(report).to.contain('/absent');
    expect(report).to.contain('Missing on both sites');
  });
});

