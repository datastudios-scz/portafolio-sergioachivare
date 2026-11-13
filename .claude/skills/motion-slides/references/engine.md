# Motor de diapositivas (`site/assets/js/app.js`)

## Estados de una diapositiva

| Clase | Significado | CSS |
|---|---|---|
| (ninguna) | lejana | `display:none` → sus imágenes lazy no descargan |
| `is-near` | vecina de la activa | `display:block; visibility:hidden` → precarga lazy |
| `is-active` | la que se ve | `display:block; z-index:1` |
| `is-entering` / `is-leaving` | durante la transición | `z-index:3` / `2`, ambas visibles |

Todas las no activas llevan `inert`. La portada trae `is-active` en el HTML para que el primer pintado no espere al JS.

## API

```js
deck.go(k, { push, focus, instant })   // índice 0-based; si hay transición en curso, queda en cola (pending)
deck.next() / deck.prev()
deck.indexOf('#id')                     // → índice o null
fx.enter(slide) / fx.leave(slide)      // llama a FX[data-fx].enter/leave de los efectos dentro de la diapositiva
```

## Gesto de rueda (no romper)

```
gap = ahora - último evento
si gap > 200 ms o cambió la dirección → gesto nuevo (acumulado = 0, usado = false)
si el scroll interno puede moverse → usado = true y se deja pasar (el final del scroll no salta)
si no: preventDefault; acumulado += dy; si !usado y |acumulado| ≥ 35 → navegar y usado = true
```

`deltaMode` 1 (líneas) × 16, 2 (páginas) × alto de ventana. `ctrlKey` = zoom con pellizco → se ignora.

## Efecto nuevo

```js
FX.miEfecto = {
  init(el) { /* una vez: crear nodos, observers */ },
  enter(el, primeraVez, reanudar) { /* empezar; reanudar=true al volver a la pestaña */ },
  leave(el, pausa) { /* detener todo; pausa=true si solo se ocultó la pestaña */ },
};
```

Marcar en el HTML con `data-fx="miEfecto"` dentro de la diapositiva.
