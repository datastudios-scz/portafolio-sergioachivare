---
name: motion-slides
description: Motor y convenciones del portafolio paginado como diapositivas (HTML/CSS/JS vanilla, sin frameworks) — navegación por rueda/trackpad, teclado, swipe, puntos e índice, rutas #hash, transiciones entre diapositivas, animaciones de entrada escalonadas, motion graphics (canvas/SVG) que solo corren en la diapositiva activa, accesibilidad y modo sin JS. Úsala siempre que se cree, edite, reordene o anime una diapositiva o sección del portafolio, se agregue un efecto o motion graphic, o algo de la navegación falle (salta dos diapositivas, no hace scroll en móvil, el teclado no responde).
---

# Motor de diapositivas con motion graphics

La experiencia es una presentación: una diapositiva a pantalla completa por vez, transiciones
cinematográficas, y contenido que entra en coreografía. Pero sigue siendo una web: rápida,
accesible, enlazable (`#seccion`) y usable sin JS. Lee `references/engine.md` antes de tocar
`site/assets/js/app.js` y `references/animations.md` antes de animar algo.

## Estructura

```
site/
  index.html                 todas las diapositivas: <section class="slide" id="…" data-title="…">
  assets/css/app.css         tokens → base → deck → componentes → diapositivas → animaciones → print
  assets/js/app.js           motor (deck) + efectos (fx) en un solo módulo diferido
  assets/img/                generado por la skill web-perf (no editar a mano)
  assets/fonts/              woff2 self-hosted
```

## Agregar una diapositiva (receta)

1. Copia una `<section class="slide">` existente con layout parecido; `id` en minúsculas sin
   tildes (es la ruta `#id`) y `data-title` corto (aparece en el índice y en el lector de pantalla).
2. Un único `h2` con `tabindex="-1"` (recibe el foco al llegar con teclado).
3. Marca lo que debe animarse con `data-a="tipo"` y `style="--i:N"` para el orden (ver animations.md).
4. Contenido que pueda crecer en móvil va dentro de `.slide__scroll` (scroll interno; el motor
   solo cambia de diapositiva cuando ese scroll llega al borde).
5. Imágenes: `<picture>` generado con datos de `assets/img/manifest.json`, con `width`/`height`
   y `loading="lazy"` (el motor solo "monta" la diapositiva actual y sus vecinas, así que lazy = precarga inteligente).
6. Si necesita un efecto con JS, regístralo en `FX` dentro de `app.js` con `enter/leave`;
   nunca dejes un `requestAnimationFrame` corriendo fuera de su diapositiva.
7. Prueba: rueda de mouse, trackpad, flechas, swipe en 390×844, `#id` directo, reduced-motion,
   y sin JS (skill `webapp-testing`). Luego `git-autopush`.

## Reglas que evitan los bugs clásicos

- **Un gesto = una diapositiva.** La inercia del trackpad emite eventos ~1 s; se exige una pausa
  sin eventos (≥ 200 ms) o un cambio claro de dirección antes de aceptar otro gesto.
- **Scroll interno primero.** Si `.slide__scroll` puede moverse en esa dirección, el evento es suyo.
- **No secuestrar** teclas en inputs, ni cuando el lightbox/índice está abierto (tienen su propio manejo).
- **Diapositivas inactivas con `inert`** (fuera del tab order y del árbol de accesibilidad) y
  anuncio `aria-live` "N de total: título" al cambiar.
- **Rutas relativas** siempre (el sitio vive en `/<repo>/` en GitHub Pages).
- **Sin JS** (`<html>` sin clase `js`): las diapositivas se ven como una página larga normal.
- **Reduced motion**: transiciones de opacidad ≤ 200 ms, sin parallax ni partículas en movimiento.
