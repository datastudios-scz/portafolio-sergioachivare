# Contenido: del Canva original al sitio

Fuente: "Portafolio BI - Sergio Achivare" (35 diapositivas). Extraído el 2026-11-13 con `canva-extract`
(textos, 54 medios, 6 fuentes). Las 35 diapositivas pasaron a 17; ningún contenido se perdió, se reagrupó.
El 2026-11-13 el dueño pidió además destacar el Portal BI + IA (con contenido de su propia página del producto,
sin nombrar el negocio), sus capacidades de desarrollo y agentes, y la infraestructura como código.
Tercera ronda (2026-11-13): portada sin el cargo actual; login y chat del portal rehechos con el diseño del producto
real (sin sus datos); fuera el bloque "Portales reales en producción"; pestañas con recorrido guiado; la IA pasó de
captura a animación; el cierre dice "Gracias por tu visita a mi portafolio".

| # | Diapositiva (`#id`) | Viene de | Contenido / imágenes | Notas |
|---|---|---|---|---|
| 1 | Portada `#inicio` | Canva 1 | `retrato` | Título "Arquitecto de soluciones de datos e IA" y bajada con infraestructura, datos, BI, apps y agentes; sin el cargo actual; un solo botón (WhatsApp) |
| 2 | Perfil `#perfil` | Canva 2 | — | Cifras: 8 años, 12 rubros, 7 empresas, +1000 usuarios |
| 3 | Pilares `#stack` | Canva 1, 2, 4 | — | Cinco pilares con viga y base, animados |
| 4 | Arquitectura completa `#arquitectura` | Canva 3 | — | Capas: infraestructura → datos y desarrollos → Portal BI + IA → clientes |
| 5 | Portal BI `#portal` | Canva 4–9 + contenido del Portal BI del dueño | maqueta HTML: login de vidrio como el real → 9 tableros | Receta Azure + Power BI + Desarrollo + Seguridad = Portal BI + IA; usuario y contraseña se tipean, "Ingresar" carga |
| 6 | Portal BI con IA `#portal-ia` | contenido y diseño del Portal BI del dueño | visor del tablero con el chat al costado | Un cursor abre el chat, tipea la pregunta, se ven los pasos, el DAX, la respuesta y el gráfico a pedido |
| 7 | Rubros `#rubros` | Canva 10 | escena VS Code + MCP | Mosaicos sin enlaces; tablero construido por código |
| 8 | Banca `#banca` | Canva 11–12 | `banca-*` | Chat de WhatsApp con datos ficticios |
| 9 | Consumo masivo `#consumo` | Canva 13 | `consumo-*` (4) | Capturas originales, no los mockups de tablet |
| 10 | Marketing `#marketing` | Canva 15–19 | `mkt-*` (5) en pestañas | Recorrido guiado (como en 12, 14 y 15): las pestañas avanzan solas cada 5 s y las no vistas laten |
| 11 | Recursos humanos `#rrhh` | Canva 14 | `rrhh` | Nombres, cumpleaños y fechas difuminados |
| 12 | Seguridad `#seguridad` | Canva 20–23 | `sec-*` (4) en pestañas | |
| 13 | Infraestructura como código `#fabric` | Canva 24 + pedido del dueño | terminal animada + `fabric-etl` | Azure CLI y API de Fabric; árbol de recursos |
| 14 | Apps `#apps` | Canva 26–29 | `app-*` (12) en pestañas | Credenciales, CI y celulares difuminados |
| 15 | Sistemas web `#web` | Canva 30–31 | `web-pautas`, `web-ventas` | |
| 16 | IA `#ia` | Canva 32–34 + pedido del dueño | mapa animado: orquestador + 8 nodos, y el código del agente | Dos escenarios alternados: IA local que resume ventas y avisa por WhatsApp; RAG en la nube que publica un asistente en el portal |
| 17 | Contacto `#contacto` | Canva 1, 35 | `retrato` | "Gracias por tu visita a mi portafolio"; WhatsApp, correo y teléfono |

Las maquetas (portal, chat, VS Code, terminal, mapa de IA) son HTML/CSS vectorial con datos y marcas de ejemplo
(ACME Analytics, Nordex Datos, Andina Retail; dominio portal.tuempresa.com). No muestran datos reales de clientes.
Las cifras del visor con chat cuadran entre sí: KPI (5,41 M, +9,7 %), barras, tabla por sucursal y la respuesta
de la IA (Online +34,4 %, de 701.300 a 942.800; Norte −3,2 %).
Diapositivas de transición del original ("¿Seguimos?", "¿Qué te parece el portal?") → reemplazadas por el riel de
capítulos y el índice. No hay enlaces que salten fuera de la secuencia (pedido del dueño).

## Ortografía corregida

"¿Alguna ves" → "¿Alguna vez" · "Tableu" → "Tableau" · "ha continuación" → "a continuación" · "Merketing" → "Marketing" ·
"Desarollos/desarollo" → "Desarrollos/desarrollo" · "Porsupuesto" → "Por supuesto" · "Exchangue" → "Exchange" ·
"Fronted" → "frontend" · "Domino" → "dominio".

## Anonimización (difuminado en `tools/images.json` → `redact`)

| Imagen | Qué se difumina |
|---|---|
| `app-asistencia-login`, `app-comercios-login` | Usuario y contraseña |
| `app-accidentes-formulario` | Número de CI e Id del caso (contiene el CI) |
| `app-comercios-registros`, `app-comercios-alta` | Números de comercio (celulares) y nombre de la líder |
| `rrhh` | Nombres de empleados, fechas de cumpleaños |
| `app-accidentes-panel` | Nombres de personas (lista, consolidado, grilla) |
| `banca-registros`, `banca-monitor`, `app-comercios-panel` | Nombres de afiliadores y comercios, nº de comercio |
| `app-asistencia-panel` | Nombres y la selfie de asistencia |
| `sec-ad`, `sec-exchange`, `sec-accesos` | Nombres, usuarios de dominio, correos |
| `consumo-impulsacion`, `consumo-ciudad` | Nombres de impulsadoras y de dueños de puestos; firma "Elaborado por" |

Pendiente de decisión del dueño: las capturas de marketing muestran publicaciones públicas de medios (sin difuminar).
