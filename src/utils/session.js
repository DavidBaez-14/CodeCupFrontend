const TOKEN_KEY = 'codecup_token';
const ROL_KEY = 'codecup_rol';
const NOMBRE_KEY = 'codecup_nombre';
const EMAIL_KEY = 'codecup_email';
const CEDULA_KEY = 'codecup_cedula';
const ROLES_KEY = 'codecup_roles';
const LOGIN_ROLE_KEY = 'codecup_login_role';
const INVITACION_KEY = 'codecup_invitacion';

export function setSession({ token, rol, nombre, email, cedula, roles }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (rol) localStorage.setItem(ROL_KEY, rol);
  if (nombre !== undefined) localStorage.setItem(NOMBRE_KEY, nombre || '');
  if (email !== undefined) localStorage.setItem(EMAIL_KEY, email || '');
  if (cedula !== undefined) localStorage.setItem(CEDULA_KEY, cedula || '');
  if (roles !== undefined) localStorage.setItem(ROLES_KEY, JSON.stringify(roles || []));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROL_KEY);
  localStorage.removeItem(NOMBRE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(CEDULA_KEY);
  localStorage.removeItem(ROLES_KEY);
}

/** Access token vigente de Supabase (lo mantiene lib/supabase con onAuthStateChange). */
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

/** Guarda lo que devuelve GET /api/auth/me. `rol` es el rol activo (si es null no se cambia). */
export function guardarSesionDesdeMe(me, rol) {
  setSession({
    rol: rol || undefined,
    nombre: me?.nombre,
    email: me?.correo,
    cedula: me?.cedula,
    roles: me?.roles || [],
  });
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRol() {
  return localStorage.getItem(ROL_KEY);
}

export function getNombre() {
  return localStorage.getItem(NOMBRE_KEY);
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY);
}

export function getCedula() {
  return localStorage.getItem(CEDULA_KEY);
}

export function getRoles() {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSession() {
  return Boolean(getToken());
}

export function pickPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  const order = ['administrador', 'arbitro', 'delegado', 'jugador'];
  const found = order.find((r) => roles.map((x) => String(x).toLowerCase()).includes(r));
  return (found || roles[0]).toUpperCase();
}

export function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

export function hasRole(roles, role) {
  const normalized = normalizeRole(role);
  if (!Array.isArray(roles) || !normalized) return false;
  return roles.some((item) => normalizeRole(item) === normalized);
}

export function setLoginRole(role) {
  if (!role) return;
  sessionStorage.setItem(LOGIN_ROLE_KEY, normalizeRole(role));
}

export function getLoginRole() {
  return sessionStorage.getItem(LOGIN_ROLE_KEY);
}

export function clearLoginRole() {
  sessionStorage.removeItem(LOGIN_ROLE_KEY);
}

/** Invitación abierta antes de iniciar sesión: se acepta después del login o del registro. */
export function setInvitacionPendiente(token) {
  if (token) localStorage.setItem(INVITACION_KEY, token);
}

export function getInvitacionPendiente() {
  return localStorage.getItem(INVITACION_KEY);
}

export function clearInvitacionPendiente() {
  localStorage.removeItem(INVITACION_KEY);
}
