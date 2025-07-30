export interface ReportNameOptions {
  htmlThreshold?: number;
  imageThreshold?: number;
  mismatchThreshold?: number;
  sitemap?: string;
  strictHtml?: boolean;
  urlList?: string;
}

function sanitizePart(part: string): string {
  return part.replaceAll(/[^a-z0-9]/gi, '_');
}

export function buildReportFilename(options: ReportNameOptions): string {
  const parts: string[] = [];
  if (options.urlList) {
    const base = options.urlList.split(/[/\\]/).pop() ?? options.urlList;
    parts.push(sanitizePart(base.replace(/\.[^.]+$/, '')));
  } else if (options.sitemap) {
    const base = options.sitemap.split(/[/\\]/).pop() ?? options.sitemap;
    parts.push(sanitizePart(base.replace(/\.[^.]+$/, '')));
  } else {
    parts.push('crawl');
  }

  if (options.htmlThreshold !== undefined) parts.push(`ht${options.htmlThreshold}`);
  if (options.imageThreshold !== undefined) parts.push(`it${options.imageThreshold}`);
  if (options.mismatchThreshold !== undefined) parts.push(`mt${options.mismatchThreshold}`);
  if (options.strictHtml) parts.push('strict');

  return `report-${parts.join('-')}.html`;
}
