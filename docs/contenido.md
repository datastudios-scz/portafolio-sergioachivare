# Contenido: del Canva original al sitio

Fuente: "Portafolio BI - Sergio Achivare" (35 diapositivas). Extraído el 2026-11-13 con `canva-extract`
(textos, 54 medios, 6 fuentes). Los 35 → 16 diapositivas; ningún contenido se perdió, se reagrupó.

| # | Diapositiva (`#id`) | Viene de (Canva) | Imágenes (`tools/images.json`) | Notas |
|---|---|---|---|---|
| 1 | Portada `#inicio` | 1 | `retrato` (MAGDWHsvDEA, recortado sin fondo) | 7 títulos → titular + 1 frase; contacto pasa a la última |
| 2 | Perfil `#perfil` | 2 | — | Objetivo y trayectoria reescritos; cifras 8 años · 12 rubros · 7 empresas · +1000 usuarios |
| 3 | Stack `#stack` | 1, 2, 4 | — | Herramientas agrupadas en 5 frentes con enlace a sus casos |
| 4 | Arquitectura BI `#arquitectura` | 3 | — | Diagrama redibujado en SVG animado |
| 5 | Portal BI `#portal` | 4–9 | `portal-*` (5) | El argumento "1 licencia = +1000 usuarios" pasa a titular |
| 6 | Rubros `#rubros` | 10 | — | 12 rubros como segmentador; los que tienen caso enlazan |
| 7 | Banca `#banca` | 11–12 | `banca-monitor`, `banca-registros` | Captura de WhatsApp real (nombres y celulares de terceros) **reemplazada** por un chat animado con datos ficticios |
| 8 | Consumo masivo `#consumo` | 13 | `consumo-*` (4) | Se usan las capturas originales, no los mockups de tablet |
| 9 | Marketing `#marketing` | 15–19 | `mkt-*` (5) en pestañas | "Merketing" corregido |
| 10 | Recursos humanos `#rrhh` | 14 | `rrhh` | Nombres, cumpleaños y fechas difuminados; recortado a su contenido |
| 11 | Seguridad `#seguridad` | 20–23 | `sec-*` (4) en pestañas | "Exchangue" corregido en el texto (la captura conserva su título original) |
| 12 | Ingeniería de datos `#fabric` | 24 | `fabric-etl` | "Domino Fabric" → "dominio de Fabric" |
| 13 | Apps `#apps` | 26–29 | `app-*` (12) en pestañas | Credenciales, CI y celulares difuminados |
| 14 | Sistemas web `#web` | 30–31 | `web-pautas`, `web-ventas` | "Fronted" → "frontend" |
| 15 | IA `#ia` | 32–34 | `ia-arquitectura` | Lista de tecnologías extraída de la infografía |
| 16 | Contacto `#contacto` | 1, 35 | `retrato` | WhatsApp, correo y teléfono como botones |

Diapositivas de transición del original ("¿Seguimos?", "¿Qué te parece el portal?") → reemplazadas por el riel de
capítulos y el índice.

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
