import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitarRol } from '../api/auth';
import { appwriteCreateJwt } from '../lib/appwrite';
import {
  getCedula,
  getEmail,
  getNombre,
  getRol,
  getRoles,
  getToken,
  normalizeRole,
  setSession,
} from '../utils/session';
import '../styles/role-header-actions.css';
import '../styles/role-switcher.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
  JUGADOR: '/dashboard/jugador',
};

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

const REQUESTABLE_ROLES = [
  { value: 'JUGADOR', label: 'Jugador' },
  { value: 'DELEGADO', label: 'Delegado' },
  { value: 'ARBITRO', label: 'Arbitro' },
];

const ROLES_JUGADOR = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'GRADUADO', label: 'Graduado' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
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

  const missingRoles = useMemo(() => {
    if (!allowRoleRequest) return [];
    return REQUESTABLE_ROLES
      .map((role) => role.value)
      .filter((role) => !availableRoles.includes(role));
  }, [allowRoleRequest, availableRoles]);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('perfil');
  const [requestRole, setRequestRole] = useState(missingRoles[0] || 'JUGADOR');
  const [cedula, setCedula] = useState(getCedula() || '');
  const [rolJugador, setRolJugador] = useState('ESTUDIANTE');
  const [codigoUniversitario, setCodigoUniversitario] = useState('');
  const [semestre, setSemestre] = useState('');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (missingRoles.length && !missingRoles.includes(requestRole)) {
      setRequestRole(missingRoles[0]);
    }
  }, [missingRoles, requestRole]);

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

    setSession({
      token: getToken(),
      rol: normalized,
      nombre: getNombre(),
      email: getEmail(),
      cedula: getCedula(),
      roles: availableRoles,
    });

    navigate(ROLE_ROUTE[normalized] || '/login', { replace: true });
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!cedula.trim()) {
      setError('La cedula es obligatoria.');
      return;
    }

    if (!/^\d{6,15}$/.test(cedula.trim())) {
      setError('La cedula debe contener entre 6 y 15 digitos.');
      return;
    }

    if (requestRole === 'JUGADOR' && rolJugador === 'ESTUDIANTE') {
      if (!codigoUniversitario.trim()) {
        setError('El codigo estudiantil es obligatorio.');
        return;
      }
      if (!/^[1-9]\d*$/.test(String(semestre).trim())) {
        setError('El semestre debe ser un numero valido.');
        return;
      }
    }

    setLoading(true);
    try {
      const appwriteJwt = await appwriteCreateJwt();
      const data = await solicitarRol({
        appwriteJwt,
        cedula: cedula.trim(),
        rol: requestRole,
        rolJugador: requestRole === 'JUGADOR' ? rolJugador : undefined,
        codigoUniversitario:
          requestRole === 'JUGADOR' && rolJugador === 'ESTUDIANTE'
            ? codigoUniversitario.trim()
            : null,
        semestre:
          requestRole === 'JUGADOR' && rolJugador === 'ESTUDIANTE'
            ? Number(semestre)
            : null,
        motivoSolicitud: motivoSolicitud.trim() || undefined,
      });

      if (data.estado === 'APROBADO' && data.token?.token) {
        const updatedRoles = normalizeRoleList(data.token.roles);
        setAvailableRoles(updatedRoles.length ? updatedRoles : availableRoles);
        setSession({
          token: data.token.token,
          rol: requestRole,
          nombre: data.token.nombre,
          email: data.token.correo,
          cedula: data.token.cedula,
          roles: data.token.roles,
        });
        navigate(ROLE_ROUTE[requestRole] || '/dashboard/jugador', { replace: true });
        return;
      }

      setMessage(data.mensaje || 'Solicitud enviada. Espera aprobacion del administrador.');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la solicitud.');
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

                {allowRoleRequest && missingRoles.length === 0 && (
                  <p className="role-profile-note">Ya tienes todos los roles disponibles.</p>
                )}

                {allowRoleRequest && missingRoles.length > 0 && (
                  <form className="role-request-form" onSubmit={handleRequest}>
                    <div className="role-request-grid">
                      <div className="role-request-field">
                        <label className="role-form-label" htmlFor="role-request-cedula">Cedula</label>
                        <input
                          id="role-request-cedula"
                          className="form-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="1090000001"
                          value={cedula}
                          onChange={(event) => setCedula(event.target.value)}
                          required
                        />
                      </div>
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
                    </div>

                    {requestRole === 'JUGADOR' && (
                      <div className="role-request-grid">
                        <div className="role-request-field">
                          <label className="role-form-label" htmlFor="role-request-rol-jugador">Rol del jugador</label>
                          <select
                            id="role-request-rol-jugador"
                            className="form-input"
                            value={rolJugador}
                            onChange={(event) => setRolJugador(event.target.value)}
                          >
                            {ROLES_JUGADOR.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        {rolJugador === 'ESTUDIANTE' && (
                          <>
                            <div className="role-request-field">
                              <label className="role-form-label" htmlFor="role-request-codigo">Codigo estudiantil</label>
                              <input
                                id="role-request-codigo"
                                className="form-input"
                                type="text"
                                placeholder="1155404"
                                value={codigoUniversitario}
                                onChange={(event) => setCodigoUniversitario(event.target.value)}
                                required
                              />
                            </div>
                            <div className="role-request-field">
                              <label className="role-form-label" htmlFor="role-request-semestre">Semestre</label>
                              <input
                                id="role-request-semestre"
                                className="form-input"
                                type="number"
                                min="1"
                                max="20"
                                placeholder="7"
                                value={semestre}
                                onChange={(event) => setSemestre(event.target.value)}
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="role-request-field">
                      <label className="role-form-label" htmlFor="role-request-motivo">Comentario opcional</label>
                      <textarea
                        id="role-request-motivo"
                        className="form-input"
                        rows={3}
                        placeholder="Describe tu solicitud si es necesario."
                        value={motivoSolicitud}
                        onChange={(event) => setMotivoSolicitud(event.target.value)}
                      />
                    </div>

                    {error && <p className="banner banner-error">{error}</p>}
                    {message && <p className="banner banner-success">{message}</p>}

                    <div className="role-request-actions">
                      <button className="action-button primary" type="submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar solicitud'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleHeaderActions;
