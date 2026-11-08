import { useCallback, useEffect, useState } from 'react';
import {
  actualizarCamiseta,
  agregarMiembro,
  createEquipo,
  getMiEquipo,
  listInscripcionesDelegado,
  listMiembrosEquipoTorneo,
  removerMiembro,
} from '../../api/supercopa';
import { TIPOS_DOCUMENTO } from '../../constants/documento';
import { getToken } from '../../utils/session';

const MIEMBRO_VACIO = { tipoDocumento: 'CC', numeroDocumento: '', nombre: '', numeroCamiseta: '' };

function MiEquipoTab({ onEquipoCreado, toast }) {
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [creando, setCreando] = useState(false);

  const [inscripciones, setInscripciones] = useState([]);
  const [inscActiva, setInscActiva] = useState('');
  const [miembros, setMiembros] = useState([]);
  const [actioningId, setActioningId] = useState(null);

  const [nuevo, setNuevo] = useState(MIEMBRO_VACIO);
  const [errorAgregar, setErrorAgregar] = useState('');
  const [agregando, setAgregando] = useState(false);

  const [remover, setRemover] = useState({ open: false, miembro: null });

  const [editandoCamiseta, setEditandoCamiseta] = useState(null);
  const [nuevoNumero, setNuevoNumero] = useState('');

  const cargarEquipo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMiEquipo(getToken()).catch(() => null);
      setEquipo(data || null);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar tu equipo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarInscripciones = useCallback(async () => {
    try {
      const data = await listInscripcionesDelegado(getToken());
      const list = Array.isArray(data) ? data : [];
      setInscripciones(list);
      if (list.length && !inscActiva) setInscActiva(list[0].id);
    } catch { /* sin inscripciones: el plantel queda vacío */ }
  }, [inscActiva]);

  const loadMiembros = useCallback(async () => {
    if (!inscActiva) { setMiembros([]); return; }
    try {
      const data = await listMiembrosEquipoTorneo(inscActiva, getToken());
      setMiembros(Array.isArray(data) ? data : []);
    } catch {
      setMiembros([]);
    }
  }, [inscActiva]);

  useEffect(() => { cargarEquipo(); }, [cargarEquipo]);
  useEffect(() => { cargarInscripciones(); }, [cargarInscripciones]);
  useEffect(() => { loadMiembros(); }, [loadMiembros]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombreNuevo.trim()) { setError('Indica un nombre para tu equipo.'); return; }
    setCreando(true);
    setError('');
    setFeedback('');
    try {
      const eq = await createEquipo(nombreNuevo.trim(), getToken());
      setEquipo(eq);
      toast?.(`Equipo "${eq.nombre}" creado`);
      setFeedback(`Equipo "${eq.nombre}" creado. Ahora inscríbete a un torneo desde la pestaña Torneos.`);
      setNombreNuevo('');
      onEquipoCreado?.();
    } catch (err) {
      setError(err?.message || 'No fue posible crear el equipo.');
    } finally {
      setCreando(false);
    }
  };

  // Spec 0018 (W1) y 0027: se agrega con documento y nombre, sin búsqueda previa. Si la persona
  // no tiene cuenta, el backend la crea sin cuenta; si su cuenta está bloqueada, responde
  // JUGADOR_BLOQUEADO y se muestra su mensaje.
  const handleAgregar = async (e) => {
    e.preventDefault();
    const numeroDocumento = nuevo.numeroDocumento.trim();
    const nombre = nuevo.nombre.trim();
    if (!numeroDocumento || !nombre) {
      setErrorAgregar('Escribe el número de documento y el nombre completo.');
      return;
    }
    setAgregando(true);
    setErrorAgregar('');
    setError('');
    setFeedback('');
    try {
      const miembro = await agregarMiembro(inscActiva, {
        tipoDocumento: nuevo.tipoDocumento,
        numeroDocumento,
        nombre,
        numeroCamiseta: nuevo.numeroCamiseta ? parseInt(nuevo.numeroCamiseta, 10) : null,
      }, getToken());
      const quien = miembro?.nombre || nombre;
      toast?.(`${quien} agregado al plantel`);
      setFeedback(`${quien} agregado al plantel.`);
      setNuevo(MIEMBRO_VACIO);
      await loadMiembros();
    } catch (err) {
      setErrorAgregar(err?.message || 'No fue posible agregar al jugador.');
    } finally {
      setAgregando(false);
    }
  };

  const confirmarRemover = async () => {
    const miembro = remover.miembro;
    if (!miembro) return;
    setActioningId(miembro.personaId);
    setError('');
    setFeedback('');
    try {
      await removerMiembro(inscActiva, miembro.personaId, getToken());
      toast?.(`${miembro.nombre} eliminado del plantel`);
      setFeedback(`${miembro.nombre} eliminado del plantel.`);
      setRemover({ open: false, miembro: null });
      await loadMiembros();
    } catch (err) {
      setError(err?.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleGuardarCamiseta = async (personaId) => {
    setError('');
    setFeedback('');
    try {
      const num = nuevoNumero ? parseInt(nuevoNumero, 10) : null;
      await actualizarCamiseta(inscActiva, personaId, num, getToken());
      toast?.('Número de camiseta actualizado');
      setFeedback('Número de camiseta actualizado.');
      setEditandoCamiseta(null);
      await loadMiembros();
    } catch (err) {
      setError(err?.message);
    }
  };

  const inicialesEquipo = (equipo?.nombre || '??').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  const activos = miembros.filter((m) => m.estado === 'ACTIVO');
  const sancionados = miembros.filter((m) => m.sancionado);

  return (
    <div className="dg-panel dg-panel-animated">
      {/* Crear equipo */}
      {!loading && !equipo && (
        <article className="ds-panel" style={{ marginBottom: 24 }}>
          <header className="panel-header">
            <h2>Crea tu equipo</h2>
            <p>Define el nombre del equipo que dirigirás. Podrás inscribirlo en torneos publicados.</p>
          </header>
          <form className="dg-add-player-form" onSubmit={handleCrear}>
            <input
              className="dg-add-player-input"
              type="text"
              placeholder="Ej: Los Magos"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              required
            />
            <button type="submit" className="dg-add-player-btn" disabled={creando}>
              {creando ? 'Creando…' : 'Crear equipo'}
            </button>
          </form>
          {feedback && <p className="banner banner-success">{feedback}</p>}
          {error && <p className="banner banner-error">{error}</p>}
        </article>
      )}

      {/* Equipo + plantilla */}
      {equipo && (
        <>
          <div className="dg-team-header">
            <div className="dg-team-crest">{inicialesEquipo}</div>
            <div className="dg-team-info">
              <div className="dg-team-name">{equipo.nombre}</div>
              <div className="dg-team-meta">
                {inscripciones.length > 0
                  ? `${inscripciones.length} inscripción(es) a torneos`
                  : 'Aún no estás inscrito en ningún torneo'}
              </div>
            </div>
            <div className="dg-team-counters">
              <div className="dg-team-counter">
                <div className="dg-team-counter-val">{activos.length}</div>
                <div className="dg-team-counter-lbl">Jugadores</div>
              </div>
              {sancionados.length > 0 && (
                <div className="dg-team-counter">
                  <div className="dg-team-counter-val warn">{sancionados.length}</div>
                  <div className="dg-team-counter-lbl">Sancionados</div>
                </div>
              )}
            </div>
          </div>

          {inscripciones.length > 0 && (
            <div className="inline-search" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="insc-sel">Plantilla del torneo:</label>
              <select
                id="insc-sel"
                className="form-input"
                value={inscActiva}
                onChange={(e) => setInscActiva(e.target.value)}
              >
                {inscripciones.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.torneoNombre} ({i.estadoInscripcion})
                  </option>
                ))}
              </select>
            </div>
          )}

          {feedback && <p className="banner banner-success">{feedback}</p>}
          {error && <p className="banner banner-error">{error}</p>}

          {inscripciones.length === 0 ? (
            <p className="empty-state">Inscríbete a un torneo para empezar a gestionar el plantel.</p>
          ) : activos.length === 0 ? (
            <p className="empty-state">No hay miembros activos. Agrega jugadores desde el panel de abajo.</p>
          ) : (
            <ul className="dg-players-grid">
              {activos.map((m) => (
                <PlayerRow
                  key={m.personaId}
                  miembro={m}
                  editandoCamiseta={editandoCamiseta}
                  nuevoNumero={nuevoNumero}
                  actioningId={actioningId}
                  onStartEdit={() => { setEditandoCamiseta(m.personaId); setNuevoNumero(m.numeroCamiseta || ''); }}
                  onCancelEdit={() => setEditandoCamiseta(null)}
                  onNumeroChange={setNuevoNumero}
                  onGuardarCamiseta={() => handleGuardarCamiseta(m.personaId)}
                  onRemover={() => setRemover({ open: true, miembro: m })}
                />
              ))}
            </ul>
          )}

          {/* Agregar jugador */}
          {inscripciones.length > 0 && (
            <article className="ds-panel" style={{ marginTop: 24, marginBottom: 0 }}>
              <header className="panel-header">
                <h2>Agregar jugador</h2>
                <p>Escribe su documento y su nombre completo. Si todavía no tiene cuenta, entra al plantel como «Sin cuenta».</p>
              </header>
              <form onSubmit={handleAgregar} noValidate>
                <div className="dg-form-grid">
                  <div className="dg-form-field">
                    <label className="dg-form-label" htmlFor="miembro-tipo">Tipo de documento</label>
                    <select
                      id="miembro-tipo"
                      className="dg-form-select"
                      value={nuevo.tipoDocumento}
                      onChange={(e) => setNuevo((p) => ({ ...p, tipoDocumento: e.target.value }))}
                    >
                      {TIPOS_DOCUMENTO.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dg-form-field">
                    <label className="dg-form-label" htmlFor="miembro-documento">Número de documento</label>
                    <input
                      id="miembro-documento"
                      className="dg-form-input"
                      type="text"
                      autoComplete="off"
                      maxLength={20}
                      required
                      value={nuevo.numeroDocumento}
                      onChange={(e) => setNuevo((p) => ({ ...p, numeroDocumento: e.target.value }))}
                    />
                  </div>
                  <div className="dg-form-field">
                    <label className="dg-form-label" htmlFor="miembro-nombre">Nombre completo</label>
                    <input
                      id="miembro-nombre"
                      className="dg-form-input"
                      type="text"
                      autoComplete="off"
                      maxLength={150}
                      required
                      value={nuevo.nombre}
                      onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="dg-form-field">
                    <label className="dg-form-label" htmlFor="miembro-camiseta">Camiseta (opcional)</label>
                    <input
                      id="miembro-camiseta"
                      className="dg-form-input"
                      type="number"
                      min={1}
                      max={99}
                      value={nuevo.numeroCamiseta}
                      onChange={(e) => setNuevo((p) => ({ ...p, numeroCamiseta: e.target.value }))}
                    />
                  </div>
                </div>
                {errorAgregar && <p className="banner banner-error" role="alert" style={{ marginTop: 14 }}>{errorAgregar}</p>}
                <button type="submit" className="dg-form-submit" disabled={agregando}>
                  {agregando ? 'Agregando…' : 'Agregar al plantel'}
                </button>
              </form>
            </article>
          )}
        </>
      )}

      {/* Modal de confirmación para eliminar */}
      {remover.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Eliminar del plantel</h3>
            <p>Vas a eliminar a <strong>{remover.miembro?.nombre}</strong> del equipo.</p>
            {remover.miembro?.torneoEstado === 'EN_CURSO' && (
              <p className="banner banner-warning" style={{ margin: '0.75rem 0' }}>
                El torneo ya inició. Sus estadísticas previas se conservan,
                pero no podrá participar en los próximos partidos.
              </p>
            )}
            <div className="modal-actions">
              <button
                className="action-button ghost"
                onClick={() => setRemover({ open: false, miembro: null })}
              >
                Cancelar
              </button>
              <button className="action-button reject" onClick={confirmarRemover}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ miembro: m, editandoCamiseta, nuevoNumero, actioningId, onStartEdit, onCancelEdit, onNumeroChange, onGuardarCamiseta, onRemover }) {
  const cls = [
    'dg-player-row',
    m.esDelegado ? 'captain' : '',
    m.sancionado ? 'suspended' : '',
  ].filter(Boolean).join(' ');

  return (
    <li className={cls}>
      <div className="dg-player-num">{m.numeroCamiseta ?? '?'}</div>
      <div className="dg-player-details">
        <div className="dg-player-name-row">
          {m.nombre || 'Sin nombre'}
          {m.esDelegado && <span className="dg-player-captain-tag">Capitán</span>}
          {m.tieneCuenta === false && <span className="dg-player-sin-cuenta-tag">Sin cuenta</span>}
        </div>
        <div className="dg-player-sub">
          <span>{m.posicion || '—'}</span>
          <span className="dg-dot" />
          <span className="mono">{m.numeroDocumento || 'Sin documento'}</span>
          {m.alturaCm && (<><span className="dg-dot" /><span>{m.alturaCm} cm</span></>)}
          {m.piernaHabil && (<><span className="dg-dot" /><span>{m.piernaHabil}</span></>)}
        </div>
      </div>
      <div className="dg-player-cards">
        {editandoCamiseta === m.personaId ? (
          <form className="camiseta-inline-form" onSubmit={(e) => { e.preventDefault(); onGuardarCamiseta(); }}>
            <input
              className="form-input"
              type="number" min={1} max={99}
              value={nuevoNumero}
              onChange={(e) => onNumeroChange(e.target.value)}
              autoFocus
              onBlur={onCancelEdit}
              style={{ width: 60, padding: '2px 6px', fontSize: '0.9rem', fontWeight: 700 }}
            />
          </form>
        ) : (
          <span className="camiseta-badge" onClick={onStartEdit} title="Editar número">
            #{m.numeroCamiseta ?? '?'}
          </span>
        )}
      </div>
      <div className="dg-player-actions">
        {!m.esDelegado && (
          <button type="button" className="dg-btn-icon danger" onClick={onRemover} title="Eliminar" disabled={actioningId === m.personaId}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

export default MiEquipoTab;
