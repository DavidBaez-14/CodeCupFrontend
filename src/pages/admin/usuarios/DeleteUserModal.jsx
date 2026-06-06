import { useEffect, useState } from 'react';

function DeleteUserModal({ open, cuenta, onClose, onSubmit }) {
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
      await onSubmit({ cedula: cuenta.cedula, motivo: motivo.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || 'No fue posible eliminar la cuenta.');
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">Eliminar cuenta</div>
            <div className="u-modal-subtitle">Esta acción no se puede deshacer.</div>
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
              La cuenta de <strong>{cuenta?.nombre || cuenta?.correo}</strong> será eliminada definitivamente,
              junto con sus roles y su usuario en Appwrite.
            </div>
          </div>
          <div className="u-field">
            <label className="u-field-label">Motivo<span className="req">*</span></label>
            <textarea
              className="u-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo de la eliminación (queda en auditoría)..."
            />
          </div>
          {error && <div className="u-callout danger"><div>{error}</div></div>}
        </div>
        <div className="u-modal-footer">
          <button className="u-btn u-btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="u-btn u-btn-danger" onClick={handleSubmit} disabled={submitting}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
            {submitting ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserModal;
