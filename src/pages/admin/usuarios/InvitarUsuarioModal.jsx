import { useState } from 'react';
import { invitarUsuario } from '../../../api/invitaciones';

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'ARBITRO', label: 'Árbitro' },
  { value: 'DELEGADO', label: 'Delegado' },
];

/**
 * "Invitar usuario" (spec 0019): reemplaza a "Crear usuario". El backend no crea cuentas
 * ni contraseñas: genera un enlace que el admin comparte. Quien lo abre recibe el rol
 * al entrar o al registrarse con ese correo.
 */
function InvitarUsuarioModal({ open, onClose, onInvitado }) {
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('ARBITRO');
  const [invitacion, setInvitacion] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!open) return null;

  const cerrar = () => {
    setCorreo('');
    setRol('ARBITRO');
    setInvitacion(null);
    setError('');
    setCopiado(false);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const limpio = correo.trim();
    if (!/^\S+@\S+\.\S+$/.test(limpio)) {
      setError('Escribe un correo válido.');
      return;
    }
    setEnviando(true);
    try {
      const creada = await invitarUsuario({ correo: limpio, rol });
      setInvitacion(creada);
      onInvitado?.(creada);
    } catch (err) {
      setError(err?.body?.code === 'INVITACION_DUPLICADA'
        ? 'Ya hay una invitación pendiente para ese correo y ese rol.'
        : (err?.message || 'No fue posible crear la invitación.'));
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(invitacion.enlace);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="u-modal-backdrop" role="dialog" aria-modal="true">
      <div className="u-modal">
        <div className="u-modal-header">
          <div className="u-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v16H4z" opacity="0" />
              <path d="M22 6 12 13 2 6" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </div>
          <div className="u-modal-title-block">
            <div className="u-modal-title">{invitacion ? 'Invitación creada' : 'Invitar usuario'}</div>
            <div className="u-modal-subtitle">
              {invitacion
                ? 'Comparte el enlace con la persona. El rol se aplica al entrar con ese correo.'
                : 'Se genera un enlace para compartir. No se crea ninguna contraseña.'}
            </div>
          </div>
          <button className="u-modal-close" type="button" onClick={cerrar} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!invitacion && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="u-modal-body">
              <div className="u-field">
                <label className="u-field-label" htmlFor="invitar-correo">Correo electrónico</label>
                <input
                  id="invitar-correo"
                  className="u-input"
                  type="email"
                  placeholder="usuario@ufps.edu.co"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
              <div className="u-field">
                <label className="u-field-label" htmlFor="invitar-rol">Rol</label>
                <select id="invitar-rol" className="u-select" value={rol} onChange={(e) => setRol(e.target.value)}>
                  {ROLES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="u-field-hint">Jugador no se invita: todos quedan como jugador al registrarse.</div>
              </div>
              {error && <div className="u-callout danger"><div>{error}</div></div>}
            </div>
            <div className="u-modal-footer">
              <button className="u-btn" type="button" onClick={cerrar}>Cancelar</button>
              <button className="u-btn u-btn-primary" type="submit" disabled={enviando}>
                {enviando ? 'Creando…' : 'Crear invitación'}
              </button>
            </div>
          </form>
        )}

        {invitacion && (
          <>
            <div className="u-modal-body">
              <div className="u-field-label" style={{ textAlign: 'center' }}>Enlace de invitación</div>
              <div className="password-reveal">
                <div className="password-display">{invitacion.enlace}</div>
                <button className={`btn-copy ${copiado ? 'copied' : ''}`} type="button" onClick={copiar} aria-label="Copiar enlace" title="Copiar enlace">
                  {copiado ? '✓' : '⧉'}
                </button>
              </div>
            </div>
            <div className="u-modal-footer full">
              <button className="u-btn u-btn-primary" type="button" onClick={cerrar}>Listo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default InvitarUsuarioModal;
