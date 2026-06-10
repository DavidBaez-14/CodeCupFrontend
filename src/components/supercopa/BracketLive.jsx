import MatchCard from './MatchCard';

const FASE_LABEL = {
  REPECHAJE: 'Repechaje',
  OCTAVOS: 'Octavos de Final',
  CUARTOS: 'Cuartos de Final',
  SEMIS: 'Semifinales',
  FINAL: 'Final',
  TERCER_PUESTO: 'Tercer puesto',
};

const FASE_ORDEN = ['REPECHAJE', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL', 'TERCER_PUESTO'];

const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
  DESCANSO: 'descanso',
};

/**
 * Bracket dinámico que dibuja las fases KO a partir de partidos reales.
 * Cada columna es una fase. Las cards muestran "Por definir" cuando no hay equipo.
 */
function BracketLive({ partidos, onOpenPartido }) {
  // Solo fases KO
  const koPartidos = partidos.filter(
    (p) => p.fase && p.fase !== 'GRUPOS'
  );

  if (koPartidos.length === 0) {
    return (
      <div className="bl-empty">
        <p className="bl-empty-title">Sin eliminatorias todavía</p>
        <p className="bl-empty-desc">
          El bracket aparece aquí cuando se termine la fase de grupos. El sistema asigna
          automáticamente los clasificados a sus cruces siguiendo el reglamento.
        </p>
      </div>
    );
  }

  const porFase = new Map();
  for (const p of koPartidos) {
    if (!porFase.has(p.fase)) porFase.set(p.fase, []);
    porFase.get(p.fase).push(p);
  }
  for (const lista of porFase.values()) {
    lista.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
  }
  const columnas = FASE_ORDEN.filter((f) => porFase.has(f));

  return (
    <div className="bl-wrap">
      {columnas.map((fase) => (
        <div key={fase} className="bl-column">
          <div className="bl-column-head">{FASE_LABEL[fase] || fase}</div>
          <div className="bl-cards">
            {porFase.get(fase).map((p, idx) => {
              const hora = p.fecha ? new Date(p.fecha).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit',
              }) : '';
              const match = {
                home: p.localNombre || 'Por definir',
                away: p.visitanteNombre || 'Por definir',
                scoreH: ['FINALIZADO', 'EN_CURSO', 'WO'].includes(p.estado) ? p.golesLocal : null,
                scoreA: ['FINALIZADO', 'EN_CURSO', 'WO'].includes(p.estado) ? p.golesVisitante : null,
                status: STATUS_MAP[p.estado] || 'upcoming',
                date: p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short',
                }) : '',
              };
              const canOpen = p.estado !== 'DESCANSO'
                && p.localEquipoTorneoId
                && p.visitanteEquipoTorneoId;
              const label = etiquetaCruce(fase, idx, porFase.get(fase).length);
              return (
                <div key={p.id} className="bl-card">
                  {label && <div className="bl-card-label">{label}</div>}
                  <MatchCard
                    match={match}
                    hora={hora}
                    onOpen={canOpen && onOpenPartido ? () => onOpenPartido(p) : null}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function etiquetaCruce(fase, idx, total) {
  if (fase === 'REPECHAJE') return `R${idx + 1}`;
  if (fase === 'CUARTOS') return `C${idx + 1}`;
  if (fase === 'SEMIS') return `SF${idx + 1}`;
  if (fase === 'FINAL' && total === 1) return 'Final';
  if (fase === 'TERCER_PUESTO') return '3er puesto';
  return '';
}

export default BracketLive;
