import { useState } from 'react';
import {
  SAMPLE_STATS_A,
  SAMPLE_STATS_B,
  buildGlobalStandings,
} from '../../data/supercopa';
import StandingsTable from './StandingsTable';
import Bracket from './Bracket';

const VIEWS = [
  { id: 'grupoA',        label: 'Grupo A' },
  { id: 'grupoB',        label: 'Grupo B' },
  { id: 'global',        label: 'Global' },
  { id: 'eliminatorias', label: 'Eliminatorias' },
];

function InfoNote({ children }) {
  return (
    <div className="info-note">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {children}
    </div>
  );
}

function GroupLabel({ pill, label, count }) {
  return (
    <div className="group-label">
      {pill && <span className="group-pill">{pill}</span>}
      {label}
      {count != null && <span className="group-count">{count} equipos</span>}
    </div>
  );
}

function ClasificacionTab() {
  const [view, setView] = useState('grupoA');
  const global = buildGlobalStandings();

  return (
    <div className="content-section">
      <div className="subtabs-wrap">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`subtab-btn${view === v.id ? ' active' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'grupoA' && (
        <>
          <GroupLabel pill="A" label="Grupo A" count={SAMPLE_STATS_A.length} />
          <InfoNote>
            Los 2 primeros de cada grupo avanzan a semifinales · Las insignias muestran los últimos 3 partidos
          </InfoNote>
          <StandingsTable data={SAMPLE_STATS_A} />
        </>
      )}

      {view === 'grupoB' && (
        <>
          <GroupLabel pill="B" label="Grupo B" count={SAMPLE_STATS_B.length} />
          <InfoNote>
            Los 2 primeros de cada grupo avanzan a semifinales · Las insignias muestran los últimos 3 partidos
          </InfoNote>
          <StandingsTable data={SAMPLE_STATS_B} />
        </>
      )}

      {view === 'global' && (
        <>
          <GroupLabel label="Clasificación Global" count={global.length} />
          <InfoNote>Ambos grupos combinados — ordenados por puntos totales</InfoNote>
          <StandingsTable data={global} />
        </>
      )}

      {view === 'eliminatorias' && (
        <>
          <GroupLabel label="Fase Eliminatoria" />
          <Bracket groupA={SAMPLE_STATS_A} groupB={SAMPLE_STATS_B} />
        </>
      )}
    </div>
  );
}

export default ClasificacionTab;
