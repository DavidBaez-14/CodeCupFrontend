import { useState, useEffect, useCallback } from 'react';
import { getComprobantesPendientes, aprobarComprobante, rechazarComprobante, getDownloadUrl } from '../../../api/finanzas';
import { getToken } from '../../../utils/session';
import '../../../styles/finanzas.css';

function ComprobantesView() {
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadComprobantes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComprobantesPendientes(getToken());
      setComprobantes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Error al cargar comprobantes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadComprobantes(); }, [loadComprobantes]);

  const handlePreview = async (id) => {
    try {
      const res = await getDownloadUrl(id, getToken());
      if (res.url) {
        window.open(res.url, '_blank');
      } else {
        alert('No se pudo obtener la URL de descarga.');
      }
    } catch (e) {
      alert('Error al abrir el comprobante: ' + e.message);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Aprobar comprobante?')) return;
    try {
      await aprobarComprobante(id, getToken());
      setFeedback('Comprobante aprobado exitosamente.');
      setTimeout(() => setFeedback(''), 3000);
      loadComprobantes();
    } catch (e) {
      alert('Error aprobando: ' + e.message);
    }
  };

  const handleRechazar = async (id) => {
    const motivo = window.prompt('Motivo de rechazo:');
    if (!motivo) return;
    try {
      await rechazarComprobante(id, motivo, getToken());
      setFeedback('Comprobante rechazado.');
      setTimeout(() => setFeedback(''), 3000);
      loadComprobantes();
    } catch (e) {
      alert('Error rechazando: ' + e.message);
    }
  };

  if (loading) return <div className="empty-state">Cargando comprobantes...</div>;

  return (
    <article className="ds-panel">
      <header className="panel-header">
        <h2>Comprobantes Pendientes</h2>
        <p>Revisa los comprobantes de pago subidos por los delegados (inscripciones o multas).</p>
      </header>
      
      {feedback && <div className="banner banner-success" style={{ margin: '0 1.5rem 1rem' }}>{feedback}</div>}
      {error && <div className="banner banner-error" style={{ margin: '0 1.5rem 1rem' }}>{error}</div>}

      {comprobantes.length === 0 ? (
        <p className="empty-state">No hay comprobantes pendientes.</p>
      ) : (
        <div className="table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Equipo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha Subida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.map(c => (
                <tr key={c.id}>
                  <td>{c.referenciaExterna || c.id.substring(0, 8)}</td>
                  <td>{c.equipoNombre || 'N/A'}</td>
                  <td>{c.concepto || 'Pago'}</td>
                  <td className="fn-premio-amount">${(c.monto || 0).toLocaleString()}</td>
                  <td>{c.fechaSubida ? new Date(c.fechaSubida).toLocaleDateString() : '—'}</td>
                  <td className="actions-cell">
                    <button type="button" className="action-button ghost" onClick={() => handlePreview(c.id)}>Ver PDF/Img</button>
                    <button type="button" className="action-button primary" onClick={() => handleAprobar(c.id)}>Aprobar</button>
                    <button type="button" className="action-button reject" onClick={() => handleRechazar(c.id)}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default ComprobantesView;
