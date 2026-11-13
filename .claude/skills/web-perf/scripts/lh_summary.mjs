#!/usr/bin/env node
// Resume uno o más reportes JSON de Lighthouse en una tabla Markdown.
// Uso: node lh_summary.mjs .lh/mobile.json [.lh/desktop.json ...]
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rows = [];
for (const file of process.argv.slice(2)) {
  const r = JSON.parse(await readFile(file, 'utf8'));
  const cat = (k) => (r.categories?.[k]?.score == null ? '–' : Math.round(r.categories[k].score * 100));
  const au = (k) => r.audits?.[k]?.displayValue ?? '–';
  const weight = r.audits?.['total-byte-weight']?.numericValue;
  rows.push([
    path.basename(file, '.json'),
    r.configSettings?.formFactor ?? '?',
    cat('performance'), cat('accessibility'), cat('best-practices'), cat('seo'),
    au('first-contentful-paint'), au('largest-contentful-paint'), au('total-blocking-time'),
    au('cumulative-layout-shift'), weight ? `${(weight / 1024).toFixed(0)} KB` : '–',
  ]);
}
const head = ['reporte', 'form', 'Perf', 'A11y', 'BP', 'SEO', 'FCP', 'LCP', 'TBT', 'CLS', 'Peso'];
console.log(`| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|`);
for (const r of rows) console.log(`| ${r.join(' | ')} |`);
