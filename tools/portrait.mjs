// Retrato: quita el fondo blanco (relleno por inundación desde arriba y los lados),
// genera el recorte con alfa (AVIF/WebP) y una versión mínima en grises+alfa para el
// retrato de puntos de la portada.
// Uso: node tools/portrait.mjs <foto.png> <dir_salida>
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [src, outDir] = process.argv.slice(2);
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

const isBg = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
  return mn > 226 && mx - mn < 18; // casi blanco y sin color
};

// BFS desde bordes superior, izquierdo y derecho (no el inferior: la camisa blanca llega abajo)
const bg = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let head = 0, tail = 0;
const push = (x, y) => {
  const p = y * W + x;
  if (bg[p] || !isBg(p * 4)) return;
  bg[p] = 1;
  queue[tail++] = p;
};
for (let x = 0; x < W; x++) push(x, 0);
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (head < tail) {
  const p = queue[head++];
  const x = p % W, y = (p / W) | 0;
  if (x > 0) push(x - 1, y);
  if (x < W - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < H - 1) push(x, y + 1);
}

// máscara: 255 = sujeto. Erosión de 1 px para quitar el halo blanco y luego suavizado.
let mask = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++) mask[p] = bg[p] ? 0 : 255;
const eroded = Buffer.from(mask);
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (mask[p] && (!mask[p - 1] || !mask[p + 1] || !mask[p - W] || !mask[p + W])) eroded[p] = 0;
  }
}
// ojo: blur() puede devolver 3 canales; extractChannel(0) garantiza 1 byte por píxel
const blurred = await sharp(eroded, { raw: { width: W, height: H, channels: 1 } })
  .blur(1.1).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
if (blurred.info.channels !== 1) throw new Error(`máscara con ${blurred.info.channels} canales`);
mask = blurred.data;
const bgCount = bg.reduce((a, v) => a + v, 0);
console.log(`fondo detectado: ${(100 * bgCount / (W * H)).toFixed(1)}% de la imagen`);

// caja del sujeto
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (mask[y * W + x] > 128) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const pad = 12;
const crop = { left: Math.max(0, minX - pad), top: Math.max(0, minY - pad), width: Math.min(W, maxX + pad) - Math.max(0, minX - pad), height: Math.min(H, maxY + 1) - Math.max(0, minY - pad) };

const rgba = Buffer.from(data);
for (let p = 0; p < W * H; p++) rgba[p * 4 + 3] = mask[p];
const cut = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract(crop).png().toBuffer();

const manifestPath = path.join(outDir, 'manifest.json');
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* nuevo */ }
const files = [];
for (const w of [480, 800, 1200]) {
  const r = sharp(cut).resize({ width: w });
  const avif = await r.clone().avif({ quality: 62, effort: 6 }).toBuffer();
  const webp = await r.clone().webp({ quality: 84, alphaQuality: 90, effort: 6 }).toBuffer();
  await writeFile(path.join(outDir, `retrato-${w}.avif`), avif);
  await writeFile(path.join(outDir, `retrato-${w}.webp`), webp);
  files.push({ w, avif: `retrato-${w}.avif`, webp: `retrato-${w}.webp`, avifBytes: avif.length, webpBytes: webp.length });
  console.log(`retrato-${w}: avif ${(avif.length / 1024).toFixed(0)} KB · webp ${(webp.length / 1024).toFixed(0)} KB`);
}
manifest.retrato = { width: crop.width, height: crop.height, ratio: +(crop.width / crop.height).toFixed(4), color: 'transparent', files };
await writeFile(manifestPath, JSON.stringify(manifest, null, 1));

// versión para puntos: 120 px de ancho, gris + alfa, PNG sin pérdida
const dots = await sharp(cut).resize({ width: 120 }).greyscale().png({ compressionLevel: 9, palette: false }).toBuffer();
await writeFile(path.join(outDir, 'retrato-puntos.png'), dots);
const dm = await sharp(dots).metadata();
console.log(`retrato-puntos.png ${dm.width}×${dm.height} (${(dots.length / 1024).toFixed(1)} KB) · recorte ${crop.width}×${crop.height}`);
