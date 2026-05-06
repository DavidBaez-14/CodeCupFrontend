import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { getMiPerfil, listEquipos } from '../api/supercopa';
import { TEAM_COLORS } from '../data/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getEmail, getNombre, getToken } from '../utils/session';
import '../styles/admin.css';
import '../styles/role-shell.css';
import '../styles/jugador.css';

const TABS = [
  { id: 'equipo', label: 'Equipo' },
  { id: 'perfil', label: 'Perfil' },
];

function normalizeEquipos(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') return { id: item, nombre: item };
      return { id: item.id || item.nombre, nombre: item.nombre || item.name || 'Equipo' };
    });
  }
  return [];
}

function JugadorDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Jugador';
  const email = getEmail() || '';
  const token = getToken();

  const [activeTab, setActiveTab] = useState('equipo');
  const [equipos, setEquipos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [errorPerfil, setErrorPerfil] = useState('');

  const fallbackEquipos = useMemo(() => {
    return Object.keys(TEAM_COLORS).map((name) => ({ id: name, nombre: name }));
  }, []);

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  useEffect(() => {
    let alive = true;
    async function loadEquipos() {
      setLoadingEquipos(true);
      setErrorEquipos('');
      try {
        const data = await listEquipos(token);
        if (!alive) return;
        const normalized = normalizeEquipos(data);
        setEquipos(normalized.length ? normalized : fallbackEquipos);
      } catch (err) {
        if (!alive) return;
        setErrorEquipos(err?.message || 'No fue posible cargar los equipos.');
        setEquipos(fallbackEquipos);
      } finally {
        if (alive) setLoadingEquipos(false);
      }
    }
    loadEquipos();
    return () => { alive = false; };
  }, [fallbackEquipos, token]);

  useEffect(() => {
    let alive = true;
    async function loadPerfil() {
      setLoadingPerfil(true);
      setErrorPerfil('');
      try {
        const data = await getMiPerfil(token);
        if (!alive) return;
        setPerfil(data || null);
      } catch (err) {
        if (!alive) return;
        setErrorPerfil(err?.message || 'No fue posible cargar tu perfil.');
      } finally {
        if (alive) setLoadingPerfil(false);
      }
    }
    loadPerfil();
    return () => { alive = false; };
  }, [token]);

  return (
    <main className="role-shell jugador-shell">
      <header className="role-topbar jugador-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de jugador</p>
          </div>
        </div>

        <nav className="jugador-tabs" aria-label="Pestañas de jugador">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`jugador-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="role-user">
          <div className="role-user-info">
            <p className="user-name">{nombre}</p>
            <small className="user-email">{email}</small>
          </div>
          <button className="logout-btn" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="role-content jugador-content">
        {activeTab === 'equipo' && (
          <article className="ds-panel">
            <header className="panel-header">
              <h2>Equipos disponibles</h2>
              <p>Selecciona el equipo en el que deseas inscribirte para la Supercopa.</p>
            </header>

            {errorEquipos && <p className="banner banner-error">{errorEquipos}</p>}
            {loadingEquipos ? (
              <p className="empty-state">Cargando equipos…</p>
            ) : (
              <div className="equipo-grid">
                {equipos.map((equipo) => (
                  <div key={equipo.id} className="equipo-card">
                    <span
                      className="equipo-dot"
                      style={{ backgroundColor: TEAM_COLORS[equipo.nombre] || '#3d4f80' }}
                      aria-hidden="true"
                    />
                    <div className="equipo-info">
                      <h3>{equipo.nombre}</h3>
                      <p>Solicita tu cupo en este equipo.</p>
                    </div>
                    <button className="action-button ghost" type="button" disabled>
                      Solicitar ingreso
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        )}

        {activeTab === 'perfil' && (
          <article className="ds-panel">
            <header className="panel-header">
              <h2>Mi perfil</h2>
              <p>Resumen de tu participación y rendimiento en el torneo.</p>
            </header>

            {errorPerfil && <p className="banner banner-error">{errorPerfil}</p>}
            {loadingPerfil ? (
              <p className="empty-state">Cargando tu perfil…</p>
            ) : perfil ? (
              <div className="perfil-stack">
                <div className="perfil-summary">
                  <div>
                    <h3>{perfil.nombre || nombre}</h3>
                    <p className="mono">{perfil.cedula || '—'}</p>
                  </div>
                  <div className="perfil-metric">
                    <span>Partidos</span>
                    <strong>{perfil?.resumen?.partidosJugados ?? 0}</strong>
                  </div>
                  <div className="perfil-metric">
                    <span>Goles</span>
                    <strong>{perfil?.resumen?.goles ?? 0}</strong>
                  </div>
                  <div className="perfil-metric">
                    <span>Tarjetas</span>
                    <strong>
                      {(perfil?.resumen?.tarjetas?.amarillas ?? 0)
                        + (perfil?.resumen?.tarjetas?.azules ?? 0)
                        + (perfil?.resumen?.tarjetas?.rojas ?? 0)}
                    </strong>
                  </div>
                </div>

                <div className="perfil-block">
                  <h4>Equipos donde has jugado</h4>
                  {perfil?.equipos?.length ? (
                    <ul>
                      {perfil.equipos.map((item, idx) => (
                        <li key={`${item.nombre || item.id}-${idx}`}>
                          {item.nombre || item.id}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Aún no hay equipos registrados.</p>
                  )}
                </div>

                <div className="perfil-block">
                  <h4>Titulos</h4>
                  {perfil?.titulos?.length ? (
                    <ul>
                      {perfil.titulos.map((item, idx) => (
                        <li key={`${item.torneo || item.equipo}-${idx}`}>
                          {item.torneo || 'Torneo'} · {item.equipo || 'Equipo'} · {item.puesto || '—'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Aún no hay titulos registrados.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="empty-state">No hay datos de perfil todavía.</p>
            )}
          </article>
        )}
      </section>
    </main>
  );
}

export default JugadorDashboard;
