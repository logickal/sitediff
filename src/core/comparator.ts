import path from 'path';
import fs from 'fs/promises';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {generateHtmlReport} from './reporter.js';
import {diffWords} from 'diff';

interface PageData {
  html: string;
  screenshot: Buffer;
}

interface SitePages {
  [path: string]: PageData;
}

interface CompareOptions {
  prodBaseUrl?: string;
  testBaseUrl?: string;
  mismatchThreshold?: number;
  htmlThreshold?: number;
  imageThreshold?: number;
}

function sanitizeFilename(urlPath: string): string {
  return urlPath
    .replace(/^\/+/, '')       // remove leading slashes
    .replace(/[^a-z0-9]/gi, '_') // replace non-alphanumerics
    .toLowerCase();
}

function normalizeHtmlForComparison(html: string, baseUrls: string[], stripNonces = true): string {
  let normalized = html;

  for (const base of baseUrls) {
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized.replace(new RegExp(escaped, 'g'), '__BASEURL__');
  }

  if (stripNonces) {
    normalized = normalized.replace(/nonce-[-\w]+/g, 'nonce-__REDACTED__');
  }

  return normalized;
}

function calculateHtmlDiffPercent(htmlA: string, htmlB: string): number {
  const diff = diffWords(htmlA, htmlB);
  const totalLength = diff.reduce((acc, part) => acc + part.value.length, 0);
  const changedLength = diff.filter(part => part.added || part.removed)
                            .reduce((acc, part) => acc + part.value.length, 0);
  return totalLength === 0 ? 0 : (changedLength / totalLength) * 100;
}

export async function compareSites(
  prodPages: SitePages,
  testPages: SitePages,
  options: CompareOptions = {}
) {
  const results = [];
  await fs.mkdir('diff_output', {recursive: true});

  for (const pathKey of Object.keys(prodPages)) {
    const prod = prodPages[pathKey];
    const test = testPages[pathKey];

    if (!test) {
      console.warn(`[DIFF] Test site missing for ${pathKey}`);
      results.push({ url: pathKey, matchScore: 0, visualDiff: null, htmlDiff: null, notes: 'Missing on test site' });
      continue;
    }

    console.log(`[DIFF] Comparing ${pathKey}...`);

    let score = 100;
    let notes = 'OK';
    let diffImagePath;
    let visualDiffPercent = 0;
    let htmlDiffPercent = 0;
    let shouldInclude = true;

    try {
      const normalizedProdHtml = normalizeHtmlForComparison(prod.html, [options.prodBaseUrl ?? '', options.testBaseUrl ?? '']);
      const normalizedTestHtml = normalizeHtmlForComparison(test.html, [options.prodBaseUrl ?? '', options.testBaseUrl ?? '']);
      htmlDiffPercent = calculateHtmlDiffPercent(normalizedProdHtml, normalizedTestHtml);

      const prodPng = PNG.sync.read(prod.screenshot);
      const testPng = PNG.sync.read(test.screenshot);
      const width = Math.min(prodPng.width, testPng.width);
      const height = Math.min(prodPng.height, testPng.height);

      const diff = new PNG({width, height});
      const mismatch = pixelmatch(
        prodPng.data, testPng.data, diff.data,
        width, height,
        {threshold: 0.1}
      );
      visualDiffPercent = (mismatch / (width * height)) * 100;

      score = Math.round((100 - visualDiffPercent + 100 - htmlDiffPercent) / 2);

      if (options.imageThreshold !== undefined && visualDiffPercent > options.imageThreshold) {
        const safeFilename = sanitizeFilename(pathKey) + '_diff.png';
        diffImagePath = path.join('diff_output', safeFilename);
        await fs.writeFile(diffImagePath, PNG.sync.write(diff));
      }

      if (options.mismatchThreshold !== undefined && score >= (100 - options.mismatchThreshold)) {
        shouldInclude = false;
      }

    } catch (e) {
      score = 0;
      notes = 'Error comparing page content';
      console.error(`[DIFF] Error comparing ${pathKey}:`, e);
    }

    if (shouldInclude) {
      results.push({
        url: pathKey,
        matchScore: score,
        visualDiff: visualDiffPercent,
        htmlDiff: htmlDiffPercent,
        notes,
        screenshotDiffPath: diffImagePath,
        prodHtml: prod.html,
        testHtml: test.html,
      });
    }
  }

  await generateHtmlReport(results, 'report.html', options.htmlThreshold ?? 0);
}
