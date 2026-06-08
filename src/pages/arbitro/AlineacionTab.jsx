import { initials, teamColor } from './arbitroData';

function AlineacionTab({ match, onTogglePlayer, onAddAll, onCloseMatch }) {
  const closed = match.status === 'played';
  return (
    <div className="ar-detail-panel">
      <TeamSection
        side="home"
        match={match}
        onTogglePlayer={onTogglePlayer}
        onAddAll={onAddAll}
        disabled={closed}
      />
      <TeamSection
        side="away"
        match={match}
        onTogglePlayer={onTogglePlayer}
        onAddAll={onAddAll}
        disabled={closed}
      />

      <div className="ar-lineup-summary">
        <div className="ar-lineup-summary-card">
          <div className="ar-lineup-summary-label">{match.home}</div>
          <div className="ar-lineup-summary-val">
            <em>{match.onFieldHome?.length || 0}</em>
            <span> en cancha</span>
          </div>
        </div>
        <div className="ar-lineup-summary-card">
          <div className="ar-lineup-summary-label">{match.away}</div>
          <div className="ar-lineup-summary-val">
            <em>{match.onFieldAway?.length || 0}</em>
            <span> en cancha</span>
          </div>
        </div>
      </div>

      <div className="ar-close-match-wrap">
        <div className="ar-close-match-title">Finalizar partido</div>
        <div className="ar-close-match-sub">
          Al cerrar el partido el resultado quedará registrado en la fecha y ya no se podrán editar los eventos.
        </div>
        <button
          type="button"
          className={`ar-btn-close-match${closed ? ' done' : ''}`}
          onClick={onCloseMatch}
          disabled={closed}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {closed ? 'Partido cerrado' : 'Cerrar partido'}
        </button>
      </div>
    </div>
  );
}

function TeamSection({ side, match, onTogglePlayer, onAddAll, disabled }) {
  const isHome = side === 'home';
  const roster = isHome ? match.homeRoster : match.awayRoster;
  const onField = isHome ? match.onFieldHome : match.onFieldAway;
  const name = isHome ? match.home : match.away;
  const c = teamColor(name);

  const rosterArr = Array.isArray(roster) ? roster : [];

  const addableCount = rosterArr.filter(
    (p) => !onField?.includes(p.num),
  ).length;
  const allFull = addableCount === 0;

  return (
    <section className="ar-team-section">
      <header className="ar-team-section-header">
        <div className="ar-team-section-crest" style={{ background: `${c}22`, borderColor: `${c}55` }}>
          {initials(name)}
        </div>
        <div className="ar-team-section-name">{name}</div>

        <button
          type="button"
          className={`ar-btn-add-all${allFull ? ' full' : ''}`}
          onClick={() => onAddAll(side)}
          disabled={allFull || disabled}
          title="Agregar a todos los habilitados"
        >
          {allFull ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          {allFull ? 'Todos en cancha' : 'Agregar todos'}
        </button>

        <div className={`ar-team-section-counter${onField?.length === 0 ? ' warn' : ''}`}>
          {onField?.length || 0}/{rosterArr.length}
        </div>
      </header>

      <ul className="ar-player-list">
        {rosterArr.map((p) => (
          <PlayerRow
            key={`${side}-${p.num}`}
            player={p}
            side={side}
            onField={onField?.includes(p.num)}
            onToggle={() => onTogglePlayer(side, p.num)}
            disabled={disabled}
          />
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({ player: p, side, onField, onToggle, disabled }) {
  let cls = '';
  if (onField) cls = 'on-field';

  let actions;
  if (onField) {
    actions = (
      <button type="button" className="ar-btn-icon danger" onClick={onToggle} title="Quitar de cancha" disabled={disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    );
  } else {
    actions = (
      <button type="button" className="ar-btn-icon success" onClick={onToggle} title="Agregar a cancha" disabled={disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    );
  }

  return (
    <li className={`ar-player-row ${cls}`}>
      <div className="ar-player-num">{p.num}</div>
      <div className="ar-player-info">
        <div className="ar-player-name">{p.name}</div>
        <div className="ar-player-sub">
          {onField ? <span>En cancha</span> : <span>Fuera</span>}
        </div>
      </div>
      <div className="ar-player-actions">{actions}</div>
    </li>
  );
}

export default AlineacionTab;
