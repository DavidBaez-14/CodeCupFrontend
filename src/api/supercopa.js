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

export function listSolicitudes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function listSolicitudesPendientes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes/pendientes'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function aprobarSolicitud(id, token) {
  return requestJson(buildUrl(`/api/supercopa/solicitudes/${id}/aprobar`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function rechazarSolicitud(id, motivo, token) {
  return requestJson(buildUrl(`/api/supercopa/solicitudes/${id}/rechazar`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
}

export function getMisSolicitudes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes/mis-solicitudes'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function listTorneos(token) {
  return requestJson(buildUrl('/api/supercopa/torneos'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function solicitarIngreso(equipoId, torneoId, token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ equipoId, torneoId }),
  });
}
