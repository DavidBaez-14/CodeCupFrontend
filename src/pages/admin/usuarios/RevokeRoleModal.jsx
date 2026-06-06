import { useEffect, useState } from 'react';

const ROL_LABEL = {
  ADMINISTRADOR: 'Administrador',
  DELEGADO: 'Delegado',
  ARBITRO: 'Árbitro',
  JUGADOR: 'Jugador',
};

function RevokeRoleModal({ open, cuenta, rol, onClose, onSubmit }) {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMotivo('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ cedula: cuenta.cedula, rol, motivo: motivo.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || 'No fue posible revocar el rol.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true">
      <div className="u-modal">
        <div className="u-modal-header">
          <div className="u-modal-icon warn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <polyline points="3 3 3 8 8 8" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">Revocar rol</div>
            <div className="u-modal-subtitle">
              Vas a quitar el rol <strong>{ROL_LABEL[rol] || rol}</strong> a <strong>{cuenta?.nombre || cuenta?.correo}</strong>.
            </div>
          </div>
          <button className="u-modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="u-modal-body">
          <div className="u-field">
            <label className="u-field-label">Motivo<span className="req">*</span></label>
            <textarea
              className="u-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Razón de la revocación..."
            />
          </div>
          {error && <div className="u-callout danger"><div>{error}</div></div>}
        </div>
        <div className="u-modal-footer">
          <button className="u-btn u-btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="u-btn u-btn-danger" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Revocando…' : 'Revocar rol'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RevokeRoleModal;
