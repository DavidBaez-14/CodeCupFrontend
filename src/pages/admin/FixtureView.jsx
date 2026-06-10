import { useCallback, useEffect, useMemo, useState } from 'react';
import MatchCard from '../../components/supercopa/MatchCard';
import ClasificacionLiveTab from '../../components/supercopa/ClasificacionLiveTab';
import BracketLive from '../../components/supercopa/BracketLive';
import {
  borrarFixture,
  listPartidosTorneo,
  listTorneosAdmin,
  getConfiguracionTorneo,
} from '../../api/supercopa';
import { getToken } from '../../utils/session';
import GestionPartidoModal from '../../components/supercopa/GestionPartidoModal';
import '../../styles/admin-fixture.css';

const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
  DESCANSO: 'descanso',
};

const SUBTABS = [
  { id: 'partidos', label: 'Partidos' },
  { id: 'clasificacion', label: 'Clasificación' },
  { id: 'eliminatorias', label: 'Eliminatorias' },
];

function FixtureView() {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [configTorneo, setConfigTorneo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [openPartido, setOpenPartido] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [activeTab, setActiveTab] = useState('partidos');

  useEffect(() => {
    listTorneosAdmin(getToken())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTorneos(list);
        if (list.length && !torneoId) setTorneoId(list[0].id);
      })
      .catch((err) => setError(err?.message || 'No fue posible cargar torneos.'));
  }, [torneoId]);

  const load = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    setError('');
    setFeedback('');
    try {
      const [partidosData, cfg] = await Promise.all([
        listPartidosTorneo(torneoId, getToken()),
        getConfiguracionTorneo(torneoId, getToken()).catch(() => null),
      ]);
      setPartidos(Array.isArray(partidosData) ? partidosData : []);
      setConfigTorneo(cfg);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar el fixture.');
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => { load(); }, [load]);

  const torneoSel = torneos.find((t) => t.id === torneoId);

  const handleBorrar = async () => {
    if (!torneoId) return;
    if (!confirm(
      '¿Borrar el fixture completo? Solo es posible si no hay partidos en curso ni finalizados.'
    )) return;
    setDeleting(true);
    setError('');
    setFeedback('');
    try {
      await borrarFixture(torneoId, getToken());
      setPartidos([]);
      setFeedback('Fixture borrado. Vuelve a "Configurar torneo" para generar uno nuevo.');
    } catch (err) {
      setError(err?.message || 'No fue posible borrar el fixture.');
    } finally {
      setDeleting(false);
    }
  };

  // Agrupar partidos por fase (solo GRUPOS aquí; eliminatorias en su propio tab)
  const seccionesGrupos = useMemo(() => {
    const gruposOnly = partidos.filter((p) => !p.fase || p.fase === 'GRUPOS');
    if (gruposOnly.length === 0) return [];

    const sub = new Map();
    for (const p of gruposOnly) {
      const key = `${p.jornada ?? '?'}|${p.grupo ?? ''}`;
      if (!sub.has(key)) sub.set(key, []);
      sub.get(key).push(p);
    }
    return Array.from(sub.entries())
      .sort((a, b) => {
        const [ja, ga] = a[0].split('|');
        const [jb, gb] = b[0].split('|');
        if (ja !== jb) return Number(ja) - Number(jb);
        return ga.localeCompare(gb);
      })
      .map(([key, lista]) => {
        const [jornada, grupo] = key.split('|');
        return {
          id: `J-${key}`,
          jornada: jornada === '?' ? null : Number(jornada),
          grupo: grupo || null,
          partidos: lista,
        };
      });
  }, [partidos]);

  const hayPartidos = partidos.length > 0;
  const hayKO = partidos.some((p) => p.fase && p.fase !== 'GRUPOS');
  const tieneRondas = Array.isArray(configTorneo?.rondasPlayoff) && configTorneo.rondasPlayoff.length > 0;
  const conRepechaje = !!configTorneo?.repechaje;
  const clasificanPorGrupo = configTorneo?.clasificanPorGrupo;
  const tieneGrupos = partidos.some((p) => p.fase === 'GRUPOS');

  const handlePartidoActualizado = (partidoActualizado) => {
    if (partidoActualizado && partidoActualizado.id) {
      setPartidos((prev) => prev.map((p) => p.id === partidoActualizado.id ? { ...p, ...partidoActualizado } : p));
    }
    // Refrescar el listado completo para reflejar auto-fill del bracket
    load();
  };

  const toggleSection = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrar sub-tabs: clasificación solo si hay grupos; eliminatorias solo si hay rondas configuradas o ya hay partidos KO
  const tabsVisibles = SUBTABS.filter((t) => {
    if (t.id === 'clasificacion') return tieneGrupos;
    if (t.id === 'eliminatorias') return tieneRondas || hayKO;
    return true;
  });

  // Si el tab activo ya no aplica, caer a partidos
  useEffect(() => {
    if (!tabsVisibles.find((t) => t.id === activeTab)) setActiveTab('partidos');
  }, [activeTab, tabsVisibles]);

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Fixture y cronograma</h2>
          <p>El cronograma del torneo seleccionado. Haz click sobre un partido para registrar eventos. La generación del fixture se hace desde <strong>"Configurar torneo"</strong>.</p>
        </header>

        <div className="inline-search">
          <label className="form-label" htmlFor="torneo-fix">Torneo:</label>
          <select
            id="torneo-fix"
            className="form-input"
            value={torneoId}
            onChange={(e) => setTorneoId(e.target.value)}
          >
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.estado}{t.formato ? ` · ${t.formato}` : ''})
              </option>
            ))}
          </select>
          <button type="button" className="action-button ghost" onClick={load} disabled={loading}>
            {loading ? 'Refrescando…' : 'Refrescar'}
          </button>
          {hayPartidos && (
            <button
              type="button"
              className="action-button reject"
              onClick={handleBorrar}
              disabled={deleting}
              title="Borra todos los partidos. Falla si alguno fue jugado o está en curso."
            >
              {deleting ? 'Borrando…' : 'Borrar fixture'}
            </button>
          )}
        </div>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando partidos…</p>
        ) : !hayPartidos ? (
          <div className="fx-empty">
            <p className="fx-empty-title">Sin fixture aún</p>
            <p className="fx-empty-desc">
              {torneoSel?.estado === 'EN_CURSO'
                ? 'Este torneo está en curso pero todavía no tiene partidos. Ve a "Configurar torneo" para generar el fixture.'
                : torneoSel?.estado === 'PUBLICADO'
                  ? 'Este torneo está publicado pero no se ha iniciado. Inícialo desde "Configurar torneo" y luego genera el fixture.'
                  : 'Configura, publica e inicia el torneo desde "Configurar torneo" para poder generar el fixture.'}
            </p>
          </div>
        ) : (
          <>
            <nav className="fx-tabs">
              {tabsVisibles.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`fx-tab${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {activeTab === 'partidos' && (
              <div className="fx-fases">
                {seccionesGrupos.length === 0 ? (
                  <p className="empty-state">Sin partidos de fase de grupos. Ve al tab "Eliminatorias".</p>
                ) : (
                  <PartidosGruposPanel
                    secciones={seccionesGrupos}
                    collapsed={collapsed}
                    onToggle={toggleSection}
                    onOpenPartido={setOpenPartido}
                  />
                )}
              </div>
            )}

            {activeTab === 'clasificacion' && (
              <ClasificacionLiveTab
                torneoId={torneoId}
                conRepechaje={conRepechaje}
                clasificanPorGrupo={clasificanPorGrupo}
              />
            )}

            {activeTab === 'eliminatorias' && (
              <BracketLive partidos={partidos} onOpenPartido={setOpenPartido} />
            )}
          </>
        )}
      </article>

      {openPartido && (
        <GestionPartidoModal
          partido={openPartido}
          onClose={() => { setOpenPartido(null); load(); }}
          onPartidoActualizado={handlePartidoActualizado}
        />
      )}
    </div>
  );
}

function PartidosGruposPanel({ secciones, collapsed, onToggle, onOpenPartido }) {
  return (
    <section className="fx-fase">
      <h3 className="fx-fase-title">Fase de grupos</h3>
      {secciones.map((sub) => {
        const id = sub.id;
        const isCollapsed = !!collapsed[id];
        return (
          <div key={id} className={`fx-jornada${isCollapsed ? '' : ' open'}`}>
            <button
              type="button"
              className="fx-jornada-head"
              onClick={() => onToggle(id)}
            >
              <span className="fx-jornada-num">{sub.jornada || '?'}</span>
              <span className="fx-jornada-title">Jornada {sub.jornada || '—'}</span>
              {sub.grupo && <span className="fx-grupo-tag">Grupo {sub.grupo}</span>}
              <span className="fx-jornada-meta">{sub.partidos.length} partido{sub.partidos.length !== 1 ? 's' : ''}</span>
              <span className="fx-chevron">{isCollapsed ? '▾' : '▴'}</span>
            </button>
            {!isCollapsed && (
              <div className="fx-matches">
                {sub.partidos.map((p) => (
                  <PartidoCard key={p.id} partido={p} onOpen={onOpenPartido} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function PartidoCard({ partido, onOpen }) {
  const hora = partido.fecha ? new Date(partido.fecha).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  }) : '';
  const match = {
    home: partido.localNombre || 'Por definir',
    away: partido.visitanteNombre || 'Por definir',
    scoreH: ['FINALIZADO', 'EN_CURSO', 'WO'].includes(partido.estado) ? partido.golesLocal : null,
    scoreA: ['FINALIZADO', 'EN_CURSO', 'WO'].includes(partido.estado) ? partido.golesVisitante : null,
    status: STATUS_MAP[partido.estado] || 'upcoming',
    date: partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short',
    }) : '',
  };
  const canOpen = partido.estado !== 'DESCANSO'
    && partido.localEquipoTorneoId
    && partido.visitanteEquipoTorneoId;
  return (
    <MatchCard
      match={match}
      hora={hora}
      onOpen={canOpen ? () => onOpen(partido) : null}
    />
  );
}

export default FixtureView;
