import {diffWords} from 'diff';
import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

import {generateHtmlReport, type PageResult} from './reporter.js';

interface PageData {
  html: string;
  screenshot: Buffer;
}

interface SitePages {
  [path: string]: PageData;
}

interface CompareOptions {
  htmlThreshold?: number;
  imageThreshold?: number;
  mismatchThreshold?: number;
  prodBaseUrl?: string;
  strictHtml?: boolean;
  testBaseUrl?: string;
}

function sanitizeFilename(urlPath: string): string {
  return urlPath
    .replace(/^\/+/, '')       // remove leading slashes
    .replaceAll(/[^a-z0-9]/gi, '_') // replace non-alphanumerics
    .toLowerCase();
}

function normalizeHtmlForComparison(html: string, baseUrls: string[], strict = false): string {
  if (strict) return html;

  let normalized = html;

  for (const base of baseUrls) {
    if (!base) continue;
    const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
    normalized = normalized.replaceAll(new RegExp(escaped, 'g'), '__BASEURL__');

    const alt = base.endsWith('/') ? base.slice(0, -1) : base + '/';
    const escapedAlt = alt.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
    normalized = normalized.replaceAll(new RegExp(escapedAlt, 'g'), '__BASEURL__/');
  }

  normalized = normalized.replaceAll(/nonce=(['"]).*?\1/g, 'nonce=$1__REDACTED__$1');

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
  const results: PageResult[] = [];
  await fs.mkdir('diff_output', {recursive: true});

  const keys = Object.keys(prodPages);

  await Promise.all(keys.map(async pathKey => {
    const prod = prodPages[pathKey];
    const test = testPages[pathKey];

    if (!test) {
      console.warn(`[DIFF] Test site missing for ${pathKey}`);
      results.push({ htmlDiff: null, matchScore: 0, notes: 'Missing on test site', url: pathKey, visualDiff: null });
      continue;
    }

    console.log(`[DIFF] Comparing ${pathKey}...`);

    let score = 100;
    let notes = 'OK';
    let diffImagePath;
    let visualDiffPercent = 0;
    let htmlDiffPercent = 0;
    let normalizedProdHtml = prod.html;
    let normalizedTestHtml = test.html;
    let shouldInclude = true;

    try {
      normalizedProdHtml = normalizeHtmlForComparison(
        prod.html,
        [options.prodBaseUrl ?? '', options.testBaseUrl ?? ''],
        options.strictHtml ?? false,
      );
      normalizedTestHtml = normalizeHtmlForComparison(
        test.html,
        [options.prodBaseUrl ?? '', options.testBaseUrl ?? ''],
        options.strictHtml ?? false,
      );
      htmlDiffPercent = calculateHtmlDiffPercent(normalizedProdHtml, normalizedTestHtml);

      const prodPng = PNG.sync.read(prod.screenshot);
      const testPng = PNG.sync.read(test.screenshot);
      const width = Math.min(prodPng.width, testPng.width);
      const height = Math.min(prodPng.height, testPng.height);

      const diff = new PNG({height, width});
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

    } catch (error) {
      score = 0;
      notes = 'Error comparing page content';
      console.error(`[DIFF] Error comparing ${pathKey}:`, error);
    }

    if (shouldInclude) {
      results.push({
        htmlDiff: htmlDiffPercent,
        matchScore: score,
        notes,
        prodHtml: normalizedProdHtml,
        screenshotDiffPath: diffImagePath,
        testHtml: normalizedTestHtml,
        url: pathKey,
        visualDiff: visualDiffPercent,
      });
    }
  }));

  await generateHtmlReport(results, 'report.html', options.htmlThreshold ?? 0);
}
