import { useEffect, useState } from 'react';

/**
 * Bloquear una cuenta (spec 0018, W3; spec 0027). El backend la deja BLOQUEADA y le quita los
 * roles, pero no borra a la persona: su historial (equipos, partidos, estadísticas) se conserva.
 * Ejemplo de uso: un jugador expulsado de un torneo por conducta antideportiva.
 */
function BloquearCuentaModal({ open, cuenta, onClose, onSubmit }) {
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
      await onSubmit({ cuentaId: cuenta.id, motivo: motivo.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || 'No fue posible bloquear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bloquear-titulo">
      <div className="u-modal danger">
        <div className="u-modal-header">
          <div className="u-modal-icon danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title" id="bloquear-titulo">Bloquear cuenta</div>
            <div className="u-modal-subtitle">Se conserva su historial.</div>
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              La cuenta de <strong>{cuenta?.nombre || cuenta?.correo}</strong> queda bloqueada: no podrá iniciar
              sesión ni entrar a un plantel. Se le quitan los roles, pero se conservan sus equipos, partidos y
              estadísticas. Por ahora no se puede desbloquear desde la web.
            </div>
          </div>
          <div className="u-field">
            <label className="u-field-label" htmlFor="bloquear-motivo">Motivo<span className="req">*</span></label>
            <textarea
              id="bloquear-motivo"
              className="u-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: expulsado del torneo por conducta antideportiva. Queda en la auditoría."
            />
          </div>
          {error && <div className="u-callout danger" role="alert"><div>{error}</div></div>}
        </div>
        <div className="u-modal-footer">
          <button className="u-btn u-btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="u-btn u-btn-danger" onClick={handleSubmit} disabled={submitting}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {submitting ? 'Bloqueando…' : 'Bloquear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BloquearCuentaModal;
