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

/**
 * Vista de gestión de un partido. Sirve para árbitro y admin.
 *  - mode='arbitro': flujo normal de gestión.
 *  - mode='admin'  : muestra botón "Reabrir" cuando el partido ya está cerrado.
 */
function MatchDetailView({
  match,
  mode = 'arbitro',
  onTogglePlayer,
  onAddAll,
  onAddEvent,
  onDeleteEvent,
  onCloseMatch,
  onWO,
  onCancel,
  onReopen,
}) {
  const [activeTab, setActiveTab] = useState('alineacion');

  const hc = teamColor(match.home);
  const ac = teamColor(match.away);

  const statusChip = (() => {
    if (match.status === 'played')   return { cls: 'played',   label: match.estado === 'WO' ? 'W.O.' : 'Finalizado'  };
    if (match.events?.length === 0)  return { cls: 'upcoming', label: 'Por iniciar' };
    return { cls: '', label: 'En curso' };
  })();

  const canReopen = mode === 'admin'
    && (match.estado === 'FINALIZADO' || match.estado === 'WO');

  return (
    <div className="ar-view ar-view-detail">
      <div className="ar-scoreboard">
        <div className="ar-sb-context">
          {match.fecha && <span className="ar-context-badge">Jornada {match.fecha}</span>}
          {match.grupo && (
            <>
              <span className="ar-context-dot" />
              <span className="ar-context-badge">{match.grupo.startsWith('Grupo ') || match.grupo.length === 1 ? `Grupo ${match.grupo}` : match.grupo}</span>
            </>
          )}
          {match.date && (
            <>
              <span className="ar-context-dot" />
              <span className="ar-context-text">{match.date} · {match.hora}</span>
            </>
          )}
          {canReopen && onReopen && (
            <button
              type="button"
              className="action-button ghost"
              style={{ marginLeft: 'auto' }}
              onClick={onReopen}
              title="Reabrir el partido para hacer cambios (solo admin)"
            >
              Reabrir partido
            </button>
          )}
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
