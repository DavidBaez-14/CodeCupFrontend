import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import RoleHeaderActions from '../components/RoleHeaderActions';
import { aprobarRol, aprobarTodosCuenta, listPendientes, rechazarRol, rechazarTodosCuenta } from '../api/registros';
import { cerrarSesion } from '../lib/supabase';
import { getEmail, getNombre, getToken } from '../utils/session';
import ConfigurarTorneoView from './admin/ConfigurarTorneoView';
import GestionarEquiposView from './admin/GestionarEquiposView';
import FixtureView from './admin/FixtureView';
import UsuariosView from './admin/UsuariosView';
import '../styles/admin.css';
import '../styles/admin-torneo.css';

// Spec 0018 (W3/W4) y 0027: sin padrón no hay "Cargar jugadores CSV" (el CSV vuelve en M5 como
// informe), y "Buscar jugador" vive en Usuarios, que busca por documento, nombre o correo.
const SIDEBAR_GROUPS = [
  {
    title: 'Identidad',
    items: [
      { id: 'pendientes', label: 'Solicitudes pendientes', live: true },
      { id: 'usuarios', label: 'Usuarios', live: true },
    ],
  },
  {
    title: 'Torneo',
    items: [
      { id: 'torneo', label: 'Configurar torneo', live: true },
      { id: 'equipos', label: 'Gestionar equipos', live: true },
      { id: 'fixture', label: 'Fixture y cronograma', live: true },
    ],
  },
];

const VIEW_LABEL = {
  pendientes: 'Solicitudes pendientes',
  usuarios: 'Usuarios',
  torneo: 'Configurar torneo',
  equipos: 'Gestionar equipos',
  fixture: 'Fixture y cronograma',
};

const LIVE_VIEWS = ['pendientes', 'usuarios', 'torneo', 'equipos', 'fixture'];

const ROL_LABEL = {
  ARBITRO: 'Árbitro',
  DELEGADO: 'Delegado',
  ADMINISTRADOR: 'Administrador',
  JUGADOR: 'Jugador',
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  PENDIENTE_VALIDACION: 'Validación manual',
};

function formatFecha(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('pendientes');
  const nombre = getNombre() || 'Administrador';
  const email = getEmail() || '';

  const handleLogout = async () => {
    await cerrarSesion();
    navigate('/');
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar-v2">
        <div className="admin-brand-v2">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de administrador</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_GROUPS.map((group) => (
            <section key={group.title}>
              <p className="sidebar-group">{group.title}</p>
              <div className="sidebar-items">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <span className="sidebar-bullet" aria-hidden="true" />
                    <span>{item.label}</span>
                    {!item.live && <span className="sidebar-tag">próx.</span>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{nombre.slice(0, 1).toUpperCase()}</div>
          <div className="user-meta">
            <p className="user-name">{nombre}</p>
            <small className="user-email">{email || 'admin@codecup.local'}</small>
          </div>
        </div>
        <button className="logout-btn" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="crumb">Dashboard / Identidad</p>
            <h1>{VIEW_LABEL[activeView] || 'Módulo en construcción'}</h1>
          </div>
          <RoleHeaderActions allowRoleRequest={false} />
        </header>

        {activeView === 'pendientes' && <PendientesView />}
        {activeView === 'usuarios' && <UsuariosView />}
        {activeView === 'torneo' && <ConfigurarTorneoView />}
        {activeView === 'equipos' && <GestionarEquiposView />}
        {activeView === 'fixture' && <FixtureView />}
        {!LIVE_VIEWS.includes(activeView) && <PlaceholderView />}
      </section>
    </main>
  );
}

// Orden estable de pills cuando una cuenta tiene varios roles pendientes.
const ROL_ORDEN = { DELEGADO: 0, JUGADOR: 1, ARBITRO: 2, ADMINISTRADOR: 3 };

function PendientesView() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  // perfilId: null cuando el rechazo es del grupo completo (cuentaId).
  const [rechazo, setRechazo] = useState({
    open: false,
    cuentaId: null,
    perfilId: null,
    nombre: '',
    motivo: '',
  });
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPendientes(getToken());
      setRegistros(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las solicitudes pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupamos solicitudes por cuenta para mostrar una sola fila aunque traiga
  // varios roles pendientes (caso: pidió DELEGADO y el backend creó también JUGADOR).
  const grupos = useMemo(() => {
    const map = new Map();
    for (const r of registros) {
      const key = r.cuentaId || `solo:${r.id}`;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, solicitudes]) => {
      const ordenadas = [...solicitudes].sort((a, b) => {
        const oa = ROL_ORDEN[a.rol] ?? 99;
        const ob = ROL_ORDEN[b.rol] ?? 99;
        return oa - ob;
      });
      const cabecera = ordenadas[0];
      return {
        key,
        cuentaId: cabecera.cuentaId || null,
        cabecera,
        solicitudes: ordenadas,
        total: ordenadas.length,
        motivoSolicitud: ordenadas.find((s) => s.motivoSolicitud)?.motivoSolicitud,
        fechaSolicitud: cabecera.fechaSolicitud,
      };
    });
  }, [registros]);

  const handleAprobarGrupo = async (grupo) => {
    const actionKey = grupo.cuentaId || grupo.cabecera.id;
    setActioningId(actionKey);
    setError('');
    setFeedback('');
    try {
      if (grupo.total > 1 && grupo.cuentaId) {
        await aprobarTodosCuenta(grupo.cuentaId, getToken());
        setFeedback(`Todos los roles de ${grupo.cabecera.nombre || grupo.cabecera.correo} aprobados.`);
        setRegistros((prev) => prev.filter((r) => r.cuentaId !== grupo.cuentaId));
      } else {
        await aprobarRol(grupo.cabecera.id, getToken());
        setFeedback(`Solicitud de ${grupo.cabecera.nombre || grupo.cabecera.correo} aprobada.`);
        setRegistros((prev) => prev.filter((r) => r.id !== grupo.cabecera.id));
      }
    } catch (err) {
      setError(err?.message || 'No fue posible aprobar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const openRechazo = (grupo) => {
    setRechazo({
      open: true,
      cuentaId: grupo.total > 1 ? grupo.cuentaId : null,
      perfilId: grupo.total > 1 ? null : grupo.cabecera.id,
      nombre: grupo.cabecera.nombre || grupo.cabecera.correo,
      motivo: '',
    });
  };

  const handleRechazar = async () => {
    if (!rechazo.motivo.trim()) {
      setError('Indica un motivo para el rechazo.');
      return;
    }
    const actionKey = rechazo.cuentaId || rechazo.perfilId;
    setActioningId(actionKey);
    setError('');
    setFeedback('');
    try {
      if (rechazo.cuentaId) {
        await rechazarTodosCuenta(rechazo.cuentaId, rechazo.motivo.trim(), getToken());
        setFeedback(`Solicitudes de ${rechazo.nombre} rechazadas.`);
        setRegistros((prev) => prev.filter((r) => r.cuentaId !== rechazo.cuentaId));
      } else {
        await rechazarRol(rechazo.perfilId, rechazo.motivo.trim(), getToken());
        setFeedback(`Solicitud de ${rechazo.nombre} rechazada.`);
        setRegistros((prev) => prev.filter((r) => r.id !== rechazo.perfilId));
      }
      setRechazo({ open: false, cuentaId: null, perfilId: null, nombre: '', motivo: '' });
    } catch (err) {
      setError(err?.message || 'No fue posible rechazar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <div className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Pendientes</p>
          <p className="metric-value">{grupos.length}</p>
          <p className="metric-hint">Esperan tu aprobación</p>
        </article>
        <article className="metric-card metric-secondary">
          <p className="metric-label">Acción</p>
          <p className="metric-value-sm">Aprobar / Rechazar</p>
          <p className="metric-hint">Aprobar agrega el rol a la cuenta. Rechazar no borra la cuenta ni sus otros roles.</p>
        </article>
        <button type="button" className="action-button ghost" onClick={load} disabled={loading}>
          {loading ? 'Actualizando…' : 'Refrescar'}
        </button>
      </div>

      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <article className="ds-panel">
        <header className="panel-header">
          <h2>Solicitudes en cola</h2>
          <p>Tabla con todos los registros con estado <strong>PENDIENTE</strong>.</p>
        </header>

        {loading ? (
          <p className="empty-state">Cargando solicitudes…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">No hay solicitudes pendientes en este momento.</p>
        ) : (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => {
                  const actionKey = grupo.cuentaId || grupo.cabecera.id;
                  const ocupado = actioningId === actionKey;
                  return (
                    <tr key={grupo.key}>
                      <td>
                        <div>{grupo.cabecera.nombre || '—'}</div>
                        {grupo.motivoSolicitud && (
                          <small className="muted" title={grupo.motivoSolicitud}>
                            “{grupo.motivoSolicitud}”
                          </small>
                        )}
                      </td>
                      <td>{grupo.cabecera.correo || '—'}</td>
                      <td className="mono">{grupo.cabecera.numeroDocumento || 'Sin documento'}</td>
                      <td>
                        <div className="role-pill-stack">
                          {grupo.solicitudes.map((s) => (
                            <span key={s.id} className={`role-pill role-${(s.rol || '').toLowerCase()}`}>
                              {ROL_LABEL[s.rol] || s.rol || '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="role-pill-stack">
                          {grupo.solicitudes.map((s) => (
                            <span key={s.id} className={`role-pill role-${(s.estado || '').toLowerCase()}`}>
                              {ESTADO_LABEL[s.estado] || s.estado || '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="muted">{formatFecha(grupo.fechaSolicitud)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="action-button approve"
                          disabled={ocupado}
                          onClick={() => handleAprobarGrupo(grupo)}
                          title={grupo.total > 1
                            ? 'Aprueba todos los roles solicitados por esta cuenta'
                            : undefined}
                        >
                          {ocupado
                            ? '…'
                            : grupo.total > 1
                              ? `Aprobar ${grupo.total} roles`
                              : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          className="action-button reject"
                          disabled={ocupado}
                          onClick={() => openRechazo(grupo)}
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {rechazo.open && (() => {
        const rechazoActionKey = rechazo.cuentaId || rechazo.perfilId;
        const ocupado = actioningId === rechazoActionKey;
        const esGrupo = !!rechazo.cuentaId;
        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h3>Rechazar solicitud</h3>
              <p>
                Vas a rechazar {esGrupo ? 'todas las solicitudes' : 'la solicitud'} de <strong>{rechazo.nombre}</strong>.
                La cuenta no se elimina; si la persona tiene otros roles aprobados, los conserva.
              </p>
              <label className="form-label" htmlFor="motivo-rechazo">Motivo</label>
              <textarea
                id="motivo-rechazo"
                className="form-input"
                rows={4}
                value={rechazo.motivo}
                onChange={(e) => setRechazo((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ej: no pertenece a ningún equipo inscrito."
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={() => setRechazo({ open: false, cuentaId: null, perfilId: null, nombre: '', motivo: '' })}
                  disabled={ocupado}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="action-button reject"
                  onClick={handleRechazar}
                  disabled={ocupado}
                >
                  {ocupado ? 'Rechazando…' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function PlaceholderView() {
  return (
    <article className="ds-panel placeholder">
      <h2>Módulo en construcción</h2>
      <p>Esta sección ya tiene su lugar en la navegación. Su funcionalidad se libera en próximos sprints, sin afectar lo ya operativo.</p>
    </article>
  );
}

export default AdminDashboard;
