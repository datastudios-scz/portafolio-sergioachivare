# Rendimiento

Skill: `web-perf`. Medido sobre el sitio publicado (GitHub Pages, con compresión real), Lighthouse 12.

## Presupuesto y estado (2026-11-13)

| Métrica | Meta | Medido |
|---|---|---|
| Peso total de la carga inicial (comprimido) | ≤ 300 KB | **123 KB** |
| JS propio sin comprimir | ≤ 60 KB | ~30 KB (12 KB transferidos) |
| LCP móvil | ≤ 2,0 s | **1,4–1,6 s** |
| CLS | ≤ 0,02 | **0** |
| TBT móvil | ≤ 100 ms | **0–20 ms** |
| Lighthouse móvil | 95 / 95 / 100 / 100 | **100 / 100 / 100 / 100** |
| Lighthouse escritorio | — | **100 / 100 / 100 / 100** |

Carga inicial por tipo (transferido): HTML 16 KB · fuente 52 KB · imágenes 34 KB · CSS 9 KB · JS 12 KB.
Las capturas de cada diapositiva se descargan cuando esa diapositiva queda al lado de la actual.

## Mediciones

| Fecha | Cambio | Móvil Perf/A11y/BP/SEO | LCP móvil | TBT | Peso |
|---|---|---|---|---|---|
| 2026-11-13 | Primera publicación | 100 / 96 / 100 / 100 | 1,2 s | 50 ms | 159 KB |
| 2026-11-13 | Fuente recortada (90 → 53 KB) | 98 / 95 / 100 / 100 | 1,7 s | 140 ms | 123 KB |
| 2026-11-13 | Sin layout forzado al arrancar + arreglos de A11y | **100 / 100 / 100 / 100** | 1,4–1,6 s | 0–20 ms | 123 KB |
| 2026-11-13 | Rediseño v2: 17 diapositivas, 4 maquetas animadas, íconos SVG (HTML 91 KB sin comprimir) | 99 / 100 / 100 / 100 | 1,6 s | 80 ms | 134 KB |

(La variación de LCP entre corridas en vivo es de ±0,3 s por la red; se toman dos corridas.)

## Qué se hizo y por qué

- **Imágenes** (`npm run img`): AVIF + WebP en 640 / 1080 / hasta 1920 px; el HTML ofrece AVIF solo cuando pesa menos
  que WebP (en capturas con mucho texto a veces no). Calidad AVIF 60 con croma 4:4:4 y WebP 82 para que los números
  se lean. Fondo borroso de 16 px mientras cargan. 8,2 MB de originales → cada visitante baja solo la variante que necesita.
- **Márgenes recortados** en 10 tableros: más dato visible por píxel.
- **Fuente**: Archivo variable de Google Fonts (90 KB) → instanciada a ancho 62–100 y peso 400–850, recortada a los
  caracteres del español (`fontTools`): **53 KB**. Con `preload` y `font-display: swap`.

  ```bash
  python -m fontTools.varLib.instancer fuente.woff2 wdth=62:100 wght=400:850 -o inst.ttf
  python -m fontTools.subset inst.ttf --flavor=woff2 --output-file=archivo-es.woff2 \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC,U+2122,U+2190-2193" \
    --layout-features="kern,liga,calt,tnum,lnum,case,ccmp,locl,mark,mkmk" --no-hinting
  ```
- **Portada sin imagen pesada**: el retrato de puntos sale de un PNG de 10 KB; la foto real (13 KB AVIF) carga con
  prioridad baja. El LCP es texto.
- **JS**: un módulo diferido, sin frameworks. Al arrancar no fuerza layout (se movió `scrollTop` y la medición del
  riel al cuadro siguiente): la tarea larga de 111 ms con CPU ×4 desapareció.
- **Caché**: `app.css` y `app.js` con `?v=<hash>` (los pone `tools/build.mjs`).

## Cómo medir de nuevo

```bash
export CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"
npx --yes lighthouse@12 https://datastudios-scz.github.io/portafolio-sergioachivare/ --quiet \
  --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=.lh/mobile.json
node .claude/skills/web-perf/scripts/lh_summary.mjs .lh/mobile.json
```
