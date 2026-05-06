import { requestJson } from './http';

export function uploadCsv(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson('/api/jugadores/cargar-csv', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export function getJugadorByCedula(cedula, token) {
  return requestJson(`/api/jugadores/${encodeURIComponent(cedula)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function listJugadores({ token, rolJugador, activo, page = 0, size = 10 } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (rolJugador && rolJugador !== 'TODOS') params.set('rol_jugador', rolJugador);
  if (activo !== undefined && activo !== null && activo !== 'TODOS') params.set('activo', String(activo));

  return requestJson(`/api/jugadores?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}
