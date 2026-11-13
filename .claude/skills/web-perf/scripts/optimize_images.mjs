#!/usr/bin/env node
// Pipeline de imágenes: AVIF + WebP en varios anchos, placeholder borroso y manifest.
// Uso: node optimize_images.mjs <config.json>
// config: {
//   "outDir": "site/assets/img",
//   "defaults": { "widths": [640, 1280, 1920], "avif": 60, "webp": 82 },
//   "images": [ { "src": ".canva-cache/media/MAxxx.png", "name": "dash-bcp", "widths": [...], "crop": {left,top,width,height}, "trim": true,
//                 "redact": [ {left,top,width,height,sigma?} ] } ]
// }
// Requiere `sharp` instalado en el proyecto (npm i -D sharp).
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const configPath = process.argv[2];
if (!configPath) {
  console.error('Uso: node optimize_images.mjs <config.json>');
  process.exit(2);
}
const cfg = JSON.parse(await readFile(configPath, 'utf8'));
const outDir = cfg.outDir ?? 'site/assets/img';
const defaults = { widths: [640, 1280, 1920], avif: 60, webp: 82, ...cfg.defaults };
await mkdir(outDir, { recursive: true });

const manifestPath = path.join(outDir, 'manifest.json');
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* primero */ }

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
let totalIn = 0, totalOut = 0;

for (const img of cfg.images) {
  const opts = { ...defaults, ...img };
  let buf = await sharp(img.src, { failOn: 'none' }).png().toBuffer();
  // 1) redact sobre la imagen ORIGINAL (sus coordenadas son de la fuente): difumina
  //    credenciales, documentos, teléfonos y nombres de terceros
  if (img.redact?.length) {
    const layers = [];
    for (const r of img.redact) {
      const patch = await sharp(buf).extract(r).blur(r.sigma ?? 7).toBuffer();
      layers.push({ input: patch, left: r.left, top: r.top });
    }
    buf = await sharp(buf).composite(layers).png().toBuffer();
  }
  // 2) recorte explícito y/o de márgenes uniformes, después del redact
  if (img.crop) buf = await sharp(buf).extract(img.crop).png().toBuffer();
  if (img.trim) buf = await sharp(buf).trim({ threshold: 10 }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  const srcSize = (await stat(img.src)).size;
  totalIn += srcSize;

  const widths = [...new Set(opts.widths.map((w) => Math.min(w, meta.width)))].sort((a, b) => a - b);
  const files = [];
  for (const w of widths) {
    const resized = sharp(buf).resize({ width: w, withoutEnlargement: true });
    const avifName = `${img.name}-${w}.avif`;
    const webpName = `${img.name}-${w}.webp`;
    const avif = await resized.clone().avif({ quality: opts.avif, effort: 6, chromaSubsampling: '4:4:4' }).toBuffer();
    const webp = await resized.clone().webp({ quality: opts.webp, effort: 6, smartSubsample: true }).toBuffer();
    await writeFile(path.join(outDir, avifName), avif);
    await writeFile(path.join(outDir, webpName), webp);
    totalOut += avif.length + webp.length;
    files.push({ w, avif: avifName, webp: webpName, avifBytes: avif.length, webpBytes: webp.length });
  }

  const { dominant } = await sharp(buf).stats();
  const lqip = await sharp(buf).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  manifest[img.name] = {
    width: meta.width,
    height: meta.height,
    ratio: +(meta.width / meta.height).toFixed(4),
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    files,
  };
  const biggest = files.at(-1);
  console.log(`${img.name.padEnd(28)} ${meta.width}×${meta.height}  ${kb(srcSize)} → máx ${kb(biggest.avifBytes)} avif / ${kb(biggest.webpBytes)} webp`);
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 1));
console.log(`\nTotal fuentes ${kb(totalIn)} → generado ${kb(totalOut)} (todas las variantes). Manifest: ${manifestPath}`);
