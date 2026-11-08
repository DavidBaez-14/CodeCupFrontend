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
  cerrarSinPagoArbitraje as apiCerrarSinPagoArbitraje,
} from '../api/supercopa';
import { getBloqueadosPartido, registrarPagoTodas, habilitarExcepcion as apiHabilitarExcepcion } from '../api/finanzas';
import { getToken } from '../utils/session';
import { armarPartido, cuerpoEvento } from '../utils/partido';

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
  const [bloqueados, setBloqueados] = useState([]);
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
      const [ali, ev, rost, blq] = await Promise.all([
        listAlineacionPartido(partidoId, getToken()).catch(() => []),
        listEventosPartido(partidoId, getToken()).catch(() => []),
        loadRoster(partidoBase?.localEquipoTorneoId, partidoBase?.visitanteEquipoTorneoId),
        getBloqueadosPartido(partidoId, getToken()).catch(() => []),
      ]);
      setAlineacion(Array.isArray(ali) ? ali : []);
      setEvents(Array.isArray(ev) ? ev : []);
      setRoster(rost);
      setBloqueados(Array.isArray(blq) ? blq : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar el partido.');
    } finally {
      setLoading(false);
    }
  }, [partidoId, partidoBase?.localEquipoTorneoId, partidoBase?.visitanteEquipoTorneoId, loadRoster]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Vista derivada (utils/partido.js): todo se cruza por personaId.
  const match = useMemo(
    () => armarPartido({ partido, roster, alineacion, eventos: events, bloqueados }),
    [partido, alineacion, events, roster, bloqueados],
  );

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
        await quitarJugadorCancha(partidoId, player.personaId, getToken());
      } else {
        await agregarJugadorCancha(partidoId, player.personaId, equipoTorneoId, getToken());
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
      // La API asume addAll por equipoTorneoId, pero el backend validará elegibilidad
      // Si el backend lanza error, lo atrapamos.
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
    try {
      await crearEvento(partidoId, cuerpoEvento(player, equipoTorneoId, type), getToken());
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

  const cerrarSinPagoArbitraje = useCallback(async (winnerSide, motivo) => {
    if (!partidoId || !match) return null;
    const equipoNoPagoTorneoId = winnerSide === 'home'
      ? match.visitanteEquipoTorneoId // Si gana home, el que NO pagó fue away
      : winnerSide === 'away' ? match.localEquipoTorneoId : null; // Si es 'ambos', mandamos null u otro flag

    try {
      const updated = await apiCerrarSinPagoArbitraje(partidoId, { equipoNoPagoTorneoId, motivo }, getToken());
      if (updated) setPartido(updated);
      await loadAll();
      return updated;
    } catch (err) {
      setError(err?.message || 'No fue posible cerrar sin pago de arbitraje.');
      throw err;
    }
  }, [partidoId, match, loadAll]);

  const registrarPago = useCallback(async (personaId, body) => {
    try {
      await registrarPagoTodas(personaId, body, getToken());
      await loadAll();
    } catch (err) {
      setError(err?.message || 'Error registrando pago.');
      throw err;
    }
  }, [loadAll]);

  const habilitarExcepcion = useCallback(async (multaId, body) => {
    try {
      await apiHabilitarExcepcion(multaId, body, getToken());
      await loadAll();
    } catch (err) {
      setError(err?.message || 'Error habilitando excepción.');
      throw err;
    }
  }, [loadAll]);

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
    cerrarSinPagoArbitraje,
    registrarPago,
    habilitarExcepcion,
  };
}
