// eslint-disable-next-line n/no-extraneous-import
import pLimit from 'p-limit';
import {type BrowserContextOptions, chromium} from 'playwright';

export interface BasicAuth {
  password: string;
  username: string;
}

export interface FetchPagesOptions {
  auth?: BasicAuth;
  concurrency?: number;
}

export async function fetchPages(
  baseUrl: string,
  paths: string[],
  logFn: (msg: string) => void,
  options: FetchPagesOptions = {},
) {
  const browser = await chromium.launch();
  const contextOptions: BrowserContextOptions = {};
  if (options.auth) {
    contextOptions.httpCredentials = {password: options.auth.password, username: options.auth.username};
  }

  const context = await browser.newContext(contextOptions);
  const limit = pLimit(options.concurrency ?? 4);

  const results: Record<string, {html: string; screenshot: Buffer}> = {};

  await Promise.all(paths.map(path => limit(async () => {
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    logFn(`Fetching ${fullUrl}`);

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60_000); // 60 seconds

    try {
      // Using 'load' instead of 'networkidle' avoids hanging on pages
      // that keep long-lived network connections (analytics, streaming, etc.).
      await page.goto(fullUrl, {waitUntil: 'load'});
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
