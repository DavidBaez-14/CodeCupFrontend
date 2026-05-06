import { requestJson } from './http';

const MS2_ORIGIN = import.meta.env.VITE_MS2_ORIGIN ?? '';

function buildUrl(path) {
  if (!MS2_ORIGIN) return path;
  return `${MS2_ORIGIN}${path}`;
}

export function listEquipos(token) {
  return requestJson(buildUrl('/api/supercopa/equipos'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getMiPerfil(token) {
  return requestJson(buildUrl('/api/supercopa/mi-perfil'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}
