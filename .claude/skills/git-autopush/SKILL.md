---
name: git-autopush
description: Commit + push automático al repo del portafolio (github.com/datastudios-scz/portafolio-sergioachivare) después de CADA paso terminado — skill nueva, extracción, diapositiva, estilo, optimización, doc o despliegue. Úsala siempre que se termine un cambio en este proyecto, cuando el usuario diga "sube", "push", "guarda en GitHub", "publica los cambios", o al cerrar cualquier fase de trabajo, aunque no lo pida explícitamente: la regla del proyecto es que nada quede solo en local.
---

# Push automático por paso

El dueño del proyecto pidió que **cada cosa** termine en el repo remoto. Un commit pequeño
y descriptivo por paso deja un historial que cuenta cómo se construyó el sitio y permite
volver atrás sin miedo. Las credenciales ya están en la laptop (Git Credential Manager);
no se piden ni se escriben tokens en ningún archivo.

## Cómo

```bash
bash .claude/skills/git-autopush/scripts/autopush.sh "feat(slides): portada con red de datos animada" \
  "Detalle opcional del porqué." \
  "Co-Authored-By: <línea de atribución que indique el sistema>"
```

Cada argumento es un párrafo del mensaje. El script:
1. hace `git add -A` respetando `.gitignore`;
2. aborta si detecta archivos sensibles (`.env`, `*.pem`, `*.key`, `id_rsa`, `credentials*`);
3. commitea (si no hay cambios, solo intenta el push pendiente);
4. hace push a la rama actual; si el remoto avanzó, `pull --rebase` y reintenta una vez;
5. imprime el hash y el asunto del commit.

## Mensajes (en español, estilo Conventional Commits)

`tipo(ámbito): resumen en presente, ≤ 72 caracteres`

| tipo | cuándo |
|---|---|
| `feat` | diapositiva, sección o interacción nueva |
| `style` | solo diseño visual (colores, tipografía, espaciado) |
| `anim` | animaciones / motion graphics |
| `perf` | imágenes, fuentes, carga, Lighthouse |
| `fix` | corrección de un error |
| `docs` | archivos de `/docs` o README |
| `chore` | skills, configuración, herramientas, CI |
| `deploy` | GitHub Pages / Render |

Ejemplos: `feat(dashboards): galería filtrable por industria con lightbox`,
`perf(img): AVIF+WebP en 3 anchos, -78% de peso`, `docs(aprendizajes): wheel con inercia en trackpads`.

## Antes de cada push, revisa

- `git status --short` no muestra `.canva-cache/`, `node_modules/` ni capturas de prueba.
- Si tocaste `site/`, que el sitio cargue sin errores de consola (skill `webapp-testing`).
- Si aprendiste algo no obvio, anótalo en `docs/` en el mismo commit (skill `project-docs`).

## Si falla

- `rejected (fetch first)`: el script ya hace `pull --rebase`; si hay conflicto, resuélvelo, no fuerces.
- Nunca `--force` sobre `main` ni `--no-verify`.
- Error de credenciales: avisa al usuario; no intentes otras cuentas.
