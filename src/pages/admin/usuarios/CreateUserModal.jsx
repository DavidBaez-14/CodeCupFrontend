import { useState } from 'react';

function CreateUserModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    cedula: '',
    rolInicial: 'DELEGADO',
    motivo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const reset = () => {
    setForm({ nombre: '', correo: '', cedula: '', rolInicial: 'DELEGADO', motivo: '' });
    setError('');
    setCreated(null);
    setCopied(false);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.nombre.trim() || !form.correo.trim() || !form.cedula.trim() || !form.motivo.trim()) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await onSubmit({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        cedula: form.cedula.trim(),
        rolInicial: form.rolInicial,
        motivo: form.motivo.trim(),
      });
      setCreated(data);
    } catch (err) {
      setError(err?.message || 'No fue posible crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.passwordTemporal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true">
      <div className="u-modal">
        <div className="u-modal-header">
          <div className="u-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">{created ? 'Cuenta creada' : 'Crear usuario'}</div>
            <div className="u-modal-subtitle">
              {created
                ? 'Guarda la contraseña antes de cerrar — no se mostrará de nuevo.'
                : 'Se generará automáticamente una contraseña temporal.'}
            </div>
          </div>
          <button className="u-modal-close" onClick={close} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!created && (
          <>
            <div className="u-modal-body">
              <div className="u-field">
                <label className="u-field-label">Nombre completo<span className="req">*</span></label>
                <input
                  className="u-input"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: María González"
                />
              </div>
              <div className="u-field">
                <label className="u-field-label">Correo electrónico<span className="req">*</span></label>
                <input
                  className="u-input"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                  placeholder="usuario@ufps.edu.co"
                />
              </div>
              <div className="u-field">
                <label className="u-field-label">Cédula<span className="req">*</span></label>
                <input
                  className="u-input"
                  value={form.cedula}
                  onChange={(e) => setForm((p) => ({ ...p, cedula: e.target.value }))}
                  placeholder="1090123456"
                />
              </div>
              <div className="u-field">
                <label className="u-field-label">Rol inicial<span className="req">*</span></label>
                <select
                  className="u-select"
                  value={form.rolInicial}
                  onChange={(e) => setForm((p) => ({ ...p, rolInicial: e.target.value }))}
                >
                  <option value="DELEGADO">Delegado</option>
                  <option value="ARBITRO">Árbitro</option>
                </select>
                <div className="u-field-hint">
                  El rol "Administrador" se asigna luego desde la tabla con doble confirmación.
                </div>
              </div>
              <div className="u-field">
                <label className="u-field-label">Motivo<span className="req">*</span></label>
                <textarea
                  className="u-textarea"
                  value={form.motivo}
                  onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
                  placeholder="Por qué se crea esta cuenta manualmente (queda en auditoría)..."
                />
              </div>
              {error && <div className="u-callout danger"><div>{error}</div></div>}
            </div>
            <div className="u-modal-footer">
              <button className="u-btn u-btn-secondary" onClick={close} disabled={submitting}>
                Cancelar
              </button>
              <button className="u-btn u-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creando…' : 'Crear cuenta'}
              </button>
            </div>
          </>
        )}

        {created && (
          <>
            <div className="u-modal-body">
              <div className="u-field-label" style={{ textAlign: 'center' }}>
                Contraseña temporal generada
              </div>
              <div className="password-reveal">
                <div className="password-display">{created.passwordTemporal}</div>
                <button
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  title="Copiar"
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="password-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span><strong>Guárdala ahora.</strong> Por seguridad no podrás verla de nuevo después de cerrar.</span>
              </div>
            </div>
            <div className="u-modal-footer full">
              <button className="u-btn u-btn-primary" onClick={close}>Entendido, ya la guardé</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CreateUserModal;
