import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { getJugadorByCedula } from '../api/jugadores';
import { aprobarSolicitud, listSolicitudesPendientes, rechazarSolicitud } from '../api/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getEmail, getNombre, getToken } from '../utils/session';
import '../styles/admin.css';
import '../styles/role-shell.css';

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

function DelegadoDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Delegado';
  const email = getEmail() || '';
  const token = getToken();

  const [cedula, setCedula] = useState('');
  const [jugador, setJugador] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState('');
  const [feedbackSolicitudes, setFeedbackSolicitudes] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [rechazo, setRechazo] = useState({ open: false, id: null, nombre: '', motivo: '' });

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!cedula.trim()) return;
    setLoading(true);
    setError('');
    setJugador(null);
    try {
      const data = await getJugadorByCedula(cedula.trim(), token);
      setJugador(data);
    } catch (err) {
      setError(err?.message || 'No fue posible obtener el jugador.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSolicitudes = useCallback(async () => {
    setLoadingSolicitudes(true);
    setErrorSolicitudes('');
    setFeedbackSolicitudes('');
    try {
      const data = await listSolicitudesPendientes(token);
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorSolicitudes(err?.message || 'No fue posible cargar las solicitudes.');
    } finally {
      setLoadingSolicitudes(false);
    }
  }, [token]);

  useEffect(() => {
    refreshSolicitudes();
  }, [refreshSolicitudes]);

  const handleAprobarSolicitud = async (solicitud) => {
    setActioningId(solicitud.id);
    setErrorSolicitudes('');
    setFeedbackSolicitudes('');
    try {
      await aprobarSolicitud(solicitud.id, token);
      setSolicitudes((prev) => prev.filter((item) => item.id !== solicitud.id));
      setFeedbackSolicitudes(`Solicitud de ${solicitud.nombre || solicitud.cedula} aprobada.`);
    } catch (err) {
      setErrorSolicitudes(err?.message || 'No fue posible aprobar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const openRechazo = (solicitud) => {
    setRechazo({
      open: true,
      id: solicitud.id,
      nombre: solicitud.nombre || solicitud.cedula || 'Jugador',
      motivo: '',
    });
  };

  const handleRechazarSolicitud = async () => {
    if (!rechazo.motivo.trim()) {
      setErrorSolicitudes('Indica un motivo para el rechazo.');
      return;
    }
    setActioningId(rechazo.id);
    setErrorSolicitudes('');
    setFeedbackSolicitudes('');
    try {
      await rechazarSolicitud(rechazo.id, rechazo.motivo.trim(), token);
      setSolicitudes((prev) => prev.filter((item) => item.id !== rechazo.id));
      setFeedbackSolicitudes(`Solicitud de ${rechazo.nombre} rechazada.`);
      setRechazo({ open: false, id: null, nombre: '', motivo: '' });
    } catch (err) {
      setErrorSolicitudes(err?.message || 'No fue posible rechazar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <main className="role-shell">
      <header className="role-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de delegado</p>
          </div>
        </div>
        <div className="role-user">
          <div className="role-user-info">
            <p className="user-name">{nombre}</p>
            <small className="user-email">{email}</small>
          </div>
          <button className="logout-btn" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="role-content">
        <article className="ds-panel welcome-panel">
          <p className="role-tag">DELEGADO</p>
          <h1>Hola, {nombre.split(' ')[0]}</h1>
          <p>Aquí podrás verificar elegibilidad de jugadores y, en próximos sprints, gestionar tu equipo, pagos y cronograma.</p>
        </article>

        <article className="ds-panel">
          <header className="panel-header">
            <h2>Verificar jugador</h2>
            <p>Consulta por cédula a la base oficial de la facultad para confirmar elegibilidad.</p>
          </header>

          <form className="inline-search" onSubmit={handleSearch}>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 1090000001"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
            />
            <button className="action-button primary" type="submit" disabled={loading}>
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {error && <p className="banner banner-error">{error}</p>}

          {jugador && (
            <div className="player-card">
              <header className="player-card-header">
                <span className={`role-pill role-${(jugador.rolJugador || '').toLowerCase()}`}>
                  {jugador.rolJugador || '—'}
                </span>
                <span className={`status-pill ${jugador.activo ? 'on' : 'off'}`}>
                  {jugador.activo ? 'Activo' : 'Inactivo'}
                </span>
              </header>
              <h3 className="player-name">{jugador.nombre || '—'}</h3>
              <dl className="player-grid">
                <div><dt>Cédula</dt><dd className="mono">{jugador.cedula || '—'}</dd></div>
                <div><dt>Código universitario</dt><dd>{jugador.codigoUniversitario || '—'}</dd></div>
                <div><dt>Semestre</dt><dd>{jugador.semestre ?? '—'}</dd></div>
              </dl>
            </div>
          )}
        </article>

        <article className="ds-panel">
          <header className="panel-header">
            <h2>Solicitudes de jugadores</h2>
            <p>Gestiona las solicitudes pendientes para tus equipos.</p>
          </header>

          <div className="metric-row">
            <article className="metric-card">
              <p className="metric-label">Pendientes</p>
              <p className="metric-value">{solicitudes.length}</p>
              <p className="metric-hint">Esperan tu aprobacion</p>
            </article>
            <button
              type="button"
              className="action-button ghost"
              onClick={refreshSolicitudes}
              disabled={loadingSolicitudes}
            >
              {loadingSolicitudes ? 'Actualizando…' : 'Refrescar'}
            </button>
          </div>

          {feedbackSolicitudes && <p className="banner banner-success">{feedbackSolicitudes}</p>}
          {errorSolicitudes && <p className="banner banner-error">{errorSolicitudes}</p>}

          {loadingSolicitudes ? (
            <p className="empty-state">Cargando solicitudes…</p>
          ) : solicitudes.length === 0 ? (
            <p className="empty-state">No hay solicitudes pendientes en este momento.</p>
          ) : (
            <div className="table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Cedula</th>
                    <th>Equipo</th>
                    <th>Torneo</th>
                    <th>Fecha</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.nombre || '—'}</td>
                      <td className="mono">{solicitud.cedula || '—'}</td>
                      <td>{solicitud.equipoNombre || '—'}</td>
                      <td>{solicitud.torneoNombre || '—'}</td>
                      <td className="muted">{formatFecha(solicitud.fechaSolicitud)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="action-button approve"
                          disabled={actioningId === solicitud.id}
                          onClick={() => handleAprobarSolicitud(solicitud)}
                        >
                          {actioningId === solicitud.id ? '…' : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          className="action-button reject"
                          disabled={actioningId === solicitud.id}
                          onClick={() => openRechazo(solicitud)}
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="ds-panel placeholder">
          <h2>Funcionalidades en construcción</h2>
          <p>Mi Equipo, Pagos y Cronograma se habilitan en próximos sprints. La consulta de jugadores ya está operativa contra el backend.</p>
        </article>
      </section>

      {rechazo.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Rechazar solicitud</h3>
            <p>Vas a rechazar la solicitud de <strong>{rechazo.nombre}</strong>.</p>
            <label className="form-label" htmlFor="motivo-rechazo">Motivo</label>
            <textarea
              id="motivo-rechazo"
              className="form-input"
              rows={4}
              value={rechazo.motivo}
              onChange={(e) => setRechazo((prev) => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ej: datos invalidos o cupo completo."
            />
            <div className="modal-actions">
              <button
                type="button"
                className="action-button ghost"
                onClick={() => setRechazo({ open: false, id: null, nombre: '', motivo: '' })}
                disabled={actioningId === rechazo.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="action-button reject"
                onClick={handleRechazarSolicitud}
                disabled={actioningId === rechazo.id}
              >
                {actioningId === rechazo.id ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default DelegadoDashboard;
