import { requestJson } from './http';

export function exchange(appwriteJwt) {
  return requestJson('/api/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appwriteJwt }),
  });
}

export function solicitarRol({
  appwriteJwt,
  cedula,
  rol,
  rolJugador,
  codigoUniversitario,
  semestre,
  motivoSolicitud,
}) {
  return requestJson('/api/auth/solicitar-rol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appwriteJwt,
      cedula,
      rol,
      rolJugador,
      codigoUniversitario,
      semestre,
      motivoSolicitud,
    }),
  });
}

export function refresh(token) {
  return requestJson('/api/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
