import { useState } from 'react';
import { teamColor, EVENT_LABELS } from './arbitroData';

const EVENT_TYPES = [
  { id: 'gol',      label: 'Gol' },
  { id: 'amarilla', label: 'Amarilla' },
  { id: 'azul',     label: 'Azul' },
  { id: 'roja',     label: 'Roja' },
];

/**
 * Registro de eventos del partido. Cronología única (sin división por tiempos).
 * Los eventos vienen ya persistidos en BD (vía useGestionPartido).
 */
function EventosTab({ match, onAddEvent, onDeleteEvent }) {
  const closed = match.status === 'played';
  const [type, setType] = useState('gol');
  const [side, setSide] = useState('home');
  const [playerNum, setPlayerNum] = useState(null);

  const onField = side === 'home' ? match.onFieldHome : match.onFieldAway;
  const roster  = side === 'home' ? match.homeRoster  : match.awayRoster;
  const rosterArr = Array.isArray(roster) ? roster : [];
  const playersInField = rosterArr.filter((p) => onField?.includes(p.num));

  const canRegister = playerNum !== null && !closed;

  const handleRegister = async () => {
    if (!canRegister) return;
    const p = rosterArr.find((pl) => pl.num === playerNum);
    if (!p) return;
    await onAddEvent({ type, side, player: p.name, num: p.num });
    setPlayerNum(null);
  };

  const handleSelectSide = (newSide) => {
    setSide(newSide);
    setPlayerNum(null);
  };

  const hc = teamColor(match.home);
  const ac = teamColor(match.away);

  return (
    <div className="ar-detail-panel">
      <div className="ar-event-controls">
        <div className="ar-chooser-label">Tipo de evento</div>
        <div className="ar-event-type-grid">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ar-event-type-btn ${t.id}${type === t.id ? ' active' : ''}`}
              onClick={() => setType(t.id)}
              disabled={closed}
            >
              <div className="ar-event-icon-wrap">
                {t.id === 'gol' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2 L9 7 L3 7 L5.5 12 L3 17 L9 17 L12 22 L15 17 L21 17 L18.5 12 L21 7 L15 7 Z" strokeWidth="1.2" />
                  </svg>
                ) : (
                  <div
                    className="ar-event-card-icon"
                    style={{ background: t.id === 'amarilla' ? '#facc15' : t.id === 'azul' ? '#3b82f6' : '#ef4444' }}
                  />
                )}
              </div>
              {t.label}
            </button>
          ))}
        </div>

        <div className="ar-chooser-label">Equipo</div>
        <div className="ar-team-select-row">
          <button
            type="button"
            className={`ar-team-select-btn${side === 'home' ? ' active' : ''}`}
            onClick={() => handleSelectSide('home')}
            disabled={closed}
          >
            <span className="ar-ts-dot" style={{ background: hc }} />
            <span>{match.home}</span>
          </button>
          <button
            type="button"
            className={`ar-team-select-btn${side === 'away' ? ' active' : ''}`}
            onClick={() => handleSelectSide('away')}
            disabled={closed}
          >
            <span className="ar-ts-dot" style={{ background: ac }} />
            <span>{match.away}</span>
          </button>
        </div>

        <div className="ar-chooser-label">Jugador en cancha</div>
        {playersInField.length === 0 ? (
          <div className="ar-empty-chips">
            Confirma jugadores en cancha desde la pestaña Alineación.
          </div>
        ) : (
          <div className="ar-player-chips">
            {playersInField.map((p) => (
              <button
                key={p.num}
                type="button"
                className={`ar-player-chip${playerNum === p.num ? ' active' : ''}`}
                onClick={() => setPlayerNum(p.num)}
                disabled={closed}
              >
                <span className="ar-chip-num">{p.num}</span>
                {p.name}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className="ar-btn-register"
          onClick={handleRegister}
          disabled={!canRegister}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar evento
        </button>
      </div>

      <div className="ar-timeline-section">
        <div className="ar-timeline-half-label">Cronología</div>
        {(!match.events || match.events.length === 0) ? (
          <div className="ar-empty-timeline">Sin eventos registrados</div>
        ) : (
          <div className="ar-timeline">
            {match.events.map((e) => (
              <TimelineItem
                key={e.id}
                event={e}
                onDelete={() => onDeleteEvent(e.id)}
                disabled={closed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event: e, onDelete, disabled }) {
  const isHome = e.side === 'home';

  const content = (
    <div className={`ar-tl-content ${isHome ? 'left' : 'right'}`}>
      <span className="ar-tl-event-type">{EVENT_LABELS[e.type] || e.type}</span>
      <span className="ar-tl-player">
        {e.player}{e.num != null ? ` · #${e.num}` : ''}
      </span>
      {!disabled && (
        <button type="button" className="ar-tl-delete" onClick={onDelete} aria-label="Eliminar evento">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );

  const icon = e.type === 'gol' ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L9 7 L3 7 L5.5 12 L3 17 L9 17 L12 22 L15 17 L21 17 L18.5 12 L21 7 L15 7 Z" strokeWidth="1.2" />
    </svg>
  ) : (
    <div
      style={{
        width: 8,
        height: 11,
        borderRadius: 1.5,
        background: e.type === 'amarilla' ? '#facc15' : e.type === 'azul' ? '#3b82f6' : '#ef4444',
      }}
    />
  );

  return (
    <div className="ar-tl-item">
      {isHome ? content : <div className="ar-tl-content left empty" />}
      <div className={`ar-tl-node node-${e.type}`}>
        <div className="ar-tl-node-inner">{icon}</div>
      </div>
      {!isHome ? content : <div className="ar-tl-content right empty" />}
    </div>
  );
}

export default EventosTab;
