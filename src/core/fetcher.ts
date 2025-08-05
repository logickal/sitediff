import os from 'node:os';
// eslint-disable-next-line n/no-extraneous-import
import pLimit from 'p-limit';
import {chromium} from 'playwright';

export async function fetchPages(
  baseUrl: string,
  paths: string[],
  logFn: (msg: string) => void,
  concurrency = os.cpus().length,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const limit = pLimit(concurrency);

  const results: Record<string, {html: string; screenshot: Buffer}> = {};

  await Promise.all(paths.map(path => limit(async () => {
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    logFn(`Fetching ${fullUrl}`);

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60_000); // 60 seconds

    try {
      await page.goto(fullUrl, {waitUntil: 'networkidle'});
      const html = await page.content();
      const screenshot = await page.screenshot({fullPage: true});
      results[path] = {html, screenshot};
      logFn(`Fetched and stored content for ${path}`);
    } catch (error) {
      logFn(`Error fetching ${fullUrl}: ${error}`);
    } finally {
      await page.close();
    }
  })));

  await browser.close();
  return results;
}
