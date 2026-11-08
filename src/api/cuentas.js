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

export function asignarRol({ cuentaId, rol, motivo }, token) {
  return requestJson('/api/admin/roles/asignar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cuentaId, rol, motivo }),
  });
}

export function revocarRol({ cuentaId, rol, motivo }, token) {
  return requestJson('/api/admin/roles/revocar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cuentaId, rol, motivo }),
  });
}

/**
 * Bloquea la cuenta (spec 0018, W3): la persona no puede entrar ni unirse a un plantel, se le
 * quitan los roles y se conserva su historial. El backend todavía no tiene cómo desbloquear.
 */
export function bloquearCuenta({ cuentaId, motivo }, token) {
  return requestJson(`/api/admin/roles/cuenta/${encodeURIComponent(cuentaId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}
