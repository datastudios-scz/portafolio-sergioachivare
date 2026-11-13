// Hoja de contacto: todas las imágenes de una carpeta en una grilla con su nombre.
// Uso: node tools/contact_sheet.mjs <carpeta> <salida.png> [ancho_celda=300] [columnas=5] [filtro_regex]
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [dir, out, cellArg = '300', colsArg = '5', filter = '.'] = process.argv.slice(2);
const cell = Number(cellArg);
const cols = Number(colsArg);
const re = new RegExp(filter);
const files = (await readdir(dir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && re.test(f)).sort();
const label = 22;
const cellH = Math.round(cell * 0.62) + label;
const rows = Math.ceil(files.length / cols);
const tiles = [];
for (const [i, f] of files.entries()) {
  const img = await sharp(path.join(dir, f)).resize({ width: cell, height: cellH - label, fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const meta = await sharp(path.join(dir, f)).metadata();
  const text = `<svg width="${cell}" height="${label}"><rect width="100%" height="100%" fill="#120052"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">${f.replace(/\.\w+$/, '')} ${meta.width}x${meta.height}</text></svg>`;
  const x = (i % cols) * cell;
  const y = Math.floor(i / cols) * cellH;
  tiles.push({ input: Buffer.from(text), left: x, top: y });
  tiles.push({ input: img, left: x, top: y + label });
}
await sharp({ create: { width: cols * cell, height: rows * cellH, channels: 3, background: '#dddddd' } })
  .composite(tiles).png().toFile(out);
console.log(`${files.length} imágenes → ${out}`);
