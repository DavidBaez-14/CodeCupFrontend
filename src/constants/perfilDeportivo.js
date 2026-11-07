// Valores permitidos del perfil deportivo del jugador (MS2).
// Espejo de las constantes que valida PerfilService.actualizarPerfilDeportivo
// en el backend. Los tres datos son opcionales (spec 0020).

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
