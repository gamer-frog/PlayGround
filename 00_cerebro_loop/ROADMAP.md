# ROADMAP DEL PROYECTO

*Marcar con `[x]` lo completado, `[~]` en progreso, `[ ]` pendiente.*

## 🚀 Funcionalidades Principales

- [x] **Cinturón de pociones** (rescatado de `opencode-checkpoints/18`): dos consumibles, poción roja (+45 vida) y azul (+35 maná), con contador, teclas `Q`/`E`, botones en el HUD y reinicio en "Nueva partida".
- [ ] **Equipos sagrado/caótico 4v4** (branch 18): convertir la escaramuza libre en dos equipos con clases y objetivos.
- [ ] **Colocación de NPCs** (branch 18): permitir posicionar combatientes antes de la ronda.
- [ ] **Puntería visible independiente por NPC** (branch 18): indicador de aim por bot para que el jugador pueda esquivar.
- [ ] **Puntuación por equipos** (branch 18): marcador de equipo en lugar de bajas individuales.
- [ ] **Modo 2v2 de NPCs + jugador 3v2** (roadmap visible en `index.html`): objetivo del MVP de combate.

## 🛠️ Deuda Técnica y Mantenimiento (Tareas [C])

- [x] Accesos defensivos en la lógica de pociones (`?? 0`, `?.addEventListener`, guardas de `player`).
- [ ] Revisar y agregar `?.` (optional chaining) en los accesos restantes a `current`/`state`/`mapData`.
- [x] `console.log` de producción: no hay ninguno en `game.js` (solo `console.warn`/`console.error` intencionales).
- [ ] ~~Sincronizar `game.js` y `dist/game.js`~~: obsoleto, no existe `dist/game.js` en este proyecto.
- [x] Guard defensivo en `isOpen()`: valida `mapData?.tiles`, límites y existencia del tile (`tiles[y]?.[x]`) antes de leer `.b`.
- [x] Documentar teclas de poción (`Q`/`E`) en el modal de controles.
- [x] Mostrar badges de tecla `Q`/`E` en los botones de poción, con títulos que indican el efecto exacto (+45 vida / +35 maná).

## 🐛 Bugs Conocidos

- [ ] Ninguno confirmado en el estado verde actual. El `TypeError ... reading 'type'` histórico no se reproduce.
- [ ] Observación: los NPCs pueden matar al mago muy rápido al inicio de ronda; revisar balance, no es un error de runtime.

## 📝 Notas

- Priorizar por impacto en el usuario y verificar siempre en navegador antes de pushear.
- Branch 18 es la fuente más rica; reconstruir por partes compatibles, nunca merge ciego.
