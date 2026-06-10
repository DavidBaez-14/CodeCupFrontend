import { useCallback, useEffect, useState } from 'react';
import { getClasificacion } from '../../api/supercopa';
import { getToken } from '../../utils/session';

/**
 * Tabla de posiciones en vivo (admin). Consume /clasificacion.
 * Resalta top-2 (zona directa a KO) y 3°-6° (zona repechaje) cuando corresponde.
 */
function ClasificacionLiveTab({ torneoId, conRepechaje, clasificanPorGrupo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getClasificacion(torneoId, getToken());
      setData(res || {});
    } catch (err) {
      setError(err?.message || 'No fue posible cargar la clasificación.');
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="empty-state">Cargando clasificación…</p>;
  if (error) return <p className="banner banner-error">{error}</p>;
  if (!data || Object.keys(data).length === 0) {
    return <p className="empty-state">Aún sin clasificación. Cierra partidos para verla.</p>;
  }

  const grupos = Object.keys(data).sort();

  return (
    <div className="cl-stack">
      <div className="cl-actions">
        <button type="button" className="action-button ghost" onClick={load}>
          Refrescar
        </button>
        {conRepechaje && (
          <div className="cl-legend">
            <span className="cl-legend-dot directo" /> Directo a cuartos
            <span className="cl-legend-dot repechaje" /> Repechaje
          </div>
        )}
      </div>
      {grupos.map((g) => (
        <section key={g} className="cl-group">
          <h3 className="cl-group-title">
            {g === 'GLOBAL' ? 'Tabla general' : `Grupo ${g}`}
            <span className="cl-group-meta">· {data[g].length} equipos</span>
          </h3>
          <div className="table-wrap">
            <table className="ds-table cl-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Equipo</th>
                  <th>Pts</th>
                  <th>PJ</th>
                  <th>G</th>
                  <th>E</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>R</th>
                  <th>Forma</th>
                </tr>
              </thead>
              <tbody>
                {data[g].map((row) => {
                  let zona = '';
                  if (conRepechaje) {
                    if (row.posicion <= 2) zona = 'directo';
                    else if (row.posicion <= 6) zona = 'repechaje';
                  } else if (clasificanPorGrupo) {
                    if (row.posicion <= clasificanPorGrupo) zona = 'directo';
                  }
                  return (
                    <tr
                      key={row.equipoTorneoId}
                      className={`cl-row ${zona ? `zona-${zona}` : ''}${row.descalificado ? ' descalificado' : ''}`}
                    >
                      <td className="mono">{row.posicion}</td>
                      <td>{row.equipoNombre}{row.descalificado && ' (descalificado)'}</td>
                      <td className="cl-cell-strong">{row.pts}</td>
                      <td>{row.pj}</td>
                      <td>{row.pg}</td>
                      <td>{row.pe}</td>
                      <td>{row.pp}</td>
                      <td>{row.gf}</td>
                      <td>{row.gc}</td>
                      <td>{(row.dg ?? 0) > 0 ? `+${row.dg}` : row.dg}</td>
                      <td>{row.rojas}</td>
                      <td>
                        <span className="cl-form-row">
                          {(row.form || []).map((r, i) => (
                            <span key={i} className={`cl-form-pill cl-form-${r}`}>{r}</span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export default ClasificacionLiveTab;
