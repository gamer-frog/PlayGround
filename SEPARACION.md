# Separación: Agentes IA / Conductor

Esta branch (`agentes-ia-plan`) reúne **todo el trabajo de agentes** que estaba mezclado con el juego:

- **Conductor — Agent studio** (la app para observar/orquestar agentes que viven en GitHub):
  - `index.html`, `styles.css`
  - `app-core.js`, `app-home.js`, `app-agents.js`, `app-missions.js`, `app-plan.js`, `app-command.js`, `app-actions.js`, `app-world.js`
  - `orchestra/` (estado, eventos, coordinador, onboarding, tests)
  - `ORCHESTRATION.md`, `docs/`, `Agents.md`, `README.md`
- **Plan de trabajo del agente**: `00_cerebro_loop/` (protocolo, handoff, roadmap, etc.).

## Origen

- La app Conductor fue consolidada desde el checkpoint `opencode-checkpoints/24` (el más nuevo de la cadena de Conductor).
- El plan `00_cerebro_loop/` fue traído desde `main` antes de limpiarlo.

## Importante

- La branch `main` queda **solo con el juego** (Arena del Robledal): `game.js`, `index.html`, `styles.css`, `assets/ao/`, etc.
- Este branch **no contiene el juego** y no debe mergearse sobre `main`.
- La app es estática: se puede servir con `python3 -m http.server 3003` desde la raíz de esta branch.
