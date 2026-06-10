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
//  MULTAS
// ─────────────────────────────────────────────────────────

export function getMultasTorneo(torneoId, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/torneo/${torneoId}`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getBolsaMultas(torneoId, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/torneo/${torneoId}/bolsa`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getElegibilidadDetalle(cedula, torneoId, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/elegibilidad/${encodeURIComponent(cedula)}/detalle?torneoId=${torneoId}`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getMultasPendientesJugador(cedula, torneoId, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/jugador/${encodeURIComponent(cedula)}/pendientes?torneoId=${torneoId}`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getBloqueadosPartido(partidoId, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/partido/${partidoId}/bloqueados`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function registrarPagoTodas(cedula, body, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/jugador/${encodeURIComponent(cedula)}/registrar-pago-todas`), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(body),
  });
}

export function habilitarExcepcion(multaId, body, token) {
  return requestJson(buildUrl(`/api/finanzas/multas/${multaId}/habilitar-excepcion`), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────
//  COMPROBANTES
// ─────────────────────────────────────────────────────────

export function getComprobantesPendientes(token) {
  return requestJson(buildUrl('/api/finanzas/comprobantes/pendientes'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function aprobarComprobante(id, token) {
  return requestJson(buildUrl(`/api/finanzas/comprobantes/${id}/aprobar`), {
    method: 'POST',
    headers: authHeader(token),
  });
}

export function rechazarComprobante(id, motivo, token) {
  return requestJson(buildUrl(`/api/finanzas/comprobantes/${id}/rechazar`), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify({ motivo }),
  });
}

export function getDownloadUrl(id, token) {
  return requestJson(buildUrl(`/api/finanzas/comprobantes/${id}/download-url`), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function getMisComprobantes(token) {
  return requestJson(buildUrl('/api/finanzas/comprobantes/mis-comprobantes'), {
    method: 'GET',
    headers: authHeader(token),
  });
}

export function solicitarUploadUrl(body, token) {
  return requestJson(buildUrl('/api/finanzas/comprobantes/upload-url'), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(body),
  });
}

export function subirComprobante(body, token) {
  return requestJson(buildUrl('/api/finanzas/comprobantes'), {
    method: 'POST',
    headers: authHeader(token, true),
    body: JSON.stringify(body),
  });
}
