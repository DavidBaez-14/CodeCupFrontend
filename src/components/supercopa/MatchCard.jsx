import { teamColor, teamInitials } from '../../data/supercopa';

const STATUS_LABEL = {
  played: 'Finalizado',
  upcoming: 'Próximo',
  live: 'En Vivo',
  descanso: 'Descanso',
};

function MatchCard({ match, hora, onOpen }) {
  const hasScore = match.scoreH !== null && match.scoreH !== undefined;
  const esDescanso = match.status === 'descanso';
  const hc = teamColor(match.home);
  const ac = teamColor(match.away);

  const motivoDescanso = match.motivoDescanso
    || 'Partido no jugado porque un equipo fue descalificado del torneo. No suma puntos ni goles para el rival.';

  return (
    <div className="match-card-wrap">
      <button
        type="button"
        className={`match-card ${match.status}`}
        onClick={onOpen || undefined}
        disabled={!onOpen}
      >
        <div className="match-team">
          <div
            className="match-team-avatar"
            style={{ background: `${hc}22`, borderColor: `${hc}44` }}
          >
            {teamInitials(match.home)}
          </div>
          <div className="match-team-name">{match.home}</div>
        </div>

        <div className="match-center">
          {esDescanso ? (
            <span className="match-vs">—</span>
          ) : hasScore ? (
            <span className="match-score">
              {match.scoreH}
              <span className="match-score-sep">–</span>
              {match.scoreA}
            </span>
          ) : (
            <span className="match-vs">vs</span>
          )}
          <span className={`match-status-chip ${match.status}`}>
            {STATUS_LABEL[match.status] ?? '—'}
          </span>
          <span className="match-date">
            {match.date}
            {hora ? ` · ${hora}` : ''}
          </span>
        </div>

        <div className="match-team away">
          <div
            className="match-team-avatar"
            style={{ background: `${ac}22`, borderColor: `${ac}44` }}
          >
            {teamInitials(match.away)}
          </div>
          <div className="match-team-name">{match.away}</div>
        </div>
      </button>

      {esDescanso && (
        <div className="match-descanso-note" role="note">
          <span className="match-descanso-icon" aria-hidden="true">⚠</span>
          {motivoDescanso}
        </div>
      )}
    </div>
  );
}

export default MatchCard;
