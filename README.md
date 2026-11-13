# Portafolio de Sergio Achivare

Portafolio web de **Sergio Achivare Balderrama**, Data Engineer y Responsable Nacional de Business Intelligence:
una presentación interactiva (diapositivas a pantalla completa con motion graphics) migrada y rediseñada desde Canva.

**Sitio:** https://datastudios-scz.github.io/portafolio-sergioachivare/

- 16 diapositivas: perfil, stack, arquitectura de BI, portal BI tokenizado, tableros por rubro, ciberseguridad,
  ingeniería de datos, apps, sistemas web, IA y contacto.
- Navegación con rueda, teclado, swipe, índice y enlaces directos (`#portal`, `#seguridad`, …). Descarga en PDF.
- Estático, sin frameworks: HTML + CSS + un módulo JS. Imágenes AVIF/WebP retina, fuente propia recortada.
- Datos personales de terceros difuminados en las capturas.

## Trabajar en el sitio

```bash
npm install                      # solo la primera vez (sharp, para imágenes)
node tools/build.mjs             # src/index.html → site/index.html
python tools/serve.py 8765       # http://127.0.0.1:8765/
python tools/qa.py http://127.0.0.1:8765/ .shots   # capturas + consola + pruebas
git push                         # GitHub Actions publica site/
```

Documentación en [`docs/`](docs/README.md): evaluación del original, diseño, arquitectura, contenido, rendimiento,
despliegue (GitHub Pages y Render) y aprendizajes. Las skills de Claude Code del proyecto están en
[`.claude/skills/`](.claude/skills/).
