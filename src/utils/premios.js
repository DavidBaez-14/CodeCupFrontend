// Ganador de un premio del torneo (PremioDTO). Spec 0027: un premio individual se identifica
// por ganadorPersonaId y muestra ganadorNombre; uno de equipo, por ganadorEquipoTorneoId.

/** El premio ya tiene ganador (persona o equipo). */
export function premioTieneGanador(premio) {
  return Boolean(premio?.ganadorPersonaId || premio?.ganadorEquipoTorneoId);
}

/** Nombre del ganador para mostrar, o null si el premio no tiene ganador. */
export function nombreGanador(premio) {
  if (premio?.ganadorEquipoTorneoId) return premio.ganadorEquipoNombre || 'Equipo';
  if (premio?.ganadorPersonaId) return premio.ganadorNombre || 'Jugador';
  return null;
}
