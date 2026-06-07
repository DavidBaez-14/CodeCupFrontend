import { useCallback, useEffect, useState } from 'react';
import {
  aprobarInscripcion,
  expulsarEquipo,
  habilitarInscripcion,
  listInscripcionesTorneo,
  listTorneosAdmin,
  rechazarInscripcion,
} from '../../api/supercopa';
import { getToken } from '../../utils/session';

const ESTADO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EXPULSADO: 'Expulsado',
};

function GestionarEquiposView() {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [rechazo, setRechazo] = useState({ open: false, eqtId: null, equipoNombre: '', motivo: '' });
  const [expulsion, setExpulsion] = useState({ open: false, eqtId: null, equipoNombre: '', motivo: '' });

  useEffect(() => {
    listTorneosAdmin(getToken())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTorneos(list);
        if (list.length && !torneoId) setTorneoId(list[0].id);
      })
      .catch((err) => setError(err?.message || 'No fue posible cargar torneos.'));
  }, [torneoId]);

  const loadInscripciones = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    setError('');
    setFeedback('');
    try {
      const data = await listInscripcionesTorneo(torneoId, getToken());
      setInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las inscripciones.');
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => { loadInscripciones(); }, [loadInscripciones]);

  const handleAprobar = async (insc) => {
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await aprobarInscripcion(insc.torneoId, insc.id, getToken());
      setFeedback(`Inscripción de "${insc.equipoNombre}" aprobada.`);
      await loadInscripciones();
    } catch (err) {
      setError(err?.message || 'No fue posible aprobar la inscripción.');
    } finally {
      setActioningId(null);
    }
  };

  const openRechazo = (insc) => {
    setRechazo({ open: true, eqtId: insc.id, equipoNombre: insc.equipoNombre, motivo: '' });
  };

  const confirmarRechazo = async () => {
    const insc = inscripciones.find((i) => i.id === rechazo.eqtId);
    if (!insc) return;
    if (!rechazo.motivo.trim()) {
      setError('Indica un motivo para el rechazo.');
      return;
    }
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await rechazarInscripcion(insc.torneoId, insc.id, rechazo.motivo.trim(), getToken());
      setFeedback(`Inscripción de "${insc.equipoNombre}" rechazada.`);
      setRechazo({ open: false, eqtId: null, equipoNombre: '', motivo: '' });
      await loadInscripciones();
    } catch (err) {
      setError(err?.message || 'No fue posible rechazar la inscripción.');
    } finally {
      setActioningId(null);
    }
  };

  const handleHabilitar = async (insc) => {
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await habilitarInscripcion(insc.torneoId, insc.id, getToken());
      setFeedback(`Inscripción de "${insc.equipoNombre}" habilitada. Vuelve a pendiente de pago.`);
      await loadInscripciones();
    } catch (err) {
      setError(err?.message || 'No fue posible habilitar la inscripción.');
    } finally {
      setActioningId(null);
    }
  };

  const openExpulsion = (insc) => {
    setExpulsion({ open: true, eqtId: insc.id, equipoNombre: insc.equipoNombre, motivo: '' });
  };

  const confirmarExpulsion = async () => {
    const insc = inscripciones.find((i) => i.id === expulsion.eqtId);
    if (!insc) return;
    if (!expulsion.motivo.trim()) {
      setError('Indica un motivo para la expulsión.');
      return;
    }
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await expulsarEquipo(insc.torneoId, insc.id, expulsion.motivo.trim(), getToken());
      setFeedback(`"${insc.equipoNombre}" expulsado del torneo.`);
      setExpulsion({ open: false, eqtId: null, equipoNombre: '', motivo: '' });
      await loadInscripciones();
    } catch (err) {
      setError(err?.message || 'No fue posible expulsar al equipo.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Gestionar inscripciones</h2>
          <p>Aprueba o rechaza las inscripciones de equipos a cada torneo. El estado <em>Aprobado</em> se setea automáticamente cuando el delegado paga.</p>
        </header>

        <div className="inline-search">
          <label className="form-label" htmlFor="torneo-select">Torneo:</label>
          <select
            id="torneo-select"
            className="form-input"
            value={torneoId}
            onChange={(e) => setTorneoId(e.target.value)}
          >
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.estado})
              </option>
            ))}
          </select>
          <button type="button" className="action-button ghost" onClick={loadInscripciones} disabled={loading}>
            {loading ? 'Refrescando…' : 'Refrescar'}
          </button>
        </div>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando inscripciones…</p>
        ) : inscripciones.length === 0 ? (
          <p className="empty-state">Aún no hay inscripciones para este torneo.</p>
        ) : (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Delegado</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((insc) => (
                  <tr key={insc.id}>
                    <td>{insc.equipoNombre}</td>
                    <td className="mono">{insc.delegadoCedula}</td>
                    <td>
                      <span className={`status-pill estado-${(insc.estadoInscripcion || '').toLowerCase()}`}>
                        {ESTADO_LABEL[insc.estadoInscripcion] || insc.estadoInscripcion}
                      </span>
                    </td>
                    <td className="muted">
                      {insc.fechaInscripcion
                        ? new Date(insc.fechaInscripcion).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                        : '—'}
                    </td>
                    <td className="muted">
                      {insc.estadoInscripcion === 'EXPULSADO'
                        ? (insc.motivoExpulsion ? `Expulsión: ${insc.motivoExpulsion}` : '—')
                        : (insc.motivoRechazo || '—')}
                    </td>
                    <td className="actions-cell">
                      {insc.estadoInscripcion === 'PENDIENTE_PAGO' && (
                        <>
                          <button
                            type="button"
                            className="action-button approve"
                            disabled={actioningId === insc.id}
                            onClick={() => handleAprobar(insc)}
                          >
                            {actioningId === insc.id ? '…' : 'Aprobar'}
                          </button>
                          <button
                            type="button"
                            className="action-button reject"
                            disabled={actioningId === insc.id}
                            onClick={() => openRechazo(insc)}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {insc.estadoInscripcion === 'RECHAZADO' && (
                        <button
                          type="button"
                          className="action-button warning"
                          disabled={actioningId === insc.id}
                          onClick={() => handleHabilitar(insc)}
                        >
                          {actioningId === insc.id ? '…' : 'Habilitar'}
                        </button>
                      )}
                      {insc.estadoInscripcion === 'APROBADO' && (
                        <button
                          type="button"
                          className="action-button reject"
                          disabled={actioningId === insc.id}
                          onClick={() => openExpulsion(insc)}
                        >
                          Expulsar
                        </button>
                      )}
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
            <h3>Rechazar inscripción</h3>
            <p>Vas a rechazar la inscripción de <strong>{rechazo.equipoNombre}</strong>.</p>
            <label className="form-label" htmlFor="motivo-rechazo-eqt">Motivo</label>
            <textarea
              id="motivo-rechazo-eqt"
              className="form-input"
              rows={4}
              value={rechazo.motivo}
              onChange={(e) => setRechazo((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej: documentación incompleta."
            />
            <div className="modal-actions">
              <button
                type="button"
                className="action-button ghost"
                onClick={() => setRechazo({ open: false, eqtId: null, equipoNombre: '', motivo: '' })}
                disabled={actioningId === rechazo.eqtId}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="action-button reject"
                onClick={confirmarRechazo}
                disabled={actioningId === rechazo.eqtId}
              >
                {actioningId === rechazo.eqtId ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {expulsion.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Expulsar equipo del torneo</h3>
            <p>
              Vas a expulsar a <strong>{expulsion.equipoNombre}</strong>. El motivo se mostrará al
              delegado en la pestaña <em>Torneos</em>. Esta acción es irreversible.
            </p>
            <label className="form-label" htmlFor="motivo-expulsion-eqt">Motivo</label>
            <textarea
              id="motivo-expulsion-eqt"
              className="form-input"
              rows={4}
              value={expulsion.motivo}
              onChange={(e) => setExpulsion((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej: agresiones al árbitro, incumplimiento del reglamento."
            />
            <div className="modal-actions">
              <button
                type="button"
                className="action-button ghost"
                onClick={() => setExpulsion({ open: false, eqtId: null, equipoNombre: '', motivo: '' })}
                disabled={actioningId === expulsion.eqtId}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="action-button reject"
                onClick={confirmarExpulsion}
                disabled={actioningId === expulsion.eqtId}
              >
                {actioningId === expulsion.eqtId ? 'Expulsando…' : 'Confirmar expulsión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionarEquiposView;
