import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cerrarPartido,
  crearEvento,
  eliminarEvento,
  listEventosPartido,
  listAlineacionPartido,
  reabrirPartido,
} from '../../api/supercopa';
import { getToken } from '../../utils/session';
import MatchTimeline from './MatchTimeline';

const TIPOS = ['GOL', 'AMARILLA', 'AZUL', 'ROJA'];

const TIPO_TO_TIMELINE = {
  GOL: 'gol',
  AMARILLA: 'amarilla',
  AZUL: 'azul',
  ROJA: 'roja',
};

function buildTimelineEvents(eventos, partido) {
  if (!partido) return [];
  const ordered = [...eventos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  let scoreH = 0;
  let scoreA = 0;
  return ordered.map((ev) => {
    const isHome = ev.equipoTorneoId === partido.localEquipoTorneoId;
    const type = TIPO_TO_TIMELINE[ev.tipoEvento] || ev.tipoEvento?.toLowerCase();
    const entry = {
      id: ev.id,
      type,
      side: isHome ? 'home' : 'away',
      player: ev.jugadorNombre || ev.cedula,
    };
    if (type === 'gol') {
      if (isHome) scoreH += 1; else scoreA += 1;
      entry.scoreH = scoreH;
      entry.scoreA = scoreA;
    }
    return entry;
  });
}

function PartidoEventosModal({ partido, onClose, onPartidoCerrado, canReopen }) {
  const [eventos, setEventos] = useState([]);
  const [jugadoresLocal, setJugadoresLocal] = useState([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioning, setActioning] = useState(false);
  const [form, setForm] = useState({ side: 'local', cedula: '', tipo: 'GOL' });

  const cerrado = partido?.estado === 'FINALIZADO' || partido?.estado === 'WO';

  const recargar = useCallback(async () => {
    if (!partido) return;
    setLoading(true);
    setError('');
    try {
      const [evts, ali] = await Promise.all([
        listEventosPartido(partido.id, getToken()),
        listAlineacionPartido(partido.id, getToken()).catch(() => []),
      ]);
      setEventos(Array.isArray(evts) ? evts : []);
      const arr = Array.isArray(ali) ? ali : [];
      setJugadoresLocal(arr.filter((j) => j.equipoTorneoId === partido.localEquipoTorneoId && j.jugo));
      setJugadoresVisitante(arr.filter((j) => j.equipoTorneoId === partido.visitanteEquipoTorneoId && j.jugo));
    } catch (err) {
      setError(err?.message || 'No fue posible cargar los eventos.');
    } finally {
      setLoading(false);
    }
  }, [partido]);

  useEffect(() => { recargar(); }, [recargar]);

  const jugadores = form.side === 'local' ? jugadoresLocal : jugadoresVisitante;
  const equipoTorneoId = form.side === 'local'
    ? partido?.localEquipoTorneoId
    : partido?.visitanteEquipoTorneoId;

  const golesLocal = eventos.filter((e) => e.equipoTorneoId === partido?.localEquipoTorneoId && e.tipoEvento === 'GOL').length;
  const golesVisitante = eventos.filter((e) => e.equipoTorneoId === partido?.visitanteEquipoTorneoId && e.tipoEvento === 'GOL').length;

  const timelineEvents = useMemo(() => buildTimelineEvents(eventos, partido), [eventos, partido]);
  const eventoIndex = useMemo(() => {
    const map = new Map();
    eventos.forEach((ev) => { map.set(ev.id, ev); });
    return map;
  }, [eventos]);

  const handleDeleteFromTimeline = (tlEvent) => {
    const original = eventoIndex.get(tlEvent.id);
    if (original) handleEliminar(original);
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!form.cedula) {
      setError('Selecciona un jugador.');
      return;
    }
    setActioning(true);
    setError('');
    setFeedback('');
    try {
      await crearEvento(partido.id, {
        cedula: form.cedula,
        equipoTorneoId,
        tipoEvento: form.tipo,
      }, getToken());
      setFeedback(`Evento ${form.tipo} registrado.`);
      setForm((p) => ({ ...p, cedula: '' }));
      await recargar();
    } catch (err) {
      setError(err?.message || 'No fue posible registrar el evento.');
    } finally {
      setActioning(false);
    }
  };

  const handleEliminar = async (ev) => {
    if (!confirm(`¿Eliminar el evento ${ev.tipoEvento} de ${ev.jugadorNombre || ev.cedula}?`)) return;
    setActioning(true);
    setError('');
    setFeedback('');
    try {
      await eliminarEvento(partido.id, ev.id, getToken());
      await recargar();
    } catch (err) {
      setError(err?.message || 'No fue posible eliminar el evento.');
    } finally {
      setActioning(false);
    }
  };

  const handleCerrar = async () => {
    if (!confirm('¿Cerrar el partido? Pasa a estado FINALIZADO.')) return;
    setActioning(true);
    setError('');
    try {
      const partidoCerrado = await cerrarPartido(partido.id, getToken());
      onPartidoCerrado?.(partidoCerrado);
    } catch (err) {
      setError(err?.message || 'No fue posible cerrar el partido.');
    } finally {
      setActioning(false);
    }
  };

  const handleReabrir = async () => {
    if (!confirm('¿Reabrir el partido? Volverá a estado EN CURSO.')) return;
    setActioning(true);
    setError('');
    try {
      const partidoReabierto = await reabrirPartido(partido.id, getToken());
      onPartidoCerrado?.(partidoReabierto);
    } catch (err) {
      setError(err?.message || 'No fue posible reabrir el partido.');
    } finally {
      setActioning(false);
    }
  };

  if (!partido) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-wide">
        <header className="evento-modal-header">
          <div>
            <h3>Eventos del partido</h3>
            <p className="muted">
              {partido.localNombre} <strong>{golesLocal} – {golesVisitante}</strong> {partido.visitanteNombre}
              {' · '}
              <span className={`status-pill estado-${(partido.estado || '').toLowerCase()}`}>{partido.estado}</span>
            </p>
          </div>
          <button type="button" className="action-button ghost" onClick={onClose}>Cerrar</button>
        </header>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {cerrado ? (
          <p className="banner banner-info">Partido {partido.estado} — solo lectura.</p>
        ) : (
          <form className="evento-form" onSubmit={handleAgregar}>
            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Equipo</span>
                <select
                  className="form-input"
                  value={form.side}
                  onChange={(e) => setForm((p) => ({ ...p, side: e.target.value, cedula: '' }))}
                >
                  <option value="local">{partido.localNombre} (local)</option>
                  <option value="visitante">{partido.visitanteNombre} (visitante)</option>
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Jugador (en cancha)</span>
                <select
                  className="form-input"
                  value={form.cedula}
                  onChange={(e) => setForm((p) => ({ ...p, cedula: e.target.value }))}
                  required
                >
                  <option value="">— Selecciona —</option>
                  {jugadores.map((j) => (
                    <option key={j.cedula} value={j.cedula}>
                      {j.jugadorNombre || j.cedula}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Tipo</span>
                <select
                  className="form-input"
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <button type="submit" className="action-button primary" disabled={actioning || !form.cedula}>
                {actioning ? '…' : 'Agregar evento'}
              </button>
            </div>
          </form>
        )}

        <div className="evento-list-wrap evento-timeline-wrap">
          <h4>Cronología</h4>
          {loading ? (
            <p className="empty-state">Cargando…</p>
          ) : (
            <MatchTimeline
              events={timelineEvents}
              status="played"
              onEventDelete={!cerrado && !actioning ? handleDeleteFromTimeline : undefined}
            />
          )}
        </div>

        {cerrado && canReopen ? (
          <div className="modal-actions">
            <button
              type="button"
              className="action-button approve"
              onClick={handleReabrir}
              disabled={actioning}
            >
              {actioning ? '…' : 'Reabrir partido'}
            </button>
          </div>
        ) : !cerrado ? (
          <div className="modal-actions">
            <button
              type="button"
              className="action-button approve"
              onClick={handleCerrar}
              disabled={actioning}
            >
              {actioning ? '…' : 'Cerrar partido'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PartidoEventosModal;
