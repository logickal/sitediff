import {URL} from 'node:url';

export function parseUrlList(fileContent: string): string[] {
  return fileContent
    .split(/\r?\n/)
    .map(line => normalizeUrlPath(line))
    .filter((p): p is string => p !== null);
}

export function normalizeUrlPath(raw: string): null | string {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
