# Coreografía de animaciones

Principio (docs/design.md): **un solo momento ambiental** — el retrato de la portada. Todo lo demás se mueve porque
la persona hizo algo (navegó, eligió una pestaña, abrió una imagen) o porque el movimiento *explica un dato*.

| Momento | Duración | Curva | Reduced motion |
|---|---|---|---|
| Transición entre diapositivas | 760 ms | `cubic-bezier(.77,0,.18,1)` + línea azafrán en el borde | fundido 180 ms |
| Pulso del riel (nodo anterior → nuevo) | ~600 ms + 18 ms por diapositiva saltada | resorte `k=260, d=24` en CSS `linear()` | salto directo |
| Retrato: ejes + puntos (0–0,9 s), tendencia (0,75–1,15 s), armado (1,25–3,3 s) | ~3,3 s | aparición `springEase(320,30)`, armado `springEase(140,18)` con escalonado por altura | retrato final directo |
| Cifras del perfil | 1,1 s | ease-out cúbica | valor final |
| Cables de la arquitectura | 620 ms c/u, escalonados 110 ms | `cubic-bezier(.65,0,.35,1)` | dibujados, sin paquetes |
| Paquetes de datos | 2,8 s por recorrido, en bucle | lineal (SMIL) | — |
| Pasos del portal | cada 3,4 s; pantalla con fundido de 0,6 s | ease-out | sin avance automático |
| Mensajes del bot | uno cada 0,95 s | `msg-in` 0,35 s | todos visibles |
| Panel de pestaña | 0,45 s | `panel-in` (opacidad + 8 px) | instantáneo |

## Reglas

- Animar solo `transform`, `opacity`, `clip-path` y `stroke-dashoffset`.
- Lo que aparece no debe mover lo demás: reservar su espacio (`visibility` en lugar de `display`).
- Resortes de forma cerrada (`springEase`) en lugar de easings genéricos para lo que "tiene masa"; ver `app.js`.
- Ningún bucle corre fuera de su diapositiva ni con la pestaña oculta.
