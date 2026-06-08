import { requestJson } from './http';

export function listPendientes(token, estado) {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  return requestJson(`/api/admin/roles/pendientes${qs}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function aprobarRol(cuentaRolId, token) {
  return requestJson(`/api/admin/roles/${encodeURIComponent(cuentaRolId)}/aprobar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function aprobarTodosCuenta(cuentaId, token) {
  return requestJson(`/api/admin/roles/cuenta/${encodeURIComponent(cuentaId)}/aprobar-todos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function rechazarTodosCuenta(cuentaId, motivo, token) {
  return requestJson(`/api/admin/roles/cuenta/${encodeURIComponent(cuentaId)}/rechazar-todos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}

export function rechazarRol(cuentaRolId, motivo, token) {
  return requestJson(`/api/admin/roles/${encodeURIComponent(cuentaRolId)}/rechazar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}
