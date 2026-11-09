# HANDOFF (Estado Actual)

## Última acción completada
Guard defensivo en `isOpen()`, documentación de `Q`/`E` en el modal y badges de tecla `Q`/`E` sobre los botones de poción. Verificado en navegador (consola limpia, sin overflow en 320–1050 px).

## Estado del build/navegador
🟢 Verde. Chromium en `http://localhost:3002` con 0 errores / 0 warnings. Cinturón de pociones operativo (3/3, Q/E, reinicio) y `isOpen` robusto.

## Decisiones de diseño tomadas
- Se usó `Object.freeze(INITIAL_POTIONS)` + copia mutable, para reiniciar el inventario sin duplicar números mágicos.
- `usePotion` valida `player`, tipo, `gameOver`, `paused` y `alive`; usa `potionInventory[type] ?? 0`.
- `refreshHud` actualiza las pociones sólo si ambos botones existen (`if (healthPotion && manaPotion)`).
- Listeners de click con optional chaining (`$('healthPotion')?.addEventListener(...)`) para no romper si falta el markup.
- No se reemplazaron `game.js`/`index.html`/`styles.css` con los de la branch 18; se portó sólo la feature.

## PRÓXIMO PASO INMEDIATO
🚀 Evaluar el rescate de la IA de NPCs de la branch 18 (auto-curación, retirada y hechizos a distancia) como feature autocontenida. Los equipos 4v4 quedan como épica mayor que requiere actualizar ACTORS, HUD y puntuación.

## Contexto importante
- Worktree de trabajo: `/tmp/opencode/foundation` en `foundation/00-cerebro-loop`; `main` local sigue a `origin/main`.
- Branch 18 tiene 889 líneas de `game.js` vs 646 de `main`; incluye equipos 4v4, pociones, colocación de NPCs y aim visible. No mergear.
- Servidor estático: `python3 -m http.server 3002 --bind 127.0.0.1`.
- Playwright necesita el symlink `chromium-1243 -> chromium-1254` en `~/.cache/ms-playwright` (ya creado).
- No usar `gh`; sólo `git`. Nunca force push.
