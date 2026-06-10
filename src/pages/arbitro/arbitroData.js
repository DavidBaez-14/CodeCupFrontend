export const TEAM_COLORS = {
  'Inglaterra':    '#ef4444',
  'Francia':       '#60a5fa',
  'Combo de TITI': '#ff5500',
  'Japón':         '#e879f9',
  'Bélgica':       '#fb7185',
  'Argentina':     '#38bdf8',
  'Países Bajos':  '#f59e0b',
  'Colombia':      '#1d6ff5',
  'Brasil':        '#facc15',
  'Portugal':      '#22c55e',
  'Marruecos':     '#f97316',
  'Noruega':       '#a78bfa',
  'Alemania':      '#9898a8',
};

export const EVENT_LABELS = {
  gol:      'Gol',
  amarilla: 'T. Amarilla',
  azul:     'T. Azul',
  roja:     'T. Roja',
};

export function initials(name) {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return trimmed.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function teamColor(name) {
  if (!name) return '#3d4f80';
  return TEAM_COLORS[name] || '#3d4f80';
}
