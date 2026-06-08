import { useCallback, useEffect, useState } from 'react';
import { listInscripcionesDelegado, pagarInscripcion } from '../../api/supercopa';
import { getToken } from '../../utils/session';

const PAYMENT_METHODS = [
  'Transferencia bancaria',
  'Nequi',
  'Daviplata',
  'Efectivo',
];

const ESTADO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EXPULSADO: 'Descalificado',
};

function PagosTab({ toast }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);

  // Payment form
  const [amount, setAmount] = useState('150.000');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [ref, setRef] = useState('');
  const [file, setFile] = useState(null);

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
    if (!window.confirm(`Confirmar pago (mock) por la inscripción a "${insc.torneoNombre}"?`)) return;
    setActioningId(insc.id);
    setError('');
    setFeedback('');
    try {
      await pagarInscripcion(insc.id, getToken());
      toast?.(`Pago registrado · ${insc.torneoNombre}`);
      setFeedback(`Pago registrado. Inscripción a "${insc.torneoNombre}" pasó a APROBADO.`);
      await load();
    } catch (err) {
      setError(err?.message || 'No fue posible registrar el pago.');
    } finally {
      setActioningId(null);
    }
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    toast?.('Pago enviado para revisión (mock)');
  };

  const pendiente = inscripciones.find((i) => i.estadoInscripcion === 'PENDIENTE_PAGO');

  return (
    <div className="dg-panel dg-panel-animated">
      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="empty-state">Cargando inscripciones…</p>
      ) : inscripciones.length === 0 ? (
        <p className="empty-state">Aún no tienes inscripciones. Inscríbete a un torneo en la pestaña Torneos.</p>
      ) : (
        <>
          {/* Payment status card */}
          {pendiente ? (
            <div className="dg-payment-status-card pending">
              <div className="dg-payment-status-row">
                <div className="dg-payment-status-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="dg-payment-status-label">Estado actual</div>
                  <div className="dg-payment-status-title">Pendiente de pago</div>
                </div>
              </div>
              <div className="dg-payment-status-amount">$<em>150.000</em></div>
              <div className="dg-payment-status-detail">
                Inscripción {pendiente.torneoNombre} · {pendiente.fechaInscripcion?.slice(0, 10)}
              </div>
            </div>
          ) : null}

          {/* Payment form */}
          <div className="dg-section-label">Cargar comprobante</div>
          <form className="dg-payment-form" onSubmit={handleSubmitPayment}>
            <div className="dg-form-grid">
              <div className="dg-form-field">
                <label className="dg-form-label">Monto</label>
                <input
                  type="text"
                  className="dg-form-input"
                  placeholder="150.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="dg-form-field">
                <label className="dg-form-label">Fecha de pago</label>
                <input
                  type="date"
                  className="dg-form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="dg-form-field">
                <label className="dg-form-label">Método</label>
                <select
                  className="dg-form-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="dg-form-field">
                <label className="dg-form-label">N° de transacción</label>
                <input
                  type="text"
                  className="dg-form-input"
                  placeholder="Ej: TRX-9384721"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </div>
              <div className="dg-form-field full">
                <label className="dg-form-label">Comprobante</label>
                <label className="dg-file-drop">
                  <div className="dg-file-drop-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="dg-file-drop-label">
                    {file ? file.name : 'Arrastra el archivo o haz clic'}
                  </div>
                  <div className="dg-file-drop-sub">PDF, JPG o PNG · Máx 5MB</div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
            <button type="submit" className="dg-form-submit">Enviar pago para revisión</button>
          </form>

          {/* Payment history */}
          <div className="dg-section-label">Historial de pagos</div>
          <div className="dg-payment-history">
            {inscripciones.map((i) => (
              <div key={i.id} className="dg-payment-row">
                <div className={`dg-payment-row-icon ${i.estadoInscripcion === 'APROBADO' ? 'paid' : 'pending'}`}>
                  {i.estadoInscripcion === 'APROBADO' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="dg-payment-row-title">{i.torneoNombre}</div>
                  <div className="dg-payment-row-sub">
                    Equipo: {i.equipoNombre} · {i.fechaInscripcion?.slice(0, 10)}
                  </div>
                  {i.estadoInscripcion === 'RECHAZADO' && i.motivoRechazo && (
                    <div className="dg-payment-row-sub" style={{ color: 'var(--color-error)' }}>Motivo: {i.motivoRechazo}</div>
                  )}
                </div>
                <div className="dg-payment-row-amount">$150.000</div>
                <span className={`dg-payment-row-chip ${chipClass(i.estadoInscripcion)}`}>
                  {ESTADO_LABEL[i.estadoInscripcion] || i.estadoInscripcion}
                </span>
                {i.estadoInscripcion === 'PENDIENTE_PAGO' && (
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={() => handlePagar(i)}
                    disabled={actioningId === i.id}
                    style={{ marginLeft: 8 }}
                  >
                    {actioningId === i.id ? 'Pagando…' : 'Pagar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function chipClass(estado) {
  if (estado === 'APROBADO') return 'paid';
  if (estado === 'PENDIENTE_PAGO') return 'pending';
  if (estado === 'EXPULSADO') return 'expelled';
  return 'rejected';
}

export default PagosTab;
