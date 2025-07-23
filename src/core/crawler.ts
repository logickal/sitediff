/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
import {URL} from 'node:url';
import {chromium} from 'playwright';

const MAX_DEPTH = 2;
const MAX_PAGES = 50;

export async function crawlSitePlaywright(baseUrl: string): Promise<string[]> {
  const visited = new Set<string>();
  const queue: {depth: number; url: string,}[] = [{depth: 0, url: baseUrl}];
  const baseHost = new URL(baseUrl).host;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const {depth, url} = queue.shift()!;
    if (visited.has(url) || depth > MAX_DEPTH) continue;

    try {
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      visited.add(url);

       
       
       
      const hrefs = await page.$$eval('a[href]', anchors =>
        anchors.map(a => (a as HTMLAnchorElement).href)
      );

      for (const href of hrefs) {
        try {
          const next = new URL(href);
          if (next.host === baseHost && !visited.has(next.href)) {
            queue.push({depth: depth + 1, url: next.href});
          }
        } catch {
          // ignore malformed URLs
        }
      }
    } catch (error) {
      console.warn(`Failed to load ${url}: ${error}`);
    }
  }

  await browser.close();
  return [...visited];
}
