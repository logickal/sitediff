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
  [path: string]: PageData;
}

export async function compareSites(
  prodPages: SitePages,
  testPages: SitePages,
  mismatchThreshold: number = 2 // Default to 2% unless specified
) {
  const results = [];
  await fs.mkdir('diff_output', {recursive: true});

  for (const pathKey of Object.keys(prodPages)) {
    const prod = prodPages[pathKey];
    const test = testPages[pathKey];

    if (!test) {
      console.warn(`[DIFF] Test site missing for ${pathKey}`);
      results.push({ url: pathKey, matchScore: 0, notes: 'Missing on test site' });
      continue;
    }

    console.log(`[DIFF] Comparing ${pathKey}...`);

    let score = 100;
    let notes = 'OK';
    let diffImagePath;

    try {
      const prodPng = PNG.sync.read(prod.screenshot);
      const testPng = PNG.sync.read(test.screenshot);

      const width = Math.min(prodPng.width, testPng.width);
      const height = Math.min(prodPng.height, testPng.height);

      const diff = new PNG({width, height});

      const mismatch = pixelmatch(
        prodPng.data, testPng.data, diff.data,
        width, height,
        {threshold: 0.1} // lower threshold = more sensitive
      );

      const percentDiff = (mismatch / (width * height)) * 100;
      score = Math.max(0, 100 - percentDiff);

      if (percentDiff > mismatchThreshold) {
        diffImagePath = path.join('diff_output', encodeURIComponent(pathKey) + '_diff.png');
        await fs.writeFile(diffImagePath, PNG.sync.write(diff));
        notes = `Visual diff: ${percentDiff.toFixed(2)}% mismatch`;
      }
    } catch (e) {
      score = 0;
      notes = 'Error comparing screenshots';
      console.error(`[DIFF] Error comparing ${pathKey}:`, e);
    }

    results.push({
      url: pathKey,
      matchScore: score,
      notes,
      screenshotDiffPath: diffImagePath,
    });
  }

  await generateHtmlReport(results);
}
