import {chromium} from 'playwright';

export async function fetchPages(baseUrl: string, paths: string[]) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: Record<string, {html: string; screenshot: Buffer}> = {};

  for (const path of paths) {
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
    await page.goto(fullUrl, {waitUntil: 'networkidle'});
    const html = await page.content();
    const screenshot = await page.screenshot({fullPage: true});
    results[fullUrl] = {html, screenshot};
  }

  await browser.close();
  return results;
}
