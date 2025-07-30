/* eslint-disable no-await-in-loop */
import {chromium} from 'playwright';

export async function fetchPages(
  baseUrl: string,
  paths: string[],
  logFn: (msg: string) => void,
  concurrency = 4,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const results: Record<string, {html: string; screenshot: Buffer}> = {};
  const queue = [...paths];

  async function worker() {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60_000); // 60 seconds

    while (queue.length > 0) {
      const nextPath = queue.shift();
      if (!nextPath) break;
      const fullUrl = nextPath.startsWith('http') ? nextPath : `${baseUrl}${nextPath}`;
      logFn(`Fetching ${fullUrl}`);

      try {
        await page.goto(fullUrl, {waitUntil: 'networkidle'});
        const html = await page.content();
        const screenshot = await page.screenshot({fullPage: true});
        results[nextPath] = {html, screenshot};
        logFn(`Fetched and stored content for ${nextPath}`);
      } catch (error) {
        logFn(`Error fetching ${fullUrl}: ${error}`);
      }
    }

    await page.close();
  }

  await Promise.all(Array.from({length: Math.min(concurrency, paths.length)}, worker));

  await browser.close();
  return results;
}
