import { useCallback, useEffect, useMemo, useState } from 'react';
import { listInscripcionesDelegado } from '../../api/supercopa';
import { getMisComprobantes, solicitarUploadUrl, subirComprobante } from '../../api/finanzas';
import { getToken } from '../../utils/session';
import { inscripcionesSubibles, comprobanteDeInscripcion } from '../../utils/pagos';

const ESTADO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EXPULSADO: 'Descalificado',
};

const ESTADO_COMP_LABEL = {
  PENDIENTE_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

function formatoMonto(monto) {
  return Number(monto).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

function PagosTab({ toast }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inscData, compData] = await Promise.all([
        listInscripcionesDelegado(getToken()),
        getMisComprobantes(getToken()),
      ]);
      setInscripciones(Array.isArray(inscData) ? inscData : []);
      setComprobantes(Array.isArray(compData) ? compData : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar tus inscripciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Inscripciones a las que se puede subir comprobante = opciones del selector.
  const subibles = useMemo(
    () => inscripcionesSubibles(inscripciones),
    [inscripciones],
  );

  // Mantener seleccionada una opción válida: si la actual ya no es subible
  // (p. ej. acabamos de subir y pasó a "en revisión"), saltar a la primera disponible.
  useEffect(() => {
    if (subibles.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!subibles.some((i) => i.id === selectedId)) {
      setSelectedId(subibles[0].id);
    }
  }, [subibles, selectedId]);

  const selected = subibles.find((i) => i.id === selectedId) ?? null;
  const selectedComp = selected ? comprobanteDeInscripcion(comprobantes, selected.id) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!file) { setError('Selecciona un archivo de comprobante.'); return; }

    setUploading(true);
    setError('');
    setFeedback('');
    try {
      const { uploadUrl, fileKey } = await solicitarUploadUrl(
        { equipoTorneoId: selected.id },
        getToken(),
      );

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          // Sobrescribe el archivo en la clave determinista (sin duplicados en Storage).
          'x-upsert': 'true',
        },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Error al subir el archivo.');

      await subirComprobante(
        { tipo: 'INSCRIPCION', referenciaId: selected.id, urlArchivo: fileKey },
        getToken(),
      );

      setFile(null);
      setFeedback('Comprobante enviado. El administrador lo revisará pronto.');
      toast?.('Comprobante enviado para revisión');
      await load();
    } catch (err) {
      setError(err?.message || 'Error al enviar el comprobante.');
    } finally {
      setUploading(false);
    }
  };

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
          {subibles.length === 0 ? (
            <p className="empty-state">No tienes pagos pendientes por ahora.</p>
          ) : (
            <form className="dg-payment-form" onSubmit={handleSubmit}>
              <div className="dg-section-label">Cargar comprobante de pago</div>

              <div className="dg-pay-field">
                <label className="dg-pay-label" htmlFor="torneo-select">Torneo a pagar</label>
                <div className="dg-pay-select-wrap">
                  <select
                    id="torneo-select"
                    className="dg-pay-select"
                    value={selected?.id ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {subibles.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.torneoNombre}
                        {i.montoInscripcion != null ? ` — $${formatoMonto(i.montoInscripcion)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selected && (
                <div className="dg-pay-summary">
                  {selected.montoInscripcion != null && (
                    <div className="dg-payment-status-amount">
                      $<em>{formatoMonto(selected.montoInscripcion)}</em>
                    </div>
                  )}
                  <div className="dg-payment-status-detail">
                    {selected.torneoNombre}
                    {selected.fechaInscripcion ? ` · inscrito el ${selected.fechaInscripcion.slice(0, 10)}` : ''}
                  </div>
                </div>
              )}

                {selectedComp?.estado === 'PENDIENTE_REVISION' && (
                  <p className="banner banner-success" style={{ margin: '1rem 0' }}>
                    Ya enviaste un comprobante y está <strong>en revisión</strong>.
                    {' '}Si te equivocaste, sube otro para reemplazarlo.
                  </p>
                )}

                {selectedComp?.estado === 'RECHAZADO' && (
                  <p className="banner banner-error" style={{ margin: '1rem 0' }}>
                    Tu comprobante anterior fue rechazado.
                    {selectedComp.motivoRechazo && <> Motivo: {selectedComp.motivoRechazo}.</>}
                    {' '}Sube uno nuevo.
                  </p>
                )}

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

                <button type="submit" className="dg-form-submit" disabled={uploading || !file || !selected}>
                  {uploading
                    ? 'Enviando…'
                    : selectedComp
                      ? 'Reemplazar comprobante'
                      : 'Enviar pago para revisión'}
                </button>
            </form>
          )}

          <div className="dg-section-label">Historial de pagos</div>
          <div className="dg-payment-history">
            {inscripciones.map((i) => {
              const comp = comprobanteDeInscripcion(comprobantes, i.id);
              return (
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
                      <div className="dg-payment-row-sub" style={{ color: 'var(--color-error)' }}>
                        Motivo: {i.motivoRechazo}
                      </div>
                    )}
                    {comp && i.estadoInscripcion === 'PENDIENTE_PAGO' && (
                      <div className="dg-payment-row-sub">
                        Comprobante: {ESTADO_COMP_LABEL[comp.estado] || comp.estado}
                      </div>
                    )}
                  </div>
                  {i.montoInscripcion != null && (
                    <div className="dg-payment-row-amount">
                      ${formatoMonto(i.montoInscripcion)}
                    </div>
                  )}
                  <span className={`dg-payment-row-chip ${chipClass(i.estadoInscripcion)}`}>
                    {ESTADO_LABEL[i.estadoInscripcion] || i.estadoInscripcion}
                  </span>
                </div>
              );
            })}
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
