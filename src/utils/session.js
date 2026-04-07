const TOKEN_KEY = 'codecup_token';
const ROL_KEY = 'codecup_rol';
const NOMBRE_KEY = 'codecup_nombre';
const MUST_CHANGE_PASSWORD_KEY = 'codecup_debe_cambiar_contrasena';

export function setSession({ token, rol, nombre, debeCambiarContrasena = false }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROL_KEY, rol);
  localStorage.setItem(NOMBRE_KEY, nombre);
  localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, String(Boolean(debeCambiarContrasena)));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROL_KEY);
  localStorage.removeItem(NOMBRE_KEY);
  localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
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

export function mustChangePassword() {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true';
}

export function hasSession() {
  return Boolean(getToken());
}
