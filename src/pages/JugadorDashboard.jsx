import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import RoleHeaderActions from '../components/RoleHeaderActions';
import { getMiPerfil, getMisSolicitudes, listEquipos, listTorneos, solicitarIngreso } from '../api/supercopa';
import { TEAM_COLORS } from '../data/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getNombre, getToken } from '../utils/session';
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
  const token = getToken();

  const [activeTab, setActiveTab] = useState('equipo');
  const [equipos, setEquipos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [errorPerfil, setErrorPerfil] = useState('');
  const [solicitudMsg, setSolicitudMsg] = useState('');
  const [solicitudando, setSolicitudando] = useState(null);
  // { [equipoId]: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' }
  const [estadosSolicitud, setEstadosSolicitud] = useState({});

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
    listTorneos(token)
      .then((data) => { if (alive && Array.isArray(data)) setTorneos(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    let alive = true;
    getMisSolicitudes(token)
      .then((data) => {
        if (!alive || !Array.isArray(data)) return;
        const map = {};
        data.forEach((s) => { map[String(s.equipoId)] = s.estado; });
        setEstadosSolicitud(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [token]);

  const handleSolicitar = async (equipo) => {
    const torneoId = torneos[0]?.id;
    if (!torneoId) {
      setSolicitudMsg('No hay torneos disponibles.');
      return;
    }
    setSolicitudando(equipo.id);
    setSolicitudMsg('');
    try {
      await solicitarIngreso(String(equipo.id), torneoId, token);
      setEstadosSolicitud((prev) => ({ ...prev, [String(equipo.id)]: 'PENDIENTE' }));
      setSolicitudMsg(`Solicitud enviada para ${equipo.nombre}. Espera aprobación del delegado.`);
    } catch (err) {
      setSolicitudMsg(err?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSolicitudando(null);
    }
  };

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
          <RoleHeaderActions allowRoleRequest />
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
            {solicitudMsg && (
              <p className={`banner ${solicitudMsg.startsWith('Solicitud enviada') ? 'banner-success' : 'banner-error'}`}>
                {solicitudMsg}
              </p>
            )}
            {loadingEquipos ? (
              <p className="empty-state">Cargando equipos…</p>
            ) : (
              <div className="equipo-grid">
                {equipos.map((equipo) => {
                  const estado = estadosSolicitud[String(equipo.id)];
                  const sending = solicitudando === equipo.id;
                  const locked = estado === 'PENDIENTE' || estado === 'APROBADA';

                  const btnLabel = sending ? 'Enviando…'
                    : estado === 'APROBADA'  ? '✓ Aprobado'
                    : estado === 'PENDIENTE' ? '⏳ Pendiente'
                    : estado === 'RECHAZADA' ? 'Reintentar'
                    : 'Solicitar ingreso';

                  const subtext = estado === 'APROBADA'  ? 'Eres miembro de este equipo.'
                    : estado === 'PENDIENTE' ? 'Solicitud pendiente de aprobación.'
                    : estado === 'RECHAZADA' ? 'Tu solicitud fue rechazada.'
                    : 'Solicita tu cupo en este equipo.';

                  const btnStyle = estado === 'APROBADA'
                    ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' }
                    : estado === 'PENDIENTE'
                    ? { borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }
                    : estado === 'RECHAZADA'
                    ? { borderColor: 'var(--color-error)', color: 'var(--color-error)' }
                    : {};

                  return (
                    <div key={equipo.id} className="equipo-card">
                      <span
                        className="equipo-dot"
                        style={{ backgroundColor: TEAM_COLORS[equipo.nombre] || '#3d4f80' }}
                        aria-hidden="true"
                      />
                      <div className="equipo-info">
                        <h3>{equipo.nombre}</h3>
                        <p>{subtext}</p>
                      </div>
                      <button
                        className="action-button ghost"
                        type="button"
                        style={btnStyle}
                        disabled={sending || locked}
                        onClick={() => handleSolicitar(equipo)}
                      >
                        {btnLabel}
                      </button>
                    </div>
                  );
                })}
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

                {/* Resumen de estadísticas */}
                <div className="perfil-summary">
                  <div>
                    <h3>{perfil.nombre || nombre}</h3>
                    <p className="mono">{perfil.cedula || '—'}</p>
                  </div>
                  <div className="perfil-metric">
                    <span>Partidos</span>
                    <strong>{perfil?.resumen?.partidosJugados ?? 0}</strong>
                  </div>
                  <div className="perfil-metric goles">
                    <span>Goles</span>
                    <strong>{perfil?.resumen?.goles ?? 0}</strong>
                  </div>
                  <div className="perfil-metric amarilla">
                    <span>Amarillas</span>
                    <strong>{perfil?.resumen?.tarjetas?.amarillas ?? 0}</strong>
                  </div>
                  <div className="perfil-metric azul">
                    <span>Azules</span>
                    <strong>{perfil?.resumen?.tarjetas?.azules ?? 0}</strong>
                  </div>
                  <div className="perfil-metric roja">
                    <span>Rojas</span>
                    <strong>{perfil?.resumen?.tarjetas?.rojas ?? 0}</strong>
                  </div>
                  <div className="perfil-metric titulos">
                    <span>Títulos</span>
                    <strong>{perfil?.resumen?.titulos ?? 0}</strong>
                  </div>
                </div>

                {/* Equipos donde ha jugado */}
                <div className="perfil-block">
                  <h4>Equipos donde ha jugado</h4>
                  {perfil?.equipos?.length ? (
                    <div>
                      {perfil.equipos.map((item, idx) => (
                        <div key={`${item.id || item.nombre}-${idx}`} className="perfil-equipo-row">
                          <span
                            className="equipo-dot"
                            style={{ backgroundColor: TEAM_COLORS[item.nombre] || '#3d4f80' }}
                            aria-hidden="true"
                          />
                          <span className="perfil-equipo-nombre">{item.nombre}</span>
                          <span className="perfil-equipo-fecha">
                            {item.desde ?? '—'} → {item.hasta ?? 'Actual'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Aún no hay equipos registrados.</p>
                  )}
                </div>

                {/* Títulos obtenidos */}
                {perfil?.titulos?.length > 0 && (
                  <div className="perfil-block">
                    <h4>Títulos obtenidos</h4>
                    <div>
                      {perfil.titulos.map((item, idx) => (
                        <div key={`${item.torneo}-${idx}`} className="perfil-equipo-row">
                          <span className="perfil-equipo-nombre">{item.torneo}</span>
                          <span className="perfil-equipo-fecha">{item.equipo}</span>
                          <span className={`puesto-badge ${item.puesto?.toLowerCase()}`}>
                            {item.puesto}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historial de partidos */}
                <div className="perfil-block">
                  <h4>Partidos jugados</h4>
                  {perfil?.partidos?.length ? (
                    <div className="perfil-partidos-list">
                      {perfil.partidos.map((p, idx) => (
                        <div key={p.id || idx} className="perfil-partido-row">
                          <span className="partido-fecha">
                            {p.fecha
                              ? new Date(p.fecha).toLocaleDateString('es-CO', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })
                              : '—'}
                          </span>
                          <div className="partido-equipos">
                            <span>{p.equipo}</span>
                            <span className="partido-rival"> vs </span>
                            <span>{p.rival}</span>
                          </div>
                          <span className="partido-goles">{p.goles ?? 0} ⚽</span>
                          {p.tarjetas?.length > 0 && (
                            <div className="partido-tarjetas">
                              {p.tarjetas.map((t, ti) => (
                                <span
                                  key={ti}
                                  className={`tarjeta-badge ${t.toLowerCase()}`}
                                  title={t}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Aún no hay partidos registrados.</p>
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
