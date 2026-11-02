import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { me, solicitarRol } from '../api/auth';
import { RUTA_POR_ROL } from '../utils/destino';
import {
  getEmail,
  getNombre,
  getRol,
  getRoles,
  guardarSesionDesdeMe,
  normalizeRole,
  setSession,
} from '../utils/session';
import '../styles/role-header-actions.css';
import '../styles/role-switcher.css';

const ROLE_LABEL = {
  ADMINISTRADOR: 'Administrador',
  ARBITRO: 'Arbitro',
  DELEGADO: 'Delegado',
  JUGADOR: 'Jugador',
};

// Orden en que se renderizan los iconos de roles en la barra superior.
const ROLE_PRIORITY = {
  ADMINISTRADOR: 0,
  DELEGADO: 1,
  JUGADOR: 2,
  ARBITRO: 3,
};

// Jugador es automático al registrarse y Administrador solo llega por invitación (spec 0017).
const REQUESTABLE_ROLES = [
  { value: 'DELEGADO', label: 'Delegado' },
  { value: 'ARBITRO', label: 'Arbitro' },
];

const ROLE_ICONS = {
  JUGADOR: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4.2" fill="currentColor" opacity="0.85" />
      <path
        d="M5.2 20.2c.6-3.5 3.4-6 6.8-6s6.1 2.5 6.8 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  DELEGADO: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 4h12v8a6 6 0 0 1-12 0V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 11h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  ARBITRO: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18.2" cy="12" r="2.2" fill="currentColor" />
      <path d="M8 10h4M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ADMINISTRADOR: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8.5l1.1 2.2 2.5.4-1.8 1.7.4 2.5-2.2-1.1-2.2 1.1.4-2.5-1.8-1.7 2.5-.4L12 8.5Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  ),
};

function normalizeRoleList(list) {
  if (!Array.isArray(list)) return [];
  const mapped = list.map((item) => normalizeRole(item)).filter(Boolean);
  const unicos = Array.from(new Set(mapped));
  unicos.sort((a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99));
  return unicos;
}

function RoleHeaderActions({ allowRoleRequest = true }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const storedRoles = normalizeRoleList(getRoles());
  const fallbackRole = normalizeRole(getRol());
  const [availableRoles, setAvailableRoles] = useState(
    storedRoles.length ? storedRoles : (fallbackRole ? [fallbackRole] : []),
  );
  const currentRole = normalizeRole(getRol());

  const [pendientes, setPendientes] = useState([]);

  const missingRoles = useMemo(() => {
    if (!allowRoleRequest) return [];
    return REQUESTABLE_ROLES
      .map((role) => role.value)
      .filter((role) => !availableRoles.includes(role) && !pendientes.includes(role));
  }, [allowRoleRequest, availableRoles, pendientes]);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('perfil');
  const [requestRole, setRequestRole] = useState(missingRoles[0] || 'DELEGADO');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (missingRoles.length && !missingRoles.includes(requestRole)) {
      setRequestRole(missingRoles[0]);
    }
  }, [missingRoles, requestRole]);

  // Al abrir el menú se refrescan los roles desde la BD (spec 0019).
  useEffect(() => {
    if (!open) return undefined;
    let cancelado = false;
    me()
      .then((datos) => {
        if (cancelado || !datos) return;
        setAvailableRoles(normalizeRoleList(datos.roles));
        setPendientes(normalizeRoleList(datos.rolesPendientes));
        guardarSesionDesdeMe(datos, null);
      })
      .catch(() => { /* sin red: se quedan los roles guardados */ });
    return () => { cancelado = true; };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSwitch = (role) => {
    const normalized = normalizeRole(role);
    if (!normalized || normalized === currentRole) return;

    setSession({ rol: normalized, roles: availableRoles });

    navigate(RUTA_POR_ROL[normalized] || '/login', { replace: true });
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await solicitarRol({ rol: requestRole, motivoSolicitud: motivoSolicitud.trim() });
      setPendientes((prev) => normalizeRoleList([...prev, requestRole]));
      setMotivoSolicitud('');
      setMessage('Solicitud enviada');
    } catch (err) {
      setError(err?.body?.code === 'SOLICITUD_EXISTENTE'
        ? 'Ya tienes una solicitud pendiente.'
        : (err?.message || 'No se pudo enviar la solicitud.'));
    } finally {
      setLoading(false);
    }
  };

  const nombre = getNombre() || 'Usuario';
  const email = getEmail() || '';
  const initial = nombre.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="role-header-actions">
      {availableRoles.length > 0 && (
        <div className="role-toggle" aria-label="Cambiar rol">
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              title={ROLE_LABEL[role] || role}
              aria-label={ROLE_LABEL[role] || role}
              className={`role-toggle-button ${role === currentRole ? 'active' : ''}`}
              onClick={() => handleSwitch(role)}
            >
              {ROLE_ICONS[role]}
            </button>
          ))}
        </div>
      )}

      <div className="role-profile" ref={menuRef}>
        <button
          type="button"
          className="role-profile-button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <span className="role-profile-avatar">{initial}</span>
          <span className="role-profile-name">{nombre.split(' ')[0]}</span>
          <span className="role-profile-caret" aria-hidden="true">▾</span>
        </button>

        {open && (
          <div className="role-profile-menu" role="menu">
            <div className="role-profile-head">
              <div className="role-profile-avatar lg">{initial}</div>
              <div>
                <p className="role-profile-full">{nombre}</p>
                <p className="role-profile-email">{email || 'usuario@codecup.local'}</p>
              </div>
            </div>

            <div className="role-profile-tabs" role="tablist">
              <button
                type="button"
                className={`role-profile-tab ${tab === 'perfil' ? 'active' : ''}`}
                onClick={() => setTab('perfil')}
              >
                Perfil
              </button>
              <button
                type="button"
                className={`role-profile-tab ${tab === 'config' ? 'active' : ''}`}
                onClick={() => setTab('config')}
              >
                Configuraciones
              </button>
            </div>

            {tab === 'perfil' && (
              <div className="role-profile-panel">
                <p className="role-profile-note">
                  Pronto podras actualizar tu foto, nombre y preferencias desde aqui.
                </p>
              </div>
            )}

            {tab === 'config' && (
              <div className="role-profile-panel">
                {!allowRoleRequest && (
                  <p className="role-profile-note">Este perfil no requiere solicitudes adicionales.</p>
                )}

                {allowRoleRequest && pendientes.length > 0 && (
                  <p className="role-profile-note">
                    Pendiente de aprobación: {pendientes.map((r) => ROLE_LABEL[r] || r).join(', ')}.
                  </p>
                )}

                {allowRoleRequest && missingRoles.length === 0 && pendientes.length === 0 && (
                  <p className="role-profile-note">Ya tienes todos los roles disponibles.</p>
                )}

                {allowRoleRequest && missingRoles.length > 0 && (
                  <form className="role-request-form" onSubmit={handleRequest}>
                    <div className="role-request-field">
                      <label className="role-form-label" htmlFor="role-request-tipo">Rol solicitado</label>
                      <select
                        id="role-request-tipo"
                        className="form-input"
                        value={requestRole}
                        onChange={(event) => setRequestRole(event.target.value)}
                      >
                        {REQUESTABLE_ROLES.filter((opt) => missingRoles.includes(opt.value)).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="role-request-field">
                      <label className="role-form-label" htmlFor="role-request-motivo">Motivo</label>
                      <textarea
                        id="role-request-motivo"
                        className="form-input"
                        rows={3}
                        maxLength={500}
                        placeholder="Opcional: cuéntale al administrador por qué."
                        value={motivoSolicitud}
                        onChange={(event) => setMotivoSolicitud(event.target.value)}
                      />
                    </div>


                    <div className="role-request-actions">
                      <button className="action-button primary" type="submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar solicitud'}
                      </button>
                    </div>
                  </form>
                )}

                {error && <p className="banner banner-error">{error}</p>}
                {message && <p className="banner banner-success">{message}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleHeaderActions;
