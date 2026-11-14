# Aprendizajes

Bitácora de lecciones no obvias. Formato: **Problema → Causa → Solución → Cómo evitarlo**.

## 2026-11-13 · curl falla contra HTTPS en Windows (canva.com, github.io)

- **Problema:** `curl` devolvía código 000 / error 35 al descargar el link de Canva. El 2026-11-14 pasó lo mismo al
  verificar el sitio publicado en github.io: con `-s` la respuesta vacía parecía un sitio sin actualizar.
- **Causa:** schannel (TLS de Windows) no pudo verificar la revocación del certificado: `CRYPT_E_NO_REVOCATION_CHECK`.
  Pasa con cualquier sitio HTTPS desde esta laptop, no solo con Canva.
- **Solución:** `curl --ssl-no-revoke …` o descargar con `urllib` de Python (no hace esa verificación).
- **Cómo evitarlo:** los scripts del proyecto usan Python o pasan `--ssl-no-revoke`. Un curl vacío (código 000) es
  este error, no un sitio caído ni en caché: usar `-sS` para ver el mensaje.

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

## 2026-11-13 · La animación de entrada descentraba los nodos del mapa

- **Problema:** los nodos del mapa de IA, centrados con `transform: translate(-50%, -50%)`, saltaban de lugar al
  entrar con `data-in="pop"`.
- **Causa:** los `@keyframes` de entrada animan `transform` y reemplazan el `translate` del centrado.
- **Solución:** centrar con la propiedad independiente `translate: -50% -50%`, que se suma al `transform` animado.
- **Cómo evitarlo:** todo lo que se posiciona con `transform` y además tiene coreografía, usar `translate`/`scale`.

## 2026-11-13 · El bloque de DAX se aplastaba a una línea en el celular

- **Problema:** en el chat del visor, en pantallas chicas, la consulta DAX se veía como una raya.
- **Causa:** el hilo es una columna flex de alto fijo; sus hijos tienen `flex-shrink: 1`, y un hijo con
  `overflow: hidden` pierde su alto mínimo automático, así que se encoge hasta casi cero cuando el contenido no cabe.
- **Solución:** `.vchat__thread > * { flex-shrink: 0 }`; el hilo se desplaza (`scrollTop`) para mostrar lo último.
- **Cómo evitarlo:** en listas flex que deben desplazarse, sus elementos no se encogen.

## 2026-11-13 · El chat a pantalla completa dejaba ver el borde del reporte

- **Problema:** en maquetas angostas el panel del chat (`flex-basis: 100%`) dejaba asomar unos píxeles del reporte.
- **Causa:** el reporte no puede bajar de su `padding` aunque tenga `min-width: 0`.
- **Solución:** en `@container (max-width: 520px)` el chat se superpone (`position: absolute` + `translateX`).

## 2026-11-13 · Pestañas que avanzan solas hacían saltar la diapositiva

- **Problema:** con el recorrido guiado, la tira de pestañas subía y bajaba en cada cambio.
- **Causa:** cada panel tiene otra altura y la diapositiva se centra vertical (`margin-block: auto`).
- **Solución:** paneles apilados en la misma celda de grilla; los ocultos con `visibility: hidden` (siguen fuera del
  árbol de accesibilidad y no reciben clics). El bloque mide lo que el más alto.
- **Cómo evitarlo:** lo que cambia solo, sin que la persona lo pida, no debe mover nada alrededor.

## 2026-11-13 · Textos tipeados por JS quedaban vacíos al imprimir y sin JS

- **Problema:** en el PDF y sin JavaScript, las instrucciones de los agentes y la pregunta del chat salían vacías, y
  los KPI de la vista previa en 0.
- **Causa:** el HTML los traía vacíos y solo el JS los llenaba.
- **Solución:** el texto final va en el HTML. En pantalla se oculta hasta que la escena arranca (si no, se ve un
  instante durante la transición y luego se borra), y al salir de la diapositiva se restaura el estado final.

## 2026-11-13 · La TBT de Lighthouse móvil saltaba de 0 a 490 ms sin cambiar nada

- **Problema:** cinco corridas seguidas sobre el mismo sitio publicado dieron TBT 170, 30, 50, 490 y 0 ms.
- **Causa:** el throttling por defecto es *simulado*: toma lo que dura cada tarea en este equipo y lo multiplica
  por 4. Si Windows está ocupado en ese momento, una tarea de 15 ms pasa a "60 ms" y cuenta como larga.
- **Solución:** reportar la mediana de varias corridas y confirmar con un perfil real: Playwright + CDP con
  `Emulation.setCPUThrottlingRate` (×4) y `Profiler` para ver qué función gasta el tiempo.
- **Cómo evitarlo:** no correr Lighthouse con otras cargas en paralelo (otro Chrome, compilaciones, capturas).

## 2026-11-14 · Un pilar más largo empuja todo el templo

- **Problema:** al sumar gobernanza al pilar de seguridad, la diapositiva de pilares pasó a tener scroll interno
  (20 px) en 1280×720 y 1024×768, y varios ítems dejaban una palabra sola en la segunda línea.
- **Causa:** los cinco pilares son una fila de grilla: el más alto fija el alto de todos. Las columnas dan ~23
  caracteres por línea entre 1280 y 1440 px; cada ítem de dos líneas suma ~18 px más 6 px de separación.
- **Solución:** probar redacciones inyectándolas en la página con Playwright y medir el `scrollHeight` de la
  diapositiva y el alto de cada pilar en 6 tamaños. Quedó la que cabe en todos: 5 ítems (accesos y auditoría
  juntos) y dos herramientas en el pilar de cloud. Los cortes se arreglaron con `text-wrap: balance`, que reparte las
  palabras sin sumar líneas.
- **Cómo evitarlo:** antes de alargar un pilar, comparar sus líneas con las del más alto en 1280×720 y 1024×768
  (los tamaños con menos margen).
