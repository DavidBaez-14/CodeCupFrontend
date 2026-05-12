import { useCallback, useEffect, useState } from 'react';
import {
  createEquipo,
  getMiEquipo,
  listInscripcionesDelegado,
  listMiembrosEquipoTorneo,
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

  // Verificar jugador
  const [cedulaBuscar, setCedulaBuscar] = useState('');
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [errorVerif, setErrorVerif] = useState('');
  const [buscando, setBuscando] = useState(false);

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

  useEffect(() => { cargarEquipo(); }, [cargarEquipo]);
  useEffect(() => { cargarInscripciones(); }, [cargarInscripciones]);

  useEffect(() => {
    if (!inscActiva) { setMiembros([]); return; }
    let alive = true;
    listMiembrosEquipoTorneo(inscActiva, getToken())
      .then((data) => { if (alive) setMiembros(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setMiembros([]); });
    return () => { alive = false; };
  }, [inscActiva]);

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
                <div className="team-counter-val">{miembros.length}</div>
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
            <p className="empty-state">Inscríbete a un torneo para empezar a recibir solicitudes de jugadores.</p>
          ) : miembros.length === 0 ? (
            <p className="empty-state">No hay miembros aún. Las solicitudes aprobadas aparecerán aquí.</p>
          ) : (
            <div className="players-grid">
              {miembros.map((m) => (
                <div key={m.cedula} className={`player-row ${m.esDelegado ? 'captain' : ''}`}>
                  <div className="player-num">{m.numeroCamiseta || '–'}</div>
                  <div className="player-details">
                    <div className="player-name-row">
                      {m.nombre || m.cedula}
                      {m.esDelegado && <span className="player-captain-tag">Delegado</span>}
                    </div>
                    <div className="player-sub">
                      <span>{m.posicion || '—'}</span>
                      <span className="dot" />
                      <span className="mono">{m.cedula}</span>
                      {m.alturaCm && (<><span className="dot" /><span>{m.alturaCm} cm</span></>)}
                      {m.piernaHabil && (<><span className="dot" /><span>{m.piernaHabil}</span></>)}
                    </div>
                  </div>
                  <div className="player-status">
                    <span className={`status-pill ${m.estado === 'ACTIVO' ? 'on' : 'off'}`}>{m.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {/* Verificar jugador (lógica antigua reubicada) */}
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Verificar elegibilidad de un jugador</h2>
          <p>Consulta por cédula contra el padrón oficial de la facultad.</p>
        </header>
        <form className="inline-search" onSubmit={handleVerificar}>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 1090000001"
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
          <div className="player-card">
            <header className="player-card-header">
              <span className={`role-pill role-${(jugadorEncontrado.rolJugador || '').toLowerCase()}`}>
                {jugadorEncontrado.rolJugador || '—'}
              </span>
              <span className={`status-pill ${jugadorEncontrado.activo ? 'on' : 'off'}`}>
                {jugadorEncontrado.activo ? 'Activo' : 'Inactivo'}
              </span>
            </header>
            <h3 className="player-name">{jugadorEncontrado.nombre || '—'}</h3>
            <dl className="player-grid">
              <div><dt>Cédula</dt><dd className="mono">{jugadorEncontrado.cedula || '—'}</dd></div>
              <div><dt>Código universitario</dt><dd>{jugadorEncontrado.codigoUniversitario || '—'}</dd></div>
              <div><dt>Semestre</dt><dd>{jugadorEncontrado.semestre ?? '—'}</dd></div>
            </dl>
          </div>
        )}
      </article>
    </div>
  );
}

export default MiEquipoTab;
