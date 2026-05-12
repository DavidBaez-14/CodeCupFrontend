import { useCallback, useEffect, useState } from 'react';
import { createTorneo, listTorneosAdmin, publicarTorneo, iniciarTorneo } from '../../api/supercopa';
import { getToken } from '../../utils/session';

const ESTADO_LABEL = {
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
};

function ConfigurarTorneoView() {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    edicion: new Date().getFullYear(),
    fechaInicio: '',
    fechaFin: '',
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listTorneosAdmin(getToken());
      setTorneos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar los torneos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.edicion) {
      setError('Nombre y edición son obligatorios.');
      return;
    }
    setCreating(true);
    setError('');
    setFeedback('');
    try {
      await createTorneo(
        {
          nombre: form.nombre.trim(),
          edicion: Number(form.edicion),
          fechaInicio: form.fechaInicio || null,
          fechaFin: form.fechaFin || null,
        },
        getToken(),
      );
      setFeedback(`Torneo "${form.nombre}" creado en estado BORRADOR.`);
      setForm({ nombre: '', edicion: new Date().getFullYear(), fechaInicio: '', fechaFin: '' });
      await load();
    } catch (err) {
      setError(err?.message || 'No fue posible crear el torneo.');
    } finally {
      setCreating(false);
    }
  };

  const handlePublicar = async (torneo) => {
    setActioningId(torneo.id);
    setError('');
    setFeedback('');
    try {
      await publicarTorneo(torneo.id, getToken());
      setFeedback(`"${torneo.nombre}" publicado.`);
      await load();
    } catch (err) {
      setError(err?.message || 'No fue posible publicar el torneo.');
    } finally {
      setActioningId(null);
    }
  };

  const handleIniciar = async (torneo) => {
    setActioningId(torneo.id);
    setError('');
    setFeedback('');
    try {
      await iniciarTorneo(torneo.id, getToken());
      setFeedback(`"${torneo.nombre}" pasó a EN CURSO.`);
      await load();
    } catch (err) {
      setError(err?.message || 'No fue posible iniciar el torneo.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Crear torneo</h2>
          <p>Los torneos nacen en estado <strong>BORRADOR</strong>. Publícalos para que los delegados puedan inscribirse.</p>
        </header>

        <form className="torneo-form" onSubmit={handleCrear}>
          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Nombre</span>
              <input
                className="form-input"
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Supercopa Mundial 2026"
                required
              />
            </label>
            <label className="form-field">
              <span className="form-label">Edición</span>
              <input
                className="form-input"
                type="number"
                min={1}
                value={form.edicion}
                onChange={(e) => setForm((p) => ({ ...p, edicion: e.target.value }))}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Fecha inicio</span>
              <input
                className="form-input"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Fecha fin</span>
              <input
                className="form-input"
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
              />
            </label>
          </div>
          <button type="submit" className="action-button primary" disabled={creating}>
            {creating ? 'Creando…' : 'Crear torneo'}
          </button>
        </form>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}
      </article>

      <article className="ds-panel">
        <header className="panel-header">
          <h2>Torneos existentes</h2>
          <p>Maneja el ciclo de vida de cada torneo: publicar → iniciar.</p>
        </header>

        {loading ? (
          <p className="empty-state">Cargando torneos…</p>
        ) : torneos.length === 0 ? (
          <p className="empty-state">Aún no hay torneos creados.</p>
        ) : (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Edición</th>
                  <th>Estado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {torneos.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nombre}</td>
                    <td className="mono">{t.edicion}</td>
                    <td>
                      <span className={`status-pill estado-${(t.estado || '').toLowerCase()}`}>
                        {ESTADO_LABEL[t.estado] || t.estado}
                      </span>
                    </td>
                    <td>{t.fechaInicio || '—'}</td>
                    <td>{t.fechaFin || '—'}</td>
                    <td className="actions-cell">
                      {t.estado === 'BORRADOR' && (
                        <button
                          type="button"
                          className="action-button approve"
                          disabled={actioningId === t.id}
                          onClick={() => handlePublicar(t)}
                        >
                          {actioningId === t.id ? '…' : 'Publicar'}
                        </button>
                      )}
                      {t.estado === 'PUBLICADO' && (
                        <button
                          type="button"
                          className="action-button primary"
                          disabled={actioningId === t.id}
                          onClick={() => handleIniciar(t)}
                        >
                          {actioningId === t.id ? '…' : 'Iniciar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}

export default ConfigurarTorneoView;
