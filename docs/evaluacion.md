# Evaluación del portafolio original (Canva)

Fuente: presentación pública "Portafolio BI - Sergio Achivare" en Canva, 35 diapositivas 16:9
(1920×1080), extraída el 2026-11-13 con la skill `canva-extract`.

## Lo que funciona (y se conserva)

- **Contenido real y variado**: más de 30 capturas de trabajos reales — dashboards de banca (BCP–Yape),
  consumo masivo, RRHH, marketing con APIs de Meta (Facebook, Instagram, anuncios, TikTok),
  auditoría y ciberseguridad (Active Directory, Exchange Online), ingeniería de datos en Fabric/Azure,
  3 apps AppSheet, 2 sistemas web Node.js y una infografía de arquitectura de IA.
- **Un gancho de negocio claro**: el portal BI tokenizado — *una licencia Power BI abastece a +1000 usuarios*,
  sin licencias incrementales. Es el argumento más fuerte del perfil y en Canva aparece recién en la diapositiva 4.
- **Foto profesional** y datos de contacto visibles.
- **Recorrido narrativo**: BI → dashboards → desarrollo → IA, con transiciones tipo "¿seguimos?".

## Lo que no funciona

| Problema | Impacto | Cómo se resuelve en la web |
|---|---|---|
| 35 diapositivas lineales, sin índice ni atajos | El visitante se cansa antes de ver lo mejor | 17 diapositivas, índice/menú, rutas `#seccion`, progreso visible |
| Portada con 7 títulos del mismo peso | Perfil difuso: no queda claro "qué es" | Un titular (Data Engineer & BI Lead) + roles que rotan + 4 pilares |
| Diseños repetidos (marco + captura + título) en ~20 diapositivas | Monotonía | Plantillas distintas por tipo de caso: galería, pestañas, mockups, diagrama animado |
| Párrafos largos en MAYÚSCULAS | Difícil de leer | Texto en caja normal, frases cortas, jerarquía tipográfica |
| 5 familias tipográficas (Montserrat, Anton, DM Sans, Roboto, Montserrat Classic) y colores que chocan (navy + verde neón + amarillo + cian) | Se ve armado a retazos | Sistema de diseño: 2 familias + 1 mono, paleta con tokens |
| Capturas pequeñas dentro de marcos, sin zoom | No se aprecia el trabajo | Lightbox a resolución completa, AVIF/WebP retina |
| Errores de ortografía ("¿Alguna ves", "Tableu", "ha continuación", "Merketing", "Desarollos", "Porsupuesto", "Exchangue", "Fronted", "Domino Fabric") | Resta credibilidad | Corregidos en el sitio |
| Login de demo con contraseña visible; nombres de personas en algunas capturas | Mala señal para un perfil de **seguridad de la información** | Credenciales difuminadas; ver recomendaciones |
| Visor de Canva: varios MB de JS, no indexable, poco usable en móvil | Lento y sin SEO | Sitio estático propio, < 300 KB la primera vista, SEO y Open Graph |
| Sin LinkedIn/GitHub ni llamada a la acción final | Se pierde el contacto | CTA a WhatsApp, correo y teléfono en la última diapositiva y siempre en el menú |

## Recomendaciones para el dueño (no se pueden resolver solo con código)

1. Revisar si hay datos de clientes o personas en las capturas (nombres en Active Directory, mensajes de
   WhatsApp) y reemplazarlas por versiones anonimizadas cuando sea posible.
2. Agregar enlaces a LinkedIn y GitHub (el sitio ya tiene el lugar preparado en la diapositiva de contacto).
3. Si hay métricas reales de impacto (horas ahorradas, costo de licencias evitado, nº de tableros en
   producción), sumarlas: convierten el portafolio en un caso de negocio.
