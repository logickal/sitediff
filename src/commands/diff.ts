import {Command, Flags} from '@oclif/core';
import fs from 'fs/promises';
import {URL} from 'url';
import {crawlSitePlaywright} from '../core/crawler.js';
import {fetchPages} from '../core/fetcher.js';
import {compareSites} from '../core/comparator.js';

export default class Diff extends Command {
  static description = 'Compare two websites (prod and test)';

  static flags = {
    prod: Flags.string({required: true, description: 'Base URL of production site'}),
    test: Flags.string({required: true, description: 'Base URL of test site'}),
    sitemap: Flags.string({required: false, description: 'Optional sitemap.xml path'}),
    urlList: Flags.string({required: false, description: 'Path to a text file containing URLs to compare'}),
    mismatchThreshold: Flags.integer({required: false, description: 'Only report on items with overall match score below this percentage (e.g., 100 - score)' }),
    htmlThreshold: Flags.integer({required: false, description: 'Generate HTML diff report for items with HTML diff percentage above this value'}),
    imageThreshold: Flags.integer({required: false, description: 'Generate screenshot diff for items with visual diff percentage above this value'}),
    strictHtml: Flags.boolean({required: false, default: false, description: 'Enable strict HTML comparison (ignores whitespace, comments, etc.)'}),
  };

  async run() {
    const {flags} = await this.parse(Diff);
    let urls: string[];

    if (flags.urlList) {
      const fileContent = await fs.readFile(flags.urlList, 'utf-8');
      const prodBase = new URL(flags.prod);
      urls = fileContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '')
        .map(url => {
          try {
            const parsed = new URL(url);
            return parsed.pathname + parsed.search + parsed.hash;
          } catch (e) {
            this.warn(`Skipping invalid URL: ${url}`);
            return '';
          }
        })
        .filter(path => path !== '');
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
    const testPages = await fetchPages(flags.test, urls, (msg: string) => this.log(`[TEST] ${msg}`));

    this.log('Comparing sites...');
    await compareSites(prodPages, testPages, {
        prodBaseUrl: flags.prod,
        testBaseUrl: flags.test,
        mismatchThreshold: flags.mismatchThreshold,
        htmlThreshold: flags.htmlThreshold,
        imageThreshold: flags.imageThreshold,
        strictHtml: flags.strictHtml,
    });


    this.log('Diff complete. Report written to report.html');
  }
}
