import { teamColor, teamInitials } from '../../data/supercopa';

function BSlot({ name, score, isWinner }) {
  const isTbd = !name;
  const color = teamColor(name);
  return (
    <div className={`b-slot${isWinner ? ' winner' : ''}${isTbd ? ' tbd' : ''}`}>
      <div
        className="b-slot-avatar"
        style={{ background: `${color}28`, border: `1px solid ${color}44` }}
      >
        {isTbd ? '?' : teamInitials(name)}
      </div>
      <span className="b-slot-name">{name || 'Por definir'}</span>
      {score !== null && score !== undefined && (
        <span className="b-slot-score">{score}</span>
      )}
    </div>
  );
}

function BMatch({ t1, t2, s1 = null, s2 = null }) {
  const w1 = s1 !== null && s2 !== null && s1 > s2;
  const w2 = s1 !== null && s2 !== null && s2 > s1;
  return (
    <div className="b-match">
      <BSlot name={t1} score={s1} isWinner={w1} />
      <div className="b-match-line" />
      <BSlot name={t2} score={s2} isWinner={w2} />
    </div>
  );
}

function Connector({ rows = 4 }) {
  return (
    <div className="bracket-connector">
      {Array.from({ length: rows }).map((_, i) => <div key={i} />)}
    </div>
  );
}

function Bracket({ groupA, groupB }) {
  const a = groupA;
  const b = groupB;

  const d1 = a[0]?.team;
  const d2 = a[1]?.team;
  const d3 = b[0]?.team;
  const d4 = b[1]?.team;

  const repMatches = [
    [a[3]?.team, b[2]?.team],
    [a[2]?.team, b[3]?.team],
    [a[5]?.team, b[4]?.team],
    [a[4]?.team, b[5]?.team],
  ];

  const qfMatches = [
    [d1, 'Gan. Rep. 1'],
    [d3, 'Gan. Rep. 2'],
    [d2, 'Gan. Rep. 3'],
    [d4, 'Gan. Rep. 4'],
  ];

  const sfMatches = [
    ['Gan. CF 1', 'Gan. CF 2'],
    ['Gan. CF 3', 'Gan. CF 4'],
  ];

  return (
    <div className="bracket-wrap">
      <div className="bracket">
        <div className="bracket-round">
          <div className="bracket-round-label label-rep">Repechaje</div>
          <div className="bracket-slots">
            {repMatches.map(([t1, t2], i) => (
              <BMatch key={`rep-${i}`} t1={t1} t2={t2} />
            ))}
          </div>
        </div>

        <Connector rows={4} />

        <div className="bracket-round">
          <div className="bracket-round-label label-qf">Cuartos de Final</div>
          <div className="bracket-slots">
            {qfMatches.map(([t1, t2], i) => (
              <BMatch key={`qf-${i}`} t1={t1} t2={t2} />
            ))}
          </div>
        </div>

        <Connector rows={4} />

        <div className="bracket-round">
          <div className="bracket-round-label label-sf">Semifinales</div>
          <div className="bracket-slots" style={{ justifyContent: 'center', gap: 48 }}>
            {sfMatches.map(([t1, t2], i) => (
              <BMatch key={`sf-${i}`} t1={t1} t2={t2} />
            ))}
          </div>
        </div>

        <Connector rows={2} />

        <div className="bracket-round">
          <div className="bracket-round-label label-final">Final</div>
          <div className="bracket-slots" style={{ justifyContent: 'center' }}>
            <BMatch t1="Gan. SF 1" t2="Gan. SF 2" />
          </div>
        </div>

        <div className="bracket-trophy">
          <div className="bracket-trophy-icon">🏆</div>
          <div className="bracket-trophy-label">Campeón</div>
        </div>
      </div>
    </div>
  );
}

export default Bracket;
