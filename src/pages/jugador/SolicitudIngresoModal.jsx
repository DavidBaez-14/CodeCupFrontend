import { useState } from 'react';

const PIERNA_OPTIONS = ['DERECHA', 'IZQUIERDA', 'AMBIDIESTRO'];
const POSICION_OPTIONS = ['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO'];

function SolicitudIngresoModal({ equipo, sending, onCancel, onConfirm, error }) {
  const [alturaCm, setAlturaCm] = useState('');
  const [piernaHabil, setPiernaHabil] = useState('DERECHA');
  const [posicion, setPosicion] = useState('MEDIOCAMPISTA');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      alturaCm: alturaCm ? Number(alturaCm) : null,
      piernaHabil,
      posicion,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Solicitar ingreso a {equipo?.equipoNombre}</h3>
        <p className="muted">
          Tu solicitud se envía al delegado del equipo. Mientras tanto, tus datos personales quedan asociados a tu perfil.
        </p>

        <form onSubmit={handleSubmit} className="torneo-form">
          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Altura (cm)</span>
              <input
                type="number"
                min={140}
                max={230}
                className="form-input"
                value={alturaCm}
                onChange={(e) => setAlturaCm(e.target.value)}
                placeholder="Ej: 178"
                required
              />
            </label>
            <label className="form-field">
              <span className="form-label">Pierna hábil</span>
              <select
                className="form-input"
                value={piernaHabil}
                onChange={(e) => setPiernaHabil(e.target.value)}
              >
                {PIERNA_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Posición</span>
              <select
                className="form-input"
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
              >
                {POSICION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          {error && <p className="banner banner-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="action-button ghost"
              onClick={onCancel}
              disabled={sending}
            >
              Cancelar
            </button>
            <button type="submit" className="action-button primary" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SolicitudIngresoModal;
