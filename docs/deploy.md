# Despliegue

Skill: `deploy-static`. El sitio es estático (`site/`), sin build en el servidor.

## GitHub Pages (principal, automático)

- **URL:** https://datastudios-scz.github.io/portafolio-sergioachivare/
- Activado el 2026-11-13 por API (`build_type: workflow`), repo público.
- Workflow: [`.github/workflows/pages.yml`](../.github/workflows/pages.yml). Corre en cada push a `main`
  que toque `site/**` o el propio workflow (también a mano desde la pestaña *Actions → Run workflow*).
- Tarda ~1 minuto. Caché de GitHub Pages: 10 minutos; por eso `app.css` y `app.js` llevan `?v=<hash>`
  (lo pone `tools/build.mjs`) y un cambio se ve al instante aunque el HTML siga en caché un rato.

## Render (alternativa, requiere tu cuenta)

[`render.yaml`](../render.yaml) es un Blueprint listo: servicio estático que publica `./site`, con caché de
una semana para `/assets/*` y encabezados de seguridad.

Pasos (una sola vez, con tu sesión de Render):
1. https://dashboard.render.com → **New** → **Blueprint**.
2. Conecta GitHub si te lo pide y elige `datastudios-scz/portafolio-sergioachivare`.
3. Confirma: Render crea `portafolio-sergio-achivare` y publica en `https://portafolio-sergio-achivare.onrender.com`
   (el subdominio puede variar si el nombre está tomado). Cada push a `main` se vuelve a publicar solo.

Los sitios estáticos de Render son gratuitos y no "se duermen" (eso solo pasa con servicios web).

## Flujo de trabajo para cambios

```bash
# editar src/index.html, site/assets/css/app.css o site/assets/js/app.js
node tools/build.mjs                # regenera site/index.html
python tools/serve.py 8765          # probar en http://127.0.0.1:8765/
python tools/qa.py http://127.0.0.1:8765/ .shots   # capturas + errores de consola + pruebas
git add -A && git commit -m "…" && git push           # publica
```

Imágenes nuevas: agregarlas en `tools/images.json` y correr `npm run img` (ver `performance.md`).

## Verificación del despliegue

```bash
bash .claude/skills/deploy-static/scripts/gh_api.sh GET "/repos/datastudios-scz/portafolio-sergioachivare/actions/runs?per_page=3"
curl -sI --ssl-no-revoke https://datastudios-scz.github.io/portafolio-sergioachivare/
```
