import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import PerfilDeportivoGuard from '../components/PerfilDeportivoGuard';
import RoleHeaderActions from '../components/RoleHeaderActions';
import {
  actualizarMiPerfil,
  getMiPerfil,
  getMisSolicitudes,
  listEquiposPorTorneo,
  listTorneos,
  solicitarIngreso,
} from '../api/supercopa';
import {
  ALTURA_MAX,
  ALTURA_MIN,
  PIERNAS,
  POSICIONES,
} from '../constants/perfilDeportivo';
import { TEAM_COLORS } from '../data/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getNombre, getToken } from '../utils/session';
import '../styles/admin.css';
import '../styles/role-shell.css';
import '../styles/jugador.css';
import '../styles/admin-torneo.css';

const TABS = [
  { id: 'equipo', label: 'Equipo' },
  { id: 'perfil', label: 'Perfil' },
];

function JugadorDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Jugador';
  const token = getToken();

  const [activeTab, setActiveTab] = useState('equipo');

  // Equipo tab
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [solicitudMsg, setSolicitudMsg] = useState('');
  const [solicitandoId, setSolicitandoId] = useState(null);
  const [errorSolicitud, setErrorSolicitud] = useState('');
  // map: equipoTorneoId -> estado ('PENDIENTE' | 'APROBADA' | 'RECHAZADA')
  const [estadosSolicitud, setEstadosSolicitud] = useState({});

  // Perfil tab
  const [perfil, setPerfil] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [perfilForm, setPerfilForm] = useState({ alturaCm: '', piernaHabil: 'DERECHA', posicion: 'MEDIOCAMPISTA' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState('');
  const [perfilErrorEdit, setPerfilErrorEdit] = useState('');

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  // Cargar torneos (publicados o en curso)
  useEffect(() => {
    let alive = true;
    setLoadingTorneos(true);
    listTorneos(token)
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        const elegibles = list.filter((t) => t.estado === 'PUBLICADO' || t.estado === 'EN_CURSO');
        setTorneos(elegibles);
        if (elegibles.length && !torneoId) setTorneoId(elegibles[0].id);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingTorneos(false); });
    return () => { alive = false; };
  }, [token, torneoId]);

  // Cargar equipos del torneo seleccionado
  const loadEquipos = useCallback(async () => {
    if (!torneoId) { setEquipos([]); return; }
    setLoadingEquipos(true);
    setErrorEquipos('');
    try {
      const data = await listEquiposPorTorneo(torneoId, token);
      setEquipos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorEquipos(err?.message || 'No fue posible cargar los equipos.');
      setEquipos([]);
    } finally {
      setLoadingEquipos(false);
    }
  }, [torneoId, token]);

  useEffect(() => { loadEquipos(); }, [loadEquipos]);

  // Mis solicitudes -> mapa por equipoTorneoId
  useEffect(() => {
    let alive = true;
    getMisSolicitudes(token)
      .then((data) => {
        if (!alive || !Array.isArray(data)) return;
        const map = {};
        for (const s of data) {
          if (s.equipoTorneoId) map[String(s.equipoTorneoId)] = s.estado;
        }
        setEstadosSolicitud(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [token]);

  // El perfil deportivo (altura/pierna/posicion) ya se captura una sola vez
  // via PerfilDeportivoGuard al entrar al dashboard; aqui solo enviamos el
  // equipoTorneoId, sin modal intermedio.
  const handleSolicitar = async (equipo) => {
    setSolicitudMsg('');
    setErrorSolicitud('');
    setSolicitandoId(equipo.equipoTorneoId);
    try {
      await solicitarIngreso({ equipoTorneoId: equipo.equipoTorneoId }, token);
      setEstadosSolicitud((prev) => ({ ...prev, [String(equipo.equipoTorneoId)]: 'PENDIENTE' }));
      setSolicitudMsg(`Solicitud enviada para "${equipo.equipoNombre}". Espera aprobación del delegado.`);
    } catch (err) {
      setErrorSolicitud(err?.message || 'No fue posible enviar la solicitud.');
    } finally {
      setSolicitandoId(null);
    }
  };

  // Perfil
  useEffect(() => {
    let alive = true;
    setLoadingPerfil(true);
    getMiPerfil(token)
      .then((data) => {
        if (!alive) return;
        setPerfil(data || null);
        if (data) {
          setPerfilForm({
            alturaCm: data.alturaCm != null ? String(data.alturaCm) : '',
            piernaHabil: data.piernaHabil || 'DERECHA',
            posicion: data.posicion || 'MEDIOCAMPISTA',
          });
        }
      })
      .catch((err) => { if (alive) setErrorPerfil(err?.message || 'No fue posible cargar tu perfil.'); })
      .finally(() => { if (alive) setLoadingPerfil(false); });
    return () => { alive = false; };
  }, [token, activeTab]);

  const handleGuardarPerfil = async (event) => {
    event.preventDefault();
    setPerfilMsg('');
    setPerfilErrorEdit('');
    const altura = Number(perfilForm.alturaCm);
    if (!Number.isFinite(altura) || altura < ALTURA_MIN || altura > ALTURA_MAX) {
      setPerfilErrorEdit(`Altura debe estar entre ${ALTURA_MIN} y ${ALTURA_MAX} cm.`);
      return;
    }
    setGuardandoPerfil(true);
    try {
      const actualizado = await actualizarMiPerfil({
        alturaCm: altura,
        piernaHabil: perfilForm.piernaHabil,
        posicion: perfilForm.posicion,
      }, token);
      setPerfil(actualizado);
      setPerfilMsg('Perfil deportivo actualizado.');
    } catch (err) {
      setPerfilErrorEdit(err?.message || 'No fue posible actualizar el perfil.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  return (
    <PerfilDeportivoGuard>
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
              <h2>Unirme a un equipo</h2>
              <p>Selecciona un torneo y solicita ingreso a un equipo inscrito.</p>
            </header>

            <div className="equipo-filter-bar">
              <div className="equipo-filter-field">
                <label className="form-label" htmlFor="torneo-jug">Torneo</label>
                <select
                  id="torneo-jug"
                  className="form-input"
                  value={torneoId}
                  onChange={(e) => setTorneoId(e.target.value)}
                  disabled={loadingTorneos || torneos.length === 0}
                >
                  {torneos.length === 0 ? (
                    <option value="">— Sin torneos disponibles —</option>
                  ) : (
                    torneos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
                    ))
                  )}
                </select>
              </div>
              <button type="button" className="action-button ghost" onClick={loadEquipos} disabled={loadingEquipos}>
                {loadingEquipos ? 'Refrescando…' : 'Refrescar'}
              </button>
            </div>

            {errorEquipos && <p className="banner banner-error">{errorEquipos}</p>}
            {errorSolicitud && <p className="banner banner-error">{errorSolicitud}</p>}
            {solicitudMsg && <p className="banner banner-success">{solicitudMsg}</p>}

            {loadingEquipos ? (
              <p className="empty-state">Cargando equipos…</p>
            ) : equipos.length === 0 ? (
              <p className="empty-state">Aún no hay equipos inscritos en este torneo.</p>
            ) : (
              <div className="equipo-grid">
                {equipos.map((eq) => {
                  const estado = estadosSolicitud[String(eq.equipoTorneoId)];
                  const locked = estado === 'PENDIENTE' || estado === 'APROBADA';
                  const enviandoEste = solicitandoId === eq.equipoTorneoId;

                  const btnLabel = enviandoEste ? 'Enviando…'
                    : estado === 'APROBADA' ? '✓ Aprobado'
                    : estado === 'PENDIENTE' ? '⏳ Pendiente'
                    : estado === 'RECHAZADA' ? 'Reintentar'
                    : 'Solicitar ingreso';
                  const subtext = estado === 'APROBADA' ? 'Eres miembro de este equipo.'
                    : estado === 'PENDIENTE' ? 'Solicitud pendiente de aprobación.'
                    : estado === 'RECHAZADA' ? 'Tu solicitud fue rechazada. Puedes reintentar.'
                    : `${eq.miembros ?? 0} miembro(s) · estado ${eq.estadoInscripcion}`;
                  const btnStyle = estado === 'APROBADA'
                    ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' }
                    : estado === 'PENDIENTE'
                    ? { borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }
                    : estado === 'RECHAZADA'
                    ? { borderColor: 'var(--color-error)', color: 'var(--color-error)' }
                    : {};

                  return (
                    <div key={eq.equipoTorneoId} className="equipo-card">
                      <div className="equipo-card-top">
                        <span
                          className="equipo-dot"
                          style={{ backgroundColor: TEAM_COLORS[eq.equipoNombre] || '#3d4f80' }}
                          aria-hidden="true"
                        />
                        <h3 className="equipo-card-nombre">{eq.equipoNombre}</h3>
                      </div>
                      <p className="equipo-card-sub">{subtext}</p>
                      <button
                        className="action-button ghost equipo-card-btn"
                        type="button"
                        style={btnStyle}
                        disabled={locked || enviandoEste}
                        onClick={() => handleSolicitar(eq)}
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
                <form onSubmit={handleGuardarPerfil} className="perfil-block">
                  <h4>Datos deportivos</h4>
                  <div className="form-row">
                    <label className="form-field">
                      <span className="form-label">Altura (cm)</span>
                      <input
                        type="number"
                        min={ALTURA_MIN}
                        max={ALTURA_MAX}
                        className="form-input"
                        value={perfilForm.alturaCm}
                        onChange={(e) => setPerfilForm((p) => ({ ...p, alturaCm: e.target.value }))}
                        required
                      />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Pierna hábil</span>
                      <select
                        className="form-input"
                        value={perfilForm.piernaHabil}
                        onChange={(e) => setPerfilForm((p) => ({ ...p, piernaHabil: e.target.value }))}
                      >
                        {PIERNAS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span className="form-label">Posición</span>
                      <select
                        className="form-input"
                        value={perfilForm.posicion}
                        onChange={(e) => setPerfilForm((p) => ({ ...p, posicion: e.target.value }))}
                      >
                        {POSICIONES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {perfilErrorEdit && <p className="banner banner-error">{perfilErrorEdit}</p>}
                  {perfilMsg && <p className="banner banner-success">{perfilMsg}</p>}
                  <div className="modal-actions">
                    <button type="submit" className="action-button primary" disabled={guardandoPerfil}>
                      {guardandoPerfil ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>

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
                          <span className="perfil-equipo-nombre">
                            {item.nombre}
                            {item.torneo && <small className="muted"> · {item.torneo}</small>}
                          </span>
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
    </PerfilDeportivoGuard>
  );
}

export default JugadorDashboard;
