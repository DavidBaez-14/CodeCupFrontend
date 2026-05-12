import { useCallback, useEffect, useState } from 'react';
import { aprobarSolicitud, listSolicitudesPendientes, rechazarSolicitud } from '../../api/supercopa';
import { getToken } from '../../utils/session';

function formatFecha(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function formatLabel(value) {
  if (!value) return '—';
  const text = String(value).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatAltura(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `${value} cm`;
}

function SolicitudesTab() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [rechazo, setRechazo] = useState({ open: false, id: null, nombre: '', motivo: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSolicitudesPendientes(getToken());
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAprobar = async (s) => {
    setActioningId(s.id);
    setError('');
    setFeedback('');
    try {
      await aprobarSolicitud(s.id, getToken());
      setSolicitudes((prev) => prev.filter((x) => x.id !== s.id));
      setFeedback(`Solicitud de ${s.nombre || s.cedula} aprobada.`);
    } catch (err) {
      setError(err?.message || 'No fue posible aprobar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const openRechazo = (s) => {
    setRechazo({ open: true, id: s.id, nombre: s.nombre || s.cedula, motivo: '' });
  };

  const confirmarRechazo = async () => {
    if (!rechazo.motivo.trim()) {
      setError('Indica un motivo para el rechazo.');
      return;
    }
    setActioningId(rechazo.id);
    setError('');
    setFeedback('');
    try {
      await rechazarSolicitud(rechazo.id, rechazo.motivo.trim(), getToken());
      setSolicitudes((prev) => prev.filter((x) => x.id !== rechazo.id));
      setFeedback(`Solicitud de ${rechazo.nombre} rechazada.`);
      setRechazo({ open: false, id: null, nombre: '', motivo: '' });
    } catch (err) {
      setError(err?.message || 'No fue posible rechazar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Solicitudes pendientes</h2>
          <p>Aprueba o rechaza las solicitudes de jugadores que quieren unirse a tu equipo.</p>
        </header>

        <div className="metric-row">
          <article className="metric-card">
            <p className="metric-label">Pendientes</p>
            <p className="metric-value">{solicitudes.length}</p>
            <p className="metric-hint">Esperan tu aprobación</p>
          </article>
          <button type="button" className="action-button ghost" onClick={load} disabled={loading}>
            {loading ? 'Actualizando…' : 'Refrescar'}
          </button>
        </div>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <p className="empty-state">No hay solicitudes pendientes.</p>
        ) : (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Cédula</th>
                  <th>Posición</th>
                  <th>Pierna hábil</th>
                  <th>Altura</th>
                  <th>Equipo</th>
                  <th>Torneo</th>
                  <th>Fecha</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nombre || '—'}</td>
                    <td className="mono">{s.cedula || '—'}</td>
                    <td>{formatLabel(s.posicion)}</td>
                    <td>{formatLabel(s.piernaHabil)}</td>
                    <td>{formatAltura(s.alturaCm)}</td>
                    <td>{s.equipoNombre || '—'}</td>
                    <td>{s.torneoNombre || '—'}</td>
                    <td className="muted">{formatFecha(s.fechaSolicitud)}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="action-button approve"
                        disabled={actioningId === s.id}
                        onClick={() => handleAprobar(s)}
                      >
                        {actioningId === s.id ? '…' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        className="action-button reject"
                        disabled={actioningId === s.id}
                        onClick={() => openRechazo(s)}
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

      {rechazo.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Rechazar solicitud</h3>
            <p>Vas a rechazar la solicitud de <strong>{rechazo.nombre}</strong>.</p>
            <label className="form-label" htmlFor="motivo-sol-rechazo">Motivo</label>
            <textarea
              id="motivo-sol-rechazo"
              className="form-input"
              rows={4}
              value={rechazo.motivo}
              onChange={(e) => setRechazo((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej: datos inválidos o cupo completo."
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
                onClick={confirmarRechazo}
                disabled={actioningId === rechazo.id}
              >
                {actioningId === rechazo.id ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SolicitudesTab;
