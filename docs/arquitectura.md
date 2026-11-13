# Arquitectura

Skill de referencia para cambios: `motion-slides` (motor y convenciones) y `web-perf` (imágenes y peso).

## Archivos

```
src/index.html              FUENTE del HTML (17 <section class="slide">, imágenes como <x-img>)
tools/build.mjs             src/index.html → site/index.html (expande <x-img>, versiona CSS/JS, limpia variantes huérfanas)
tools/images.json           qué imagen de Canva va con qué nombre, anchos, recortes y zonas a difuminar
tools/portrait.mjs          recorte del retrato + versión de 120 px para el retrato de puntos
tools/serve.py              servidor local silencioso (pruebas)
tools/qa.py                 QA con Playwright: capturas por diapositiva, consola, pruebas de interacción
tools/og_image.py           og:image a partir de la portada real
tools/contact_sheet.mjs     hoja de contacto de una carpeta de imágenes (revisión rápida)
site/                       lo que se publica (estático, sin build en el servidor)
  index.html                GENERADO: no editar a mano
  assets/css/app.css        estilos (tokens → base → cromo → deck → componentes → diapositivas → diálogos → animación → sin JS → impresión)
  assets/js/app.js          motor + efectos, un solo módulo (~46 KB sin comprimir, 15 KB con gzip)
  assets/img/               GENERADO por npm run img y tools/portrait.mjs (+ manifest.json)
  assets/fonts/archivo-es.woff2   Archivo variable recortada (ver performance.md)
```

## Cómo se construye

1. `npm run img` → `site/assets/img/*-<ancho>.avif|webp` + `manifest.json` (ancho, alto, color dominante, placeholder borroso).
2. `node tools/build.mjs` → cada `<x-img name alt sizes [zoom] [low] [eager] [nolqip] [caption]>` se vuelve un
   `<picture>` con AVIF (solo si pesa menos que WebP) + WebP, `width/height` reales (CLS ≈ 0) y fondo borroso mientras carga.
   Con `zoom` queda envuelto en `<a class="zoom" href="<máxima resolución>">` (funciona sin JS; con JS abre el lightbox).
3. Commit + push → GitHub Actions publica `site/`.

## Motor de diapositivas (`app.js` → `deck`)

- Todas las diapositivas están en el HTML. Con JS (`html.js`) se apilan a pantalla completa; solo la activa y sus
  vecinas se "montan" (`is-active`, `is-near` = visibles para el navegador pero ocultas): como las imágenes son
  `loading="lazy"`, **montar = precargar**. Las lejanas tienen `display:none` y no descargan nada.
- `deck.go(k)` → transición: la entrante se revela con `clip-path` (de abajo hacia arriba al avanzar), la saliente se
  hunde y atenúa, y una línea azafrán recorre el borde del corte. 760 ms, `cubic-bezier(.77,0,.18,1)`.
  Con `prefers-reduced-motion`: fundido de 180 ms.
- Entradas: rueda/trackpad (un gesto = una diapositiva; la inercia se ignora hasta una pausa de 200 ms o un cambio de
  dirección), teclado (flechas, AvPág/RePág, espacio, Inicio/Fin), táctil (swipe vertical ≥ 50 px), enlaces `#id`,
  riel, índice y botones ‹ › en móvil.
- Scroll interno primero: si `.slide__scroll` aún puede moverse en esa dirección, el gesto es suyo. En táctil se mira
  el estado al empezar el gesto, así llegar al borde no salta de diapositiva sin un gesto nuevo.
- Rutas: `history.replaceState` con `#id` al navegar; `pushState` cuando se llega por un enlace (el botón Atrás vuelve).
- Accesibilidad: diapositivas inactivas con `inert`; región `aria-live` anuncia "N de 17: título"; con teclado el foco
  pasa al `h2` (`tabindex="-1"`) de la nueva diapositiva.
- Sin JS: el `<html>` queda con `no-js` y el sitio es una página larga normal (pestañas abiertas, imágenes enlazadas).
- Impresión / "Descargar en PDF" (en el índice): fuerza la carga de todas las imágenes y usa `@media print`
  (A4 horizontal, una diapositiva por página, todas las pestañas visibles).

## Efectos (`FX`, montados con `data-fx`)

| `data-fx` | Diapositiva | Qué hace | Cuándo corre |
|---|---|---|---|
| `portrait` | Portada | Gráfico de dispersión → retrato de ~6.600 puntos (1.600 en móvil); lente con el cursor / toque para ver la foto | Una vez; después queda quieto (sin bucle) |
| `count` | Perfil | Cifras que cuentan hasta su valor (1,1 s) | Cada vez que se entra |
| `portal` | Portal BI | Login como el real: se tipean usuario y contraseña, "Ingresar" muestra su indicador de carga → tableros; la vuelta siguiente usa otra marca (3 de ejemplo) | Bucle de ~6,9 s mientras la diapositiva está activa |
| `aichat` | Portal BI con IA | Un cursor abre la pestaña IA del visor (el reporte se angosta), tipea la pregunta y la envía; pasos con punto que late → DAX línea a línea → respuesta → clic en "Graficar" → barras; cierra el panel | Bucle de ~20 s |
| `mcp` | Rubros | VS Code: el agente pide el tablero, se tipean medidas y visuales y la vista previa se arma (KPIs cuentan, barras, línea) | Bucle |
| `iac` | Infraestructura como código | Terminal: comandos de Azure CLI y de la API de Fabric; el árbol de recursos aparece a medida que se crean | Bucle |
| `chat` | Banca | Mensajes del bot aparecen uno a uno (datos ficticios) | Cada vez que se entra |
| `tabs` | Marketing, Seguridad, Apps, Web | Recorrido guiado: avanza de pestaña cada 5 s con barra de progreso; las no vistas laten (`is-new`). Se pausa con el mouse encima y se apaga para siempre en ese grupo al primer clic, tecla, toque, foco o zoom | Mientras la diapositiva está activa; nunca con movimiento reducido |
| `aimap` | IA | Mapa: orquestador + 8 nodos con paquetes (SVG `animateMotion`). El agente tipea la instrucción y el código; cada línea con `data-show` ilumina sus nodos y cables (`is-hot`). Alterna 2 escenarios | Bucle; el SVG se pausa (`pauseAnimations`) fuera de la diapositiva |

Las escenas de código comparten `codeScene()` (tipeo de la instrucción, líneas con `data-show` que revelan algo al
terminar) y todas usan `seq(el)`/`stopSeq(el)`: temporizadores cancelables que se limpian al salir de la diapositiva.
El cursor del visor se mueve con `transform` hacia el centro del elemento medido con `getBoundingClientRect()`
relativo a `.vmock__app` (así funciona a cualquier tamaño de maqueta).

Estado final sin animación: las instrucciones de los agentes, la pregunta del chat, el resultado del mapa de IA y los
KPI de la vista previa ya vienen escritos en el HTML (se ven sin JS y al imprimir). En pantalla, la instrucción se
oculta (`.slide:not(.is-play)`) hasta que la escena la vuelve a tipear, y `fx.leave` la restaura completa al salir.

Pestañas: los paneles se apilan en la misma celda de una grilla y los ocultos usan `visibility: hidden` en lugar de
`display: none`, así el bloque mide lo que el panel más alto y la tira de pestañas no salta al cambiar.

### Coreografía CSS (`data-in` + `.is-play`)

Los elementos con `data-in="rise|drop|pop|up|grow-x|grow-y"` y `style="--d:.4s"` animan cuando el motor agrega
`.is-play` a la diapositiva (300 ms después de empezar la transición) y vuelven a su estado inicial cuando se sale.
Pilares, capas de la arquitectura, receta del portal, mosaicos de rubros y funciones del chat usan esto, sin JS propio.
Con movimiento reducido, sin JS o al imprimir se ve directamente el estado final.

Contrato de un efecto: `FX.nombre = { init(el), enter(el, primeraVez, reanudar), leave(el, pausa) }`. Nada de
`requestAnimationFrame` corriendo fuera de su diapositiva.

## Datos personales

Las capturas se anonimizan en el pipeline de imágenes (`redact` en `tools/images.json`), sobre la imagen original y
antes de recortar. Ver la lista en `contenido.md`. Los originales sin difuminar viven solo en `.canva-cache/`
(ignorada por git).
