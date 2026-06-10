import { useCallback, useEffect, useState } from 'react';
import { listInscripcionesDelegado } from '../../api/supercopa';
import { getMisComprobantes, solicitarUploadUrl, subirComprobante } from '../../api/finanzas';
import { getToken } from '../../utils/session';

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

function PagosTab({ toast }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
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

  const pendientes = inscripciones.filter((i) => i.estadoInscripcion === 'PENDIENTE_PAGO');

  const handleSubmitPayment = async (inscripcionId) => {
    const file = files[inscripcionId];
    if (!file) { setError('Selecciona un archivo de comprobante.'); return; }

    setUploadingId(inscripcionId);
    setError('');
    setFeedback('');
    try {
      const { uploadUrl, fileKey } = await solicitarUploadUrl(
        { equipoTorneoId: inscripcionId },
        getToken(),
      );

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Error al subir el archivo.');

      await subirComprobante(
        { tipo: 'INSCRIPCION', referenciaId: inscripcionId, urlArchivo: fileKey },
        getToken(),
      );

      setFiles((prev) => ({ ...prev, [inscripcionId]: null }));
      setFeedback('Comprobante enviado. El administrador lo revisará pronto.');
      toast?.('Comprobante enviado para revisión');
      await load();
    } catch (err) {
      setError(err?.message || 'Error al enviar el comprobante.');
    } finally {
      setUploadingId(null);
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
          {pendientes.map((insc) => {
            const comp = comprobantes.find((c) => c.referenciaId === insc.id);
            const canUpload = !comp || comp.estado === 'RECHAZADO';
            const isUploading = uploadingId === insc.id;
            const selectedFile = files[insc.id] ?? null;

            return (
              <div key={insc.id}>
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
                  {insc.montoInscripcion != null && (
                    <div className="dg-payment-status-amount">
                      $<em>{Number(insc.montoInscripcion).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</em>
                    </div>
                  )}
                  <div className="dg-payment-status-detail">
                    Inscripción {insc.torneoNombre} · {insc.fechaInscripcion?.slice(0, 10)}
                  </div>
                </div>

                {comp?.estado === 'PENDIENTE_REVISION' && (
                  <p className="banner banner-success" style={{ margin: '1rem 0' }}>
                    Tu comprobante está <strong>en revisión</strong>. El administrador lo revisará pronto.
                  </p>
                )}

                {comp?.estado === 'RECHAZADO' && (
                  <p className="banner banner-error" style={{ margin: '1rem 0' }}>
                    Comprobante rechazado.
                    {comp.motivoRechazo && <> Motivo: {comp.motivoRechazo}.</>}
                    {' '}Sube uno nuevo.
                  </p>
                )}

                {canUpload && (
                  <>
                    <div className="dg-section-label">Cargar comprobante</div>
                    <form
                      className="dg-payment-form"
                      onSubmit={(e) => { e.preventDefault(); handleSubmitPayment(insc.id); }}
                    >
                      <label className="dg-file-drop">
                        <div className="dg-file-drop-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div className="dg-file-drop-label">
                          {selectedFile ? selectedFile.name : 'Arrastra el archivo o haz clic'}
                        </div>
                        <div className="dg-file-drop-sub">PDF, JPG o PNG · Máx 5MB</div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => setFiles((prev) => ({ ...prev, [insc.id]: e.target.files?.[0] || null }))}
                        />
                      </label>
                      <button type="submit" className="dg-form-submit" disabled={isUploading || !selectedFile}>
                        {isUploading ? 'Enviando…' : 'Enviar pago para revisión'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            );
          })}

          <div className="dg-section-label">Historial de pagos</div>
          <div className="dg-payment-history">
            {inscripciones.map((i) => {
              const comp = comprobantes.find((c) => c.referenciaId === i.id);
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
                    {comp && (
                      <div className="dg-payment-row-sub">
                        Comprobante: {ESTADO_COMP_LABEL[comp.estado] || comp.estado}
                      </div>
                    )}
                  </div>
                  {i.montoInscripcion != null && (
                    <div className="dg-payment-row-amount">
                      ${Number(i.montoInscripcion).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
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
