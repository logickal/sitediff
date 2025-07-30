import {expect} from 'chai'

import {buildReportFilename} from '../../src/core/report-name.js'

describe('buildReportFilename', () => {
  it('includes urlList base name and flags', () => {
    const name = buildReportFilename({htmlThreshold: 5, strictHtml: true, urlList: 'urls.txt'})
    expect(name).to.equal('report-urls-ht5-strict.html')
  })

  it('falls back to sitemap base name', () => {
    const name = buildReportFilename({sitemap: 'path/to/site.xml'})
    expect(name).to.equal('report-site.html')
  })

  it('uses crawl when neither list provided', () => {
    const name = buildReportFilename({})
    expect(name).to.equal('report-crawl.html')
  })
})
