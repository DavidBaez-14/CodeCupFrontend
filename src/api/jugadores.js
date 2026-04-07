import { requestJson } from './http';

export function uploadCsv(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson('/api/jugadores/cargar-csv', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export function getJugadorByCedula(cedula, token) {
  return requestJson(`/api/jugadores/${encodeURIComponent(cedula)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
