/* eslint-disable no-await-in-loop */
import {chromium} from 'playwright';

export async function fetchPages(baseUrl: string, paths: string[], logFn: (msg: string) => void) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60_000); // 60 seconds

  const results: Record<string, {html: string; screenshot: Buffer}> = {};

  for (const path of paths) {
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    logFn(`Fetching ${fullUrl}`);

    try {
      await page.goto(fullUrl, {waitUntil: 'networkidle'});
      const html = await page.content();
      const screenshot = await page.screenshot({fullPage: true});
      results[path] = {html, screenshot};  // ✅ Use `path` as key
      logFn(`Fetched and stored content for ${path}`);
    } catch (error) {
      logFn(`Error fetching ${fullUrl}: ${error}`);
    }
  }

  await browser.close();
  return results;
}
