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
import { getJugadorByCedula } from '../../api/jugadores';
import { getToken } from '../../utils/session';

function MiEquipoTab({ onEquipoCreado }) {
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

  // Buscar y agregar jugador
  const [cedulaBuscar, setCedulaBuscar] = useState('');
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [errorVerif, setErrorVerif] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [numeroCamiseta, setNumeroCamiseta] = useState('');
  const [agregando, setAgregando] = useState(false);

  // Remover jugador
  const [remover, setRemover] = useState({ open: false, miembro: null });

  // Editar camiseta inline
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
    } catch {/* noop */}
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
      setFeedback(`Equipo "${eq.nombre}" creado. Ahora inscríbete a un torneo desde la pestaña Torneos.`);
      setNombreNuevo('');
      onEquipoCreado?.();
    } catch (err) {
      setError(err?.message || 'No fue posible crear el equipo.');
    } finally {
      setCreando(false);
    }
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    if (!cedulaBuscar.trim()) return;
    setBuscando(true);
    setErrorVerif('');
    setJugadorEncontrado(null);
    try {
      const j = await getJugadorByCedula(cedulaBuscar.trim(), getToken());
      setJugadorEncontrado(j);
    } catch (err) {
      setErrorVerif(err?.message || 'No se encontró el jugador.');
    } finally {
      setBuscando(false);
    }
  };

  const handleAgregarJugador = async () => {
    if (!jugadorEncontrado) return;
    setAgregando(true);
    setError('');
    setFeedback('');
    try {
      await agregarMiembro(inscActiva, {
        cedula: jugadorEncontrado.cedula,
        numeroCamiseta: numeroCamiseta ? parseInt(numeroCamiseta, 10) : null,
      }, getToken());
      setFeedback(`${jugadorEncontrado.nombre} agregado al plantel.`);
      setJugadorEncontrado(null);
      setCedulaBuscar('');
      setNumeroCamiseta('');
      await loadMiembros();
    } catch (err) {
      setError(err?.message);
    } finally {
      setAgregando(false);
    }
  };

  const confirmarRemover = async () => {
    const miembro = remover.miembro;
    if (!miembro) return;
    setActioningId(miembro.cedula);
    setError('');
    setFeedback('');
    try {
      await removerMiembro(inscActiva, miembro.cedula, getToken());
      setFeedback(`${miembro.nombre} eliminado del plantel.`);
      setRemover({ open: false, miembro: null });
      await loadMiembros();
    } catch (err) {
      setError(err?.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleGuardarCamiseta = async (cedula) => {
    setError('');
    setFeedback('');
    try {
      const num = nuevoNumero ? parseInt(nuevoNumero, 10) : null;
      await actualizarCamiseta(inscActiva, cedula, num, getToken());
      setFeedback('Número de camiseta actualizado.');
      setEditandoCamiseta(null);
      await loadMiembros();
    } catch (err) {
      setError(err?.message);
    }
  };

  const inicialesEquipo = (equipo?.nombre || '??').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  return (
    <div className="view-stack">
      {/* Crear equipo */}
      {!loading && !equipo && (
        <article className="ds-panel">
          <header className="panel-header">
            <h2>Crea tu equipo</h2>
            <p>Define el nombre del equipo que dirigirás. Podrás inscribirlo en torneos publicados.</p>
          </header>
          <form className="inline-search" onSubmit={handleCrear}>
            <input
              className="form-input"
              type="text"
              placeholder="Ej: Los Magos"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              required
            />
            <button type="submit" className="action-button primary" disabled={creando}>
              {creando ? 'Creando…' : 'Crear equipo'}
            </button>
          </form>
          {feedback && <p className="banner banner-success">{feedback}</p>}
          {error && <p className="banner banner-error">{error}</p>}
        </article>
      )}

      {/* Equipo + plantilla */}
      {equipo && (
        <article className="ds-panel">
          <header className="team-header">
            <div className="team-crest">{inicialesEquipo}</div>
            <div className="team-info">
              <div className="team-name">{equipo.nombre}</div>
              <div className="team-meta">
                {inscripciones.length > 0
                  ? `${inscripciones.length} inscripción(es) a torneos`
                  : 'Aún no estás inscrito en ningún torneo'}
              </div>
            </div>
            <div className="team-counters">
              <div className="team-counter">
                <div className="team-counter-val">{miembros.filter((m) => m.estado === 'ACTIVO').length}</div>
                <div className="team-counter-lbl">Jugadores</div>
              </div>
            </div>
          </header>

          {inscripciones.length > 0 && (
            <div className="inline-search">
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
          ) : miembros.filter((m) => m.estado === 'ACTIVO').length === 0 ? (
            <p className="empty-state">No hay miembros activos. Agrega jugadores desde el panel de abajo.</p>
          ) : (
            <div className="players-grid">
              {miembros.filter((m) => m.estado === 'ACTIVO').map((m) => (
                <div key={m.cedula} className={`player-row ${m.esDelegado ? 'captain' : ''}`}>
                  <div className="player-row-top">
                    <div className="player-name-row">
                      <span className="player-name">{m.nombre || m.cedula}</span>
                      {m.esDelegado && <span className="player-captain-tag">Delegado</span>}
                      {editandoCamiseta === m.cedula ? (
                        <form className="camiseta-inline-form" onSubmit={(e) => { e.preventDefault(); handleGuardarCamiseta(m.cedula); }}>
                          <input
                            className="form-input"
                            type="number" min={1} max={99}
                            value={nuevoNumero}
                            onChange={(e) => setNuevoNumero(e.target.value)}
                            autoFocus
                            onBlur={() => setEditandoCamiseta(null)}
                          />
                        </form>
                      ) : (
                        <span
                          className="camiseta-badge"
                          onClick={() => { setEditandoCamiseta(m.cedula); setNuevoNumero(m.numeroCamiseta || ''); }}
                          title="Editar número"
                        >
                          #{m.numeroCamiseta ?? '?'}
                        </span>
                      )}
                      <span className={`status-pill ${m.estado === 'ACTIVO' ? 'on' : 'off'}`}>{m.estado}</span>
                      {!m.esDelegado && (
                        <button
                          className="action-button danger small"
                          onClick={() => setRemover({ open: true, miembro: m })}
                          title="Eliminar del plantel"
                          disabled={actioningId === m.cedula}
                        >
                          {actioningId === m.cedula ? '…' : '✕'}
                        </button>
                      )}
                    </div>
                    <div className="player-sub">
                      <span>{m.posicion || '—'}</span>
                      <span className="dot" />
                      <span className="mono">{m.cedula}</span>
                      {m.alturaCm && (<><span className="dot" /><span>{m.alturaCm} cm</span></>)}
                      {m.piernaHabil && (<><span className="dot" /><span>{m.piernaHabil}</span></>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {/* Agregar jugador — buscar cédula y agregar */}
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Agregar jugador</h2>
          <p>Busca por cédula y agrégalo directamente al plantel.</p>
        </header>
        <form className="inline-search" onSubmit={handleVerificar}>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            placeholder="Cédula del jugador"
            value={cedulaBuscar}
            onChange={(e) => setCedulaBuscar(e.target.value)}
            required
          />
          <button className="action-button primary" type="submit" disabled={buscando}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
        {errorVerif && <p className="banner banner-error">{errorVerif}</p>}
        {jugadorEncontrado && (
          <div className="add-player-form" style={{ marginTop: '1rem' }}>
            <div className="player-card">
              <h3 className="player-name">{jugadorEncontrado.nombre || '—'}</h3>
              <dl className="player-grid">
                <div><dt>Cédula</dt><dd className="mono">{jugadorEncontrado.cedula || '—'}</dd></div>
                <div><dt>Semestre</dt><dd>{jugadorEncontrado.semestre ?? '—'}</dd></div>
                <div><dt>Rol</dt><dd>{jugadorEncontrado.rolJugador || '—'}</dd></div>
              </dl>
            </div>
            <div className="inline-search" style={{ marginTop: '0.5rem' }}>
              <input
                className="form-input"
                type="number"
                min={1} max={99}
                placeholder="N° camiseta (opcional)"
                value={numeroCamiseta}
                onChange={(e) => setNumeroCamiseta(e.target.value)}
                style={{ maxWidth: '200px' }}
              />
              <button className="action-button primary" onClick={handleAgregarJugador} disabled={agregando}>
                {agregando ? 'Agregando…' : 'Agregar al plantel'}
              </button>
            </div>
          </div>
        )}
      </article>

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

export default MiEquipoTab;