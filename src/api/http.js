import { cerrarSesion, renovarSesion } from '../lib/supabase';
import { irA } from '../utils/navegacion';

const GATEWAY_ORIGIN = import.meta.env.VITE_GATEWAY_URL ?? '';

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text ? { mensaje: text } : {};
}

function claveAuthorization(headers) {
  return Object.keys(headers || {}).find((k) => k.toLowerCase() === 'authorization');
}

function tieneAuthorization(headers) {
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has('Authorization');
  return Boolean(claveAuthorization(headers));
}

function conTokenNuevo(headers, token) {
  if (headers instanceof Headers) {
    const copia = new Headers(headers);
    copia.set('Authorization', `Bearer ${token}`);
    return copia;
  }
  return { ...headers, [claveAuthorization(headers) || 'Authorization']: `Bearer ${token}` };
}

function crearError(response, body) {
  const error = new Error(body?.mensaje || body?.error || 'Error en la solicitud.');
  error.status = response.status;
  error.body = body;
  return error;
}

/**
 * fetch + JSON. Spec 0019:
 * - ante un 401 de una petición autenticada, renueva la sesión y la reintenta UNA vez;
 *   si no se puede renovar, cierra la sesión y lleva al login;
 * - ante 403 CUENTA_BLOQUEADA, cierra la sesión y lleva al login con el aviso.
 */
export async function requestJson(path, options = {}) {
  const url = /^https?:\/\//i.test(path) ? path : `${GATEWAY_ORIGIN}${path}`;
  let response = await fetch(url, options);
  let body = await parseBody(response);

  if (response.status === 401 && tieneAuthorization(options.headers)) {
    const tokenNuevo = await renovarSesion();
    if (!tokenNuevo) {
      await cerrarSesion();
      irA('/login?aviso=sesion-vencida');
      throw crearError(response, body);
    }
    response = await fetch(url, { ...options, headers: conTokenNuevo(options.headers, tokenNuevo) });
    body = await parseBody(response);
  }

  if (response.status === 403 && body?.code === 'CUENTA_BLOQUEADA') {
    await cerrarSesion();
    irA('/login?aviso=bloqueada');
  }

  if (!response.ok) {
    throw crearError(response, body);
  }

  return body;
}
