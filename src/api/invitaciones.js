import { requestJson } from './http';
import { getToken } from '../utils/session';

/** Admin: crea una invitación (ADMINISTRADOR, ARBITRO o DELEGADO). Devuelve el enlace para compartir. */
export function invitarUsuario({ correo, rol }, token) {
  return requestJson('/api/admin/invitaciones', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? getToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, rol }),
  });
}
