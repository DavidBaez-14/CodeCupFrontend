import { useState } from 'react';

const WO_REASONS = [
  'No presentación del equipo rival',
  'Cantidad insuficiente de jugadores',
  'Documentación incompleta',
  'Otro',
];

const CANCEL_REASONS = [
  'Lluvia / clima adverso',
  'Cancha no disponible',
  'Falta de pago de inscripción',
  'Problemas de orden público',
  'Decisión administrativa',
  'Otro',
];

function ExcepcionesTab({ match, onWO, onCancel }) {
  const [woWinner,    setWoWinner]    = useState('home');
  const [woReason,    setWoReason]    = useState(WO_REASONS[0]);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNotes,  setCancelNotes]  = useState('');

  const handleWO = () => {
    const winnerName = woWinner === 'home' ? match.home : match.away;
    if (!window.confirm(
      `¿Confirmar W.O. a favor de ${winnerName}? El resultado quedará 3-0 sin goles asignados a jugadores.`,
    )) return;
    onWO(woWinner, woReason);
  };

  const handleCancel = () => {
    if (!window.confirm(
      `¿Cancelar el partido? Motivo: ${cancelReason}. Será reprogramado por el comité.`,
    )) return;
    onCancel(cancelReason, cancelNotes);
  };

  const homeIsWinner = woWinner === 'home';

  return (
    <div className="ar-detail-panel">
      <div className="ar-exception-card">
        <header className="ar-exception-header">
          <div className="ar-exception-icon wo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1l3 6 6 .9-4.5 4.4 1 6.7L12 16l-5.5 3 1-6.7L3 7.9 9 7l3-6z" />
            </svg>
          </div>
          <div>
            <div className="ar-exception-title">Victoria por W.O.</div>
            <div className="ar-exception-sub">
              Un equipo no se presenta. El ganador recibe 3-0 sin goles asignados a jugadores.
            </div>
          </div>
        </header>

        <div className="ar-form-row">
          <label className="ar-form-label">Equipo ganador</label>
          <div className="ar-team-radio-row">
            {[
              { side: 'home', name: match.home },
              { side: 'away', name: match.away },
            ].map((opt) => (
              <button
                key={opt.side}
                type="button"
                className={`ar-team-radio${woWinner === opt.side ? ' active' : ''}`}
                onClick={() => setWoWinner(opt.side)}
              >
                <div className="ar-team-radio-dot" />
                <div>
                  <div className="ar-team-radio-name">{opt.name}</div>
                  <div className="ar-team-radio-sub">Recibe 3-0</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="ar-form-row">
          <label className="ar-form-label">Motivo del W.O.</label>
          <select
            className="ar-form-select"
            value={woReason}
            onChange={(e) => setWoReason(e.target.value)}
          >
            {WO_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="ar-score-preview">
          <div className={`ar-score-preview-team${!homeIsWinner ? ' loser' : ''}`}>{match.home}</div>
          <div className="ar-score-preview-score">{homeIsWinner ? '3 – 0' : '0 – 3'}</div>
          <div className={`ar-score-preview-team${homeIsWinner ? ' loser' : ''}`}>{match.away}</div>
        </div>

        <button type="button" className="ar-btn-submit" onClick={handleWO}>
          Confirmar W.O.
        </button>
      </div>

      <div className="ar-exception-card">
        <header className="ar-exception-header">
          <div className="ar-exception-icon cancel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <div className="ar-exception-title">Cancelar partido</div>
            <div className="ar-exception-sub">
              El partido se reprogramará. Útil por lluvia, falta de pago, cancha no disponible, etc.
            </div>
          </div>
        </header>

        <div className="ar-form-row">
          <label className="ar-form-label">Motivo de la cancelación</label>
          <select
            className="ar-form-select"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          >
            {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="ar-form-row">
          <label className="ar-form-label">Observaciones (opcional)</label>
          <textarea
            className="ar-form-textarea"
            placeholder="Detalles adicionales para el comité organizador..."
            value={cancelNotes}
            onChange={(e) => setCancelNotes(e.target.value)}
          />
        </div>

        <button type="button" className="ar-btn-submit danger" onClick={handleCancel}>
          Cancelar partido
        </button>
      </div>
    </div>
  );
}

export default ExcepcionesTab;
