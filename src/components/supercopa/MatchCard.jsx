import { teamColor, teamInitials } from '../../data/supercopa';

const STATUS_LABEL = {
  played: 'Finalizado',
  upcoming: 'Próximo',
  live: 'En Vivo',
};

function MatchCard({ match, hora, onOpen }) {
  const hasScore = match.scoreH !== null && match.scoreH !== undefined;
  const hc = teamColor(match.home);
  const ac = teamColor(match.away);

  return (
    <button
      type="button"
      className={`match-card ${match.status}`}
      onClick={onOpen}
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
        {hasScore ? (
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
  );
}

export default MatchCard;
