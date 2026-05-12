import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { findMatch, teamColor, teamInitials } from '../data/supercopa';
import MatchTimeline from '../components/supercopa/MatchTimeline';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import '../styles/partido-detalle.css';

const DEMO_LINEUP = [
  'Brayan R.', 'Kevin M.', 'Sebastián T.', 'Andrés L.', 'Carlos P.',
  'Juan D.', 'Felipe O.', 'Miguel A.', 'Diego H.', 'Luis E.', 'Tomás V.',
];

const DEMO_EVENTS = [
  { type: 'gol',      side: 'home', player: 'Brayan R.',   scoreH: 1, scoreA: 0 },
  { type: 'amarilla', side: 'away', player: 'Néider M.' },
  { type: 'gol',      side: 'home', player: 'Felipe O.',   scoreH: 2, scoreA: 0 },
  { type: 'azul',     side: 'home', player: 'Carlos P.' },
  { type: 'gol',      side: 'away', player: 'Pablo S.',    scoreH: 2, scoreA: 1 },
  { type: 'gol',      side: 'home', player: 'Kevin M.',    scoreH: 3, scoreA: 1 },
];

const STATUS_LABEL = {
  played: 'Finalizado',
  upcoming: 'Próximo',
  live: 'En Vivo',
};

function ScorersRow({ events }) {
  const players = {};
  events.forEach((ev) => {
    const key = `${ev.side}|${ev.player}`;
    if (!players[key]) {
      players[key] = { side: ev.side, name: ev.player, goles: 0, amarillas: 0, rojas: 0, azules: 0 };
    }
    if (ev.type === 'gol')      players[key].goles++;
    if (ev.type === 'amarilla') players[key].amarillas++;
    if (ev.type === 'roja')     players[key].rojas++;
    if (ev.type === 'azul')     players[key].azules++;
  });

  const home = Object.values(players).filter((p) => p.side === 'home');
  const away = Object.values(players).filter((p) => p.side === 'away');

  function badges(p) {
    const items = [];
    for (let i = 0; i < p.goles; i++) {
      items.push(
        <div key={`g${i}`} className="badge-gol">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>,
      );
    }
    for (let i = 0; i < p.amarillas; i++) items.push(<div key={`a${i}`} className="badge-amarilla" />);
    for (let i = 0; i < p.azules; i++)    items.push(<div key={`b${i}`} className="badge-azul" />);
    for (let i = 0; i < p.rojas; i++)     items.push(<div key={`r${i}`} className="badge-roja" />);
    return items;
  }

  function col(list, side) {
    return (
      <div className={`scorers-col ${side}`}>
        {list.map((p) => (
          <div key={`${side}-${p.name}`} className={`scorer-item ${side}`}>
            <span className="scorer-name">{p.name}</span>
            <div className="scorer-badges">{badges(p)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="scorers-row">
      {col(home, 'home')}
      {col(away, 'away')}
    </div>
  );
}

function Scoreboard({ match, jornada }) {
  const hc = teamColor(match.home);
  const ac = teamColor(match.away);
  const isPlayed = match.status === 'played';
  const homeWinner = isPlayed && match.scoreH > match.scoreA;
  const awayWinner = isPlayed && match.scoreA > match.scoreH;

  return (
    <div className="scoreboard animate-in">
      <div className="match-context">
        <span className="context-badge">
          Fecha {jornada.fecha} · Grupo {jornada.grupo}
        </span>
        <span className="context-dot" />
        <span className="context-text">
          {match.date} · {jornada.hora}
        </span>
      </div>

      <div className="score-row">
        <div className={`score-team${homeWinner ? ' winner' : ''}${awayWinner ? ' loser' : ''}`}>
          <div
            className="score-team-avatar"
            style={{ background: `${hc}22`, borderColor: `${hc}55` }}
          >
            {teamInitials(match.home)}
          </div>
          <div className="score-team-name">{match.home}</div>
        </div>

        <div className="score-center">
          <div className="score-digits">
            <span>{isPlayed ? match.scoreH : '–'}</span>
            <span className="score-sep">–</span>
            <span>{isPlayed ? match.scoreA : '–'}</span>
          </div>
          <div className={`score-status ${match.status}`}>
            {STATUS_LABEL[match.status] ?? '—'}
          </div>
        </div>

        <div className={`score-team${awayWinner ? ' winner' : ''}${homeWinner ? ' loser' : ''}`}>
          <div
            className="score-team-avatar"
            style={{ background: `${ac}22`, borderColor: `${ac}55` }}
          >
            {teamInitials(match.away)}
          </div>
          <div className="score-team-name">{match.away}</div>
        </div>
      </div>

      <div className="score-divider" />

      {isPlayed && match.events?.length > 0 && (
        <ScorersRow events={match.events} />
      )}
    </div>
  );
}

function Lineup({ home, away, events }) {
  const hc = teamColor(home.name);
  const ac = teamColor(away.name);

  const eventsFor = {};
  events.forEach((ev) => {
    if (!eventsFor[ev.player]) eventsFor[ev.player] = [];
    eventsFor[ev.player].push(ev.type);
  });

  function playerBadges(name) {
    const evs = eventsFor[name] || [];
    return evs.map((t, i) => {
      if (t === 'gol')      return <div key={i} className="lineup-badge gol" />;
      if (t === 'amarilla') return <div key={i} className="lineup-badge amarilla" />;
      if (t === 'roja')     return <div key={i} className="lineup-badge roja" />;
      return null;
    });
  }

  function list(players) {
    return players.map((p, i) => (
      <div key={`${p}-${i}`} className="lineup-player">
        <span className="lineup-num">{i + 1}</span>
        <span className="lineup-name">{p}</span>
        {playerBadges(p)}
      </div>
    ));
  }

  return (
    <div className="lineup-cols">
      <div>
        <div className="lineup-col-title" style={{ color: hc }}>{home.name}</div>
        {list(home.lineup)}
      </div>
      <div>
        <div className="lineup-col-title" style={{ color: ac }}>{away.name}</div>
        {list(away.lineup)}
      </div>
    </div>
  );
}

function PartidoDetalle() {
  const { matchKey } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('timeline');

  const result = findMatch(matchKey);
  if (!result) return <Navigate to="/torneos/2026" replace />;

  const { partido, jornada } = result;
  const events = partido.events?.length ? partido.events : (partido.status === 'played' ? DEMO_EVENTS : []);
  const home = { name: partido.home, lineup: partido.homeLineup ?? DEMO_LINEUP };
  const away = { name: partido.away, lineup: partido.awayLineup ?? DEMO_LINEUP };

  return (
    <>
      <header className="detalle-navbar">
        <button type="button" className="detalle-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>
        <span className="detalle-title">{partido.home} vs {partido.away}</span>
        <Link className="detalle-logo" to="/torneos/2026">
          <img src={brandLogo} alt="Code Cup" />
          <span className="detalle-logo-text"><em>C</em>C</span>
        </Link>
      </header>

      <main className="partido-detalle-page">
        <Scoreboard match={partido} jornada={jornada} />

        <div className="detail-tabs animate-in-2">
          <button
            type="button"
            className={`detail-tab${tab === 'timeline' ? ' active' : ''}`}
            onClick={() => setTab('timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            className={`detail-tab${tab === 'lineup' ? ' active' : ''}`}
            onClick={() => setTab('lineup')}
          >
            Alineación
          </button>
        </div>

        <div className="detail-panel animate-in-3">
          {tab === 'timeline' && <MatchTimeline events={events} status={partido.status} />}
          {tab === 'lineup' && <Lineup home={home} away={away} events={events} />}
        </div>

        <footer className="detalle-footer">© 2026 · Code Cup · UFPS Cúcuta</footer>
      </main>
    </>
  );
}

export default PartidoDetalle;
