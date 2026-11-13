---
name: deploy-static
description: Publica gratis el portafolio estático (carpeta site/) en GitHub Pages vía GitHub Actions y deja listo el Blueprint de Render (render.yaml) — activar Pages por API con las credenciales de git de la laptop, verificar el workflow y la URL pública, encabezados de caché/seguridad. Úsala cuando se pida publicar, desplegar, "subir a internet", obtener el link del sitio, configurar GitHub Pages o Render, o cuando un despliegue falle o la página publicada no se actualice.
---

# Despliegue gratuito: GitHub Pages (principal) + Render (alternativa)

El sitio es 100% estático en `site/`: no hay build en el servidor, así que publicar es
copiar esa carpeta. Eso lo hace barato, rápido y difícil de romper.

## GitHub Pages (automático en cada push a `main`)

1. Copia `assets/pages.yml` a `.github/workflows/pages.yml` (publica `site/` con
   `actions/upload-pages-artifact` + `actions/deploy-pages`; solo corre si cambia `site/**`).
2. Activa Pages con fuente "GitHub Actions" (una sola vez) usando el token que ya guarda
   Git Credential Manager. **Nunca** imprimas el token ni lo escribas en archivos:

   ```bash
   bash .claude/skills/deploy-static/scripts/gh_api.sh GET  /repos/OWNER/REPO            # ¿público? ¿permisos?
   bash .claude/skills/deploy-static/scripts/gh_api.sh POST /repos/OWNER/REPO/pages '{"build_type":"workflow"}'
   bash .claude/skills/deploy-static/scripts/gh_api.sh GET  /repos/OWNER/REPO/pages       # html_url
   bash .claude/skills/deploy-static/scripts/gh_api.sh GET  "/repos/OWNER/REPO/actions/runs?per_page=3"
   ```
   - `409` en el POST = ya estaba activo → usa `PUT` con el mismo cuerpo si hay que cambiar a workflow.
   - Pages en plan gratuito exige repo **público**. Si es privado, no lo cambies sin preguntar:
     usa Render (abajo) o pide confirmación.
3. Verifica: el run del workflow termina en `success` y `curl -sI <html_url>` responde 200.
   La URL queda `https://<owner>.github.io/<repo>/` → todas las rutas del sitio deben ser **relativas**
   (`assets/...`, nunca `/assets/...`).

## Render (Blueprint, 1 clic del dueño)

`render.yaml` en la raíz (plantilla en `assets/render.yaml`): servicio `runtime: static`,
`staticPublishPath: ./site`, encabezados de caché para `/assets/*` y de seguridad.
Render necesita que el dueño conecte su cuenta: **Dashboard → New → Blueprint → elegir el repo**.
No hay forma de hacerlo sin su sesión; deja los pasos en `docs/deploy.md`.

## Checklist antes de publicar

- [ ] Rutas relativas; `404.html`, `robots.txt`, `sitemap.xml`, favicon y `og:image` presentes.
- [ ] Sin errores de consola (skill `webapp-testing`) y presupuesto de `web-perf` cumplido.
- [ ] `docs/deploy.md` con URL, fecha y pasos manuales pendientes.
