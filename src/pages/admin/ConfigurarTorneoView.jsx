import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTorneo,
  listTorneosAdmin,
  publicarTorneo,
  iniciarTorneo,
  getConfiguracionTorneo,
  guardarConfiguracionTorneo,
  generarFixture,
  borrarFixture,
  getFinanzasConfig,
  guardarInscripcionConfig,
  guardarMultaConfig,
  getPremiosTorneo,
  crearPremio,
  actualizarPremio,
  eliminarPremio,
  cerrarTorneo,
  asignarPremio,
  quitarAsignacionPremio,
  listInscripcionesTorneo,
  listMiembrosEquipoTorneoAdmin,
} from '../../api/supercopa';
import { getToken } from '../../utils/session';
import '../../styles/admin-torneo-formato.css';
import '../../styles/finanzas.css';

const ESTADO_LABEL = {
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
};

const TEMPLATES = [
  {
    id: 'LIGA',
    name: 'Liga',
    sub: 'Round-Robin',
    description: 'Todos contra todos en una sola ronda. Quien sume más puntos al final gana el torneo.',
    range: [4, 10],
    tags: ['Sin playoffs', '1 ronda', 'Más partidos'],
    defaults: { numGrupos: null, clasificanPorGrupo: null, repechaje: false, rondasPlayoff: [] },
  },
  {
    id: 'GRUPOS_ELIMINATORIAS',
    name: 'Grupos + Eliminatorias',
    sub: 'Group Stage',
    description: 'Divide los equipos en grupos. Los mejores avanzan a cuartos, semis y final.',
    range: [8, 16],
    tags: ['2–4 grupos', 'Playoffs'],
    defaults: { numGrupos: 2, clasificanPorGrupo: 2, repechaje: false, rondasPlayoff: ['CUARTOS', 'SEMIS', 'FINAL'] },
  },
  {
    id: 'ELIMINACION_DIRECTA',
    name: 'Eliminación Directa',
    sub: 'Single Elimination',
    description: 'Bracket único de eliminación. Pierdes un partido y quedas afuera.',
    range: [4, 16],
    tags: ['Sin grupos', 'Pocos partidos', 'Alta tensión'],
    defaults: { numGrupos: null, clasificanPorGrupo: null, repechaje: false, rondasPlayoff: ['CUARTOS', 'SEMIS', 'FINAL'] },
  },
  {
    id: 'CHAMPIONS',
    name: 'Champions League',
    sub: 'Híbrido + Repechaje',
    description: 'Fase de grupos + repechaje para no eliminados directamente. Estilo Supercopa Mundial.',
    range: [10, 16],
    tags: ['Grupos', 'Repechaje', 'Recomendado FIFA'],
    defaults: { numGrupos: 2, clasificanPorGrupo: 2, repechaje: true, rondasPlayoff: ['CUARTOS', 'SEMIS', 'FINAL'] },
  },
];

const RONDAS_OPCIONES = [
  { id: 'OCTAVOS', label: 'Octavos', partidos: 8 },
  { id: 'CUARTOS', label: 'Cuartos', partidos: 4 },
  { id: 'SEMIS', label: 'Semis', partidos: 2 },
  { id: 'FINAL', label: 'Final', partidos: 1 },
  { id: 'TERCER_PUESTO', label: '3er puesto', partidos: 1 },
];

function recommendedTemplate(equipos) {
  if (equipos >= 11) return 'CHAMPIONS';
  if (equipos >= 8) return 'GRUPOS_ELIMINATORIAS';
  if (equipos >= 4) return 'LIGA';
  return 'ELIMINACION_DIRECTA';
}

function ConfigurarTorneoView() {
  const [torneos, setTorneos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
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

  const loadTorneos = useCallback(async (preserveSelected) => {
    setLoading(true);
    setError('');
    try {
      const data = await listTorneosAdmin(getToken());
      const list = Array.isArray(data) ? data : [];
      setTorneos(list);
      if (!preserveSelected && list.length && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setError(err?.message || 'No fue posible cargar los torneos.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadTorneos(false); }, [loadTorneos]);

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
      const nuevo = await createTorneo(
        {
          nombre: form.nombre.trim(),
          edicion: Number(form.edicion),
          fechaInicio: form.fechaInicio || null,
          fechaFin: form.fechaFin || null,
        },
        getToken(),
      );
      setFeedback(`Torneo "${form.nombre}" creado. Configura el formato.`);
      setForm({ nombre: '', edicion: new Date().getFullYear(), fechaInicio: '', fechaFin: '' });
      await loadTorneos(true);
      if (nuevo?.id) setSelectedId(nuevo.id);
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
      await loadTorneos(true);
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
      await loadTorneos(true);
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
          <p>Los torneos nacen en estado <strong>BORRADOR</strong>. Después configura el formato y publícalo.</p>
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
          <p>Selecciona un torneo para configurar su formato. Publicar/Iniciar también se hace aquí.</p>
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
                  <th>Formato</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {torneos.map((t) => (
                  <tr
                    key={t.id}
                    className={selectedId === t.id ? 'row-selected' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setSelectedId(t.id)}
                      >
                        {t.nombre}
                      </button>
                    </td>
                    <td className="mono">{t.edicion}</td>
                    <td>
                      <span className={`status-pill estado-${(t.estado || '').toLowerCase()}`}>
                        {ESTADO_LABEL[t.estado] || t.estado}
                      </span>
                    </td>
                    <td>
                      {t.formato
                        ? <span className="format-pill">{TEMPLATES.find((x) => x.id === t.formato)?.name || t.formato}</span>
                        : <span className="muted">— sin configurar</span>}
                    </td>
                    <td className="actions-cell">
                      {t.estado === 'BORRADOR' && (
                        <button
                          type="button"
                          className="action-button approve"
                          disabled={actioningId === t.id || !t.formato}
                          onClick={() => handlePublicar(t)}
                          title={!t.formato ? 'Configura el formato antes de publicar' : ''}
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

      {selectedId && (
        <>
          <ConfiguracionFormato
            key={`fmt-${selectedId}`}
            torneoId={selectedId}
            onChanged={() => loadTorneos(true)}
          />
          <ConfiguracionFinanzas
            key={`fin-${selectedId}`}
            torneoId={selectedId}
            configTorneo={torneos.find((t) => t.id === selectedId)}
            onChanged={() => loadTorneos(true)}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Sub-componente: Configuración de formato del torneo seleccionado
// ─────────────────────────────────────────────────────────────────

function ConfiguracionFormato({ torneoId, onChanged }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    formato: null,
    numGrupos: 2,
    clasificanPorGrupo: 2,
    repechaje: false,
    rondasPlayoff: ['CUARTOS', 'SEMIS', 'FINAL'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getConfiguracionTorneo(torneoId, getToken());
      setConfig(data);
      if (data.formato) {
        setDraft({
          formato: data.formato,
          numGrupos: data.numGrupos ?? 2,
          clasificanPorGrupo: data.clasificanPorGrupo ?? 2,
          repechaje: !!data.repechaje,
          rondasPlayoff: data.rondasPlayoff || [],
        });
      }
    } catch (err) {
      setError(err?.message || 'No fue posible cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => { load(); }, [load]);

  const equipos = config?.equiposAprobados ?? 0;
  const recommended = useMemo(() => recommendedTemplate(equipos), [equipos]);
  const formatoEditable = config?.formatoEditable ?? false;

  const aplicarPlantilla = (id) => {
    if (!formatoEditable) return;
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setDraft({
      formato: id,
      numGrupos: tpl.defaults.numGrupos ?? 2,
      clasificanPorGrupo: tpl.defaults.clasificanPorGrupo ?? 2,
      repechaje: tpl.defaults.repechaje,
      rondasPlayoff: tpl.defaults.rondasPlayoff,
    });
  };

  const toggleRonda = (r) => {
    setDraft((prev) => ({
      ...prev,
      rondasPlayoff: prev.rondasPlayoff.includes(r)
        ? prev.rondasPlayoff.filter((x) => x !== r)
        : [...prev.rondasPlayoff, r],
    }));
  };

  const stepNumGrupos = (delta) => {
    setDraft((prev) => {
      const next = Math.min(4, Math.max(1, (prev.numGrupos || 1) + delta));
      return { ...prev, numGrupos: next };
    });
  };

  const stepClasifican = (delta) => {
    setDraft((prev) => {
      const next = Math.min(8, Math.max(1, (prev.clasificanPorGrupo || 1) + delta));
      return { ...prev, clasificanPorGrupo: next };
    });
  };

  const equiposPorGrupo = useMemo(() => {
    if (!draft.numGrupos || draft.numGrupos < 1) return 0;
    return Math.ceil(equipos / draft.numGrupos);
  }, [equipos, draft.numGrupos]);

  /**
   * Capacidad disponible para la primera ronda KO según el formato seleccionado.
   * Determina qué chips de ronda son válidos para no permitir configurar fases
   * imposibles (caso ELIMINACION_DIRECTA con 2 equipos pero chip CUARTOS activo).
   */
  const equiposParaPrimeraKO = useMemo(() => {
    if (!draft.formato) return 0;
    if (draft.formato === 'ELIMINACION_DIRECTA') return equipos;
    if (draft.formato === 'GRUPOS_ELIMINATORIAS') {
      return draft.numGrupos * draft.clasificanPorGrupo;
    }
    if (draft.formato === 'CHAMPIONS') {
      // En CHAMPIONS con repechaje: top 2 directos + ganadores de repechaje (mitad)
      const total = draft.numGrupos * draft.clasificanPorGrupo;
      if (draft.repechaje) {
        const directos = 2 * draft.numGrupos;
        const repechaje = total - directos;
        return directos + Math.floor(repechaje / 2);
      }
      return total;
    }
    return 0;
  }, [draft, equipos]);

  // Para chips: la primera ronda válida es la más pequeña que cabe.
  // Cuando equiposParaPrimeraKO == 2 → solo FINAL
  //                        == 4 → SEMIS + FINAL
  //                        == 8 → CUARTOS + SEMIS + FINAL
  //                        == 16 → OCTAVOS + CUARTOS + SEMIS + FINAL
  const rondaPermitida = (rondaId) => {
    if (!draft.formato || equiposParaPrimeraKO === 0) return { ok: true, motivo: '' };
    const opt = RONDAS_OPCIONES.find((x) => x.id === rondaId);
    if (!opt) return { ok: true, motivo: '' };
    if (rondaId === 'TERCER_PUESTO') return { ok: true, motivo: '' };
    const cupos = opt.partidos * 2;
    if (cupos > equiposParaPrimeraKO) {
      return {
        ok: false,
        motivo: `Necesitas ${cupos} equipos en la primera ronda KO; tu configuración solo aporta ${equiposParaPrimeraKO}.`,
      };
    }
    return { ok: true, motivo: '' };
  };

  const partidosEstimados = useMemo(() => {
    let total = 0;
    if (draft.formato === 'LIGA') {
      total = equipos * (equipos - 1) / 2;
    } else if (draft.formato === 'GRUPOS_ELIMINATORIAS' || draft.formato === 'CHAMPIONS') {
      const n = equiposPorGrupo;
      const porGrupo = n * (n - 1) / 2;
      total = porGrupo * draft.numGrupos;
    }
    for (const r of draft.rondasPlayoff) {
      const opt = RONDAS_OPCIONES.find((x) => x.id === r);
      if (opt) total += opt.partidos;
    }
    if (draft.repechaje) total += 4;
    return total;
  }, [draft, equipos, equiposPorGrupo]);

  // TODO (post-demo): validación CHAMPIONS más fina.
  //   Hoy "pasan directo por grupo" está hardcodeado en 2 (regla del reglamento),
  //   y el warning compara totalClasifican vs cupos de la primera ronda elegida
  //   sin contar el efecto del repechaje (que reduce a la mitad).
  //   Casos que aún no validamos bien:
  //     - 2 grupos × 5 eq + top 2 directos = 4 directos → naturalmente cabe en
  //       SEMIS (4 cupos), no en CUARTOS. La UI debería SUGERIR la ronda óptima
  //       según equiposParaPrimeraKO en lugar de marcar warning genérico.
  //     - Repechaje impar (3 equipos no se emparejan) debe bloquearse explícito.
  //     - "Pasan directo por grupo" debería ser configurable (no fijo en 2)
  //       para soportar formatos personalizados.
  //   Para hoy: el warning solo detecta totalClasifican > cuposPrimera; el chip
  //   rojo + tooltip de la ronda inválida sigue activo y guía al admin.
  const warning = useMemo(() => {
    if (!draft.formato) return null;
    if (draft.formato === 'GRUPOS_ELIMINATORIAS' || draft.formato === 'CHAMPIONS') {
      const totalClasifican = draft.numGrupos * draft.clasificanPorGrupo;
      const primeraRonda = draft.rondasPlayoff[0];
      const cuposPrimera = RONDAS_OPCIONES.find((x) => x.id === primeraRonda)?.partidos * 2 || 0;
      if (cuposPrimera > 0 && totalClasifican > cuposPrimera) {
        return `Clasifican ${totalClasifican} equipos pero la primera ronda (${primeraRonda}) solo tiene ${cuposPrimera} cupos.`;
      }
      if (equipos > 0 && draft.numGrupos * equiposPorGrupo > equipos + 2) {
        return `Hay ${equipos} equipos inscritos. Con ${draft.numGrupos} grupos de ${equiposPorGrupo} algunos grupos quedarán desbalanceados.`;
      }
    }
    if (draft.formato === 'ELIMINACION_DIRECTA') {
      const primera = draft.rondasPlayoff[0];
      const cupos = RONDAS_OPCIONES.find((x) => x.id === primera)?.partidos * 2 || 0;
      if (equipos > cupos) {
        return `Hay ${equipos} equipos pero la primera ronda (${primera}) solo tiene ${cupos} cupos.`;
      }
    }
    return null;
  }, [draft, equipos, equiposPorGrupo]);

  const handleGuardar = async () => {
    if (!draft.formato) {
      setError('Selecciona una plantilla primero.');
      return;
    }
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const payload = {
        formato: draft.formato,
        numGrupos: ['GRUPOS_ELIMINATORIAS', 'CHAMPIONS'].includes(draft.formato) ? draft.numGrupos : null,
        clasificanPorGrupo: ['GRUPOS_ELIMINATORIAS', 'CHAMPIONS'].includes(draft.formato) ? draft.clasificanPorGrupo : null,
        repechaje: draft.formato === 'CHAMPIONS' ? draft.repechaje : false,
        rondasPlayoff: draft.formato === 'LIGA' ? [] : draft.rondasPlayoff,
      };
      const data = await guardarConfiguracionTorneo(torneoId, payload, getToken());
      setConfig(data);
      setFeedback('Configuración guardada.');
      if (onChanged) onChanged();
    } catch (err) {
      setError(err?.message || 'No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <article className="ds-panel">
        <p className="empty-state">{loading ? 'Cargando configuración…' : 'Sin datos.'}</p>
      </article>
    );
  }

  return (
    <article className="ds-panel ct-panel">
      <header className="panel-header">
        <h2>Formato de "{config.torneoNombre}"</h2>
        <p>Elige una plantilla, ajusta parámetros y guarda. Los cambios se bloquean cuando el torneo está EN CURSO.</p>
      </header>

      <div className="ct-context">
        <div className="ct-context-info">
          <div className="ct-context-name">{config.torneoNombre}</div>
          <div className="ct-context-meta">
            Estado: {ESTADO_LABEL[config.estado] || config.estado}
            {config.fixtureGenerado && ' · Fixture generado'}
            {config.hayPartidoJugado && ' · Con partidos jugados'}
          </div>
        </div>
        <div className="ct-context-stat">
          <div className="ct-context-val"><em>{equipos}</em></div>
          <div className="ct-context-lbl">Equipos</div>
        </div>
        <div className="ct-context-stat">
          <div className="ct-context-val">
            {draft.formato === 'LIGA' ? 'Liga'
              : draft.formato === 'ELIMINACION_DIRECTA' ? 'KO'
              : draft.numGrupos ? `${draft.numGrupos}×G` : '—'}
          </div>
          <div className="ct-context-lbl">Formato</div>
        </div>
        <div className="ct-context-stat">
          <div className="ct-context-val">{partidosEstimados || '—'}</div>
          <div className="ct-context-lbl">Partidos est.</div>
        </div>
      </div>

      {!formatoEditable && (
        <p className="banner banner-warn">
          <strong>Formato bloqueado.</strong> {config.motivoBloqueoFormato}
        </p>
      )}

      {/* ── PLANTILLAS ── */}
      <section className="ct-section">
        <h3 className="ct-section-title"><span className="ct-section-num">1</span> Plantilla del torneo</h3>
        <p className="ct-section-desc">
          El sistema sugiere una plantilla según los <strong>{equipos}</strong> equipos aprobados.
        </p>
        <div className="ct-templates-grid">
          {TEMPLATES.map((t) => {
            const inRange = equipos >= t.range[0] && equipos <= t.range[1];
            const isRec = t.id === recommended;
            const isSel = draft.formato === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`ct-tpl-card${isSel ? ' selected' : ''}${isRec && !isSel ? ' recommended' : ''}`}
                disabled={!formatoEditable}
                onClick={() => aplicarPlantilla(t.id)}
              >
                {isRec && !isSel && <span className="ct-rec-badge">Recomendada</span>}
                {isSel && <span className="ct-check">✓</span>}
                <div className="ct-tpl-name">{t.name}</div>
                <div className="ct-tpl-sub">{t.sub} · {t.range[0]}–{t.range[1]} eq.{inRange ? '' : ' ⚠'}</div>
                <div className="ct-tpl-desc">{t.description}</div>
                <div className="ct-tpl-tags">
                  {t.tags.map((tag) => <span key={tag} className="ct-tpl-tag">{tag}</span>)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── PERSONALIZAR ── */}
      {draft.formato && (
        <section className="ct-section">
          <h3 className="ct-section-title"><span className="ct-section-num">2</span> Personalizar</h3>
          <p className="ct-section-desc">Ajusta la plantilla a tu torneo. Los cambios se reflejan en el preview.</p>

          <div className="ct-config-card">
            <div>
              <div className="ct-col-label">Fase de Grupos</div>
              {['GRUPOS_ELIMINATORIAS', 'CHAMPIONS'].includes(draft.formato) ? (
                <>
                  <div className="ct-param-row">
                    <div>
                      <div className="ct-param-name">Cantidad de grupos</div>
                      <div className="ct-param-hint">Cómo se reparten los {equipos} equipos</div>
                    </div>
                    <Stepper value={draft.numGrupos} onStep={stepNumGrupos} min={1} max={4} disabled={!formatoEditable} />
                  </div>
                  <div className="ct-param-row">
                    <div>
                      <div className="ct-param-name">Equipos por grupo</div>
                      <div className="ct-param-hint">Promedio · {equipos} / {draft.numGrupos} = {(equipos / draft.numGrupos).toFixed(1)}</div>
                    </div>
                    <div className="ct-static-val">{equiposPorGrupo}</div>
                  </div>
                  <div className="ct-param-row">
                    <div>
                      <div className="ct-param-name">Clasifican por grupo</div>
                      <div className="ct-param-hint">Pasan a la fase eliminatoria</div>
                    </div>
                    <Stepper value={draft.clasificanPorGrupo} onStep={stepClasifican} min={1} max={Math.max(1, equiposPorGrupo - 1)} disabled={!formatoEditable} />
                  </div>
                  {draft.formato === 'CHAMPIONS' && (
                    <div className="ct-param-row">
                      <div>
                        <div className="ct-param-name">Repechaje</div>
                        <div className="ct-param-hint">Los que no clasifican directo juegan repechaje</div>
                      </div>
                      <button
                        type="button"
                        className={`ct-toggle${draft.repechaje ? ' on' : ''}`}
                        disabled={!formatoEditable}
                        onClick={() => setDraft((p) => ({ ...p, repechaje: !p.repechaje }))}
                      >
                        <span className="ct-toggle-knob" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted">Esta plantilla no usa fase de grupos.</p>
              )}
            </div>

            <div>
              <div className="ct-col-label">Eliminatorias</div>
              {draft.formato === 'LIGA' ? (
                <p className="muted">Esta plantilla no usa fase eliminatoria.</p>
              ) : (
                <>
                  <div className="ct-param-row">
                    <div>
                      <div className="ct-param-name">Rondas activas</div>
                      <div className="ct-param-hint">Toca para activar/desactivar</div>
                    </div>
                  </div>
                  <div className="ct-rounds-chips">
                    {RONDAS_OPCIONES.map((r) => {
                      const permiso = rondaPermitida(r.id);
                      const activo = draft.rondasPlayoff.includes(r.id);
                      const disabled = !formatoEditable || (!permiso.ok && !activo);
                      const motivo = !permiso.ok
                        ? permiso.motivo
                        : !formatoEditable ? 'Formato bloqueado' : '';
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`ct-round-chip${activo ? ' on' : ''}${!permiso.ok ? ' invalid' : ''}`}
                          disabled={disabled}
                          onClick={() => toggleRonda(r.id)}
                          title={motivo}
                        >
                          {r.label}
                          {!permiso.ok && <span className="ct-round-chip-warn" aria-hidden="true"> ⚠</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="ct-param-row" style={{ marginTop: 12 }}>
                    <div>
                      <div className="ct-param-name">Total partidos KO</div>
                      <div className="ct-param-hint">Sin contar tercer puesto ni desempates</div>
                    </div>
                    <div className="ct-static-val brand">
                      {draft.rondasPlayoff.reduce((a, r) => a + (RONDAS_OPCIONES.find((x) => x.id === r)?.partidos || 0), 0)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {warning && (
            <p className="banner banner-warn"><strong>Atención.</strong> {warning}</p>
          )}

          {/* Preview-flow */}
          <div className="ct-preview-card">
            <div className="ct-preview-label">Vista previa del flujo</div>
            <div className="ct-preview-flow">
              <PreviewFlow draft={draft} equiposPorGrupo={equiposPorGrupo} />
            </div>
          </div>
        </section>
      )}

      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <div className="ct-footer">
        <button
          type="button"
          className="action-button primary"
          disabled={saving || !formatoEditable || !draft.formato}
          onClick={handleGuardar}
        >
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>

      {/* ── GENERAR FIXTURE ── */}
      {config.formato && (
        <GenerarFixtureBlock
          torneoId={torneoId}
          config={config}
          onChanged={async () => {
            await load();
            if (onChanged) onChanged();
          }}
        />
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Sub-componente: bloque "Generar fixture" / "Fixture generado"
// ─────────────────────────────────────────────────────────────────

function GenerarFixtureBlock({ torneoId, config, onChanged }) {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleGenerar = async () => {
    setError('');
    setFeedback('');
    setGenerating(true);
    try {
      const data = await generarFixture(torneoId, getToken());
      setFeedback(`Fixture generado con ${Array.isArray(data) ? data.length : 0} partidos.`);
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || 'No fue posible generar el fixture.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBorrar = async () => {
    if (!confirm('¿Borrar el fixture? Solo es posible si no hay partidos jugados ni en curso.')) return;
    setError('');
    setFeedback('');
    setDeleting(true);
    try {
      await borrarFixture(torneoId, getToken());
      setFeedback('Fixture borrado. El formato vuelve a ser editable.');
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err?.message || 'No fue posible borrar el fixture.');
    } finally {
      setDeleting(false);
    }
  };

  if (config.estado === 'BORRADOR' || config.estado === 'PUBLICADO') {
    return (
      <section className="ct-fixture-block ct-fixture-block-info">
        <div>
          <h3 className="ct-fixture-title">Fixture: aún no</h3>
          <p className="ct-fixture-desc">
            Inicia el torneo (estado <strong>EN_CURSO</strong>) para poder generar el fixture.
            Las inscripciones deben estar cerradas y los equipos aprobados.
          </p>
        </div>
      </section>
    );
  }

  if (config.fixtureGenerado) {
    return (
      <section className="ct-fixture-block ct-fixture-block-ok">
        <div>
          <h3 className="ct-fixture-title">Fixture generado ✓</h3>
          <p className="ct-fixture-desc">
            El cronograma ya existe. Velo y gestiónalo desde la pestaña <strong>"Fixture y cronograma"</strong>.
            {config.hayPartidoJugado
              ? ' Como ya hay partidos jugados, no se puede borrar.'
              : ' Si necesitas cambiar el formato, primero borra el fixture.'}
          </p>
        </div>
        <div className="ct-fixture-actions">
          {!config.hayPartidoJugado && (
            <button
              type="button"
              className="action-button reject"
              disabled={deleting}
              onClick={handleBorrar}
            >
              {deleting ? 'Borrando…' : 'Borrar fixture'}
            </button>
          )}
        </div>
        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}
      </section>
    );
  }

  // EN_CURSO sin fixture: el lugar para generarlo.
  return (
    <section className="ct-fixture-block ct-fixture-block-cta">
      <div>
        <h3 className="ct-fixture-title">Generar fixture</h3>
        <p className="ct-fixture-desc">
          Hay <strong>{config.equiposAprobados} equipos aprobados</strong>. Al pulsar el botón
          se crearán todos los partidos según el formato configurado. Si algo no cuadra, el
          backend te dirá qué ajustar — el formato sigue editable mientras no haya partidos.
        </p>
      </div>
      <div className="ct-fixture-actions">
        <button
          type="button"
          className="action-button primary"
          disabled={generating || config.equiposAprobados < 2}
          onClick={handleGenerar}
        >
          {generating ? 'Generando…' : `Generar fixture (${config.equiposAprobados} equipos)`}
        </button>
      </div>
      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}
    </section>
  );
}

function Stepper({ value, onStep, min, max, disabled }) {
  return (
    <div className="ct-stepper">
      <button type="button" className="ct-step-btn" disabled={disabled || value <= min} onClick={() => onStep(-1)}>−</button>
      <div className="ct-step-val">{value}</div>
      <button type="button" className="ct-step-btn" disabled={disabled || value >= max} onClick={() => onStep(1)}>+</button>
    </div>
  );
}

function PreviewFlow({ draft, equiposPorGrupo }) {
  const stages = [];
  if (['GRUPOS_ELIMINATORIAS', 'CHAMPIONS'].includes(draft.formato)) {
    const letters = ['A', 'B', 'C', 'D'].slice(0, draft.numGrupos);
    stages.push({
      head: 'Fase de Grupos',
      blocks: letters.map((L) => `Grupo ${L} · ${equiposPorGrupo} eq.`),
    });
  } else if (draft.formato === 'LIGA') {
    stages.push({ head: 'Liga · Round-Robin', blocks: ['Todos contra todos'] });
  }
  if (draft.repechaje) stages.push({ head: 'Repechaje', blocks: ['4 cruces'] });

  const ordenKO = ['OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];
  for (const r of ordenKO) {
    if (draft.rondasPlayoff.includes(r)) {
      const opt = RONDAS_OPCIONES.find((x) => x.id === r);
      stages.push({ head: opt.label, blocks: [`${opt.partidos} partido${opt.partidos > 1 ? 's' : ''}`] });
    }
  }
  if (draft.rondasPlayoff.includes('TERCER_PUESTO')) {
    stages.push({ head: '3er puesto', blocks: ['1 partido'] });
  }

  return (
    <>
      {stages.map((s, i) => (
        <span key={i} className="ct-stage-wrap">
          {i > 0 && <span className="ct-preview-arrow">→</span>}
          <span className="ct-preview-stage">
            <span className="ct-preview-stage-head">{s.head}</span>
            {s.blocks.map((b, j) => <span key={j} className="ct-preview-block">{b}</span>)}
          </span>
        </span>
      ))}
      {(stages.length > 0) && (
        <span className="ct-stage-wrap">
          <span className="ct-preview-arrow">→</span>
          <span className="ct-preview-stage trophy">
            <span className="ct-preview-trophy">🏆</span>
            <span className="ct-preview-trophy-lbl">Campeón</span>
          </span>
        </span>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Sub-componente: Configuración de Finanzas (Inscripción, Multas, Premios)
// ─────────────────────────────────────────────────────────────────

function ConfiguracionFinanzas({ torneoId, configTorneo, onChanged }) {
  const [finanzas, setFinanzas] = useState(null);
  const [premios, setPremios] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [formInscripcion, setFormInscripcion] = useState({ monto: '', bancoDestino: '', cuentaDestino: '', titularCuenta: '' });
  const [formMultas, setFormMultas] = useState({
    montoAmarilla: '', montoAzul: '', montoRoja: '', fechasSuspensionRoja: 1
  });
  const [formPremio, setFormPremio] = useState({ tipo: 'CAMPEON', descripcion: '', monto: '' });
  const [assigning, setAssigning] = useState(null); // { premioId } while assigning

  const loadFinanzas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, dataPremios] = await Promise.all([
        getFinanzasConfig(torneoId, getToken()),
        getPremiosTorneo(torneoId, getToken()),
      ]);
      setFinanzas(data);
      setFormInscripcion({
        monto: data.monto ?? '',
        bancoDestino: data.bancoDestino || '',
        cuentaDestino: data.cuentaDestino || '',
        titularCuenta: data.titularCuenta || '',
      });
      setFormMultas({
        montoAmarilla: data.multas?.montoAmarilla ?? '',
        montoAzul: data.multas?.montoAzul ?? '',
        montoRoja: data.multas?.montoRoja ?? '',
        fechasSuspensionRoja: data.multas?.fechasSuspensionRoja ?? 1,
      });
      setPremios(Array.isArray(dataPremios) ? dataPremios : []);

      if (configTorneo?.estado === 'FINALIZADO') {
        const inscripciones = await listInscripcionesTorneo(torneoId, getToken());
        const equipos = Array.isArray(inscripciones) ? inscripciones : [];
        const members = await Promise.all(
          equipos.map(eq =>
            listMiembrosEquipoTorneoAdmin(eq.id, getToken()).catch(() => [])
          )
        );
        setJugadores(members.flat().filter(Boolean));
      }
    } catch (err) {
      setError(err?.message || 'Error cargando finanzas.');
    } finally {
      setLoading(false);
    }
  }, [torneoId, configTorneo?.estado]);

  useEffect(() => { loadFinanzas(); }, [loadFinanzas]);

  const handleSaveInscripcion = async () => {
    setSavingConfig(true);
    setFeedback('');
    setError('');
    try {
      await guardarInscripcionConfig(torneoId, {
        monto: Number(formInscripcion.monto),
        bancoDestino: formInscripcion.bancoDestino,
        cuentaDestino: formInscripcion.cuentaDestino,
        titularCuenta: formInscripcion.titularCuenta,
      }, getToken());
      setFeedback('Configuración de inscripción guardada.');
    } catch (err) {
      setError(err?.message || 'Error guardando inscripción.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveMultas = async () => {
    setSavingConfig(true);
    setFeedback('');
    setError('');
    try {
      await guardarMultaConfig(torneoId, {
        montoAmarilla: Number(formMultas.montoAmarilla),
        montoAzul: Number(formMultas.montoAzul),
        montoRoja: Number(formMultas.montoRoja),
        fechasSuspensionRoja: Number(formMultas.fechasSuspensionRoja) || 1,
      }, getToken());
      setFeedback('Configuración de multas guardada.');
    } catch (err) {
      setError(err?.message || 'Error guardando multas.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCrearPremio = async (e) => {
    e.preventDefault();
    setFeedback('');
    setError('');
    try {
      const existing = premios.find(p => p.codigoCatalogo === formPremio.tipo);
      if (existing) {
        await actualizarPremio(torneoId, existing.id, {
          titulo: formPremio.tipo === 'OTRO' ? formPremio.descripcion : null,
          descripcion: null,
          monto: Number(formPremio.monto)
        }, getToken());
        setFeedback('Premio actualizado.');
      } else {
        await crearPremio(torneoId, {
          codigoCatalogo: formPremio.tipo,
          titulo: formPremio.tipo === 'OTRO' ? formPremio.descripcion : null,
          descripcion: null,
          monto: Number(formPremio.monto)
        }, getToken());
        setFeedback('Premio creado.');
      }
      setFormPremio({ tipo: 'CAMPEON', descripcion: '', monto: '' });
      await loadFinanzas();
    } catch (err) {
      setError(err?.message || 'Error guardando premio.');
    }
  };

  const handleEliminarPremio = async (id) => {
    if (!confirm('¿Eliminar este premio?')) return;
    try {
      await eliminarPremio(torneoId, id, getToken());
      setFeedback('Premio eliminado.');
      await loadFinanzas();
    } catch (err) {
      setError(err?.message || 'Error eliminando premio.');
    }
  };

  const handleAsignarPremio = async (premioId, cedula) => {
    if (!cedula) return;
    setAssigning(premioId);
    setFeedback('');
    setError('');
    try {
      await asignarPremio(torneoId, premioId, { cedula }, getToken());
      setFeedback('Premio asignado exitosamente.');
      await loadFinanzas();
    } catch (err) {
      setError(err?.message || 'Error asignando premio.');
    } finally {
      setAssigning(null);
    }
  };

  const handleQuitarAsignacion = async (premioId) => {
    if (!confirm('¿Quitar la asignación de este premio?')) return;
    setFeedback('');
    setError('');
    try {
      await quitarAsignacionPremio(torneoId, premioId, getToken());
      setFeedback('Asignación removida.');
      await loadFinanzas();
    } catch (err) {
      setError(err?.message || 'Error quitando asignación.');
    }
  };

  const handleCerrarTorneo = async () => {
    if (!confirm('¿Estás seguro de cerrar el torneo? Se asignarán los premios automáticos y no se podrán revertir los resultados.')) return;
    try {
      await cerrarTorneo(torneoId, getToken());
      setFeedback('Torneo cerrado exitosamente.');
      if (onChanged) onChanged();
    } catch (err) {
      setError(err?.message || 'Error cerrando el torneo.');
    }
  };

  if (loading || !finanzas) {
    return <div className="empty-state">Cargando finanzas...</div>;
  }

  const isBorrador = configTorneo?.estado === 'BORRADOR';
  const isFinalizado = configTorneo?.estado === 'FINALIZADO';

  return (
    <div className="ds-panel">
      <header className="panel-header">
        <h2>Finanzas y Premios</h2>
        <p>Configura los valores de inscripción, tabla de multas y la bolsa de premios del torneo.</p>
      </header>

      {/* INSCRIPCION */}
      <section className="fn-section">
        <h3 className="fn-section-title">Inscripción</h3>
        <p className="fn-section-desc">Define el costo y el método de pago para que los equipos puedan inscribirse.</p>
        <div className="fn-grid">
          <label className="fn-card">
            <span className="fn-card-label">Valor (COP)</span>
            <input className="fn-card-input" type="number" value={formInscripcion.monto} onChange={e => setFormInscripcion({ ...formInscripcion, monto: e.target.value })} disabled={!isBorrador} />
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Banco / Servicio</span>
            <select className="fn-card-input" value={formInscripcion.bancoDestino} onChange={e => setFormInscripcion({ ...formInscripcion, bancoDestino: e.target.value })} disabled={!isBorrador}>
              <option value="">— Seleccionar —</option>
              <option value="NEQUI">Nequi</option>
              <option value="DAVIPLATA">Daviplata</option>
              <option value="BANCOLOMBIA">Bancolombia</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Número de cuenta</span>
            <input className="fn-card-input" type="text" value={formInscripcion.cuentaDestino} onChange={e => setFormInscripcion({ ...formInscripcion, cuentaDestino: e.target.value })} disabled={!isBorrador} />
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Titular de la cuenta</span>
            <input className="fn-card-input" type="text" value={formInscripcion.titularCuenta} onChange={e => setFormInscripcion({ ...formInscripcion, titularCuenta: e.target.value })} disabled={!isBorrador} />
          </label>
        </div>
        <div className="fn-actions">
          <button type="button" className="action-button primary" onClick={handleSaveInscripcion} disabled={savingConfig || !isBorrador}>
            Guardar Inscripción
          </button>
        </div>
      </section>

      {/* MULTAS */}
      <section className="fn-section">
        <h3 className="fn-section-title">Multas</h3>
        <p className="fn-section-desc">Valores que se cobrarán automáticamente por tarjetas o ausencias.</p>
        <div className="fn-grid">
          <label className="fn-card">
            <span className="fn-card-label">Amarilla (COP)</span>
            <input className="fn-card-input" type="number" value={formMultas.montoAmarilla} onChange={e => setFormMultas({ ...formMultas, montoAmarilla: e.target.value })} />
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Azul (COP)</span>
            <input className="fn-card-input" type="number" value={formMultas.montoAzul} onChange={e => setFormMultas({ ...formMultas, montoAzul: e.target.value })} />
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Roja (COP)</span>
            <input className="fn-card-input" type="number" value={formMultas.montoRoja} onChange={e => setFormMultas({ ...formMultas, montoRoja: e.target.value })} />
          </label>
          <label className="fn-card">
            <span className="fn-card-label">Fechas suspensión roja</span>
            <input className="fn-card-input" type="number" min="1" value={formMultas.fechasSuspensionRoja} onChange={e => setFormMultas({ ...formMultas, fechasSuspensionRoja: e.target.value })} />
          </label>
        </div>
        <div className="fn-actions">
          <button type="button" className="action-button primary" onClick={handleSaveMultas} disabled={savingConfig}>
            Guardar Multas
          </button>
        </div>
      </section>

      {/* PREMIOS */}
      <section className="fn-section">
        <h3 className="fn-section-title">Premios (Bolsa)</h3>
        <p className="fn-section-desc">Crea los premios que se repartirán al final del torneo. Campeón, Subcampeón, MVP, etc.</p>

        <form className="fn-grid" onSubmit={handleCrearPremio} style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
          <label className="fn-card">
            <span className="fn-card-label">Tipo</span>
            <select className="fn-card-input" value={formPremio.tipo} onChange={e => setFormPremio({ ...formPremio, tipo: e.target.value })} disabled={isFinalizado}>
              <option value="CAMPEON">Campeón</option>
              <option value="SUBCAMPEON">Subcampeón</option>
              <option value="TERCERO">Tercer puesto</option>
              <option value="GOLEADOR">Goleador</option>
              <option value="PORTERO_MENOS_VENCIDO">Portero menos vencido</option>
              <option value="MVP">MVP</option>
              <option value="OTRO">Otro...</option>
            </select>
          </label>
          {formPremio.tipo === 'OTRO' && (
            <label className="fn-card">
              <span className="fn-card-label">Descripción</span>
              <input className="fn-card-input" type="text" value={formPremio.descripcion} onChange={e => setFormPremio({ ...formPremio, descripcion: e.target.value })} disabled={isFinalizado} required />
            </label>
          )}
          <label className="fn-card">
            <span className="fn-card-label">Monto (COP)</span>
            <input className="fn-card-input" type="number" value={formPremio.monto} onChange={e => setFormPremio({ ...formPremio, monto: e.target.value })} disabled={isFinalizado} required />
          </label>
          <button type="submit" className="action-button approve" disabled={isFinalizado}>
            {premios.find(p => p.codigoCatalogo === formPremio.tipo) ? 'Actualizar monto' : '+ Agregar'}
          </button>
        </form>

        <div className="fn-premios-list">
          {premios.map(p => {
            const isIndividual = !p.ganadorEquipoNombre;
            const hasWinner = p.ganadorCedula || p.ganadorEquipoTorneoId;
            const isManualType = p.codigoCatalogo === 'MVP' || p.codigoCatalogo === 'OTRO';
            return (
              <div key={p.id} className="fn-premio-item">
                <div className="fn-premio-info">
                  <span className="fn-premio-name">{p.codigoCatalogo === 'OTRO' ? (p.titulo || 'Otro') : p.nombreCatalogo}</span>
                  <span className="fn-premio-amount">${p.monto.toLocaleString()}</span>
                  {p.ganadorEquipoNombre && <span className="fn-premio-winner">🏆 {p.ganadorEquipoNombre} {p.ganadorJugadorNombre ? `(${p.ganadorJugadorNombre})` : ''}</span>}
                  {p.ganadorCedula && !p.ganadorEquipoNombre && (
                    <span className="fn-premio-winner">🏆 {p.ganadorJugadorNombre || p.ganadorCedula}</span>
                  )}
                  {isFinalizado && !hasWinner && isIndividual && isManualType && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <select
                        className="fn-card-input"
                        style={{ flex: 1 }}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAsignarPremio(p.id, e.target.value);
                        }}
                        disabled={assigning === p.id}
                      >
                        <option value="">Seleccionar jugador...</option>
                        {jugadores.map(j => (
                          <option key={j.cedula} value={j.cedula}>{j.nombre || j.cedula}</option>
                        ))}
                      </select>
                      {assigning === p.id && <span className="muted">Asignando...</span>}
                    </div>
                  )}
                  {isFinalizado && hasWinner && isIndividual && isManualType && (
                    <button
                      type="button"
                      className="action-button ghost"
                      style={{ fontSize: '0.75rem', marginTop: 8 }}
                      onClick={() => handleQuitarAsignacion(p.id)}
                    >
                      Quitar asignación
                    </button>
                  )}
                </div>
                {!isFinalizado && (
                  <button type="button" className="action-button reject" onClick={() => handleEliminarPremio(p.id)}>X</button>
                )}
              </div>
            );
          })}
          {premios.length === 0 && <span className="muted">No hay premios configurados.</span>}
        </div>
      </section>

      {/* CERRAR TORNEO */}
      {configTorneo?.estado === 'EN_CURSO' && (
        <section className="fn-section" style={{ border: '1px solid var(--color-error)' }}>
          <h3 className="fn-section-title" style={{ color: 'var(--color-error)' }}>Cerrar Torneo</h3>
          <p className="fn-section-desc">Esta acción finalizará el torneo y asignará automáticamente los premios (Campeón, Goleador, Valla Menos Vencida). No se puede revertir.</p>
          <button type="button" className="action-button reject" onClick={handleCerrarTorneo}>
            Finalizar Torneo
          </button>
        </section>
      )}

      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}
    </div>
  );
}

export default ConfigurarTorneoView;
