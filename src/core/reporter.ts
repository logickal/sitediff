import fs from 'fs/promises';
import path from 'path';

interface PageResult {
  url: string;
  matchScore: number;
  visualDiff: number | null;
  htmlDiff: number | null;
  notes: string;
  screenshotDiffPath?: string;
}

export async function generateHtmlReport(results: PageResult[], outputPath: string = 'report.html') {
  const rows = results.map(r => {
    const relativeImagePath = r.screenshotDiffPath ? path.relative(path.dirname(outputPath), r.screenshotDiffPath) : null;
    return `
      <tr>
        <td><a href="${r.url}" target="_blank">${r.url}</a></td>
        <td>${r.matchScore.toFixed(1)}%</td>
        <td>${r.visualDiff !== null ? r.visualDiff.toFixed(2) + '%' : 'N/A'}</td>
        <td>${r.htmlDiff !== null ? r.htmlDiff.toFixed(2) + '%' : 'N/A'}</td>
        <td>${r.notes}</td>
        <td>${relativeImagePath ? `<img src="${relativeImagePath}" width="200"/>` : 'N/A'}</td>
      </tr>
    `;
  }).join('');

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
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  await fs.writeFile(outputPath, html, 'utf-8');
}
