import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import RoleHeaderActions from '../components/RoleHeaderActions';
import { listPartidosTorneo, listTorneosAdmin } from '../api/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getNombre, getToken } from '../utils/session';
import MatchListView from './arbitro/MatchListView';
import GestionPartidoModal from '../components/supercopa/GestionPartidoModal';
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

function partidoToListItem(p) {
  const fecha = p.fecha ? new Date(p.fecha) : new Date();
  return {
    id: p.id,
    fecha: p.jornada || 1,
    grupo: p.grupo || 'A',
    hora: fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    date: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    home: p.localNombre,
    away: p.visitanteNombre,
    status: STATUS_MAP[p.estado] || 'upcoming',
    scoreH: p.golesLocal ?? 0,
    scoreA: p.golesVisitante ?? 0,
  };
}

function ArbitroDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Árbitro';

  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState('');

  const [openPartido, setOpenPartido] = useState(null);
  const [jornadaFilter, setJornadaFilter] = useState('all');

  useEffect(() => {
    listTorneosAdmin(getToken())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTorneos(list);
        if (list.length) setTorneoId((curr) => curr || list[0].id);
      })
      .catch((err) => setError(err?.message || 'No fue posible cargar torneos.'));
  }, []);

  const loadPartidos = useCallback(async () => {
    if (!torneoId) return;
    setLoadingMatches(true);
    setError('');
    try {
      const data = await listPartidosTorneo(torneoId, getToken());
      const arr = Array.isArray(data) ? data : [];
      setPartidos(arr);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar partidos.');
    } finally {
      setLoadingMatches(false);
    }
  }, [torneoId]);

  useEffect(() => { loadPartidos(); }, [loadPartidos]);

  // El árbitro solo ve partidos con ambos equipos asignados — los placeholders
  // del bracket (ej. cuartos antes de que terminen los grupos) no son jugables
  // y no deben aparecer en la lista. Los listamos cuando el sistema auto-puebla.
  const matches = useMemo(
    () => partidos
      .filter((p) => p.localNombre && p.visitanteNombre)
      .map(partidoToListItem),
    [partidos],
  );

  const handleOpenMatch = (id) => {
    const p = partidos.find((x) => x.id === id);
    if (p) setOpenPartido(p);
  };

  const handlePartidoActualizado = (partidoActualizado) => {
    if (partidoActualizado && partidoActualizado.id) {
      setPartidos((prev) => prev.map((p) => p.id === partidoActualizado.id ? { ...p, ...partidoActualizado } : p));
    }
  };

  const handleCloseModal = () => {
    setOpenPartido(null);
    loadPartidos();
  };

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
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
        {error && (
          <p className="banner banner-error" style={{ margin: '16px 20px 0' }}>{error}</p>
        )}

        {loadingMatches ? (
          <div className="ar-page" style={{ paddingTop: 0 }}>
            <p className="empty-state" style={{ padding: 40 }}>Cargando partidos…</p>
          </div>
        ) : (
          <div className="ar-page" style={{ paddingTop: 0 }}>
            <MatchListView
              matches={matches}
              jornadaFilter={jornadaFilter}
              onChangeFilter={setJornadaFilter}
              onOpenMatch={handleOpenMatch}
            />
            <footer className="ar-page-footer">© 2026 · Code Cup · UFPS Cúcuta</footer>
          </div>
        )}
      </section>

      {openPartido && (
        <GestionPartidoModal
          partido={openPartido}
          mode="arbitro"
          onClose={handleCloseModal}
          onPartidoActualizado={handlePartidoActualizado}
        />
      )}

      {nombre && null}
    </main>
  );
}

export default ArbitroDashboard;
