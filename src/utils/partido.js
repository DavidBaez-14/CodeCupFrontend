// Lógica pura de la gestión de un partido (árbitro y admin), separada de useGestionPartido
// para poder probarla. Spec 0027: el roster, la alineación, los eventos y los bloqueados se
// cruzan por personaId. Antes se cruzaban por el número de documento, y sin él todos los
// jugadores quedaban bajo la misma llave (undefined) sin que la pantalla mostrara ningún error.

export const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
  DESCANSO: 'descanso',
};

export const TIPO_TO_LOCAL = {
  GOL: 'gol',
  AMARILLA: 'amarilla',
  AZUL: 'azul',
  ROJA: 'roja',
};

export const LOCAL_TO_TIPO = {
  gol: 'GOL',
  amarilla: 'AMARILLA',
  azul: 'AZUL',
  roja: 'ROJA',
};

/** Número de cada persona en su roster: 1..n, en el orden en que llega del backend. */
export function numerosPorPersona(roster) {
  const numeros = new Map();
  roster.forEach((miembro, i) => numeros.set(miembro.personaId, i + 1));
  return numeros;
}

/** Roster en la forma que pinta la UI, con el bloqueo (suspensión o multa) de cada persona si lo tiene. */
export function rosterUI(roster, numeros, bloqueados) {
  return roster.map((miembro) => ({
    num: numeros.get(miembro.personaId),
    personaId: miembro.personaId,
    name: miembro.nombre || miembro.numeroDocumento || 'Sin nombre',
    suspension: bloqueados.find((b) => b.personaId === miembro.personaId) || null,
  }));
}

/** Números de los jugadores de ese roster que están en cancha (alineación con jugo = true). */
export function numerosEnCancha(rosterDeLaUI, alineacion) {
  const enCancha = new Set(alineacion.filter((a) => a.jugo).map((a) => a.personaId));
  return rosterDeLaUI.filter((p) => enCancha.has(p.personaId)).map((p) => p.num);
}

/** Eventos en la forma de la UI, en orden. Un gol de W.O. no tiene persona: sale como "(WO)". */
export function eventosUI(eventos, localEquipoTorneoId, numerosLocal, numerosVisitante) {
  return eventos
    .map((e) => {
      const isHome = e.equipoTorneoId === localEquipoTorneoId;
      const numeros = isHome ? numerosLocal : numerosVisitante;
      return {
        id: e.id,
        type: TIPO_TO_LOCAL[e.tipoEvento] || (e.tipoEvento || '').toLowerCase(),
        side: isHome ? 'home' : 'away',
        num: e.personaId ? numeros.get(e.personaId) || null : null,
        player: e.jugadorNombre || (e.personaId ? 'Jugador' : '(WO)'),
        personaId: e.personaId || null,
        orden: e.orden,
      };
    })
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

/**
 * Todo lo que pinta la pantalla del partido a partir de las respuestas del backend:
 * el partido base (PartidoAdminDTO), los rosters de los dos equipos (MiembroEquipoDTO),
 * la alineación (PartidoJugadorDTO), los eventos (EventoDTO) y los bloqueados.
 */
export function armarPartido({ partido, roster, alineacion, eventos, bloqueados }) {
  if (!partido) return null;

  const numerosLocal = numerosPorPersona(roster.home);
  const numerosVisitante = numerosPorPersona(roster.away);
  const homeRoster = rosterUI(roster.home, numerosLocal, bloqueados);
  const awayRoster = rosterUI(roster.away, numerosVisitante, bloqueados);
  const events = eventosUI(eventos, partido.localEquipoTorneoId, numerosLocal, numerosVisitante);

  const fecha = partido.fecha ? new Date(partido.fecha) : null;

  return {
    id: partido.id,
    home: partido.localNombre || 'Por definir',
    away: partido.visitanteNombre || 'Por definir',
    // El marcador es siempre el cómputo en vivo de los eventos (la BD ya los tiene). NO usar
    // partido.golesLocal: es un valor viejo que el padre solo recarga al cerrar el partido.
    // Un W.O. guarda 3 goles sin persona que también cuentan aquí, así que el 3-0 sigue saliendo bien.
    scoreH: events.filter((e) => e.type === 'gol' && e.side === 'home').length,
    scoreA: events.filter((e) => e.type === 'gol' && e.side === 'away').length,
    status: STATUS_MAP[partido.estado] || 'upcoming',
    estado: partido.estado,
    hora: fecha ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
    date: fecha ? fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '',
    fecha: partido.jornada || '',
    grupo: partido.grupo || partido.fase || '',
    localEquipoTorneoId: partido.localEquipoTorneoId,
    visitanteEquipoTorneoId: partido.visitanteEquipoTorneoId,
    homeRoster,
    awayRoster,
    onFieldHome: numerosEnCancha(homeRoster, alineacion),
    onFieldAway: numerosEnCancha(awayRoster, alineacion),
    events,
    torneoId: partido.torneoId,
  };
}

/** Cuerpo de POST …/partidos/{id}/eventos para un jugador del roster. */
export function cuerpoEvento(jugador, equipoTorneoId, type) {
  return {
    personaId: jugador.personaId,
    equipoTorneoId,
    tipoEvento: LOCAL_TO_TIPO[type] || type.toUpperCase(),
  };
}
