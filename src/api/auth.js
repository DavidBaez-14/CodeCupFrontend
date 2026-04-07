import { requestJson } from './http';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8081';

export function login(correo, contrasena) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo, contrasena }),
  });
}

export function startGoogleLogin() {
  window.location.href = `${BACKEND_ORIGIN}/api/auth/google`;
}

export function recuperarContrasena(correo) {
  return requestJson('/api/auth/recuperar-contrasena', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo }),
  });
}

export function cambiarContrasena(token, contrasenaActual, contrasenaNueva) {
  return requestJson('/api/auth/cambiar-contrasena', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
  });
}
