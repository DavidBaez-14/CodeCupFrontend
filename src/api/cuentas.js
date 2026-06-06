import { requestJson } from './http';

export function listarCuentas({ q, rol, page = 0, size = 8 } = {}, token) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (rol) params.set('rol', rol);
  params.set('page', String(page));
  params.set('size', String(size));
  return requestJson(`/api/admin/cuentas?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function crearCuenta(payload, token) {
  return requestJson('/api/admin/cuentas', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function asignarRol({ cedula, rol, motivo }, token) {
  return requestJson('/api/admin/roles/asignar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cedula, rol, motivo }),
  });
}

export function revocarRol({ cedula, rol, motivo }, token) {
  return requestJson('/api/admin/roles/revocar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cedula, rol, motivo }),
  });
}

export function eliminarCuenta({ cedula, motivo }, token) {
  return requestJson(`/api/admin/roles/cuenta/${encodeURIComponent(cedula)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}
