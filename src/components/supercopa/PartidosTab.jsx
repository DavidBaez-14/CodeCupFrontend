import { useState } from 'react';
import { JORNADAS, buildMatchKey } from '../../data/supercopa';
import MatchCard from './MatchCard';

function PartidosTab({ onOpenMatch }) {
  const [activeId, setActiveId] = useState(JORNADAS[0]?.id);
  const active = JORNADAS.find((j) => j.id === activeId) ?? JORNADAS[0];

  return (
    <div className="content-section">
      <div className="jornada-carousel-wrap">
        <div className="jornada-carousel">
          {JORNADAS.map((j) => (
            <button
              key={j.id}
              type="button"
              className={`jornada-card${j.id === active.id ? ' active' : ''}`}
              onClick={() => setActiveId(j.id)}
            >
              <span className="jc-grupo">Grupo {j.grupo}</span>
              <span className="jc-fecha">F{j.fecha}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="jornada-header">
          Fecha {active.fecha} · Grupo {active.grupo}
        </div>
        <div className="matches-list">
          {active.partidos.map((m, idx) => (
            <MatchCard
              key={`${active.id}-${idx}`}
              match={m}
              hora={active.hora}
              onOpen={() => onOpenMatch(buildMatchKey(active.id, idx))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PartidosTab;
