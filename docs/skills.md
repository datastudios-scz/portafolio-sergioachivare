# Skills del proyecto

Regla del proyecto: **cada proceso o paso se hace con una skill activa**. Las skills propias viven
en [`.claude/skills/`](../.claude/skills/) y viajan con el repo, así cualquier sesión futura de
Claude Code en esta carpeta las tiene disponibles.

## Instaladas en el repo

| Skill | Origen | Para qué | Paso donde se usa |
|---|---|---|---|
| `canva-extract` | propia (2026-11-13) | Leer el diseño público de Canva sin login: textos, imágenes en máxima resolución, fuentes, miniaturas | Extracción y evaluación |
| `motion-slides` | propia (2026-11-13) | Motor de diapositivas, navegación, animaciones y motion graphics | Construcción del sitio |
| `web-perf` | propia (2026-11-13) | Imágenes AVIF/WebP retina, fuentes, presupuesto y Lighthouse | Optimización y medición |
| `deploy-static` | propia (2026-11-13) | GitHub Pages por Actions + Blueprint de Render | Publicación |
| `git-autopush` | propia (2026-11-13) | Commit + push después de cada paso | Siempre |
| `project-docs` | propia (2026-11-13) | Mantener esta carpeta `/docs` | Siempre |
| `webapp-testing` | descargada de [anthropics/skills](https://github.com/anthropics/skills) (commit `2c5958e`) | Pruebas con Playwright: capturas, consola, interacción | QA |

## Skills de Claude Code usadas (no viven en el repo)

| Skill | Paso |
|---|---|
| `skill-creator` | Crear las skills propias de arriba |
| `frontend-design` | Dirección visual, tipografía, layout (ver `design.md`) |
| `animate` | Es para videos en canvas; se tomaron sus reglas de movimiento (resortes de forma cerrada) |
| `update-config` | Pedido de "no pedir aprobación de GitHub": se resolvió fijando la cuenta de Git Credential Manager del repo |
| `code-review` | Revisión de correctitud del código antes de cerrar |

## Notas

- Las skills propias se escribieron sin el ciclo formal de evaluación de `skill-creator`
  (subagentes + revisión humana) porque el trabajo se pidió autónomo; se validan usándolas
  en este proyecto y se ajustan cuando algo falla (ver `aprendizajes.md`).
- Revisión de seguridad de lo descargado: `webapp-testing/scripts/with_server.py` solo
  levanta servidores locales y espera un puerto; sin red ni escritura fuera del proceso.
