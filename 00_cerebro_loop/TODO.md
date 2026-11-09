# TODO Y BLOQUEOS

*Regla: Máximo 3 intentos por ítem. Si falla 3 veces, se marca "REQUIERE HUMANO" y se salta.*

## Tareas en progreso

- [ ] 🔄 Ninguna en este momento. El último ítem (cinturón de pociones) completó y se verificó en el primer intento.

## Requiere intervención humana

- [ ] 🛑 REQUIERE HUMANO (informativo): eliminar branches `opencode-checkpoints/*` del remoto.
  - Motivo: es destructivo y varias branches contienen proyectos no relacionados o trabajo paralelo sin verificar.
  - Contexto: 22 branches; sólo `7,11,14,15,18` pertenecen al juego. No borrar hasta completar el rescate.

## Ideas pendientes

- [ ] 💡 Portar el indicador de puntería visible por NPC de la branch 18.
- [ ] 💡 Añadir guard defensivo `Boolean(mapData && ...)` en `isOpen()`.
- [ ] 💡 Revisar balance: el mago muere demasiado rápido al inicio de ronda.
