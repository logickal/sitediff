import {Command, Flags} from '@oclif/core';
import fs from 'node:fs/promises';
import path from 'node:path';

import {compareSites} from '../core/comparator.js';
import {crawlSitePlaywright} from '../core/crawler.js';
import {fetchPages} from '../core/fetcher.js';
import {buildReportFilename} from '../core/report-name.js';
import {parseUrlList} from '../core/url-list.js';

export default class Diff extends Command {
  static description = 'Compare two websites (prod and test)';
static flags = {
    htmlThreshold: Flags.integer({description: 'Generate HTML diff report for items with HTML diff percentage above this value', required: false}),
    imageThreshold: Flags.integer({description: 'Generate screenshot diff for items with visual diff percentage above this value', required: false}),
    mismatchThreshold: Flags.integer({description: 'Only report on items with overall match score below this percentage (e.g., 100 - score)', required: false }),
    prod: Flags.string({description: 'Base URL of production site', required: true}),
    sitemap: Flags.string({description: 'Optional sitemap.xml path', required: false}),
    strictHtml: Flags.boolean({default: false, description: 'Enable strict HTML comparison (ignores whitespace, comments, etc.)', required: false}),
    test: Flags.string({description: 'Base URL of test site', required: true}),
    testCreds: Flags.string({description: 'Basic auth credentials for test site in username:password format', required: false}),
    urlList: Flags.string({description: 'Path to a text file containing URLs to compare', required: false}),
  };

  async run() {
    const {flags} = await this.parse(Diff);
    let urls: string[];

    const outputFilename = buildReportFilename({
      htmlThreshold: flags.htmlThreshold,
      imageThreshold: flags.imageThreshold,
      mismatchThreshold: flags.mismatchThreshold,
      sitemap: flags.sitemap,
      strictHtml: flags.strictHtml,
      urlList: flags.urlList,
    });
    const outputPath = path.resolve(outputFilename);

    if (flags.urlList) {
      const fileContent = await fs.readFile(flags.urlList, 'utf8');
      urls = parseUrlList(fileContent);
    } else {
      urls = await crawlSitePlaywright(flags.prod);
    }

    this.log(`Discovered ${urls.length} URLs to compare:`);
    for (const path of urls) {
      this.log(`  ${path}`);
    }

    this.log('Fetching pages from production site...');
    const prodPages = await fetchPages(flags.prod, urls, (msg: string) => this.log(`[PROD] ${msg}`));

    this.log('Fetching pages from test site...');
    let testAuth;
    if (flags.testCreds) {
      const [username, password] = flags.testCreds.split(':');
      if (username && password) {
        testAuth = {password, username};
      } else {
        this.warn('Invalid --testCreds format. Expected username:password');
      }
    }

    const testPages = await fetchPages(flags.test, urls, (msg: string) => this.log(`[TEST] ${msg}`), {auth: testAuth});

    this.log('Comparing sites...');
    await compareSites(prodPages, testPages, {
        htmlThreshold: flags.htmlThreshold,
        imageThreshold: flags.imageThreshold,
        mismatchThreshold: flags.mismatchThreshold,
        outputPath,
        prodBaseUrl: flags.prod,
        strictHtml: flags.strictHtml,
        testBaseUrl: flags.test,
    }, urls);

    this.log(`Diff complete. Report written to ${outputPath}`);
  }
}
