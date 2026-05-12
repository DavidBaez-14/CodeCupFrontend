import { useCallback, useEffect, useMemo, useState } from 'react';
import MatchCard from '../../components/supercopa/MatchCard';
import {
  generarFixture,
  listInscripcionesTorneo,
  listPartidosTorneo,
  listTorneosAdmin,
} from '../../api/supercopa';
import { getToken } from '../../utils/session';
import EventosPartidoModal from './EventosPartidoModal';

const STATUS_MAP = {
  PROGRAMADO: 'upcoming',
  EN_CURSO: 'live',
  FINALIZADO: 'played',
  APLAZADO: 'upcoming',
  WO: 'played',
};

function FixtureView() {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [aprobadosCount, setAprobadosCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [generating, setGenerating] = useState(false);
  const [openPartido, setOpenPartido] = useState(null);

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
      const [partidosData, inscripciones] = await Promise.all([
        listPartidosTorneo(torneoId, getToken()),
        listInscripcionesTorneo(torneoId, getToken()),
      ]);
      setPartidos(Array.isArray(partidosData) ? partidosData : []);
      const aprobados = (Array.isArray(inscripciones) ? inscripciones : [])
        .filter((i) => i.estadoInscripcion === 'APROBADO').length;
      setAprobadosCount(aprobados);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar el fixture.');
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerar = async () => {
    if (!torneoId) return;
    if (!confirm(`Generar fixture para ${aprobadosCount} equipos aprobados?`)) return;
    setGenerating(true);
    setError('');
    setFeedback('');
    try {
      const data = await generarFixture(torneoId, getToken());
      setPartidos(Array.isArray(data) ? data : []);
      setFeedback(`Fixture generado con ${data.length} partidos.`);
    } catch (err) {
      setError(err?.message || 'No fue posible generar el fixture.');
    } finally {
      setGenerating(false);
    }
  };

  const jornadas = useMemo(() => {
    if (!partidos.length) return [];
    const sorted = [...partidos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const grupos = new Map();
    for (const p of sorted) {
      const key = p.fecha ? p.fecha.slice(0, 10) : 'sin-fecha';
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(p);
    }
    let idx = 0;
    return Array.from(grupos.entries()).map(([fecha, lista]) => ({
      id: `j-${idx++}`,
      fecha,
      partidos: lista,
    }));
  }, [partidos]);

  const handlePartidoCerrado = (partidoActualizado) => {
    setPartidos((prev) => prev.map((p) => p.id === partidoActualizado.id ? partidoActualizado : p));
    setOpenPartido(null);
    load();
  };

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Fixture y cronograma</h2>
          <p>Genera el calendario todos-contra-todos sobre los equipos aprobados. Haz click sobre un partido para registrar eventos.</p>
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
              <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
            ))}
          </select>
          <button type="button" className="action-button ghost" onClick={load} disabled={loading}>
            {loading ? 'Refrescando…' : 'Refrescar'}
          </button>
          {partidos.length === 0 && (
            <button
              type="button"
              className="action-button primary"
              onClick={handleGenerar}
              disabled={generating || aprobadosCount < 2}
              title={aprobadosCount < 2 ? 'Se necesitan al menos 2 equipos aprobados.' : ''}
            >
              {generating ? 'Generando…' : `Generar fixture (${aprobadosCount} equipos)`}
            </button>
          )}
        </div>

        {feedback && <p className="banner banner-success">{feedback}</p>}
        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="empty-state">Cargando partidos…</p>
        ) : jornadas.length === 0 ? (
          <p className="empty-state">Aún no hay partidos en este torneo.</p>
        ) : (
          <div className="fixture-grid">
            {jornadas.map((jornada, idx) => (
              <section key={jornada.id} className="fixture-jornada">
                <h4>Jornada {idx + 1} · {jornada.fecha}</h4>
                <div className="fixture-matches">
                  {jornada.partidos.map((p) => {
                    const hora = p.fecha ? new Date(p.fecha).toLocaleTimeString('es-CO', {
                      hour: '2-digit', minute: '2-digit',
                    }) : '';
                    const match = {
                      home: p.localNombre,
                      away: p.visitanteNombre,
                      scoreH: p.estado === 'FINALIZADO' || p.estado === 'EN_CURSO' ? p.golesLocal : null,
                      scoreA: p.estado === 'FINALIZADO' || p.estado === 'EN_CURSO' ? p.golesVisitante : null,
                      status: STATUS_MAP[p.estado] || 'upcoming',
                      date: p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short',
                      }) : '',
                    };
                    return (
                      <MatchCard
                        key={p.id}
                        match={match}
                        hora={hora}
                        onOpen={() => setOpenPartido(p)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </article>

      {openPartido && (
        <EventosPartidoModal
          partido={openPartido}
          onClose={() => setOpenPartido(null)}
          onPartidoCerrado={handlePartidoCerrado}
        />
      )}
    </div>
  );
}

export default FixtureView;
