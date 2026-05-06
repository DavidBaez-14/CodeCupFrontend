import { requestJson } from './http';

export function listPendientes(token) {
  return requestJson('/api/admin/registros/pendientes', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function aprobarRegistro(perfilId, token) {
  return requestJson(`/api/admin/registros/${encodeURIComponent(perfilId)}/aprobar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function rechazarRegistro(perfilId, motivo, token) {
  return requestJson(`/api/admin/registros/${encodeURIComponent(perfilId)}/rechazar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}
