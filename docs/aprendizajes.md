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

## 2026-11-13 · Heredoc de bash se comía las barras invertidas

- **Problema:** un script Python escrito con `cat << 'EOF'` perdió los `\\`.
- **Solución:** escribir archivos con la herramienta de edición, no con heredocs, cuando tengan barras invertidas.
