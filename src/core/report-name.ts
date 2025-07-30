import path from 'node:path';

export interface ReportNameOptions {
  htmlThreshold?: number;
  imageThreshold?: number;
  mismatchThreshold?: number;
  sitemap?: string;
  strictHtml?: boolean;
  urlList?: string;
}

export function buildReportFilename(options: ReportNameOptions): string {
  const parts: string[] = [];
  if (options.urlList) {
    const base = path.basename(options.urlList, path.extname(options.urlList));
    parts.push(base);
  } else if (options.sitemap) {
    const base = path.basename(options.sitemap, path.extname(options.sitemap));
    parts.push(base);
  } else {
    parts.push('crawl');
  }

  if (options.htmlThreshold !== undefined) parts.push(`ht${options.htmlThreshold}`);
  if (options.imageThreshold !== undefined) parts.push(`it${options.imageThreshold}`);
  if (options.mismatchThreshold !== undefined) parts.push(`mt${options.mismatchThreshold}`);
  if (options.strictHtml) parts.push('strict');

  return `report-${parts.join('-')}.html`;
}
