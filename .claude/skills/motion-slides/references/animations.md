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
| Portal: usuario (75 ms/carácter) → contraseña (65 ms) → Ingresar con carga 0,85 s → tableros (escalonados 70 ms) → otra marca | ciclo ~6,9 s | transiciones de color 0,7 s | primera marca, tableros visibles |
| Visor con chat: cursor → pestaña IA → panel se abre (0,6 s `cubic-bezier(.16,1,.3,1)`) → pregunta (42 ms/carácter) → pasos cada 650 ms → DAX (14 ms/carácter) → respuesta → "Graficar" → barras (0,6 s, escalonadas 70 ms) → cierra | ~20 s | cursor 0,75 s `cubic-bezier(.45,0,.2,1)`; clic = `scale .78` | panel abierto con todo visible |
| Pestañas guiadas: avance cada 5 s con barra de progreso; punto que late en las no vistas | 5 s por pestaña | progreso lineal; latido 1,6 s | sin avance automático |
| Mapa de IA: instrucción (26 ms/carácter) → código (16 ms/carácter) → nodos y cables en azafrán → resultado | ~9 s + 6 s de pausa, 2 escenarios | paquetes SVG 2–2,8 s; cable activo con trazo que corre | primer escenario completo, paquetes quietos |
| VS Code + MCP: instrucción → medidas → visuales → vista previa | ~6 s + 6,5 s de pausa | 11 ms/carácter; KPIs cuentan 1 s | todo visible |
| Terminal de infraestructura: comandos → árbol de recursos | ~7 s + 7 s de pausa | 8 ms/carácter | todo visible |
| Mosaicos de rubros | escalonados 50 ms | `in-pop` | estado final |

## Reglas

- Animar solo `transform`, `opacity`, `clip-path` y `stroke-dashoffset`. Única excepción: el panel del chat anima
  `margin-right` porque lo que se quiere mostrar es justamente que el reporte se angosta (maqueta chica, costo bajo).
- Lo que aparece no debe mover lo demás: reservar su espacio (`visibility`/`opacity`, no `display`). Dentro de un
  contenedor de alto fijo que se desplaza (hilo del chat) sí vale `display`, con `flex-shrink: 0` en los hijos.
- Lo que cambia solo (pestañas guiadas) se detiene para siempre al primer gesto de la persona: nunca pelear por el control.
- Centrar con `translate` (propiedad), no con `transform`, cuando el elemento también tiene `data-in`.
- Animaciones SVG (SMIL): `pauseAnimations()` al montar y al salir; `unpauseAnimations()` al entrar.
- Textos que el JS tipea: su versión final va en el HTML (sin JS e impresión); en pantalla, oculta hasta `.is-play`.
- Todo bucle se detiene al salir de la diapositiva o con la pestaña oculta (`seq`/`stopSeq`, `fx.leave`).
- Estados "ocultos hasta animar" siempre bajo `.js` y con su versión final en `@media print`.
- Las maquetas usan datos y marcas de ejemplo; nunca datos reales de clientes.
