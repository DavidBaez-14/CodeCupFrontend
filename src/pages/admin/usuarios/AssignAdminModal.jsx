import { useEffect, useState } from 'react';

function AssignAdminModal({ open, cuenta, onClose, onSubmit }) {
  const [motivo, setMotivo] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMotivo('');
      setConfirmText('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const confirmed = confirmText === 'CONFIRMAR';

  const handleSubmit = async () => {
    setError('');
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await onSubmit({ cedula: cuenta.cedula, rol: 'ADMINISTRADOR', motivo: motivo.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || 'No fue posible otorgar el rol.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true">
      <div className="u-modal danger">
        <div className="u-modal-header">
          <div className="u-modal-icon danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">Otorgar Administrador</div>
            <div className="u-modal-subtitle">Esta acción crea otro super-usuario.</div>
          </div>
          <button className="u-modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="u-modal-body">
          <div className="u-callout danger">
            <div className="u-callout-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <strong>Atención.</strong> El usuario podrá crear/eliminar cuentas, configurar torneos y revocar a otros administradores.{' '}
              <strong>{cuenta?.nombre || cuenta?.correo}</strong> tendrá acceso completo y permanente al sistema.
            </div>
          </div>
          <div className="u-field">
            <label className="u-field-label">Motivo<span className="req">*</span></label>
            <textarea
              className="u-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Razón obligatoria de la asignación..."
            />
          </div>
          <div className="u-field">
            <label className="u-field-label">
              Escribe{' '}
              <code style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)', padding: '0 4px', background: 'rgba(239,68,68,0.1)', borderRadius: 3 }}>
                CONFIRMAR
              </code>{' '}
              para habilitar el botón<span className="req">*</span>
            </label>
            <input
              className={`u-input danger-input ${confirmed ? 'confirmed' : ''}`}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRMAR"
              autoComplete="off"
            />
            <div className="u-field-hint">La palabra debe coincidir exactamente, en mayúsculas.</div>
          </div>
          {error && <div className="u-callout danger"><div>{error}</div></div>}
        </div>
        <div className="u-modal-footer">
          <button className="u-btn u-btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button
            className="u-btn u-btn-danger"
            onClick={handleSubmit}
            disabled={submitting || !confirmed || !motivo.trim()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {submitting ? 'Otorgando…' : 'Otorgar Administrador'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignAdminModal;
