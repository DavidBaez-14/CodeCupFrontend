export const TEAM_COLORS = {
  Colombia: '#1d6ff5',
  Brasil: '#facc15',
  Portugal: '#22c55e',
  Inglaterra: '#ef4444',
  Francia: '#60a5fa',
  Marruecos: '#f97316',
  Noruega: '#a78bfa',
  Argentina: '#38bdf8',
  Bélgica: '#fb7185',
  'Combo de TITI': '#ff5500',
  Japón: '#e879f9',
  Alemania: '#9898a8',
  'Países Bajos': '#f59e0b',
};

export const TEAM_CAPTAINS = {
  Colombia: 'Fredy Vera',
  Brasil: 'Brian Delgado',
  Portugal: 'Dayler Carreño',
  Inglaterra: 'Brayan Rodríguez',
  Francia: 'Néider Moreno',
  Marruecos: 'Julian Soler',
  Noruega: 'Abisaid Gómez',
  Argentina: 'David Peñaranda',
  Bélgica: 'Samuel',
  'Combo de TITI': 'Edward Camargo',
  Japón: 'Santiago Moreno',
  Alemania: 'Brayan Vera',
  'Países Bajos': 'Mauricio Di Donato',
};

export const SAMPLE_STATS_A = [
  { team: 'Inglaterra',    pts: 6, pj: 3, pg: 2, pe: 0, pp: 1, gf: 8,  gc: 4, form: ['W', 'W', 'L'] },
  { team: 'Argentina',     pts: 6, pj: 3, pg: 2, pe: 0, pp: 1, gf: 6,  gc: 5, form: ['W', 'L', 'W'] },
  { team: 'Francia',       pts: 5, pj: 3, pg: 1, pe: 2, pp: 0, gf: 5,  gc: 3, form: ['D', 'W', 'D'] },
  { team: 'Combo de TITI', pts: 4, pj: 3, pg: 1, pe: 1, pp: 1, gf: 7,  gc: 6, form: ['W', 'D', 'L'] },
  { team: 'Bélgica',       pts: 3, pj: 3, pg: 1, pe: 0, pp: 2, gf: 4,  gc: 7, form: ['L', 'W', 'L'] },
  { team: 'Japón',         pts: 2, pj: 3, pg: 0, pe: 2, pp: 1, gf: 3,  gc: 5, form: ['D', 'D', 'L'] },
  { team: 'Países Bajos',  pts: 1, pj: 3, pg: 0, pe: 1, pp: 2, gf: 2,  gc: 5, form: ['L', 'L', 'D'] },
];

export const SAMPLE_STATS_B = [
  { team: 'Brasil',    pts: 9, pj: 3, pg: 3, pe: 0, pp: 0, gf: 11, gc: 2, form: ['W', 'W', 'W'] },
  { team: 'Colombia',  pts: 6, pj: 3, pg: 2, pe: 0, pp: 1, gf: 8,  gc: 5, form: ['W', 'W', 'L'] },
  { team: 'Portugal',  pts: 4, pj: 3, pg: 1, pe: 1, pp: 1, gf: 5,  gc: 5, form: ['D', 'W', 'L'] },
  { team: 'Marruecos', pts: 3, pj: 3, pg: 1, pe: 0, pp: 2, gf: 4,  gc: 8, form: ['W', 'L', 'L'] },
  { team: 'Noruega',   pts: 2, pj: 3, pg: 0, pe: 2, pp: 1, gf: 3,  gc: 4, form: ['D', 'L', 'D'] },
  { team: 'Alemania',  pts: 1, pj: 3, pg: 0, pe: 1, pp: 2, gf: 2,  gc: 9, form: ['L', 'D', 'L'] },
];

export const JORNADAS = [
  {
    id: 'j1a', fecha: 1, grupo: 'A', hora: '11:00 AM',
    partidos: [
      { home: 'Inglaterra',    away: 'Francia',       scoreH: 3, scoreA: 1, status: 'played',   date: 'Abr 28' },
      { home: 'Combo de TITI', away: 'Japón',         scoreH: 4, scoreA: 1, status: 'played',   date: 'Abr 28' },
      { home: 'Argentina',     away: 'Bélgica',       scoreH: 2, scoreA: 0, status: 'played',   date: 'Abr 28' },
      { home: 'Países Bajos',  away: 'Francia',       scoreH: null, scoreA: null, status: 'upcoming', date: 'Abr 28' },
    ],
  },
  {
    id: 'j1b', fecha: 1, grupo: 'B', hora: '2:00 PM',
    partidos: [
      { home: 'Colombia', away: 'Marruecos', scoreH: 2, scoreA: 1, status: 'played', date: 'Abr 29' },
      { home: 'Brasil',   away: 'Alemania',  scoreH: 4, scoreA: 0, status: 'played', date: 'Abr 29' },
      { home: 'Portugal', away: 'Noruega',   scoreH: 1, scoreA: 1, status: 'played', date: 'Abr 29' },
    ],
  },
  {
    id: 'j2a', fecha: 2, grupo: 'A', hora: '11:00 AM',
    partidos: [
      { home: 'Inglaterra',    away: 'Combo de TITI', scoreH: null, scoreA: null, status: 'upcoming', date: 'May 12' },
      { home: 'Francia',       away: 'Japón',         scoreH: null, scoreA: null, status: 'upcoming', date: 'May 12' },
      { home: 'Argentina',     away: 'Países Bajos',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 12' },
      { home: 'Bélgica',       away: 'Noruega',       scoreH: null, scoreA: null, status: 'upcoming', date: 'May 12' },
    ],
  },
  {
    id: 'j2b', fecha: 2, grupo: 'B', hora: '2:00 PM',
    partidos: [
      { home: 'Brasil',   away: 'Colombia',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 13' },
      { home: 'Portugal', away: 'Alemania',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 13' },
      { home: 'Noruega',  away: 'Marruecos', scoreH: null, scoreA: null, status: 'upcoming', date: 'May 13' },
    ],
  },
  {
    id: 'j3a', fecha: 3, grupo: 'A', hora: '11:00 AM',
    partidos: [
      { home: 'Japón',         away: 'Bélgica',       scoreH: null, scoreA: null, status: 'upcoming', date: 'May 19' },
      { home: 'Países Bajos',  away: 'Inglaterra',    scoreH: null, scoreA: null, status: 'upcoming', date: 'May 19' },
      { home: 'Combo de TITI', away: 'Francia',       scoreH: null, scoreA: null, status: 'upcoming', date: 'May 19' },
      { home: 'Argentina',     away: 'Bélgica',       scoreH: null, scoreA: null, status: 'upcoming', date: 'May 19' },
    ],
  },
  {
    id: 'j3b', fecha: 3, grupo: 'B', hora: '2:00 PM',
    partidos: [
      { home: 'Alemania',  away: 'Colombia',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 20' },
      { home: 'Marruecos', away: 'Brasil',    scoreH: null, scoreA: null, status: 'upcoming', date: 'May 20' },
      { home: 'Noruega',   away: 'Portugal',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 20' },
    ],
  },
  {
    id: 'j4a', fecha: 4, grupo: 'A', hora: '11:00 AM',
    partidos: [
      { home: 'Bélgica',  away: 'Inglaterra',    scoreH: null, scoreA: null, status: 'upcoming', date: 'May 26' },
      { home: 'Francia',  away: 'Países Bajos',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 26' },
      { home: 'Japón',    away: 'Argentina',     scoreH: null, scoreA: null, status: 'upcoming', date: 'May 26' },
    ],
  },
  {
    id: 'j4b', fecha: 4, grupo: 'B', hora: '2:00 PM',
    partidos: [
      { home: 'Colombia', away: 'Portugal',  scoreH: null, scoreA: null, status: 'upcoming', date: 'May 27' },
      { home: 'Brasil',   away: 'Noruega',   scoreH: null, scoreA: null, status: 'upcoming', date: 'May 27' },
      { home: 'Alemania', away: 'Marruecos', scoreH: null, scoreA: null, status: 'upcoming', date: 'May 27' },
    ],
  },
];

export const GOLEADORES = [
  { name: 'Carlos A.',    team: 'Brasil',        pj: 3, goles: 5, initials: 'CA' },
  { name: 'Brayan R.',    team: 'Inglaterra',    pj: 3, goles: 4, initials: 'BR' },
  { name: 'E. Camargo',   team: 'Combo de TITI', pj: 3, goles: 3, initials: 'EC' },
  { name: 'Fredy V.',     team: 'Colombia',      pj: 3, goles: 3, initials: 'FV' },
  { name: 'D. Peñaranda', team: 'Argentina',     pj: 3, goles: 2, initials: 'DP' },
  { name: 'Santiago M.',  team: 'Japón',         pj: 3, goles: 2, initials: 'SM' },
  { name: 'Dayler C.',    team: 'Portugal',      pj: 3, goles: 1, initials: 'DC' },
  { name: 'B. Delgado',   team: 'Brasil',        pj: 3, goles: 1, initials: 'BD' },
];

export const TARJETAS = [
  { name: 'B. Delgado', team: 'Brasil',    pj: 3, amarillas: 2, azules: 0, rojas: 0, initials: 'BD' },
  { name: 'Julian S.',  team: 'Marruecos', pj: 3, amarillas: 2, azules: 1, rojas: 0, initials: 'JS' },
  { name: 'Abisaid G.', team: 'Noruega',   pj: 3, amarillas: 1, azules: 0, rojas: 1, initials: 'AG' },
  { name: 'Brayan V.',  team: 'Alemania',  pj: 3, amarillas: 1, azules: 1, rojas: 0, initials: 'BV' },
  { name: 'Samuel',     team: 'Bélgica',   pj: 3, amarillas: 1, azules: 0, rojas: 0, initials: 'SA' },
  { name: 'Néider M.',  team: 'Francia',   pj: 3, amarillas: 0, azules: 1, rojas: 1, initials: 'NM' },
];

export function teamInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function teamColor(name) {
  return TEAM_COLORS[name] || '#3d4f80';
}

export function buildGlobalStandings() {
  const all = [...SAMPLE_STATS_A, ...SAMPLE_STATS_B];
  return all.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const dgA = a.gf - a.gc;
    const dgB = b.gf - b.gc;
    if (dgB !== dgA) return dgB - dgA;
    return b.gf - a.gf;
  });
}

export function findMatch(matchKey) {
  if (!matchKey) return null;
  const [jornadaId, idxStr] = matchKey.split('-');
  const jornada = JORNADAS.find((j) => j.id === jornadaId);
  if (!jornada) return null;
  const idx = parseInt(idxStr, 10);
  const partido = jornada.partidos[idx];
  if (!partido) return null;
  return { jornada, partido, idx };
}

export function buildMatchKey(jornadaId, idx) {
  return `${jornadaId}-${idx}`;
}
