---
name: git-autopush
description: Commit + push automático al repo del portafolio (github.com/datastudios-scz/portafolio-sergioachivare) después de CADA paso terminado — skill nueva, extracción, diapositiva, estilo, optimización, doc o despliegue. Úsala siempre que se termine un cambio en este proyecto, cuando el usuario diga "sube", "push", "guarda en GitHub", "publica los cambios", o al cerrar cualquier fase de trabajo, aunque no lo pida explícitamente: la regla del proyecto es que nada quede solo en local.
---

# Push automático por paso

El dueño del proyecto pidió que **cada cosa** termine en el repo remoto. Un commit pequeño
y descriptivo por paso deja un historial que cuenta cómo se construyó el sitio y permite
volver atrás sin miedo. Las credenciales ya están en la laptop (Git Credential Manager);
no se piden ni se escriben tokens en ningún archivo.

## Cómo (sin pedir aprobaciones)

Usa comandos git directos: el dueño ya los tiene permitidos en Claude Code (`git add *`,
`git commit *`, `git push *`), así que no aparece ningún aviso de aprobación. Un script envoltorio
(`bash …/autopush.sh`) no coincide con esas reglas y sí pide permiso: déjalo solo como alternativa.

```bash
git add -A && git diff --cached --name-only        # revisa la lista: nada sensible ni pesado
git commit -q -m "feat(slides): portada con red de datos animada" -m "Porqué, si aporta." -m "Co-Authored-By: <atribución que indique el sistema>"
git push -q origin main                             # si lo rechaza: git pull --rebase origin main && git push -q origin main
git log -1 --format='%h %s'
```

### Credenciales sin ventanas

Git Credential Manager guarda **dos** cuentas de GitHub en esta laptop (`datastudios-scz` y
`uniteldesarrollostd`). Sin una cuenta fija abre un selector en cada push. Este repo la fija en
`.git/config` → `credential.https://github.com.username = datastudios-scz`. Si clonas el repo de
nuevo, vuelve a ejecutar:

```bash
git config credential.https://github.com.username datastudios-scz
```

### Script alternativo

`scripts/autopush.sh "asunto" ["cuerpo"] ["Co-Authored-By: …"]` hace lo mismo en un paso y además
aborta si hay archivos sensibles (`.env`, `*.pem`, `*.key`, `id_rsa`, `credentials*`) en el stage.

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
