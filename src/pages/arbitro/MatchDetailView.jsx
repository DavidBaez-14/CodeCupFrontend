import { useState } from 'react';
import { initials, teamColor } from './arbitroData';
import AlineacionTab from './AlineacionTab';
import EventosTab from './EventosTab';
import ExcepcionesTab from './ExcepcionesTab';

const TABS = [
  { id: 'alineacion',  label: 'Alineación'  },
  { id: 'eventos',     label: 'Eventos'     },
  { id: 'excepciones', label: 'Excepciones' },
];

function MatchDetailView({ match, onTogglePlayer, onAddAll, onAddEvent, onDeleteEvent, onCloseMatch, onWO, onCancel }) {
  const [activeTab, setActiveTab] = useState('alineacion');

  const hc = teamColor(match.home);
  const ac = teamColor(match.away);

  const statusChip = (() => {
    if (match.status === 'played')   return { cls: 'played',   label: 'Finalizado'  };
    if (match.events?.length === 0)  return { cls: 'upcoming', label: 'Por iniciar' };
    return { cls: '', label: 'En curso' };
  })();

  return (
    <div className="ar-view ar-view-detail">
      <div className="ar-scoreboard">
        <div className="ar-sb-context">
          <span className="ar-context-badge">Fecha {match.fecha} · Grupo {match.grupo}</span>
          <span className="ar-context-dot" />
          <span className="ar-context-text">{match.date} · {match.hora}</span>
        </div>
        <div className="ar-sb-row">
          <div className="ar-sb-team">
            <div
              className="ar-sb-avatar"
              style={{ background: `${hc}22`, borderColor: `${hc}55` }}
            >
              {initials(match.home)}
            </div>
            <div className="ar-sb-name">{match.home}</div>
          </div>
          <div className="ar-sb-center">
            <div className="ar-sb-score">
              <span>{match.scoreH}</span>
              <span className="ar-sb-score-sep">–</span>
              <span>{match.scoreA}</span>
            </div>
            <span className={`ar-sb-status-chip ${statusChip.cls}`}>{statusChip.label}</span>
          </div>
          <div className="ar-sb-team">
            <div
              className="ar-sb-avatar"
              style={{ background: `${ac}22`, borderColor: `${ac}55` }}
            >
              {initials(match.away)}
            </div>
            <div className="ar-sb-name">{match.away}</div>
          </div>
        </div>
        <div className="ar-sb-divider" />
      </div>

      <nav className="ar-detail-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ar-detail-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'alineacion' && (
        <AlineacionTab
          match={match}
          onTogglePlayer={onTogglePlayer}
          onAddAll={onAddAll}
          onCloseMatch={onCloseMatch}
        />
      )}
      {activeTab === 'eventos' && (
        <EventosTab
          match={match}
          onAddEvent={onAddEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
      {activeTab === 'excepciones' && (
        <ExcepcionesTab
          match={match}
          onWO={onWO}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

export default MatchDetailView;
