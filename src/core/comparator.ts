import {diffWords} from 'diff';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
// eslint-disable-next-line n/no-extraneous-import
import pLimit from 'p-limit';
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
  concurrency?: number;
  htmlThreshold?: number;
  imageThreshold?: number;
  mismatchThreshold?: number;
  outputPath?: string;
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

  normalized = normalized.replaceAll(/nonce=(["']).*?\1/g, 'nonce=$1__REDACTED__$1');

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
  options: CompareOptions = {},
  paths: string[] = [...new Set([...Object.keys(prodPages), ...Object.keys(testPages)])],
) {
  const results: PageResult[] = [];
  await fs.mkdir('diff_output', {recursive: true});

  const concurrency = options.concurrency ?? os.cpus().length;
  const limit = pLimit(concurrency);

  await Promise.all(paths.map(pathKey => limit(async () => {
    const prod = prodPages[pathKey];
    const test = testPages[pathKey];

    if (!prod && !test) {
      console.warn(`[DIFF] Page missing on both sites for ${pathKey}`);
      results.push({ htmlDiff: null, matchScore: 0, notes: 'Missing on both sites', url: pathKey, visualDiff: null });
      return;
    }

    if (!prod) {
      console.warn(`[DIFF] Production site missing for ${pathKey}`);
      results.push({ htmlDiff: null, matchScore: 0, notes: 'Missing on production site', url: pathKey, visualDiff: null });
      return;
    }

    if (!test) {
      console.warn(`[DIFF] Test site missing for ${pathKey}`);
      results.push({ htmlDiff: null, matchScore: 0, notes: 'Missing on test site', url: pathKey, visualDiff: null });
      return;
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
    let prodPng: PNG | undefined;
    let testPng: PNG | undefined;

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

      const htmlMatches = normalizedProdHtml === normalizedTestHtml;
      if (!htmlMatches) {
        htmlDiffPercent = calculateHtmlDiffPercent(
          normalizedProdHtml,
          normalizedTestHtml,
        );

        if (!prod.screenshot.equals(test.screenshot)) {
          prodPng = PNG.sync.read(prod.screenshot);
          testPng = PNG.sync.read(test.screenshot);

          if (prodPng.width !== testPng.width || prodPng.height !== testPng.height) {
            console.warn(
              `[DIFF] Screenshot size mismatch for ${pathKey}: prod=${prodPng.width}x${prodPng.height}, ` +
              `test=${testPng.width}x${testPng.height}`,
            );
          }

          const width = Math.min(prodPng.width, testPng.width);
          const height = Math.min(prodPng.height, testPng.height);

          const diff = new PNG({height, width});
          const mismatch = pixelmatch(
            prodPng.data,
            testPng.data,
            diff.data,
            width,
            height,
            {threshold: 0.1},
          );
          visualDiffPercent = (mismatch / (width * height)) * 100;

          if (
            options.imageThreshold !== undefined &&
            visualDiffPercent > options.imageThreshold
          ) {
            const safeFilename = sanitizeFilename(pathKey) + '_diff.png';
            diffImagePath = path.join('diff_output', safeFilename);
            await fs.writeFile(diffImagePath, PNG.sync.write(diff));
          }
        }
      }

      score = Math.round((100 - visualDiffPercent + 100 - htmlDiffPercent) / 2);

      if (options.mismatchThreshold !== undefined && score >= (100 - options.mismatchThreshold)) {
        shouldInclude = false;
      }

    } catch (error) {
      score = 0;
      notes = 'Error comparing page content';
      const sizeInfo =
        prodPng && testPng
          ? ` (prod: ${prodPng.width}x${prodPng.height}, test: ${testPng.width}x${testPng.height})`
          : '';
      console.error(`[DIFF] Error comparing ${pathKey}${sizeInfo}:`, error);
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
  })));

  await generateHtmlReport(results, options.outputPath ?? 'report.html', options.htmlThreshold ?? 0);
}

