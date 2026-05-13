import { requestJson } from './http';

const GATEWAY_ORIGIN = import.meta.env.VITE_GATEWAY_URL ?? '';

function buildUrl(path) {
  if (!GATEWAY_ORIGIN) return path;
  return `${GATEWAY_ORIGIN}${path}`;
}

function authHeader(token, contentType = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (contentType) h['Content-Type'] = 'application/json';
  return h;
}

// ─────────────────────────────────────────────────────────
//  PUBLICOS / COMUNES
// ─────────────────────────────────────────────────────────

export function listEquipos(token) {
  return requestJson(buildUrl('/api/supercopa/equipos'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function listTorneos(token) {
  return requestJson(buildUrl('/api/supercopa/torneos'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getMiPerfil(token) {
  return requestJson(buildUrl('/api/supercopa/mi-perfil'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

// ─────────────────────────────────────────────────────────
//  SOLICITUDES (jugador / delegado)
// ─────────────────────────────────────────────────────────

export function solicitarIngreso(payload, token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes'), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(payload),
  });
}

export function getMisSolicitudes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes/mis-solicitudes'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function listSolicitudes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function listSolicitudesPendientes(token) {
  return requestJson(buildUrl('/api/supercopa/solicitudes/pendientes'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function aprobarSolicitud(id, token) {
  return requestJson(buildUrl(`/api/supercopa/solicitudes/${id}/aprobar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function rechazarSolicitud(id, motivo, token) {
  return requestJson(buildUrl(`/api/supercopa/solicitudes/${id}/rechazar`), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify({ motivo }),
  });
}

// ─────────────────────────────────────────────────────────
//  JUGADOR
// ─────────────────────────────────────────────────────────

export function listEquiposPorTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/jugador/torneos/${torneoId}/equipos`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

// ─────────────────────────────────────────────────────────
//  DELEGADO
// ─────────────────────────────────────────────────────────

export function createEquipo(nombre, token) {
  return requestJson(buildUrl('/api/supercopa/delegado/equipos'), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify({ nombre }),
  });
}

export function getMiEquipo(token) {
  return requestJson(buildUrl('/api/supercopa/delegado/equipos/mi-equipo'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function listTorneosDisponibles(token) {
  return requestJson(buildUrl('/api/supercopa/delegado/torneos/disponibles'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function inscribirEquipo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/delegado/torneos/${torneoId}/inscribir`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function listInscripcionesDelegado(token) {
  return requestJson(buildUrl('/api/supercopa/delegado/inscripciones/mias'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function pagarInscripcion(equipoTorneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/delegado/inscripciones/${equipoTorneoId}/pagar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function listMiembrosEquipoTorneo(equipoTorneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/delegado/equipo-torneo/${equipoTorneoId}/miembros`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function listMiembrosEquipoTorneoAdmin(equipoTorneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/equipo-torneo/${equipoTorneoId}/miembros`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

// ─────────────────────────────────────────────────────────
//  ADMIN — Torneos / Inscripciones / Fixture
// ─────────────────────────────────────────────────────────

export function createTorneo(payload, token) {
  return requestJson(buildUrl('/api/supercopa/admin/torneos'), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(payload),
  });
}

export function listTorneosAdmin(token) {
  return requestJson(buildUrl('/api/supercopa/admin/torneos'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function publicarTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/torneos/${torneoId}/publicar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function iniciarTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/torneos/${torneoId}/iniciar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function listInscripcionesTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/torneos/${torneoId}/inscripciones`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function aprobarInscripcion(torneoId, equipoTorneoId, token) {
  return requestJson(
    buildUrl(`/api/supercopa/admin/torneos/${torneoId}/inscripciones/${equipoTorneoId}/aprobar`),
    { method: 'POST', headers: authHeader(token) },
  );
}

export function rechazarInscripcion(torneoId, equipoTorneoId, motivo, token) {
  return requestJson(
    buildUrl(`/api/supercopa/admin/torneos/${torneoId}/inscripciones/${equipoTorneoId}/rechazar`),
    {
      method: 'POST',
      headers: authHeader(token, true),
      body: JSON.stringify({ motivo }),
    },
  );
}

export function generarFixture(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/torneos/${torneoId}/fixture`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function listPartidosTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/torneos/${torneoId}/partidos`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

// ─────────────────────────────────────────────────────────
//  ADMIN — Eventos de partido
// ─────────────────────────────────────────────────────────

export function listEventosPartido(partidoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/partidos/${partidoId}/eventos`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function crearEvento(partidoId, payload, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/partidos/${partidoId}/eventos`), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(payload),
  });
}

export function eliminarEvento(partidoId, eventoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/partidos/${partidoId}/eventos/${eventoId}`), {
    method: 'DELETE',
    headers: authHeader(token),
  });
}

export function cerrarPartido(partidoId, token) {
  return requestJson(buildUrl(`/api/supercopa/admin/partidos/${partidoId}/cerrar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

// ── HU44 — Gestión de plantel ─────────────────────────────

export function agregarMiembro(equipoTorneoId, payload, token) {
  return requestJson(
    buildUrl('/api/supercopa/delegado/equipo-torneo/${equipoTorneoId}/miembros'),
    {
      method: 'POST',
      headers: authHeader(token, true),
      body: JSON.stringify(payload),
    },
  );
}

export function removerMiembro(equipoTorneoId, cedula, token) {
  return requestJson(
    buildUrl('/api/supercopa/delegado/equipo-torneo/${equipoTorneoId}/miembros/${encodeURIComponent(cedula)}/remover'),
    { method: 'POST', headers: authHeader(token) },
  );
}

export function actualizarCamiseta(equipoTorneoId, cedula, numeroCamiseta, token) {
  return requestJson(
    buildUrl('/api/supercopa/delegado/equipo-torneo/${equipoTorneoId}/miembros/${encodeURIComponent(cedula)}/camiseta'),
    {
      method: 'PATCH',
      headers: authHeader(token, true),
      body: JSON.stringify({ numeroCamiseta }),
    },
  );
}
