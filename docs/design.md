# Dirección de diseño

Skill activa: `frontend-design` (2026-11-13). Este documento es la referencia para cualquier cambio visual.

## Brief

- **Sujeto:** Sergio Achivare Balderrama — Data Engineer y Responsable Nacional de Business Intelligence,
  con trayectoria en seguridad de la información (IAM), auditoría de sistemas, apps AppSheet, Node.js e IA local.
- **Audiencia:** reclutadores, gerentes de TI y empresas de Bolivia/LatAm que evalúan contratarlo.
- **Trabajo principal del sitio:** en menos de un minuto, demostrar que construye soluciones de datos
  de punta a punta que **ahorran dinero** (portal BI tokenizado) y llevar a un contacto por WhatsApp o correo.

## Concepto: "de los datos a la persona"

El vocabulario visual sale del oficio de BI: gráficos de dispersión, linaje de datos, páginas de reporte.

1. **Momento firma (el único movimiento no provocado por el usuario):** en la portada, una nube de puntos
   con forma de *gráfico de dispersión* se reorganiza y forma el retrato de Sergio en matriz de puntos.
   Después queda quieto; solo reacciona al puntero.
2. **Riel de linaje:** la paginación es una línea de linaje con un nodo por diapositiva, agrupada por capítulos.
   Al navegar, un pulso viaja del nodo anterior al nuevo (movimiento que responde a una acción).
3. **Páginas de reporte:** las diapositivas de casos son claras como un lienzo de reporte; las narrativas, índigo.

## Tokens

### Color

| Token | Hex | Uso |
|---|---|---|
| `--ink` Índigo noche | `#0D0A35` | Fondo de diapositivas oscuras |
| `--indigo` Índigo marca | `#120052` | Paneles sobre oscuro (el color de marca original) |
| `--paper` Papel | `#F3F1FB` | Fondo de diapositivas claras (lienzo de reporte) |
| `--saffron` Azafrán | `#FFC233` | Acento principal: estado activo, dato clave, CTA. **En fondo claro solo como relleno, nunca como texto** |
| `--violet` Violeta señal | `#6E5BFF` | Líneas de datos, foco secundario; texto en claro usa `#4B39E0` |
| `--lilac` Lila | `#E9E5FF` | Texto sobre oscuro |

Contrastes verificados: lila/índigo noche ≈ 15:1 · azafrán/índigo noche ≈ 11:1 · texto `#17133F`/papel ≈ 15:1 ·
`#4B39E0`/papel ≈ 6:1.

### Tipografía

Una familia: **Archivo** (variable, ejes `wdth` 62–125 y `wght` 100–900), self-hosted en woff2 latin.
El eje de ancho da dos voces sin cargar dos fuentes: condensada para titulares (eco del Anton que
Sergio usaba en Canva) y ancho normal para lectura. Números con `tabular-nums`. Sin monoespaciada.

| Rol | Tamaño | Ancho / peso | Interlínea |
|---|---|---|---|
| Nombre (portada) | `clamp(3.2rem, 9vw, 8.5rem)` | 68 / 800 | 0.9 |
| Título de diapositiva (h2) | `clamp(2.2rem, 4.6vw, 4.2rem)` | 72 / 750 | 0.98 |
| Subtítulo (h3) | `clamp(1.25rem, 1.8vw, 1.6rem)` | 90 / 650 | 1.15 |
| Entrada (lead) | `clamp(1.05rem, 1.3vw, 1.3rem)` | 100 / 400 | 1.5 |
| Texto | `1rem` | 100 / 400 | 1.55 |
| Cifra KPI | `clamp(2.6rem, 5vw, 4.5rem)` | 62 / 800 | 1 |

Párrafos ≤ 62ch. Mayúsculas sostenidas: nunca en etiquetas ni párrafos.

### Layout

- Retícula de 12 columnas, medianil 24 px, márgenes `clamp(20px, 5vw, 96px)`. Contenido **alineado a la
  izquierda** (los reportes se leen de izquierda a derecha); solo el contacto final va centrado.
- Barra superior: monograma, capítulo actual, Menú, Contacto. Riel de linaje a la derecha (escritorio) o
  abajo (móvil).
- Plantillas distintas según el tipo de contenido para romper la monotonía del original:
  portada, perfil (cifras + tabla de empresas), pilares, diagrama animado, pitch con mockup,
  índice de rubros (chips tipo segmentador), caso con galería, caso con pestañas, apps con teléfonos, contacto.

```
Portada (oscura)                                Caso (clara)
┌───────────────────────────────────────┬─┐    ┌───────────────────────────────────────┬─┐
│ SA  Inicio                Menú Contacto│ │    │ SA  Business Intelligence   Menú  …    │ │
│                                        │●│    │ Título del caso                        │●│
│ Sergio            · .:::::::::.        │ │    │ Contexto en 2 líneas      ┌──────────┐ │ │
│ Achivare         .:::(retrato):.       │●│    │ • Qué resuelve            │ captura  │ │●│
│ Balderrama        ':::::::::::'        │ │    │ • Con qué                 │ (zoom)   │ │ │
│ Data Engineer y líder de BI…           │●│    │ [pestañas / miniaturas]   └──────────┘ │●│
│ [Ver proyectos] [WhatsApp]             │ │    │                                        │ │
└───────────────────────────────────────┴─┘    └───────────────────────────────────────┴─┘
```

### Principios

- **Una sola audacia:** el retrato de puntos. Todo lo demás, sobrio.
- **El movimiento explica datos:** cifras que cuentan, líneas que se trazan, paquetes que fluyen por el
  diagrama. Nada de "aparecer deslizando" en cada bloque de texto.
- **La estructura es información:** numeración solo donde hay secuencia real (pasos del portal, orden de
  diapositivas en el índice). Sin etiquetas decorativas sobre cada título.
- **Sin kit SaaS:** nada de tarjetas idénticas con sombra gris. Contenedores tipo "visual de reporte":
  regla superior fina, radios distintos según jerarquía.
- **Calidad mínima no negociable:** responsive a 360 px, foco visible (anillo azafrán), `prefers-reduced-motion`,
  contraste AA.

## Segunda ronda (2026-11-13), pedidos del dueño

- **Sin saltos:** se quitaron los botones que llevaban a otra diapositiva (portada, pilares, rubros). La navegación
  queda en riel, índice, flechas y Contacto. Nada que parezca deshabilitado o gris.
- **Título que abarca todo:** "Arquitecto de soluciones de datos e IA"; el cargo de Responsable Nacional de BI pasa a
  ser credencial debajo de la propuesta.
- **Pilares literales, pero modernos:** columnas geométricas con capitel, fuste estriado y basa, sin ornamento clásico;
  la viga dice qué sostienen y la base, la experiencia que los sostiene a ellos.
- **Arquitectura como pila construida:** la numeración 1-2-3 se justifica porque es el orden real de construcción.
- **Portal BI + IA como producto:** dos diapositivas con maquetas HTML (no capturas) para que se vean nítidas, se
  animen y muestren el uso real: ingreso con la marca del cliente, tableros asignados, chat que muestra su DAX.
- **El código como protagonista:** dos escenas de editor (MCP construyendo un tablero; Azure CLI levantando la
  plataforma) muestran que el trabajo se hace con código y agentes, no a mano.
- Las maquetas usan su propia paleta clara (interfaz de producto) dentro de las diapositivas oscuras; el índigo y el
  azafrán siguen marcando el portafolio.

## Tercera ronda (2026-11-13), pedidos del dueño

- **Portada:** fuera "Hoy, Responsable Nacional de Business Intelligence…"; la propuesta queda sola.
- **Login del portal copiado del producto real** (sus vistas y CSS, nunca sus datos ni su `.env`): fondo con el color
  de la marca, tarjeta de vidrio al 82 % con canto especular (gradiente cónico enmascarado al borde) y dos ondas que
  giran; etiquetas USUARIO / CONTRASEÑA en versalitas (como el real), campos `#f8fafc`, ojo en la contraseña, botón
  INGRESAR con indicador de carga. Luz detrás de la tarjeta y viñeta al tono oscuro de la marca para dar profundidad.
- **Chat como se usa de verdad:** no es una ventana suelta sino el panel lateral del visor del tablero, que se abre
  desde la pestaña de vidrio del borde derecho y angosta el reporte. Paleta del producto: índigo `#6366f1`,
  `#eef2ff`, `#c7d2fe`, texto `#111827`, bordes `#e5e7eb`, fondo `#f7f8fa`. Pasos con punto que late (verde al
  terminar), DAX siempre visible con "Copiar", conclusión al final y botón "Graficar". Un cursor hace el recorrido
  para que se entienda sin texto. En maquetas angostas el panel se superpone al reporte, como en el celular.
- **Pestañas que no se pierden:** punto azafrán que late en cada pestaña no vista y barra de progreso azafrán bajo
  la activa mientras el recorrido avanza solo. El control siempre lo gana la persona: al primer gesto se detiene.
- **IA como mapa vivo, no como captura:** el orquestador (núcleo azafrán con anillo que late) al centro; a la
  izquierda las fuentes (bases de datos, documentos, WhatsApp y correo), a la derecha los motores (IA en la nube,
  base vectorial, servidor de IA local con LEDs), arriba y abajo lo que se entrega (tableros con chat, reportes y
  automatizaciones). El código del agente ilumina en azafrán el camino que usa: el mensaje es "con código conecto
  cualquier proceso con cualquier IA, en la nube o en servidores propios".
- **Cierre:** "Gracias por tu visita a mi portafolio".

## Revisión contra lo genérico (antes de construir)

| Idea inicial | Por qué era genérica | Cambio |
|---|---|---|
| Red de partículas de fondo en la portada | Es el fondo "tech" por defecto | Retrato que nace de un gráfico de dispersión |
| Negro + cian neón | Cliché "near-black + acento ácido" | Índigo de marca + azafrán complementario |
| Roles rotando con efecto máquina de escribir | Segundo movimiento ambiental compitiendo | Roles en una frase; el único movimiento ambiental es el retrato |
| Etiquetas en mono mayúsculas sobre cada título | Cromo de plantilla | El capítulo vive solo en la barra superior |
| Puntos de paginación genéricos | No dicen nada del sujeto | Riel de linaje de datos |
| Treemap de habilidades con tamaños | Inventaría cifras que no existen | Pilares con herramientas reales, sin números falsos |
