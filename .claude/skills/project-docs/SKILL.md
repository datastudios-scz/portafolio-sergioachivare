---
name: project-docs
description: Mantiene la memoria del proyecto en la carpeta /docs (archivos .md) — aprendizajes, decisiones de diseño, rendimiento, contenido, arquitectura, despliegue y skills. Úsala al cerrar cualquier fase, al descubrir algo no obvio (un bug raro, un truco de rendimiento, una limitación de Canva/GitHub/Render), al tomar una decisión de diseño, o cuando el usuario pida documentar, anotar, "dejar memoria" o explicar cómo está hecho el portafolio.
---

# Memoria del proyecto en `/docs`

`/docs` es la memoria de largo plazo del portafolio: quien llegue después (el dueño, otra
persona o una sesión futura de Claude) debe entender **por qué** el sitio es como es sin
releer todo el código. Escribe para esa persona: frases cortas, concretas, con el motivo.

## Archivos

| Archivo | Contenido | Se actualiza cuando… |
|---|---|---|
| `README.md` | Índice de /docs y mapa rápido del repo | se crea o renombra un doc |
| `evaluacion.md` | Diagnóstico del Canva original: qué funciona, qué no, oportunidades | al inicio; si cambia el original |
| `contenido.md` | Inventario de textos, imágenes y su destino en el sitio (diapositiva → assets) | cambia el contenido |
| `design.md` | Dirección visual: concepto, paleta (tokens), tipografía, layout, motion | cambia un token, fuente o patrón visual |
| `arquitectura.md` | Estructura de archivos, motor de diapositivas, navegación, animaciones | cambia el código base |
| `performance.md` | Presupuesto, mediciones (Lighthouse, pesos) con fecha, optimizaciones | tras cada medición u optimización |
| `deploy.md` | Cómo se publica en GitHub Pages y Render, URLs, pasos manuales | cambia el despliegue |
| `aprendizajes.md` | Bitácora de lecciones no obvias (problema → causa → solución) | descubres algo que costó tiempo |
| `skills.md` | Skills del proyecto, origen y en qué paso se usa cada una | se agrega o cambia una skill |

## Formato

- Entradas con fecha absoluta (`2026-11-13`), nunca "ayer" o "la semana pasada".
- En `aprendizajes.md`, cada entrada: **Problema** → **Causa** → **Solución** → **Cómo evitarlo**.
- Números reales con unidad y fecha (p. ej. `LCP 1.1 s móvil — 2026-11-13`), no adjetivos.
- No dupliques lo que ya dice el código o el historial de git; enlaza a archivos con rutas relativas.
- Nada de secretos, tokens ni datos personales que no estén ya publicados en el sitio.

## Flujo

1. Termina el paso técnico.
2. Actualiza el/los doc(s) afectados (solo lo que cambió).
3. Commit + push junto con el cambio (skill `git-autopush`), tipo `docs` si es solo documentación.
