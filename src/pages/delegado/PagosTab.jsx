import { useCallback, useEffect, useState } from 'react';
import { listInscripcionesDelegado, pagarInscripcion } from '../../api/supercopa';
import { getToken } from '../../utils/session';

const ESTADO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EXPULSADO: 'Descalificado',
};

function chipClass(estado) {
  if (estado === 'APROBADO') return 'paid';
  if (estado === 'PENDIENTE_PAGO') return 'pending';
  if (estado === 'EXPULSADO') return 'expelled';
  return 'rejected';
}

function PagosTab() {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listInscripcionesDelegado(getToken());
      setInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar tus inscripciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePagar = async (insc) => {
    if (!confirm(`Confirmar pago (mock) por la inscripción a "${insc.torneoNombre}"?`)) return;
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await pagarInscripcion(insc.id, getToken());
      setFeedback(`Pago registrado. Inscripción a "${insc.torneoNombre}" pasó a APROBADO.`);
      await load();
    } catch (err) {
      setError(err?.message || 'No fue posible registrar el pago.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Pagos de inscripción</h2>
          <p>Confirma el pago de cada inscripción (proceso mock). El estado de tu equipo pasará a <em>APROBADO</em>.</p>
        </header>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando inscripciones…</p>
        ) : inscripciones.length === 0 ? (
          <p className="empty-state">Aún no tienes inscripciones. Inscríbete a un torneo en la pestaña Torneos.</p>
        ) : (
          <div className="payment-history">
            {inscripciones.map((i) => {
              const esPendiente = i.estadoInscripcion === 'PENDIENTE_PAGO';
              const esAprobado = i.estadoInscripcion === 'APROBADO';
              const esRechazado = i.estadoInscripcion === 'RECHAZADO';
              return (
                <div key={i.id} className="payment-row">
                  <div className={`payment-row-icon ${esAprobado ? 'paid' : 'pending'}`}>
                    {esAprobado ? '✓' : '⏳'}
                  </div>
                  <div>
                    <div className="payment-row-title">{i.torneoNombre}</div>
                    <div className="payment-row-sub">
                      Equipo: {i.equipoNombre} · {i.fechaInscripcion?.slice(0, 10)}
                    </div>
                    {esRechazado && i.motivoRechazo && (
                      <div className="payment-row-sub muted">Motivo: {i.motivoRechazo}</div>
                    )}
                  </div>
                  <span className={`payment-row-chip ${chipClass(i.estadoInscripcion)}`}>
                    {ESTADO_LABEL[i.estadoInscripcion] || i.estadoInscripcion}
                  </span>
                  {esPendiente ? (
                    <button
                      type="button"
                      className="action-button primary"
                      onClick={() => handlePagar(i)}
                      disabled={actioningId === i.id}
                    >
                      {actioningId === i.id ? 'Pagando…' : 'Pagar'}
                    </button>
                  ) : (
                    <span className="muted" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

export default PagosTab;
