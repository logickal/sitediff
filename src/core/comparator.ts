import path from 'path';
import fs from 'fs/promises';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {generateHtmlReport} from './reporter.js';

interface PageData {
  html: string;
  screenshot: Buffer;
}

interface SitePages {
  [url: string]: PageData;
}

export async function compareSites(prodPages: SitePages, testPages: SitePages) {
  const results = [];
  await fs.mkdir('diff_output', {recursive: true});

  for (const url of Object.keys(prodPages)) {
    const prod = prodPages[url];
    const test = testPages[url];
    if (!test) {
      results.push({ url, matchScore: 0, notes: 'Missing on test site' });
      continue;
    }

    let score = 100;
    let notes = 'OK';
    let diffImagePath;

    try {
      const prodPng = PNG.sync.read(prod.screenshot);
      const testPng = PNG.sync.read(test.screenshot);

      const {width, height} = prodPng;
      const diff = new PNG({width, height});
      const mismatch = pixelmatch(prodPng.data, testPng.data, diff.data, width, height);
      const percentDiff = (mismatch / (width * height)) * 100;
      score = Math.max(0, 100 - percentDiff);

      if (percentDiff > 2) {
        diffImagePath = path.join('diff_output', encodeURIComponent(url) + '_diff.png');
        await fs.writeFile(diffImagePath, PNG.sync.write(diff));
        notes = `Visual diff: ${percentDiff.toFixed(2)}% mismatch`;
      }
    } catch (e) {
      score = 0;
      notes = 'Error comparing screenshots';
    }

    results.push({
      url,
      matchScore: score,
      notes,
      screenshotDiffPath: diffImagePath,
    });
  }

  await generateHtmlReport(results);
}
