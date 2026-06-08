import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import RoleHeaderActions from '../components/RoleHeaderActions';
import {
  listPartidosTorneo,
  listTorneosAdmin,
  listAlineacionPartido,
  listMiembrosEquipoTorneoAdmin,
  agregarJugadorCancha,
  quitarJugadorCancha,
  agregarTodosJugadores,
  cerrarPartido,
  declararWO,
  cancelarPartido,
} from '../api/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getNombre, getToken } from '../utils/session';
import MatchListView from './arbitro/MatchListView';
import MatchDetailView from './arbitro/MatchDetailView';
import '../styles/admin.css';
import '../styles/role-shell.css';
import './arbitro/arbitro.css';

const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
  DESCANSO: 'descanso',
};

function flattenPartidoToMatch(p, torneoIdx) {
  const fecha = p.fecha ? new Date(p.fecha) : new Date();
  const status = STATUS_MAP[p.estado] || 'upcoming';
  return {
    id: p.id,
    fecha: torneoIdx + 1,
    grupo: 'A',
    hora: fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    date: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    home: p.localNombre,
    away: p.visitanteNombre,
    status,
    scoreH: p.golesLocal ?? 0,
    scoreA: p.golesVisitante ?? 0,
    homeRoster: [],
    awayRoster: [],
    onFieldHome: [],
    onFieldAway: [],
    events: [],
    estado: p.estado,
    localEquipoTorneoId: p.localEquipoTorneoId,
    visitanteEquipoTorneoId: p.visitanteEquipoTorneoId,
  };
}

function ArbitroDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Árbitro';

  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [matches, setMatches] = useState([]);
  const [alineacionMap, setAlineacionMap] = useState({});
  const [teamMembersMap, setTeamMembersMap] = useState({});
  const teamMembersCache = useRef({});
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState('');

  const [activeMatchId, setActiveMatchId] = useState(null);
  const [jornadaFilter, setJornadaFilter] = useState('all');

  // Load torneos
  useEffect(() => {
    listTorneosAdmin(getToken())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTorneos(list);
        if (list.length && !torneoId) setTorneoId(list[0].id);
      })
      .catch((err) => setError(err?.message || 'No fue posible cargar torneos.'));
  }, [torneoId]);

  // Load partidos
  const loadPartidos = useCallback(async () => {
    if (!torneoId) return;
    setLoadingMatches(true);
    setError('');
    try {
      const partidosData = await listPartidosTorneo(torneoId, getToken());
      const arr = Array.isArray(partidosData) ? partidosData : [];
      const torneoIdx = torneos.findIndex((t) => t.id === torneoId);
      const flattened = arr.map((p) => flattenPartidoToMatch(p, torneoIdx >= 0 ? torneoIdx : 0));
      setMatches(flattened);

      const aliMap = {};
      await Promise.all(arr
        .filter((p) => p.estado === 'EN_CURSO' || p.estado === 'PROGRAMADO')
        .map(async (p) => {
          try {
            const ali = await listAlineacionPartido(p.id, getToken());
            aliMap[p.id] = Array.isArray(ali) ? ali : [];
          } catch { /* ignore */ }
        }));
      setAlineacionMap(aliMap);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar partidos.');
    } finally {
      setLoadingMatches(false);
    }
  }, [torneoId, torneos]);

  useEffect(() => { loadPartidos(); }, [loadPartidos]);

  const loadTeamMembers = useCallback(async (match) => {
    if (!match) return;
    const ids = [match.localEquipoTorneoId, match.visitanteEquipoTorneoId];
    const results = {};
    for (const id of ids) {
      if (teamMembersCache.current[id]) {
        results[id] = teamMembersCache.current[id];
        continue;
      }
      try {
        const members = await listMiembrosEquipoTorneoAdmin(id, getToken());
        results[id] = Array.isArray(members) ? members : [];
        teamMembersCache.current[id] = results[id];
      } catch {
        results[id] = [];
        teamMembersCache.current[id] = [];
      }
    }
    if (Object.keys(results).length) {
      setTeamMembersMap((prev) => ({ ...prev, ...results }));
    }
  }, []);

  useEffect(() => {
    const match = matches.find((m) => m.id === activeMatchId) || null;
    if (match) loadTeamMembers(match);
  }, [activeMatchId, matches, loadTeamMembers]);

  // Enriquecer match con roster (team members) + alineación (who's on field)
  const matchesWithLineup = useMemo(() => matches.map((m) => {
    const ali = alineacionMap[m.id] || [];
    const localMembers = teamMembersMap[m.localEquipoTorneoId] || [];
    const visitanteMembers = teamMembersMap[m.visitanteEquipoTorneoId] || [];

    const homeRoster = localMembers.map((mb, i) => ({
      num: i + 1,
      name: mb.nombre || mb.cedula,
      suspension: null,
      cedula: mb.cedula,
    }));
    const awayRoster = visitanteMembers.map((mb, i) => ({
      num: i + 1,
      name: mb.nombre || mb.cedula,
      suspension: null,
      cedula: mb.cedula,
    }));

    const onFieldCedulas = new Set(ali.filter((a) => a.jugo).map((a) => a.cedula));
    const onFieldHome = homeRoster.filter((p) => onFieldCedulas.has(p.cedula)).map((p) => p.num);
    const onFieldAway = awayRoster.filter((p) => onFieldCedulas.has(p.cedula)).map((p) => p.num);

    return { ...m, homeRoster, awayRoster, onFieldHome, onFieldAway };
  }), [matches, alineacionMap, teamMembersMap]);

  // Live score from local events state
  const matchesWithLiveScore = useMemo(
    () => matchesWithLineup.map((m) => {
      if (m.status === 'played') return m;
      const goals = (m.events || []).filter((e) => e.type === 'gol');
      return {
        ...m,
        scoreH: goals.filter((e) => e.side === 'home').length,
        scoreA: goals.filter((e) => e.side === 'away').length,
      };
    }),
    [matchesWithLineup],
  );

  const activeMatch = useMemo(
    () => matchesWithLiveScore.find((m) => m.id === activeMatchId) || null,
    [matchesWithLiveScore, activeMatchId],
  );

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  // ── Mutators ────────────────────────────────────────────────

  const updateMatch = (id, updater) => {
    setMatches((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  };

  const handleTogglePlayer = async (side, num) => {
    const match = activeMatch;
    if (!match) return;
    const rosterKey = side === 'home' ? 'homeRoster' : 'awayRoster';
    const onFieldKey = side === 'home' ? 'onFieldHome' : 'onFieldAway';
    const player = match[rosterKey].find((p) => p.num === num);
    if (!player) return;

    const alreadyOnField = match[onFieldKey].includes(num);
    const equipoTorneoId = side === 'home' ? match.localEquipoTorneoId : match.visitanteEquipoTorneoId;

    try {
      if (alreadyOnField) {
        await quitarJugadorCancha(match.id, player.cedula, getToken());
      } else {
        await agregarJugadorCancha(match.id, player.cedula, equipoTorneoId, getToken());
      }
      const ali = await listAlineacionPartido(match.id, getToken());
      setAlineacionMap((prev) => ({ ...prev, [match.id]: Array.isArray(ali) ? ali : [] }));
    } catch (err) {
      setError(err?.message || 'Error al modificar alineación.');
    }
  };

  const handleAddAll = async (side) => {
    const match = activeMatch;
    if (!match) return;
    const equipoTorneoId = side === 'home' ? match.localEquipoTorneoId : match.visitanteEquipoTorneoId;
    try {
      await agregarTodosJugadores(match.id, equipoTorneoId, getToken());
      const ali = await listAlineacionPartido(match.id, getToken());
      setAlineacionMap((prev) => ({ ...prev, [match.id]: Array.isArray(ali) ? ali : [] }));
    } catch (err) {
      setError(err?.message || 'Error al agregar jugadores.');
    }
  };

  const handleAddEvent = (event) => {
    updateMatch(activeMatchId, (m) => {
      const next = { ...m, events: [...(m.events || []), event] };
      if (event.type === 'roja') {
        const key = event.side === 'home' ? 'onFieldHome' : 'onFieldAway';
        next[key] = m[key].filter((n) => n !== event.num);
      }
      return next;
    });
  };

  const handleDeleteEvent = (idx) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    updateMatch(activeMatchId, (m) => ({
      ...m,
      events: m.events.filter((_, i) => i !== idx),
    }));
  };

  const handleCloseMatch = async () => {
    const m = activeMatch;
    if (!m || m.status === 'played') return;
    if (!window.confirm(
      `¿Cerrar el partido con el resultado ${m.scoreH} - ${m.scoreA}?\nNo podrás editar los eventos después.`,
    )) return;
    try {
      await cerrarPartido(m.id, getToken());
      updateMatch(activeMatchId, (curr) => ({ ...curr, status: 'played' }));
      loadPartidos();
    } catch (err) {
      setError(err?.message || 'No fue posible cerrar el partido.');
    }
  };

  const handleWO = async (winnerSide, reason) => {
    const m = activeMatch;
    if (!m) return;
    const ganadorEquipoTorneoId = winnerSide === 'home'
      ? m.localEquipoTorneoId
      : m.visitanteEquipoTorneoId;
    try {
      await declararWO(m.id, { ganadorEquipoTorneoId, motivo: reason }, getToken());
      updateMatch(activeMatchId, (curr) => ({
        ...curr,
        status: 'played',
        events: [],
        scoreH: winnerSide === 'home' ? 3 : 0,
        scoreA: winnerSide === 'away' ? 3 : 0,
      }));
      loadPartidos();
    } catch (err) {
      setError(err?.message || 'No fue posible declarar W.O.');
    }
  };

  const handleCancel = async (reason) => {
    const m = activeMatch;
    if (!m) return;
    try {
      await cancelarPartido(m.id, { motivo: reason }, getToken());
      setActiveMatchId(null);
      loadPartidos();
    } catch (err) {
      setError(err?.message || 'No fue posible cancelar el partido.');
    }
  };

  return (
    <main className="role-shell">
      <header className="role-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de árbitro</p>
          </div>
        </div>
        <div className="role-user">
          <select
            className="form-input"
            value={torneoId}
            onChange={(e) => setTorneoId(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <RoleHeaderActions allowRoleRequest />
          <button className="logout-btn" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="role-content" style={{ padding: 0 }}>
        {error && <p className="banner banner-error" style={{ margin: '16px 20px 0' }}>{error}</p>}

        {loadingMatches ? (
          <div className="ar-page" style={{ paddingTop: 0 }}>
            <p className="empty-state" style={{ padding: 40 }}>Cargando partidos…</p>
          </div>
        ) : activeMatch ? (
          <div className="ar-page" style={{ paddingTop: 0 }}>
            <header style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="action-button ghost"
                onClick={() => setActiveMatchId(null)}
              >
                ← Volver a lista
              </button>
            </header>

            <MatchDetailView
              match={activeMatch}
              onTogglePlayer={handleTogglePlayer}
              onAddAll={handleAddAll}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onCloseMatch={handleCloseMatch}
              onWO={handleWO}
              onCancel={handleCancel}
            />

            <footer className="ar-page-footer">© 2026 · Code Cup · UFPS Cúcuta</footer>
          </div>
        ) : (
          <div className="ar-page" style={{ paddingTop: 0 }}>
            <MatchListView
              matches={matchesWithLiveScore}
              jornadaFilter={jornadaFilter}
              onChangeFilter={setJornadaFilter}
              onOpenMatch={setActiveMatchId}
            />
            <footer className="ar-page-footer">© 2026 · Code Cup · UFPS Cúcuta</footer>
          </div>
        )}
      </section>
    </main>
  );
}

export default ArbitroDashboard;
