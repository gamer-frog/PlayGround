# HANDOFF (Estado Actual)

## Última acción completada
Rescate e implementación del **cinturón de pociones** de `opencode-checkpoints/18` en `main`, reconstruido de forma compatible (sin merge ciego). Poción roja `♥` (+45 vida) y azul `✦` (+35 maná), contador 3/3, teclas `Q`/`E`, botones en el HUD y reinicio en "Nueva partida".

## Estado del build/navegador
🟢 Verde. Chromium abierto en `http://localhost:3002`, consola con 0 mensajes / 0 errores / 0 warnings. Probado en escritorio (1050×768) y móvil (390×844), sin overflow horizontal.
- Poción roja: 3→2, cura 45, toast correcto.
- Poción azul: 3→2, restaura 35 (capeado), toast correcto.
- Ambas deshabilitadas con recurso al máximo; "Nueva partida" restaura 3/3.

## Decisiones de diseño tomadas
- Se usó `Object.freeze(INITIAL_POTIONS)` + copia mutable, para reiniciar el inventario sin duplicar números mágicos.
- `usePotion` valida `player`, tipo, `gameOver`, `paused` y `alive`; usa `potionInventory[type] ?? 0`.
- `refreshHud` actualiza las pociones sólo si ambos botones existen (`if (healthPotion && manaPotion)`).
- Listeners de click con optional chaining (`$('healthPotion')?.addEventListener(...)`) para no romper si falta el markup.
- No se reemplazaron `game.js`/`index.html`/`styles.css` con los de la branch 18; se portó sólo la feature.

## PRÓXIMO PASO INMEDIATO
🚀 Continuar el rescate de la branch 18 por partes: siguiente candidato de bajo riesgo = guard defensivo `isOpen()` (`Boolean(mapData && ...)`) o el indicador de puntería de NPCs. Reconstruir, verificar en navegador y pushear.

## Contexto importante
- Worktree de trabajo: `/tmp/opencode/foundation` en `foundation/00-cerebro-loop`; `main` local sigue a `origin/main`.
- Branch 18 tiene 889 líneas de `game.js` vs 646 de `main`; incluye equipos 4v4, pociones, colocación de NPCs y aim visible. No mergear.
- Servidor estático: `python3 -m http.server 3002 --bind 127.0.0.1`.
- Playwright necesita el symlink `chromium-1243 -> chromium-1254` en `~/.cache/ms-playwright` (ya creado).
- No usar `gh`; sólo `git`. Nunca force push.
