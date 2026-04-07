import { requestJson } from './http';

export function listUsers({ token, rolSistema, activo, buscar, page = 0, size = 20 }) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  if (rolSistema && rolSistema !== 'TODOS') {
    params.set('rol_sistema', rolSistema);
  }

  if (activo !== undefined && activo !== null && activo !== 'TODOS') {
    params.set('activo', String(activo));
  }

  if (buscar) {
    params.set('buscar', buscar);
  }

  return requestJson(`/api/usuarios?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
