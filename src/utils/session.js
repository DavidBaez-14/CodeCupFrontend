const TOKEN_KEY = 'codecup_token';
const ROL_KEY = 'codecup_rol';
const NOMBRE_KEY = 'codecup_nombre';
const EMAIL_KEY = 'codecup_email';

export function setSession({ token, rol, nombre, email }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROL_KEY, rol);
  localStorage.setItem(NOMBRE_KEY, nombre || '');
  localStorage.setItem(EMAIL_KEY, email || '');
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROL_KEY);
  localStorage.removeItem(NOMBRE_KEY);
  localStorage.removeItem(EMAIL_KEY);
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

export function hasSession() {
  return Boolean(getToken());
}

export function pickPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  const order = ['administrador', 'arbitro', 'delegado'];
  const found = order.find((r) => roles.map((x) => String(x).toLowerCase()).includes(r));
  return (found || roles[0]).toUpperCase();
}
