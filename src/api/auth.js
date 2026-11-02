import { requestJson } from './http';
import { getToken } from '../utils/session';

// Endpoints de cuenta de BackendCodeCup (spec 0017). El token es el access token de Supabase.
function cabeceras(token, json = false) {
  const headers = { Authorization: `Bearer ${token ?? getToken()}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

/** 404 CUENTA_NO_REGISTRADA si todavía debe completar el registro. */
export function me(token) {
  return requestJson('/api/auth/me', { method: 'GET', headers: cabeceras(token) });
}

export function registro({ nombres, apellidos, tipoDocumento, numeroDocumento }, token) {
  return requestJson('/api/auth/registro', {
    method: 'POST',
    headers: cabeceras(token, true),
    body: JSON.stringify({ nombres, apellidos, tipoDocumento, numeroDocumento }),
  });
}

export function solicitarRol({ rol, motivoSolicitud }, token) {
  return requestJson('/api/auth/solicitar-rol', {
    method: 'POST',
    headers: cabeceras(token, true),
    body: JSON.stringify({ rol, motivoSolicitud }),
  });
}

export function aceptarInvitacion(tokenInvitacion, token) {
  return requestJson(`/api/auth/invitaciones/${encodeURIComponent(tokenInvitacion)}/aceptar`, {
    method: 'POST',
    headers: cabeceras(token),
  });
}
