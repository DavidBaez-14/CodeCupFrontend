import { requestJson } from './http';

export function exchange(appwriteJwt) {
  return requestJson('/api/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appwriteJwt }),
  });
}

export function registrar({ appwriteJwt, cedula, rolSolicitado }) {
  return requestJson('/api/auth/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appwriteJwt, cedula, rolSolicitado }),
  });
}

export function registrarJugador({ appwriteJwt, cedula, rolJugador, codigoUniversitario, semestre }) {
  return requestJson('/api/auth/registrar-jugador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appwriteJwt,
      cedula,
      rolJugador,
      codigoUniversitario,
      semestre,
    }),
  });
}

export function refresh(token) {
  return requestJson('/api/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
