import '../../styles/partido-detalle.css';

const TYPE_CONFIG = {
  gol:      { cls: 'node-gol',      label: 'Gol' },
  amarilla: { cls: 'node-amarilla', label: 'T. Amarilla', cardColor: '#facc15' },
  roja:     { cls: 'node-roja',     label: 'T. Roja',     cardColor: '#ef4444' },
  azul:     { cls: 'node-azul',     label: 'T. Azul',     cardColor: '#3b82f6' },
};

function BallSvg({ color = '#ff5500' }) {
  return (
    <svg className="tl-ball" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path
        d="M12 2 L9 7 L3 7 L5.5 12 L3 17 L9 17 L12 22 L15 17 L21 17 L18.5 12 L21 7 L15 7 Z"
        stroke={color} strokeWidth="1.2" fill={`${color}22`}
      />
    </svg>
  );
}

function EventIcon({ type }) {
  if (type === 'gol') return <BallSvg color="#ff5500" />;
  return (
    <div
      className="tl-card-icon"
      style={{ background: TYPE_CONFIG[type]?.cardColor ?? '#888' }}
    />
  );
}

function MatchTimeline({ events, status = 'played', onEventDelete }) {
  if (status === 'upcoming') {
    return (
      <div className="upcoming-state">
        <div className="upcoming-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="upcoming-title">Partido por jugar</div>
        <div className="upcoming-sub">
          La línea de tiempo estará disponible cuando inicie el partido.
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="upcoming-state">
        <div className="upcoming-title">Sin eventos</div>
        <div className="upcoming-sub">
          Aún no se han registrado eventos para este partido.
        </div>
      </div>
    );
  }

  const half = Math.ceil(events.length / 2);

  return (
    <div className="timeline">
      <div className="tl-item">
        <div className="tl-content left">
          <span className="tl-event-type" style={{ color: 'rgba(255,255,255,0.25)' }}>Inicio</span>
        </div>
        <div className="tl-node node-meta">
          <div className="tl-node-inner">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        <div className="tl-content right" />
      </div>

      {events.map((ev, idx) => {
        const cfg = TYPE_CONFIG[ev.type];
        if (!cfg) return null;
        const isHome = ev.side === 'home';
        const deletable = typeof onEventDelete === 'function';
        return (
          <div key={ev.id ?? idx}>
            {idx === half && (
              <div className="tl-half">
                <div className="tl-half-line" />
                <div className="tl-half-label">Segundo tiempo</div>
                <div className="tl-half-line" />
              </div>
            )}
            <div className={`tl-item ${isHome ? 'left-event' : 'right-event'}`}>
              {isHome ? (
                <div className="tl-content left">
                  <span className={`tl-event-type ${cfg.cls}`}>{cfg.label}</span>
                  <span className="tl-player">{ev.player}</span>
                  {ev.type === 'gol' && ev.scoreH != null && (
                    <span className="tl-score-flash">
                      {ev.scoreH}<span className="flash-sep"> – </span>{ev.scoreA}
                    </span>
                  )}
                  {deletable && (
                    <button
                      type="button"
                      className="tl-delete"
                      onClick={() => onEventDelete(ev)}
                      aria-label="Eliminar evento"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="tl-content left empty" />
              )}

              <div className={`tl-node ${cfg.cls}`}>
                <div className="tl-node-inner">
                  <EventIcon type={ev.type} />
                </div>
              </div>

              {!isHome ? (
                <div className="tl-content right">
                  <span className={`tl-event-type ${cfg.cls}`}>{cfg.label}</span>
                  <span className="tl-player">{ev.player}</span>
                  {ev.type === 'gol' && ev.scoreH != null && (
                    <span className="tl-score-flash">
                      {ev.scoreH}<span className="flash-sep"> – </span>{ev.scoreA}
                    </span>
                  )}
                  {deletable && (
                    <button
                      type="button"
                      className="tl-delete"
                      onClick={() => onEventDelete(ev)}
                      aria-label="Eliminar evento"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="tl-content right empty" />
              )}
            </div>
          </div>
        );
      })}

      <div className="tl-item">
        <div className="tl-content left" />
        <div className="tl-node node-meta">
          <div className="tl-node-inner">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </div>
        </div>
        <div className="tl-content right">
          <span className="tl-event-type" style={{ color: 'rgba(255,255,255,0.25)' }}>Final</span>
        </div>
      </div>
    </div>
  );
}

export default MatchTimeline;
