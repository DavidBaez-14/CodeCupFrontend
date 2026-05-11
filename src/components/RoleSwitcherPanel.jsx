import { useEffect, useMemo, useState } from 'react';
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
import '../styles/role-switcher.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
  JUGADOR: '/dashboard/jugador',
};

const REQUESTABLE_ROLES = [
  { value: 'JUGADOR', label: 'Jugador' },
  { value: 'DELEGADO', label: 'Delegado' },
  { value: 'ARBITRO', label: 'Arbitro' },
];

const ROLE_LABEL = {
  ADMINISTRADOR: 'Administrador',
  ARBITRO: 'Arbitro',
  DELEGADO: 'Delegado',
  JUGADOR: 'Jugador',
};

const ROLES_JUGADOR = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'GRADUADO', label: 'Graduado' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

function normalizeRoleList(list) {
  if (!Array.isArray(list)) return [];
  const mapped = list.map((item) => normalizeRole(item)).filter(Boolean);
  return Array.from(new Set(mapped));
}

function RoleSwitcherPanel() {
  const navigate = useNavigate();
  const storedRoles = normalizeRoleList(getRoles());
  const fallbackRole = normalizeRole(getRol());
  const [availableRoles, setAvailableRoles] = useState(
    storedRoles.length ? storedRoles : (fallbackRole ? [fallbackRole] : []),
  );
  const currentRole = normalizeRole(getRol());

  const missingRoles = useMemo(() => {
    return REQUESTABLE_ROLES
      .map((role) => role.value)
      .filter((role) => !availableRoles.includes(role));
  }, [availableRoles]);

  const [showRequest, setShowRequest] = useState(false);
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
    if (!missingRoles.length) {
      setShowRequest(false);
    }
  }, [missingRoles, requestRole]);

  useEffect(() => {
    if (requestRole !== 'JUGADOR') {
      setRolJugador('ESTUDIANTE');
      setCodigoUniversitario('');
      setSemestre('');
    }
  }, [requestRole]);

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

  return (
    <article className="ds-panel role-switcher">
      <header className="panel-header">
        <h2>Perfiles disponibles</h2>
        <p>Cambia de dashboard o solicita un nuevo rol sin salir de tu sesion.</p>
      </header>

      <div className="role-switcher-row">
        <div className="role-switcher-badges">
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              className={`role-switcher-pill ${role === currentRole ? 'active' : ''}`}
              onClick={() => handleSwitch(role)}
            >
              {ROLE_LABEL[role] || role}
            </button>
          ))}
        </div>
        {missingRoles.length > 0 && (
          <div className="role-switcher-actions">
            <button
              type="button"
              className="action-button ghost"
              onClick={() => setShowRequest((prev) => !prev)}
            >
              {showRequest ? 'Ocultar solicitud' : 'Solicitar nuevo rol'}
            </button>
          </div>
        )}
      </div>

      {missingRoles.length === 0 && (
        <p className="role-switcher-note">Ya tienes todos los roles disponibles para usuarios normales.</p>
      )}

      {showRequest && missingRoles.length > 0 && (
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
    </article>
  );
}

export default RoleSwitcherPanel;
