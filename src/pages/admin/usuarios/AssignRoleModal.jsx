import { useEffect, useState } from 'react';

function AssignRoleModal({ open, cuenta, rolPreseleccionado, onClose, onSubmit }) {
  const [rol, setRol] = useState('DELEGADO');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setRol(rolPreseleccionado || 'DELEGADO');
      setMotivo('');
      setError('');
      setSubmitting(false);
    }
  }, [open, rolPreseleccionado]);

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
      setError(err?.message || 'No fue posible asignar el rol.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true">
      <div className="u-modal">
        <div className="u-modal-header">
          <div className="u-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">Asignar rol</div>
            <div className="u-modal-subtitle">
              Concede permisos a <strong>{cuenta?.nombre || cuenta?.correo}</strong>.
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
            <label className="u-field-label">Rol a asignar<span className="req">*</span></label>
            <select className="u-select" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="DELEGADO">Delegado</option>
              <option value="ARBITRO">Árbitro</option>
            </select>
          </div>
          <div className="u-field">
            <label className="u-field-label">Motivo<span className="req">*</span></label>
            <textarea
              className="u-textarea"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Razón de la asignación (queda en auditoría)..."
            />
          </div>
          {error && <div className="u-callout danger"><div>{error}</div></div>}
        </div>
        <div className="u-modal-footer">
          <button className="u-btn u-btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="u-btn u-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Asignando…' : 'Confirmar asignación'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignRoleModal;
