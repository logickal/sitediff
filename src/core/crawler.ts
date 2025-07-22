import {chromium} from 'playwright';
import {URL} from 'url';

const MAX_DEPTH = 2;
const MAX_PAGES = 50;

export async function crawlSitePlaywright(baseUrl: string): Promise<string[]> {
  const visited = new Set<string>();
  const queue: {url: string, depth: number}[] = [{url: baseUrl, depth: 0}];
  const baseHost = new URL(baseUrl).host;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const {url, depth} = queue.shift()!;
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
            queue.push({url: next.href, depth: depth + 1});
          }
        } catch (e) {
          // ignore malformed URLs
        }
      }
    } catch (err) {
      console.warn(`Failed to load ${url}: ${err}`);
    }
  }

  await browser.close();
  return Array.from(visited);
}
