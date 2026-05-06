import { useState } from 'react';
import { GOLEADORES, TARJETAS, teamColor } from '../../data/supercopa';
import { TeamAvatar } from './StandingsTable';

function rankLabel(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}`;
}

function rankClass(i) {
  if (i === 0) return 'top1';
  if (i === 1) return 'top2';
  if (i === 2) return 'top3';
  return '';
}

function PlayerCell({ player, idx, withRankColor = true }) {
  const color = teamColor(player.team);
  return (
    <div className="player-cell">
      <span className={`player-rank ${withRankColor ? rankClass(idx) : ''}`}>
        {withRankColor ? rankLabel(idx) : idx + 1}
      </span>
      <div
        className="player-avatar"
        style={{ background: `${color}22`, borderColor: `${color}44` }}
      >
        {player.initials}
      </div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-team-name">{player.team}</span>
      </div>
    </div>
  );
}

function GoleadoresPanel() {
  const top = GOLEADORES[0];
  return (
    <div>
      {top && (
        <div className="top-scorer-banner">
          <div className="top-scorer-icon">⚽</div>
          <div className="top-scorer-info">
            <div className="top-scorer-eyebrow">Máximo Goleador</div>
            <div className="top-scorer-name">{top.name}</div>
            <div className="top-scorer-meta">
              {top.team} · {top.pj} partidos jugados
            </div>
          </div>
          <div>
            <div className="top-scorer-val">{top.goles}</div>
            <div className="top-scorer-val-lbl">Goles</div>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <table className="player-stats-table">
          <thead>
            <tr>
              <th className="col-player">Jugador</th>
              <th className="col-goles">Goles</th>
              <th>PJ</th>
              <th>Goles/PJ</th>
              <th>Equipo</th>
            </tr>
          </thead>
          <tbody>
            {GOLEADORES.map((p, i) => {
              const ratio = p.pj > 0 ? (p.goles / p.pj).toFixed(1) : '0.0';
              return (
                <tr key={`${p.name}-${i}`}>
                  <td className="col-player">
                    <PlayerCell player={p} idx={i} withRankColor />
                  </td>
                  <td className="col-goles">{p.goles}</td>
                  <td>{p.pj}</td>
                  <td style={{ color: 'rgba(255,255,255,0.55)' }}>{ratio}</td>
                  <td><TeamAvatar name={p.team} size={22} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TarjetasPanel() {
  return (
    <div className="table-scroll">
      <table className="player-stats-table">
        <thead>
          <tr>
            <th className="col-player">Jugador</th>
            <th><span className="card-yellow" /> Amarillas</th>
            <th><span className="card-blue" /> Azules</th>
            <th><span className="card-red" /> Rojas</th>
            <th>PJ</th>
            <th>Equipo</th>
          </tr>
        </thead>
        <tbody>
          {TARJETAS.map((p, i) => (
            <tr key={`${p.name}-${i}`}>
              <td className="col-player">
                <PlayerCell player={p} idx={i} withRankColor={false} />
              </td>
              <td>
                <span className="card-yellow" />
                <span className="card-count">{p.amarillas}</span>
              </td>
              <td>
                <span className="card-blue" />
                <span className="card-count">{p.azules}</span>
              </td>
              <td>
                <span className="card-red" />
                <span className="card-count">{p.rojas}</span>
              </td>
              <td>{p.pj}</td>
              <td><TeamAvatar name={p.team} size={22} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstadisticasTab() {
  const [view, setView] = useState('goleadores');

  return (
    <div className="content-section">
      <div className="subtabs-wrap">
        <button
          type="button"
          className={`subtab-btn${view === 'goleadores' ? ' active' : ''}`}
          onClick={() => setView('goleadores')}
        >
          Goleadores
        </button>
        <button
          type="button"
          className={`subtab-btn${view === 'tarjetas' ? ' active' : ''}`}
          onClick={() => setView('tarjetas')}
        >
          Tarjetas
        </button>
      </div>

      {view === 'goleadores' ? <GoleadoresPanel /> : <TarjetasPanel />}
    </div>
  );
}

export default EstadisticasTab;
