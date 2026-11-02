import { me } from '../api/auth';
import { cerrarSesion } from '../lib/supabase';
import { MENSAJE_BLOQUEADA, MENSAJE_SIN_ADMIN } from './erroresAuth';
import {
  clearLoginRole,
  getInvitacionPendiente,
  guardarSesionDesdeMe,
  normalizeRole,
  pickPrimaryRole,
} from './session';

export const RUTA_POR_ROL = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
  JUGADOR: '/dashboard/jugador',
};

export const NOMBRE_ROL = {
  ADMINISTRADOR: 'Administrador',
  ARBITRO: 'Árbitro',
  DELEGADO: 'Delegado',
  JUGADOR: 'Jugador',
};

/**
 * A dónde entra alguien según GET /api/auth/me y el rol elegido con los íconos del login.
 * - `entrar`: tiene el rol (o no eligió) → su dashboard.
 * - `sin-admin`: eligió Administrador sin tenerlo → no entra (como antes).
 * - `pendiente`: eligió Delegado/Árbitro y ya lo pidió → espera.
 * - `solicitar`: eligió Delegado/Árbitro y no lo ha pedido → lo solicita.
 */
export function resolverDestino(datos, rolElegido) {
  const roles = (datos?.roles || []).map(normalizeRole);
  const pendientes = (datos?.rolesPendientes || []).map(normalizeRole);
  const elegido = normalizeRole(rolElegido);

  if (elegido && roles.includes(elegido)) {
    return { tipo: 'entrar', rol: elegido, ruta: RUTA_POR_ROL[elegido] };
  }
  if (elegido === 'ADMINISTRADOR') return { tipo: 'sin-admin' };
  if (elegido === 'DELEGADO' || elegido === 'ARBITRO') {
    return pendientes.includes(elegido) ? { tipo: 'pendiente', rol: elegido } : { tipo: 'solicitar', rol: elegido };
  }

  const principal = pickPrimaryRole(roles);
  if (principal && RUTA_POR_ROL[principal]) {
    return { tipo: 'entrar', rol: principal, ruta: RUTA_POR_ROL[principal] };
  }
  return { tipo: 'pendiente', rol: pendientes[0] || null };
}

/**
 * Lo que pasa después de tener sesión de Supabase (login, Google o enlace del correo):
 * pregunta /me y navega. Devuelve `{ error }` cuando la pantalla debe mostrar un mensaje.
 */
export async function despuesDeEntrar({ navigate, rolElegido }) {
  let datos;
  try {
    datos = await me();
  } catch (err) {
    if (err?.status === 404) {
      navigate('/complete-signup', { replace: true });
      return {};
    }
    if (err?.body?.code === 'CUENTA_BLOQUEADA') {
      await cerrarSesion();
      return { error: MENSAJE_BLOQUEADA };
    }
    throw err;
  }

  const invitacion = getInvitacionPendiente();
  if (invitacion) {
    navigate(`/invitacion/${encodeURIComponent(invitacion)}`, { replace: true });
    return {};
  }

  const destino = resolverDestino(datos, rolElegido);
  if (destino.tipo === 'sin-admin') {
    await cerrarSesion();
    return { error: MENSAJE_SIN_ADMIN };
  }
  if (destino.tipo === 'pendiente') {
    guardarSesionDesdeMe(datos, null);
    navigate('/pending', { replace: true });
    return {};
  }
  if (destino.tipo === 'solicitar') {
    guardarSesionDesdeMe(datos, null);
    navigate(`/complete-signup?tipo=${destino.rol}`, { replace: true });
    return {};
  }

  guardarSesionDesdeMe(datos, destino.rol);
  clearLoginRole();
  navigate(destino.ruta, { replace: true });
  return {};
}
