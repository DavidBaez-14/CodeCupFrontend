// Valores permitidos del perfil deportivo del jugador (MS2).
// Espejo de las constantes que valida PerfilService.actualizarPerfilDeportivo
// en el backend.

export const PIERNAS = [
  { value: 'DERECHA', label: 'Derecha' },
  { value: 'IZQUIERDA', label: 'Izquierda' },
  { value: 'AMBIDIESTRO', label: 'Ambidiestro' },
];

export const POSICIONES = [
  { value: 'PORTERO', label: 'Portero' },
  { value: 'DEFENSA', label: 'Defensa' },
  { value: 'MEDIOCAMPISTA', label: 'Mediocampista' },
  { value: 'DELANTERO', label: 'Delantero' },
];

export const ALTURA_MIN = 100;
export const ALTURA_MAX = 250;

export function perfilDeportivoCompleto(perfil) {
  if (!perfil) return false;
  return Number.isFinite(Number(perfil.alturaCm))
    && typeof perfil.piernaHabil === 'string' && perfil.piernaHabil.trim() !== ''
    && typeof perfil.posicion === 'string' && perfil.posicion.trim() !== '';
}
