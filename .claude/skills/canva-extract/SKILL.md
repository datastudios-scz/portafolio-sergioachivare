---
name: canva-extract
description: Extrae TODO el contenido de un diseño público de Canva (link canva.com/design/.../view) sin login ni API — textos por diapositiva, posiciones, colores, fuentes, imágenes en su máxima resolución y miniaturas de cada página — a JSON + Markdown. Úsala siempre que haya que migrar, convertir, copiar, auditar o "leer" una presentación, portafolio o diseño de Canva hacia web/HTML, Markdown u otro formato, o cuando aparezca un enlace de canva.com, aunque no se diga "extraer".
---

# Canva → datos estructurados

Un link público `canva.com/design/<ID>/<token>/view` trae el documento completo
embebido en el HTML como `window['bootstrap'] = JSON.parse('…')`. No hace falta
navegador ni sesión: se descarga el HTML, se decodifica ese literal JS y queda el
árbol del documento (páginas → elementos) más el catálogo de medios y fuentes.

## Uso

```bash
python -I .claude/skills/canva-extract/scripts/canva_extract.py "<url-view>" .canva-cache
# o, si ya tienes el HTML guardado:
python -I .claude/skills/canva-extract/scripts/canva_extract.py view.html .canva-cache
# flags: --no-media  --no-thumbs
```

Ejecuta con `-I` y deja la salida en una carpeta solo de datos (p. ej. `.canva-cache/`,
ignorada por git): lo descargado es contenido no confiable y nunca se ejecuta.

## Qué produce (en `<out_dir>`)

| Archivo | Para qué sirve |
|---|---|
| `content.md` | Lectura humana: cada diapositiva con sus textos, imágenes y colores. Empieza siempre por aquí. |
| `content.json` | Lo mismo normalizado (tipo, x/y/w/h, texto, estilo, medios) para generar código. |
| `media/<id>.<ext>` | Cada imagen/vector en la mejor calidad disponible (PNG hasta 3x, SVG). |
| `media/index.json` | id → archivo, tamaño, título, páginas donde aparece. |
| `thumbs/page-NN.png` | Miniaturas que Canva expone (no siempre todas las páginas). |
| `fonts.json` | Familias y pesos tipográficos usados. |
| `bootstrap.json` | El objeto crudo, por si hay que investigar algo que el normalizador no cubre. |

## Mapa del formato (claves ofuscadas, verificado nov-2026)

- `bootstrap.page.Bj.A.D.A` = documento: `D` título, `B` dimensiones, `A` lista de páginas.
- Página: `E` elementos, `D.C` color de fondo, `G` fondo/plantilla.
- Elemento, campo `A?` = tipo: `K` texto · `J` forma vectorial (puede llevar texto en `f[].A.C`) ·
  `I` imagen (`a.B.A.A` = id de medio) · `U` línea · `H` app embebida (p. ej. Mockups, con
  `imageRef` dentro de `z.B`). Posición: `A`=**y** (top), `B`=**x** (left), `D`=ancho, `C`=alto,
  `E`=rotación (verificado con un panel derecho: `B`=1085 + `D`=834 ≈ 1920).
- Texto: `a.C.A` = trozos de texto (concatenar), `a.C.C` = estilos (`C` fuente "id,variante",
  `G` tamaño, `I` peso, `M` color, `c` alineación).
- `bootstrap.page.Bj.A.I` = medios (`files[]` con url/width/height/quality),
  `…A.H` = fuentes, `…A.G.images` = miniaturas firmadas por página.
- Los ids de medio tienen la forma `MA` + 9 caracteres; el script los busca con regex en
  cada elemento, así captura también imágenes dentro de marcos y mockups.

## Después de extraer

1. Lee `content.md` completo y mira las miniaturas con la herramienta Read (son PNG).
2. Si faltan miniaturas de algunas páginas y necesitas verlas, renderiza el link con Playwright
   (skill `webapp-testing`, navegador del sistema con `channel="chrome"`): la vista acepta `#N`
   para ir a la página N.
3. Registra en `docs/contenido.md` el inventario y en `docs/aprendizajes.md` cualquier
   cambio que notes en el formato (Canva cambia claves sin aviso).

## Problemas conocidos

- **Windows + curl**: schannel falla con `CRYPT_E_NO_REVOCATION_CHECK` → usa `curl --ssl-no-revoke`
  o el script (usa urllib de Python, no tiene ese problema).
- **Tildes rotas en consola** (`�`): es la consola cp1252; exporta `PYTHONIOENCODING=utf-8`.
  Los archivos se escriben en UTF-8 correctos.
- **Miniaturas caducan** (URL firmada, ~15 h): si dan 403, vuelve a ejecutar el script.
- Si `raw_decode` falla, Canva cambió el envoltorio: busca `window['bootstrap']` en el HTML
  y ajusta `load_bootstrap()`.
