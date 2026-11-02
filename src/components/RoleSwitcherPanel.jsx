import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { me, solicitarRol } from '../api/auth';
import { RUTA_POR_ROL } from '../utils/destino';
import {
  getRol,
  getRoles,
  guardarSesionDesdeMe,
  normalizeRole,
  setSession,
} from '../utils/session';
import '../styles/role-switcher.css';

// Jugador es automático al registrarse y Administrador solo llega por invitación (spec 0017).
const REQUESTABLE_ROLES = [
  { value: 'DELEGADO', label: 'Delegado' },
  { value: 'ARBITRO', label: 'Arbitro' },
];

const ROLE_LABEL = {
  ADMINISTRADOR: 'Administrador',
  ARBITRO: 'Arbitro',
  DELEGADO: 'Delegado',
  JUGADOR: 'Jugador',
};

function normalizeRoleList(list) {
  if (!Array.isArray(list)) return [];
  const mapped = list.map((item) => normalizeRole(item)).filter(Boolean);
  return Array.from(new Set(mapped));
}

function mensajeDeSolicitud(err) {
  return err?.body?.code === 'SOLICITUD_EXISTENTE'
    ? 'Ya tienes una solicitud pendiente.'
    : (err?.message || 'No se pudo enviar la solicitud.');
}

function RoleSwitcherPanel() {
  const navigate = useNavigate();
  const storedRoles = normalizeRoleList(getRoles());
  const fallbackRole = normalizeRole(getRol());
  const [availableRoles, setAvailableRoles] = useState(
    storedRoles.length ? storedRoles : (fallbackRole ? [fallbackRole] : []),
  );
  const [pendientes, setPendientes] = useState([]);
  const currentRole = normalizeRole(getRol());

  const missingRoles = useMemo(() => {
    return REQUESTABLE_ROLES
      .map((role) => role.value)
      .filter((role) => !availableRoles.includes(role) && !pendientes.includes(role));
  }, [availableRoles, pendientes]);

  const [showRequest, setShowRequest] = useState(false);
  const [requestRole, setRequestRole] = useState(missingRoles[0] || 'DELEGADO');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Los roles salen de la BD: al montar se refrescan para ver los recién aprobados (spec 0019).
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (missingRoles.length && !missingRoles.includes(requestRole)) {
      setRequestRole(missingRoles[0]);
    }
  }, [missingRoles, requestRole]);

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
      setError(mensajeDeSolicitud(err));
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

      {pendientes.length > 0 && (
        <p className="role-switcher-note">
          Pendiente de aprobación: {pendientes.map((r) => ROLE_LABEL[r] || r).join(', ')}.
        </p>
      )}

      {missingRoles.length === 0 && pendientes.length === 0 && (
        <p className="role-switcher-note">Ya tienes todos los roles disponibles para usuarios normales.</p>
      )}

      {showRequest && missingRoles.length > 0 && (
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
    </article>
  );
}

export default RoleSwitcherPanel;
