import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

export async function compareSites(prodPages: any, testPages: any) {
  for (const url of Object.keys(prodPages)) {
    const prod = prodPages[url];
    const test = testPages[url];
    // TODO: Use cheerio to diff HTML
    // TODO: Pixelmatch to compare screenshots
    console.log(`Compared ${url}: placeholder result ✅`);
  }
}
