import { initials, teamColor } from './arbitroData';

function MatchListView({ matches, jornadaFilter, onChangeFilter, onOpenMatch }) {
  const allLabels = Array.from(new Set(matches.map((m) => `F${m.fecha} · G${m.grupo}`))).sort();
  const pills = ['all', ...allLabels];

  const passes = (m) =>
    jornadaFilter === 'all' || `F${m.fecha} · G${m.grupo}` === jornadaFilter;

  const upcoming = matches.filter((m) => passes(m) && m.status !== 'played');
  const played   = matches.filter((m) => passes(m) && m.status === 'played');

  return (
    <div className="ar-view ar-view-list">
      <div className="ar-hero">
        <div className="ar-hero-inner">
          <span className="ar-role-tag">Árbitro</span>
          <h1 className="ar-hero-greeting">Hola, <em>Árbitro</em></h1>
          <p className="ar-hero-sub">
            Selecciona un partido para confirmar alineaciones, registrar eventos o reportar excepciones.
          </p>
        </div>
        <div className="ar-hero-divider" />
      </div>

      <div className="ar-match-list-wrap">
        <div className="ar-jornada-pills">
          {pills.map((p) => (
            <button
              key={p}
              type="button"
              className={`ar-jornada-pill${jornadaFilter === p ? ' active' : ''}`}
              onClick={() => onChangeFilter(p)}
            >
              {p === 'all' ? 'Todos' : p}
            </button>
          ))}
        </div>

        <div className="ar-section-label">Próximos</div>
        <div className="ar-matches">
          {upcoming.length
            ? upcoming.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpenMatch} />)
            : <div className="ar-list-empty">Sin partidos por jugar</div>}
        </div>

        <div className="ar-section-label">Finalizados</div>
        <div className="ar-matches">
          {played.length
            ? played.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpenMatch} />)
            : <div className="ar-list-empty">Aún no hay partidos finalizados</div>}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, onOpen }) {
  const m = match;
  const statusLabel = { played: 'Finalizado', upcoming: 'Por jugar', live: 'En vivo' }[m.status];
  const hc = teamColor(m.home);
  const ac = teamColor(m.away);

  return (
    <button
      type="button"
      className={`ar-match-card ${m.status}`}
      onClick={() => onOpen(m.id)}
    >
      <div className="ar-match-team">
        <div className="ar-match-team-avatar" style={{ background: `${hc}22`, borderColor: `${hc}44` }}>
          {initials(m.home)}
        </div>
        <div className="ar-match-team-name">{m.home}</div>
      </div>

      <div className="ar-match-center">
        {m.status === 'played'
          ? <span className="ar-match-score">{m.scoreH}<span className="ar-match-score-sep">–</span>{m.scoreA}</span>
          : <span className="ar-match-vs">vs</span>}
        <span className={`ar-match-status-chip ${m.status}`}>{statusLabel}</span>
        <span className="ar-match-date">{m.date} · {m.hora}</span>
      </div>

      <div className="ar-match-team away">
        <div className="ar-match-team-avatar" style={{ background: `${ac}22`, borderColor: `${ac}44` }}>
          {initials(m.away)}
        </div>
        <div className="ar-match-team-name">{m.away}</div>
      </div>
    </button>
  );
}

export default MatchListView;
