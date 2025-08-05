import {expect} from 'chai'
import fs from 'node:fs/promises'
import path from 'node:path'
import {PNG} from 'pngjs'

import {compareSites} from '../../src/core/comparator.js'

describe('compareSites outputPath', () => {
  it('writes report to provided output path', async () => {
    const png = new PNG({height: 1, width: 1})
    const buf = PNG.sync.write(png)
    const pages = {'/': {html: '<html></html>', screenshot: buf}}
    const out = path.join('tmp-output.html')
    await compareSites(pages, pages, {outputPath: out}, ['/'])
    const stat = await fs.stat(out)
    expect(stat.isFile()).to.be.true
    await fs.unlink(out)
  })
})
