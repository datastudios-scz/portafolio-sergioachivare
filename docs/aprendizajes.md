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

## 2026-11-13 · Heredoc de bash se comía las barras invertidas

- **Problema:** un script Python escrito con `cat << 'EOF'` perdió los `\\`.
- **Solución:** escribir archivos con la herramienta de edición, no con heredocs, cuando tengan barras invertidas.
