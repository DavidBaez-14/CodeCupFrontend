import { TEAM_CAPTAINS, teamColor, teamInitials } from '../../data/supercopa';

function dgClass(dg) {
  if (dg > 0) return 'dg-pos';
  if (dg < 0) return 'dg-neg';
  return 'dg-neu';
}

function PosIndicator({ pos, total }) {
  if (pos <= 2) return <div className="pos-indicator pos-top2" />;
  if (pos >= total - 1) return <div className="pos-indicator pos-bottom" />;
  return <div className="pos-indicator pos-mid" />;
}

function FormBadges({ form }) {
  return (
    <div className="form-badges">
      {form.map((r, i) => (
        <div key={i} className={`form-badge ${r}`}>{r}</div>
      ))}
    </div>
  );
}

function TeamAvatar({ name, size = 28 }) {
  const color = teamColor(name);
  return (
    <div
      className="team-avatar"
      style={{
        background: `${color}22`,
        borderColor: `${color}44`,
        width: size,
        height: size,
      }}
    >
      {teamInitials(name)}
    </div>
  );
}

function StandingsTable({ data }) {
  const total = data.length;
  return (
    <div className="table-scroll">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="col-team">Equipo</th>
            <th className="col-pts">Pts</th>
            <th>J</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th className="win-pct-cell">%V</th>
            <th>Forma</th>
          </tr>
        </thead>
        <tbody>
          {data.map((t, i) => {
            const pos = i + 1;
            const dg = t.gf - t.gc;
            const pct = t.pj > 0 ? Math.round((t.pg / t.pj) * 100) : 0;
            const captain = TEAM_CAPTAINS[t.team] || '';
            return (
              <tr key={t.team}>
                <td className="col-team">
                  <div className="team-cell">
                    <PosIndicator pos={pos} total={total} />
                    <span className="team-pos">{pos}</span>
                    <TeamAvatar name={t.team} />
                    <div>
                      <div className="team-name">{t.team}</div>
                      <div className="team-country">{captain}</div>
                    </div>
                  </div>
                </td>
                <td className="col-pts"><strong>{t.pts}</strong></td>
                <td>{t.pj}</td>
                <td>{t.pg}</td>
                <td>{t.pe}</td>
                <td>{t.pp}</td>
                <td>{t.gf}</td>
                <td>{t.gc}</td>
                <td className={dgClass(dg)}>{dg > 0 ? '+' : ''}{dg}</td>
                <td className="win-pct-cell">
                  <div className="win-pct-bar-wrap">
                    <div className="win-pct-bar-bg">
                      <div className="win-pct-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="win-pct-val">{pct}%</span>
                  </div>
                </td>
                <td><FormBadges form={t.form} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { TeamAvatar };
export default StandingsTable;
