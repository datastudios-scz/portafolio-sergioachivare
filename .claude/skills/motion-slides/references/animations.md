# Coreografía de animaciones

Principio: el dueño valora mucho las animaciones (2026-11-13), pero cada una debe **explicar algo**: un dato que
cuenta, una estructura que se construye, un producto que se usa. Nada de "aparecer deslizando" genérico.

| Momento | Duración | Curva | Reduced motion |
|---|---|---|---|
| Transición entre diapositivas | 760 ms | `cubic-bezier(.77,0,.18,1)` + línea azafrán en el borde | fundido 180 ms |
| Pulso del riel | ~600 ms + 18 ms por diapositiva saltada | resorte `k=260, d=24` en CSS `linear()` | salto directo |
| Retrato de puntos (portada) | ~3,3 s, una sola vez | `springEase(320,30)` aparición, `springEase(140,18)` armado | retrato final |
| Cifras del perfil | 1,1 s | ease-out cúbica | valor final |
| Pilares: base → pilares (escalonados 120 ms) → viga | ~2 s | `in-rise` (clip-path), `in-drop` con rebote | estado final |
| Arquitectura: capa 1 → 2 → 3 → clientes, paquetes que suben | ~2,2 s + bucle | `in-up`, `in-grow-y`; paquetes 1,4 s lineal | estado final, sin paquetes |
| Portal: ingreso → tableros (tarjetas escalonadas 70 ms) → cambio de marca | ciclo ~5,4 s | transiciones de color 0,7 s | primera marca, sin ciclo |
| Chat con IA: pregunta → pasos → DAX → barras | ~8 s + 7,5 s de pausa | tipeo 36 ms/carácter; DAX por pasos | todo visible |
| VS Code + MCP: instrucción → medidas → visuales → vista previa | ~6 s + 6,5 s de pausa | 11 ms/carácter; KPIs cuentan 1 s | todo visible |
| Terminal de infraestructura: comandos → árbol de recursos | ~7 s + 7 s de pausa | 8 ms/carácter | todo visible |
| Mosaicos de rubros | escalonados 50 ms | `in-pop` | estado final |

## Reglas

- Animar solo `transform`, `opacity`, `clip-path` y `stroke-dashoffset`.
- Lo que aparece no debe mover lo demás: reservar su espacio (`visibility`/`opacity`, no `display`).
- Todo bucle se detiene al salir de la diapositiva o con la pestaña oculta (`seq`/`stopSeq`, `fx.leave`).
- Estados "ocultos hasta animar" siempre bajo `.js` y con su versión final en `@media print`.
- Las maquetas usan datos y marcas de ejemplo; nunca datos reales de clientes.
