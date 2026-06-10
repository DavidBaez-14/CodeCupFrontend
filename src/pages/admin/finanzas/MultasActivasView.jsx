import { useState, useEffect, useCallback } from 'react';
import { getMultasTorneo, getBolsaMultas } from '../../../api/finanzas';
import { listTorneosAdmin } from '../../../api/supercopa';
import { getToken } from '../../../utils/session';
import '../../../styles/finanzas.css';

function MultasActivasView() {
  const [torneos, setTorneos] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [multas, setMultas] = useState([]);
  const [bolsa, setBolsa] = useState({ recaudado: 0, pendiente: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('TODAS'); // TODAS, PENDIENTE, PAGADA, EXCEPCIONADA

  const loadTorneos = useCallback(async () => {
    try {
      const data = await listTorneosAdmin(getToken());
      const list = Array.isArray(data) ? data : [];
      setTorneos(list);
      if (list.length > 0) setSelectedTorneo(list[0].id);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadTorneos(); }, [loadTorneos]);

  const loadMultas = useCallback(async () => {
    if (!selectedTorneo) return;
    setLoading(true);
    try {
      const [dataMultas, dataBolsa] = await Promise.all([
        getMultasTorneo(selectedTorneo, getToken()),
        getBolsaMultas(selectedTorneo, getToken()).catch(() => ({ recaudado: 0, pendiente: 0, total: 0 }))
      ]);
      setMultas(Array.isArray(dataMultas) ? dataMultas : []);
      setBolsa(dataBolsa || { recaudado: 0, pendiente: 0, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTorneo]);

  useEffect(() => { loadMultas(); }, [loadMultas]);

  const filteredMultas = multas.filter(m => {
    if (filterEstado !== 'TODAS' && m.estado !== filterEstado) return false;
    return true;
  });

  return (
    <article className="ds-panel">
      <header className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Bolsa de Multas</h2>
          <p>Supervisa la recaudación y el estado de las multas aplicadas en el torneo.</p>
        </div>
        <select 
          className="fn-filter-select"
          value={selectedTorneo} 
          onChange={e => setSelectedTorneo(e.target.value)}
        >
          {torneos.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </header>

      {selectedTorneo && (
        <>
          <div className="fn-widget-bolsa">
            <div className="fn-bolsa-stat">
              <span className="fn-bolsa-lbl">Recaudado</span>
              <span className="fn-bolsa-val" style={{ color: 'var(--color-success)' }}>${(bolsa.recaudado || 0).toLocaleString()}</span>
            </div>
            <div className="fn-bolsa-stat" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
              <span className="fn-bolsa-lbl">Pendiente</span>
              <span className="fn-bolsa-val" style={{ color: 'var(--color-error)' }}>${(bolsa.pendiente || 0).toLocaleString()}</span>
            </div>
            <div className="fn-bolsa-stat" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
              <span className="fn-bolsa-lbl">Total Generado</span>
              <span className="fn-bolsa-val" style={{ color: 'var(--color-text)' }}>${(bolsa.total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="fn-table-filters">
            <select 
              className="fn-filter-select"
              value={filterEstado} 
              onChange={e => setFilterEstado(e.target.value)}
            >
              <option value="TODAS">Todas las multas</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PAGADA">Pagadas</option>
              <option value="EXCEPCIONADA">Excepcionadas</option>
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Cargando multas...</p>
          ) : filteredMultas.length === 0 ? (
            <p className="empty-state">No hay multas que coincidan con los filtros.</p>
          ) : (
            <div className="table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Fecha / Tipo</th>
                    <th>Jugador</th>
                    <th>Equipo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMultas.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div>{new Date(m.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{m.tipo}</div>
                      </td>
                      <td>{m.jugadorNombre || m.cedula}</td>
                      <td>{m.equipoNombre || m.equipoTorneoId}</td>
                      <td className="fn-premio-amount">${m.monto.toLocaleString()}</td>
                      <td>
                        <span className={`status-pill estado-${m.estado.toLowerCase()}`}>{m.estado}</span>
                        {m.estado === 'EXCEPCIONADA' && m.motivoExcepcion && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {m.motivoExcepcion}
                          </div>
                        )}
                        {m.estado === 'PAGADA' && m.cobradaPorArbitroId && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            Cobrada por árbitro
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default MultasActivasView;
