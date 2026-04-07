import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJugadorByCedula } from '../api/jugadores';
import { clearSession, getNombre, getToken } from '../utils/session';
import '../styles/dashboard.css';

const TABS = [
  { key: 'mi-equipo', label: 'Mi Equipo', icon: '🛡' },
  { key: 'jugadores', label: 'Jugadores', icon: '👥' },
  { key: 'pagos', label: 'Pagos', icon: '💳' },
  { key: 'cronograma', label: 'Cronograma', icon: '📅' },
  { key: 'perfil', label: 'Mi Perfil', icon: '👤' },
];

const RECENT_SEARCHES_KEY = 'delegado_jugadores_recent';

function loadRecentJugadores() {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecentJugadores(items) {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures and keep runtime state only.
  }
}

function matchesNombreOCedula(jugador, buscar) {
  const query = buscar.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const nombre = (jugador?.nombre || '').toLowerCase();
  const cedula = String(jugador?.cedula || '').toLowerCase();
  return nombre.includes(query) || cedula.includes(query);
}

function isCedulaQuery(value) {
  return /^\d+$/.test(value.trim());
}

function DelegadoDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jugadores');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jugador, setJugador] = useState(null);
  const [recentJugadores, setRecentJugadores] = useState(loadRecentJugadores);
  const [nameMatches, setNameMatches] = useState([]);

  const consultasActivas = useMemo(
    () => recentJugadores.filter((item) => item?.activo).length,
    [recentJugadores],
  );

  const rolesUnicos = useMemo(() => {
    const labels = recentJugadores
      .map((item) => item?.rolJugador)
      .filter(Boolean);
    return new Set(labels).size;
  }, [recentJugadores]);

  const handleSaveRecent = (jugadorData) => {
    setRecentJugadores((prev) => {
      const withoutCurrent = prev.filter((item) => item.cedula !== jugadorData.cedula);
      const next = [jugadorData, ...withoutCurrent].slice(0, 10);
      persistRecentJugadores(next);
      return next;
    });
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const searchValue = query.trim();
    if (!searchValue) {
      setError('Escribe una cedula o nombre para buscar.');
      return;
    }

    setError('');
    setJugador(null);
    setNameMatches([]);

    if (!isCedulaQuery(searchValue)) {
      const filtered = recentJugadores.filter((item) => matchesNombreOCedula(item, searchValue));
      setNameMatches(filtered);

      if (!filtered.length) {
        setError('No hay coincidencias por nombre en consultas recientes. Consulta primero por cedula para ampliar la lista.');
      } else {
        setJugador(filtered[0]);
      }

      return;
    }

    setLoading(true);

    try {
      const data = await getJugadorByCedula(searchValue, getToken());
      setJugador(data);
      setNameMatches([data]);
      handleSaveRecent(data);
    } catch (requestError) {
      setError(requestError.message || 'No fue posible consultar la cedula.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (item) => {
    setQuery(item.nombre || String(item.cedula || ''));
    setJugador(item);
    setNameMatches([item]);
    setError('');
  };

  return (
    <main className="delegado-layout delegado-layout-v2">
      <header className="delegado-topbar delegado-topbar-v2">
        <div className="delegado-brand-wrap">
          <p className="delegado-brand">CODE-CUP</p>
          <small>Panel del delegado</small>
        </div>
        <nav className="delegado-tabs" aria-label="Navegacion delegado">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`delegado-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="delegado-user-area">
          <span>{getNombre() || 'Delegado'}</span>
          <button className="nav-button danger" type="button" onClick={handleLogout}>Cerrar sesion</button>
        </div>
      </header>

      <section className="page delegado-content delegado-content-v2">
        <section className="delegado-kpi-grid" aria-label="Resumen de actividad">
          <article className="delegado-kpi-card">
            <p>Consultas guardadas</p>
            <strong>{recentJugadores.length}</strong>
          </article>
          <article className="delegado-kpi-card">
            <p>Jugadores activos</p>
            <strong>{consultasActivas}</strong>
          </article>
          <article className="delegado-kpi-card delegado-kpi-accent">
            <p>Roles detectados</p>
            <strong>{rolesUnicos}</strong>
          </article>
        </section>

        {activeTab === 'jugadores' ? (
          <section className="delegado-jugadores-grid">
            <article className="panel-card delegado-player-card delegado-search-card">
              <h2>Busqueda por cedula o nombre</h2>
              <p className="delegado-card-subtitle">
                Busca por cedula exacta o por nombre dentro de consultas recientes, usando la misma regla de coincidencia nombre/cedula del dashboard admin.
              </p>

              <form className="panel-form" onSubmit={handleSearch}>
                <label htmlFor="jugador-busqueda">Nombre o cedula</label>
                <input
                  id="jugador-busqueda"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej: 1098765432 o Daniel"
                  required
                />
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar jugador'}
                </button>
              </form>

              {recentJugadores.length ? (
                <div className="delegado-recent-wrap">
                  <p>Consultas recientes</p>
                  <div className="delegado-recent-chips">
                    {recentJugadores.slice(0, 6).map((item) => (
                      <button
                        key={item.cedula}
                        type="button"
                        className="delegado-recent-chip"
                        onClick={() => handleQuickSelect(item)}
                      >
                        {item.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {nameMatches.length > 1 ? (
                <div className="delegado-match-list">
                  {nameMatches.map((item) => (
                    <button
                      key={`match-${item.cedula}`}
                      type="button"
                      className="delegado-match-item"
                      onClick={() => handleQuickSelect(item)}
                    >
                      <strong>{item.nombre}</strong>
                      <small>{item.cedula}</small>
                    </button>
                  ))}
                </div>
              ) : null}

              {error ? <p className="error-text">{error}</p> : null}
            </article>

            <article className="panel-card delegado-player-card delegado-result-card">
              <h2>Ficha del jugador</h2>
              <p className="delegado-card-subtitle">Resultado seleccionado</p>

              {jugador ? (
                <div className="player-result player-result-v2">
                  <span className={`player-role role-${(jugador.rolJugador || '').toLowerCase()}`}>{jugador.rolJugador}</span>
                  <h3>{jugador.nombre}</h3>
                  <div className="delegado-result-grid">
                    <p><strong>Cedula:</strong> {jugador.cedula}</p>
                    <p><strong>Semestre:</strong> {jugador.semestre ?? 'No aplica'}</p>
                    <p><strong>Codigo:</strong> {jugador.codigoUniversitario ?? 'No aplica'}</p>
                    <p><strong>Estado:</strong> {jugador.activo ? 'Activo' : 'Inactivo'}</p>
                  </div>
                </div>
              ) : (
                <div className="delegado-empty-result">
                  <p>Sin resultados aun</p>
                  <small>Realiza una busqueda para visualizar la ficha del jugador.</small>
                </div>
              )}
            </article>
          </section>
        ) : (
          <article className="panel-card placeholder-module delegado-placeholder">
            <p className="placeholder-icon">📌</p>
            <h2>{TABS.find((tab) => tab.key === activeTab)?.label}</h2>
            <p>Modulo dinamico en preparacion para Sprint 2.</p>
          </article>
        )}
      </section>
    </main>
  );
}

export default DelegadoDashboard;
