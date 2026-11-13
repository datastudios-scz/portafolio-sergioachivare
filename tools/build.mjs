// Genera site/index.html desde src/index.html.
// - Expande <x-img name="…" alt="…" sizes="…" [class="…"] [zoom] [low] [eager] [nolqip]> a <picture>
//   con AVIF (solo si pesa menos que WebP) + WebP, width/height reales y placeholder (color + blur).
// - Versiona assets/css/app.css y assets/js/app.js con un hash de contenido (?v=…) para invalidar cachés.
// Uso: node tools/build.mjs
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const manifest = JSON.parse(await read('site/assets/img/manifest.json'));
let html = await read('src/index.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const parseAttrs = (s) => Object.fromEntries(
  [...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]),
);

const used = new Set();
function picture(a) {
  const m = manifest[a.name];
  if (!m) throw new Error(`x-img: "${a.name}" no está en manifest.json (¿corriste npm run img?)`);
  if (!a.alt && a.alt !== '') throw new Error(`x-img: "${a.name}" sin alt`);
  used.add(a.name);
  const files = m.files;
  const sum = (k) => files.reduce((s, f) => s + f[k], 0);
  const useAvif = sum('avifBytes') < sum('webpBytes') * 0.97;
  const srcset = (fmt) => files.map((f) => `assets/img/${f[fmt]} ${f.w}w`).join(', ');
  const sizes = a.sizes || '100vw';
  const fallback = files.find((f) => f.w >= 1000) || files.at(-1);
  const largest = files.at(-1);
  const loading = a.eager ? ' fetchpriority="high"' : a.low ? ' fetchpriority="low"' : ' loading="lazy"';
  let style = '';
  if (m.color && m.color !== 'transparent') {
    style = a.nolqip || !m.lqip
      ? ` style="background-color:${m.color}"`
      : ` style="background:${m.color} url(${m.lqip}) center/cover no-repeat"`;
  }
  const img = `<img src="assets/img/${fallback.webp}" width="${m.width}" height="${m.height}" alt="${esc(a.alt)}"${loading} decoding="async"${style}>`;
  const sources = (useAvif ? `<source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">` : '')
    + `<source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">`;
  const extra = a['data-step'] !== undefined ? ` data-step="${a['data-step']}"` : '';
  const pic = `<picture${a.class ? ` class="${a.class}"` : ''}${a.zoom ? '' : extra}>${sources}${img}</picture>`;
  if (!a.zoom) return pic;
  const label = a.caption || a.alt;
  return `<a class="zoom${a['link-class'] ? ` ${a['link-class']}` : ''}" href="assets/img/${largest.webp}"${extra} data-caption="${esc(label)}" aria-label="Ampliar: ${esc(a.alt)}">${pic}<span class="zoom__hint" aria-hidden="true"><svg><use href="#i-zoom"/></svg></span></a>`;
}

// los valores entre comillas pueden contener ">" sin cortar la etiqueta
html = html.replace(/<x-img((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>/g, (_, s) => picture(parseAttrs(s)));
if (html.includes('<x-img')) throw new Error('Quedó un <x-img> sin expandir: revisa su sintaxis');

for (const p of ['assets/css/app.css', 'assets/js/app.js']) {
  const buf = await readFile(new URL(`site/${p}`, root));
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  html = html.replaceAll(`"${p}"`, `"${p}?v=${hash}"`);
}

await writeFile(new URL('site/index.html', root), html);

// Limpieza: solo variantes generadas (<nombre>-<ancho>.avif|webp) que ya no figuran en el manifest
// (p. ej. tras recortar una captura). Cualquier otro archivo o carpeta en img/ se respeta.
const keep = new Set();
for (const m of Object.values(manifest)) for (const f of m.files) { keep.add(f.avif); keep.add(f.webp); }
const imgDir = new URL('site/assets/img/', root);
const variant = /^[a-z0-9-]+-\d+\.(avif|webp)$/;
const orphans = (await readdir(imgDir, { withFileTypes: true }))
  .filter((d) => d.isFile() && variant.test(d.name) && !keep.has(d.name)).map((d) => d.name);
await Promise.all(orphans.map((f) => unlink(new URL(f, imgDir))));
if (orphans.length) console.log(`Borradas ${orphans.length} variantes huérfanas: ${orphans.join(', ')}`);
const unused = Object.keys(manifest).filter((k) => !used.has(k));
console.log(`site/index.html listo · ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB · ${used.size} imágenes usadas`
  + (unused.length ? ` · sin usar: ${unused.join(', ')}` : ''));
