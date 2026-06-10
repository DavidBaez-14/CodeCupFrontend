import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  agregarJugadorCancha,
  agregarTodosJugadores,
  cancelarPartido,
  cerrarPartido,
  crearEvento,
  declararWO,
  eliminarEvento,
  listAlineacionPartido,
  listEventosPartido,
  listMiembrosEquipoTorneoAdmin,
  quitarJugadorCancha,
  reabrirPartido,
} from '../api/supercopa';
import { getToken } from '../utils/session';

const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
  DESCANSO: 'descanso',
};

const TIPO_TO_LOCAL = {
  GOL: 'gol',
  AMARILLA: 'amarilla',
  AZUL: 'azul',
  ROJA: 'roja',
};
const LOCAL_TO_TIPO = {
  gol: 'GOL',
  amarilla: 'AMARILLA',
  azul: 'AZUL',
  roja: 'ROJA',
};

/**
 * Hook compartido para gestionar un partido individual desde admin o árbitro.
 * Encapsula carga de roster + alineación + eventos y sus mutaciones.
 *
 * Recibe el "partido base" tal como viene de listPartidosTorneo (PartidoAdminDTO)
 * y mantiene la fuente de verdad sincronizada con backend.
 */
export default function useGestionPartido(partidoBase) {
  const partidoId = partidoBase?.id;

  // ── Estado base
  const [partido, setPartido] = useState(partidoBase || null);
  const [alineacion, setAlineacion] = useState([]);
  const [roster, setRoster] = useState({ home: [], away: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar partido si cambia el objeto base que viene del padre.
  useEffect(() => {
    if (partidoBase) setPartido(partidoBase);
  }, [partidoBase]);

  // Cache de roster por equipoTorneoId — evita repedirlo cada render.
  const rosterCache = useRef({});

  const loadRoster = useCallback(async (localId, visitanteId) => {
    const result = { home: [], away: [] };
    const fetchOne = async (id) => {
      if (!id) return [];
      if (rosterCache.current[id]) return rosterCache.current[id];
      try {
        const members = await listMiembrosEquipoTorneoAdmin(id, getToken());
        const arr = Array.isArray(members) ? members : [];
        rosterCache.current[id] = arr;
        return arr;
      } catch {
        return [];
      }
    };
    const [h, a] = await Promise.all([fetchOne(localId), fetchOne(visitanteId)]);
    result.home = h;
    result.away = a;
    return result;
  }, []);

  const loadAll = useCallback(async () => {
    if (!partidoId) return;
    setLoading(true);
    setError('');
    try {
      const [ali, ev, rost] = await Promise.all([
        listAlineacionPartido(partidoId, getToken()).catch(() => []),
        listEventosPartido(partidoId, getToken()).catch(() => []),
        loadRoster(partidoBase?.localEquipoTorneoId, partidoBase?.visitanteEquipoTorneoId),
      ]);
      setAlineacion(Array.isArray(ali) ? ali : []);
      setEvents(Array.isArray(ev) ? ev : []);
      setRoster(rost);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar el partido.');
    } finally {
      setLoading(false);
    }
  }, [partidoId, partidoBase?.localEquipoTorneoId, partidoBase?.visitanteEquipoTorneoId, loadRoster]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Vistas derivadas
  const match = useMemo(() => {
    if (!partido) return null;

    // Index cedula → num (asignamos números secuenciales por orden del roster)
    const buildIdx = (arr) => {
      const idx = new Map();
      arr.forEach((m, i) => idx.set(m.cedula, i + 1));
      return idx;
    };
    const homeIdx = buildIdx(roster.home);
    const awayIdx = buildIdx(roster.away);

    const buildRosterUI = (arr, idxMap) => arr.map((mb) => ({
      num: idxMap.get(mb.cedula),
      cedula: mb.cedula,
      name: mb.nombre || mb.cedula,
      suspension: null,
    }));

    const homeRoster = buildRosterUI(roster.home, homeIdx);
    const awayRoster = buildRosterUI(roster.away, awayIdx);

    const onFieldCedulas = new Set(alineacion.filter((a) => a.jugo).map((a) => a.cedula));
    const onFieldHome = homeRoster.filter((p) => onFieldCedulas.has(p.cedula)).map((p) => p.num);
    const onFieldAway = awayRoster.filter((p) => onFieldCedulas.has(p.cedula)).map((p) => p.num);

    // Eventos en shape UI
    const localId = partido.localEquipoTorneoId;
    const eventsUI = events.map((e) => {
      const isHome = e.equipoTorneoId === localId;
      const idxMap = isHome ? homeIdx : awayIdx;
      const num = e.cedula ? idxMap.get(e.cedula) || null : null;
      return {
        id: e.id,
        type: TIPO_TO_LOCAL[e.tipoEvento] || (e.tipoEvento || '').toLowerCase(),
        side: isHome ? 'home' : 'away',
        num,
        player: e.jugadorNombre || e.cedula || '(WO)',
        cedula: e.cedula,
        orden: e.orden,
      };
    });
    const sortedEvents = [...eventsUI].sort((a, b) => (a.orden || 0) - (b.orden || 0));

    // Goles para el marcador
    const golesHome = sortedEvents.filter((e) => e.type === 'gol' && e.side === 'home').length;
    const golesAway = sortedEvents.filter((e) => e.type === 'gol' && e.side === 'away').length;

    const fecha = partido.fecha ? new Date(partido.fecha) : null;

    return {
      id: partido.id,
      home: partido.localNombre || 'Por definir',
      away: partido.visitanteNombre || 'Por definir',
      // El marcador es siempre el cómputo en vivo de los eventos (la BD ya los
      // tiene). NO usar partido.golesLocal porque ese valor es stale: viene del
      // padre que solo recarga al cerrar el partido. Para WO existen 3 GOL
      // dummy events en BD que también cuentan aquí, por lo que el resultado
      // 3-0 sigue siendo correcto.
      scoreH: golesHome,
      scoreA: golesAway,
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
      onFieldHome,
      onFieldAway,
      events: sortedEvents,
    };
  }, [partido, alineacion, events, roster]);

  // ── Acciones
  const refreshAlineacion = useCallback(async () => {
    if (!partidoId) return;
    try {
      const ali = await listAlineacionPartido(partidoId, getToken());
      setAlineacion(Array.isArray(ali) ? ali : []);
    } catch (err) {
      setError(err?.message || 'No fue posible refrescar alineación.');
    }
  }, [partidoId]);

  const refreshEvents = useCallback(async () => {
    if (!partidoId) return;
    try {
      const ev = await listEventosPartido(partidoId, getToken());
      setEvents(Array.isArray(ev) ? ev : []);
    } catch (err) {
      setError(err?.message || 'No fue posible refrescar eventos.');
    }
  }, [partidoId]);

  const togglePlayer = useCallback(async (side, num) => {
    if (!match) return;
    const rosterKey = side === 'home' ? 'homeRoster' : 'awayRoster';
    const onFieldKey = side === 'home' ? 'onFieldHome' : 'onFieldAway';
    const player = match[rosterKey].find((p) => p.num === num);
    if (!player) return;
    const alreadyOnField = match[onFieldKey].includes(num);
    const equipoTorneoId = side === 'home' ? match.localEquipoTorneoId : match.visitanteEquipoTorneoId;
    try {
      if (alreadyOnField) {
        await quitarJugadorCancha(partidoId, player.cedula, getToken());
      } else {
        await agregarJugadorCancha(partidoId, player.cedula, equipoTorneoId, getToken());
      }
      await refreshAlineacion();
    } catch (err) {
      setError(err?.message || 'Error al modificar alineación.');
    }
  }, [match, partidoId, refreshAlineacion]);

  const addAll = useCallback(async (side) => {
    if (!match) return;
    const equipoTorneoId = side === 'home' ? match.localEquipoTorneoId : match.visitanteEquipoTorneoId;
    try {
      await agregarTodosJugadores(partidoId, equipoTorneoId, getToken());
      await refreshAlineacion();
    } catch (err) {
      setError(err?.message || 'Error al agregar jugadores.');
    }
  }, [match, partidoId, refreshAlineacion]);

  const addEvent = useCallback(async (eventoLocal) => {
    if (!match) return;
    const { type, side, num } = eventoLocal;
    const rosterArr = side === 'home' ? match.homeRoster : match.awayRoster;
    const player = rosterArr.find((p) => p.num === num);
    if (!player) {
      setError('Jugador no encontrado en el roster.');
      return;
    }
    const equipoTorneoId = side === 'home' ? match.localEquipoTorneoId : match.visitanteEquipoTorneoId;
    const payload = {
      cedula: player.cedula,
      equipoTorneoId,
      tipoEvento: LOCAL_TO_TIPO[type] || type.toUpperCase(),
    };
    try {
      await crearEvento(partidoId, payload, getToken());
      await refreshEvents();
    } catch (err) {
      setError(err?.message || 'No fue posible registrar el evento.');
    }
  }, [match, partidoId, refreshEvents]);

  const deleteEvent = useCallback(async (eventoId) => {
    if (!partidoId || !eventoId) return;
    try {
      await eliminarEvento(partidoId, eventoId, getToken());
      await refreshEvents();
    } catch (err) {
      setError(err?.message || 'No fue posible eliminar el evento.');
    }
  }, [partidoId, refreshEvents]);

  const closeMatch = useCallback(async () => {
    if (!partidoId) return null;
    try {
      const updated = await cerrarPartido(partidoId, getToken());
      if (updated) setPartido(updated);
      return updated;
    } catch (err) {
      setError(err?.message || 'No fue posible cerrar el partido.');
      throw err;
    }
  }, [partidoId]);

  const declarWO = useCallback(async (winnerSide, motivo) => {
    if (!partidoId || !match) return null;
    const ganadorEquipoTorneoId = winnerSide === 'home'
      ? match.localEquipoTorneoId
      : match.visitanteEquipoTorneoId;
    try {
      const updated = await declararWO(partidoId, { ganadorEquipoTorneoId, motivo }, getToken());
      if (updated) setPartido(updated);
      await loadAll();
      return updated;
    } catch (err) {
      setError(err?.message || 'No fue posible declarar W.O.');
      throw err;
    }
  }, [partidoId, match, loadAll]);

  const cancelMatch = useCallback(async (motivo) => {
    if (!partidoId) return null;
    try {
      await cancelarPartido(partidoId, { motivo }, getToken());
    } catch (err) {
      setError(err?.message || 'No fue posible cancelar el partido.');
      throw err;
    }
  }, [partidoId]);

  const reopen = useCallback(async () => {
    if (!partidoId) return null;
    try {
      const updated = await reabrirPartido(partidoId, getToken());
      if (updated) setPartido(updated);
      return updated;
    } catch (err) {
      setError(err?.message || 'No fue posible reabrir el partido.');
      throw err;
    }
  }, [partidoId]);

  return {
    match,
    loading,
    error,
    setError,
    refresh: loadAll,
    togglePlayer,
    addAll,
    addEvent,
    deleteEvent,
    closeMatch,
    declarWO,
    cancelMatch,
    reopen,
  };
}
