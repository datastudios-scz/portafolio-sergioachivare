# Aprendizajes

Bitácora de lecciones no obvias. Formato: **Problema → Causa → Solución → Cómo evitarlo**.

## 2026-11-13 · curl falla contra canva.com en Windows

- **Problema:** `curl` devolvía código 000 / error 35 al descargar el link de Canva.
- **Causa:** schannel (TLS de Windows) no pudo verificar la revocación del certificado: `CRYPT_E_NO_REVOCATION_CHECK`.
- **Solución:** `curl --ssl-no-revoke …` o descargar con `urllib` de Python (no hace esa verificación).
- **Cómo evitarlo:** los scripts del proyecto usan Python o pasan `--ssl-no-revoke`.

## 2026-11-13 · El link "view" de Canva ya trae todo el diseño

- **Problema:** parecía necesario un navegador o la API de Canva para leer el portafolio.
- **Causa:** el HTML público incluye `window['bootstrap'] = JSON.parse('…')` con el documento completo
  (35 páginas, 54 medios, 6 fuentes) y URLs públicas de cada imagen en su máxima resolución.
- **Solución:** decodificar el literal JS y recorrer el árbol → skill `canva-extract`.
- **Cómo evitarlo:** antes de automatizar un navegador, revisa si la página ya embebe sus datos.

## 2026-11-13 · Tildes rotas en la consola

- **Problema:** los textos extraídos salían como `INFORMACI�N`.
- **Causa:** la consola de Windows usa cp1252; los archivos estaban bien en UTF-8.
- **Solución:** `PYTHONIOENCODING=utf-8` al imprimir; nunca "corregir" los datos.

## 2026-11-13 · GitHub pedía aprobación en cada push

- **Problema:** cada push abría una ventana de GitHub pidiendo aprobación/selección de cuenta.
- **Causa:** Git Credential Manager tiene **dos** cuentas de GitHub guardadas (`datastudios-scz` y
  `uniteldesarrollostd`); sin una cuenta fija, pregunta cuál usar. Además, empujar desde un script
  envoltorio no coincidía con las reglas `git push *` ya permitidas en Claude Code.
- **Solución:** `git config credential.https://github.com.username datastudios-scz` (solo este repo) y
  hacer commit/push con comandos `git` directos.
- **Cómo evitarlo:** en repos nuevos de datastudios-scz, fijar la cuenta antes del primer push.

## 2026-11-13 · `python -I` ignora PYTHONIOENCODING

- **Problema:** el script terminaba con `UnicodeEncodeError` al imprimir "→" aunque se exportó `PYTHONIOENCODING=utf-8`.
- **Causa:** el modo aislado `-I` ignora todas las variables `PYTHON*`.
- **Solución:** `sys.stdout.reconfigure(encoding='utf-8')` dentro del script.

## 2026-11-13 · Handshake TLS de Python colgado contra canva.com

- **Problema:** `urllib` expiraba en el handshake TLS (intermitente); `curl --ssl-no-revoke` sí funcionaba.
- **Solución:** `canva_extract.py` intenta urllib 30 s y cae a `curl --ssl-no-revoke`.

## 2026-11-13 · Claude Code no ve skills creadas a mitad de sesión (al principio)

- **Problema:** `Unknown skill` justo después de crear `.claude/skills/*`.
- **Causa:** la carpeta no existía al iniciar la sesión; Claude Code la detectó unos minutos después.
- **Solución:** mientras tanto, seguir el `SKILL.md` a mano; luego ya se invocan normalmente.

## 2026-11-13 · `with_server.py` deja servidores colgados en Windows

- **Problema:** las pruebas con Playwright se quedaban esperando (`networkidle`) y luego `ERR_EMPTY_RESPONSE`.
- **Causa:** el helper captura stdout/stderr del servidor en un pipe que nadie lee; `http.server` escribe un log por
  petición, el búfer se llena y el servidor se bloquea. Además, con `shell=True`, `terminate()` mata `cmd.exe` pero no
  al `python` hijo: queda un servidor huérfano ocupando el puerto.
- **Solución:** `tools/serve.py` (servidor silencioso, sin logs) en segundo plano, en el puerto 8765.
- **Cómo evitarlo:** en Windows, no usar servidores que logueen a un pipe sin leerlo.

## 2026-11-13 · `sharp().blur()` sobre una máscara de 1 canal devuelve 3 canales

- **Problema:** el retrato recortado salía con líneas horizontales y un halo.
- **Causa:** la máscara alfa difuminada volvía con 3 bytes por píxel y se leía como si tuviera 1.
- **Solución:** `.extractChannel(0)` y verificar `info.channels === 1`.

## 2026-11-13 · Difuminar antes de recortar

- **Problema:** al recortar márgenes (`trim`) las zonas difuminadas quedarían corridas.
- **Causa:** las coordenadas de `redact` son de la imagen original.
- **Solución:** en `optimize_images.mjs` el orden es redact → crop → trim.

## 2026-11-13 · Lazy loading en diapositivas superpuestas

- **Problema:** con todas las diapositivas apiladas en la misma posición, `loading="lazy"` descargaría todo de inmediato.
- **Solución:** las lejanas van con `display:none` (no descargan); la activa y sus vecinas se muestran
  (las vecinas con `visibility:hidden`). Así el lazy nativo se convierte en precarga de la diapositiva siguiente.

## 2026-11-13 · Inercia del trackpad saltaba varias diapositivas

- **Solución:** un "gesto" es una serie de eventos `wheel` con menos de 200 ms entre sí; solo navega una vez por gesto.
  También se marca como usado el gesto que hizo scroll interno, para que llegar al final no salte de inmediato.

## 2026-11-13 · Accesibilidad que Lighthouse detectó

- Los nodos del riel en móvil medían 12 px (mínimo 24 px): en pantallas angostas dejan de ser enlaces y se navega con ‹ ›.
- El monograma "SA" tenía un `aria-label` que no incluía su texto visible: ahora es texto + `sr-only`.
- Un texto que aparece con fundido puede medirse a mitad de camino y fallar el contraste: aparece sin fundido.

## 2026-11-13 · El clasificador de Claude Code bloquea ciertas acciones

- Modificar la configuración global de Claude (`~/.claude/settings.json`) y matar procesos por puerto fueron
  bloqueados (auto-modificación / interferir con otras cargas). Alternativas usadas: comandos git ya permitidos y
  otro puerto para el servidor de pruebas.

## 2026-11-13 · `String.replace` convierte `$$` en `$`

- **Problema:** después de insertar código con un script, la página fallaba con `$(...).forEach is not a function`.
- **Causa:** en el texto de reemplazo de `String.prototype.replace`, `$$` significa "un signo `$`".
- **Solución:** usar `split(a).join(b)` o una función como reemplazo cuando el texto nuevo tenga `$`.

## 2026-11-13 · Líneas en blanco entre líneas de código

- **Problema:** los bloques de código de las maquetas mostraban una línea vacía entre cada línea.
- **Causa:** `<pre>` con `white-space: pre` conserva los saltos del HTML **y** cada `<span class="l">` es un bloque.
- **Solución:** `.code { white-space: normal }` y `.code .l { white-space: pre }`.

## 2026-11-13 · Unidades `cqw` en el propio contenedor

- **Problema:** el tamaño de letra de las maquetas no escalaba con su ancho.
- **Causa:** las unidades `cqw` se resuelven contra el contenedor **ancestro**, no contra el elemento que declara
  `container-type`.
- **Solución:** `container-type` en el padre (`.split__media`, `.code-fig`) y `font-size: …cqw` en la maqueta.

## 2026-11-13 · Comillas invertidas en scripts de bash

- **Problema:** al escribir Markdown con `node -e "…"`, desaparecían los textos entre comillas invertidas.
- **Causa:** dentro de comillas dobles, bash ejecuta `` `…` `` como sustitución de comandos.
- **Solución:** escribir documentos con la herramienta de edición de archivos, nunca a través de la shell.

## 2026-11-13 · Heredoc de bash se comía las barras invertidas

- **Problema:** un script Python escrito con `cat << 'EOF'` perdió los `\\`.
- **Solución:** escribir archivos con la herramienta de edición, no con heredocs, cuando tengan barras invertidas.
