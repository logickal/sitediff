import fs from 'fs/promises';
import path from 'path';
import {diffWords} from 'diff';

interface PageResult {
  url: string;
  matchScore: number;
  visualDiff: number | null;
  htmlDiff: number | null;
  notes: string;
  screenshotDiffPath?: string;
  htmlDiffPath?: string;
  prodHtml?: string;
  testHtml?: string;
}

function buildHtmlDiffPage(prodHtml: string, testHtml: string, title: string): string {
  const diff = diffWords(prodHtml, testHtml);
  const formatted = diff.map(part => {
    const escaped = part.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (part.added) return `<span style="background-color:#d4fcdc;">${escaped}</span>`;
    if (part.removed) return `<span style="background-color:#fcdada; text-decoration:line-through;">${escaped}</span>`;
    return `<span>${escaped}</span>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Diff - ${title}</title>
  <style>
    body { font-family: monospace; white-space: pre-wrap; }
    span { display: inline; }
  </style>
</head>
<body>
  <h1>HTML Diff - ${title}</h1>
  <div>${formatted}</div>
</body>
</html>`;
}

export async function generateHtmlReport(
  results: PageResult[],
  outputPath: string = 'report.html',
  htmlDiffThreshold: number = 0
) {
  const reportDir = path.dirname(outputPath);
  const rows = await Promise.all(results.map(async r => {
    const relativeImagePath = r.screenshotDiffPath ? path.relative(reportDir, r.screenshotDiffPath) : null;
    let relativeHtmlPath: string | null = null;

    if (r.prodHtml && r.testHtml && (r.htmlDiff !== null && r.htmlDiff > htmlDiffThreshold)) {
      const safeFilename = r.url.replace(/^\/+/, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const diffFileName = `${safeFilename}_html_diff.html`;
      const diffFilePath = path.join(reportDir, 'diff_output', diffFileName);
      const diffHtml = buildHtmlDiffPage(r.prodHtml, r.testHtml, r.url);
      await fs.writeFile(diffFilePath, diffHtml, 'utf-8');
      r.htmlDiffPath = diffFilePath;
      relativeHtmlPath = path.relative(reportDir, diffFilePath);
    } else if (r.htmlDiffPath) {
      relativeHtmlPath = path.relative(reportDir, r.htmlDiffPath);
    }

    return `
      <tr>
        <td><a href="${r.url}" target="_blank">${r.url}</a></td>
        <td>${r.matchScore.toFixed(1)}%</td>
        <td>${r.visualDiff !== null ? r.visualDiff.toFixed(2) + '%' : 'N/A'}</td>
        <td>${r.htmlDiff !== null ? r.htmlDiff.toFixed(2) + '%' : 'N/A'}</td>
        <td>${r.notes}</td>
        <td>${relativeImagePath ? `<img src="${relativeImagePath}" width="200"/>` : 'N/A'}</td>
        <td>${relativeHtmlPath ? `<a href="${relativeHtmlPath}" target="_blank">View</a>` : 'N/A'}</td>
      </tr>
    `;
  }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Site Diff Report</title>
  <style>
    body { font-family: sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px 12px; border: 1px solid #ccc; }
    th { background-color: #eee; }
  </style>
</head>
<body>
  <h1>Site Diff Report</h1>
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Match Score</th>
        <th>Visual Diff</th>
        <th>HTML Diff</th>
        <th>Notes</th>
        <th>Visual Preview</th>
        <th>HTML Diff</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
    </tbody>
  </table>
</body>
</html>`;

  await fs.writeFile(outputPath, html, 'utf-8');
}
