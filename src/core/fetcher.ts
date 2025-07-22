import {chromium} from 'playwright';

export async function fetchPages(baseUrl: string, paths: string[], logFn: (msg: string) => void) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000); // 60 seconds

  const results: Record<string, {html: string; screenshot: Buffer}> = {};

  for (const path of paths) {
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    logFn(`Fetching ${fullUrl}`);

    try {
      await page.goto(fullUrl, {waitUntil: 'networkidle'});
      const html = await page.content();
      const screenshot = await page.screenshot({fullPage: true});
      results[fullUrl] = {html, screenshot};
    } catch (err) {
      logFn(`Error fetching ${fullUrl}: ${err}`);
    }
  }

  await browser.close();
  return results;
}
