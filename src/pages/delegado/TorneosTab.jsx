import { useCallback, useEffect, useState } from 'react';
import { inscribirEquipo, listTorneosDisponibles } from '../../api/supercopa';
import { getToken } from '../../utils/session';

const ESTADO_INSC = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', cls: 'pending' },
  APROBADO: { label: 'Aprobado', cls: 'paid' },
  RECHAZADO: { label: 'Rechazado', cls: 'rejected' },
};

function TorneosTab({ tieneEquipo, onInscripcion }) {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listTorneosDisponibles(getToken());
      setTorneos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar los torneos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInscribir = async (torneo) => {
    if (!tieneEquipo) {
      setError('Primero crea tu equipo en la pestaña “Mi Equipo”.');
      return;
    }
    setActioningId(torneo.id);
    setError('');
    setFeedback('');
    try {
      await inscribirEquipo(torneo.id, getToken());
      setFeedback(`Te inscribiste en "${torneo.nombre}". Inscripción quedará en PENDIENTE_PAGO.`);
      await load();
      onInscripcion?.();
    } catch (err) {
      setError(err?.message || 'No fue posible inscribirse.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Torneos disponibles</h2>
          <p>Inscribe tu equipo en un torneo publicado. La inscripción queda <em>PENDIENTE_PAGO</em> hasta que cargues el pago en la pestaña Pagos.</p>
        </header>

        {!tieneEquipo && (
          <p className="banner banner-warning">
            Aún no tienes equipo. Crea el tuyo en la pestaña <strong>Mi Equipo</strong> antes de inscribirte.
          </p>
        )}

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando torneos…</p>
        ) : torneos.length === 0 ? (
          <p className="empty-state">No hay torneos publicados en este momento.</p>
        ) : (
          <div className="torneo-list">
            {torneos.map((t) => {
              const inscrito = t.inscrito;
              const estado = inscrito && ESTADO_INSC[t.estadoInscripcion];
              return (
                <div key={t.id} className={`tournament-card ${inscrito ? 'inscribed' : ''}`}>
                  <div className="tc-info">
                    <div className="tc-title">{t.nombre}</div>
                    <div className="tc-meta">
                      <span>Edición {t.edicion}</span>
                      {t.fechaInicio && <><span className="sep"></span><span>{t.fechaInicio} → {t.fechaFin || '—'}</span></>}
                      <span className="sep"></span>
                      <span>{t.estado}</span>
                    </div>
                  </div>
                  <div className="tc-cta">
                    {inscrito ? (
                      <span className={`tc-status-chip ${estado?.cls || 'pending'}`}>{estado?.label || t.estadoInscripcion}</span>
                    ) : (
                      <button
                        type="button"
                        className="tc-btn"
                        onClick={() => handleInscribir(t)}
                        disabled={actioningId === t.id || !tieneEquipo}
                      >
                        {actioningId === t.id ? '…' : 'Inscribirme'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

export default TorneosTab;
