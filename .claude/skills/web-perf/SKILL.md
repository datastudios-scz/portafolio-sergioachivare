---
name: web-perf
description: Rendimiento y calidad de render del portafolio estático — imágenes nítidas en retina (AVIF/WebP en varios anchos con srcset, placeholders blur), fuentes self-hosted woff2, carga diferida por diapositiva, presupuesto de peso y medición con Lighthouse. Úsala siempre que se agreguen o cambien imágenes, fuentes, scripts o estilos, cuando algo "cargue lento", "se vea borroso/pixelado", antes de cada despliegue, o cuando se pida medir velocidad, Core Web Vitals, LCP, CLS o puntaje Lighthouse.
---

# Rápido de abrir, nítido de ver

Dos objetivos que compiten: **alto render** (capturas de dashboards legibles, nítidas en
pantallas 2x/3x) y **entrada instantánea**. Se reconcilian sirviendo a cada pantalla solo los
píxeles que necesita, y solo cuando la diapositiva está por verse.

## Presupuesto (no negociable sin anotarlo en `docs/performance.md`)

| Métrica | Meta |
|---|---|
| Primera vista (HTML+CSS+JS+fuentes+imagen portada), comprimido | ≤ 300 KB |
| JS propio (sin comprimir) | ≤ 60 KB, sin frameworks |
| LCP (Lighthouse móvil) | ≤ 2.0 s |
| CLS | ≤ 0.02 (toda imagen con `width`/`height` o `aspect-ratio`) |
| TBT | ≤ 100 ms |
| Lighthouse móvil | Perf ≥ 95 · A11y ≥ 95 · Best Practices 100 · SEO 100 |

## Imágenes

```bash
node .claude/skills/web-perf/scripts/optimize_images.mjs tools/images.json
```

`images.json` lista cada imagen fuente con su nombre de salida y anchos. El script (sharp):
- genera `nombre-<ancho>.avif` y `.webp` (sin ampliar nunca por encima del original);
- calcula proporción, color dominante y un placeholder borroso (WebP ~16 px en base64);
- escribe `site/assets/img/manifest.json` → se usa para `srcset`, `width/height` y el blur-up.

Reglas:
- Capturas con texto pequeño (dashboards): WebP q≈82, AVIF q≈60 con `chromaSubsampling 4:4:4`;
  revisa a zoom 100% que los números se lean. Si se ve sucio, sube calidad antes que tamaño.
- Ancho máximo servido = 2× el ancho CSS en que se muestra (retina) o el original, lo que sea menor.
- `sizes` real según layout (no `100vw` si ocupa la mitad).
- Portada: `fetchpriority="high"`, sin `loading="lazy"`. El resto: lazy por diapositiva
  (el motor precarga la siguiente y la anterior).
- Vectores (íconos, diagramas): SVG inline u optimizado, nunca PNG.

## Fuentes

- Self-host en `site/assets/fonts/`, woff2, subset latin (cubre á é í ó ú ñ ¿ ¡).
- Máximo 2 familias + 1 mono; preferir variables. `font-display: swap`, `preload` solo la de titulares.
- Métricas de fallback (`size-adjust`, `ascent-override`) para que el swap no mueva el layout.

## JS y animación

- Un solo `type="module"` diferido; nada bloquea el primer render.
- Bucles `requestAnimationFrame` (canvas, partículas) se pausan si la diapositiva no está activa
  o `document.hidden`; DPR del canvas limitado a 2.
- Animar solo `transform`, `opacity`, `clip-path`, `filter` ligero. Nada de `top/left/width`.
- `prefers-reduced-motion: reduce` → transiciones cortas de opacidad, sin partículas en movimiento.

## Medición

```bash
# servidor local (en otra terminal o en background)
python -m http.server 8080 --directory site
# Lighthouse móvil y escritorio (usa el Chrome instalado)
npx --yes lighthouse http://localhost:8080/ --quiet --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.lh/mobile.json
npx --yes lighthouse http://localhost:8080/ --preset=desktop --quiet --chrome-flags="--headless=new" \
  --output=json --output-path=.lh/desktop.json
node .claude/skills/web-perf/scripts/lh_summary.mjs .lh/mobile.json .lh/desktop.json
```

Anota el resumen con fecha en `docs/performance.md` (skill `project-docs`). `.lh/` va en `.gitignore`.
