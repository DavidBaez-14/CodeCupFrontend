import { useEffect } from 'react';
import MatchDetailView from '../../pages/arbitro/MatchDetailView';
import useGestionPartido from '../../hooks/useGestionPartido';
import '../../pages/arbitro/arbitro.css';

/**
 * Modal para que el admin gestione un partido. Reutiliza MatchDetailView del árbitro.
 * Único delta vs árbitro: muestra botón "Reabrir partido" cuando está cerrado.
 */
function GestionPartidoModal({ partido, onClose, onPartidoActualizado, mode = 'admin' }) {
  const gestion = useGestionPartido(partido);

  // Cerrar con tecla ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCloseMatch = async () => {
    const m = gestion.match;
    if (!m || m.status === 'played') return;
    if (!window.confirm(
      `¿Cerrar el partido con el resultado ${m.scoreH} - ${m.scoreA}?\nNo podrás editar los eventos después.`,
    )) return;
    try {
      const updated = await gestion.closeMatch();
      if (updated && onPartidoActualizado) onPartidoActualizado(updated);
    } catch { /* */ }
  };

  const handleWO = async (winnerSide, motivo) => {
    try {
      const updated = await gestion.declarWO(winnerSide, motivo);
      if (updated && onPartidoActualizado) onPartidoActualizado(updated);
    } catch { /* */ }
  };

  const handleCancel = async (motivo) => {
    try {
      await gestion.cancelMatch(motivo);
      if (onPartidoActualizado) onPartidoActualizado(null);
      onClose();
    } catch { /* */ }
  };

  const handleCerrarSinPago = async (winnerSide, motivo) => {
    try {
      const updated = await gestion.cerrarSinPagoArbitraje(winnerSide, motivo);
      if (updated && onPartidoActualizado) onPartidoActualizado(updated);
    } catch { /* */ }
  };

  const handleReopen = async () => {
    if (!window.confirm(
      'Reabrir este partido permite editar eventos y declarar W.O. ¿Continuar?',
    )) return;
    try {
      const updated = await gestion.reopen();
      if (updated && onPartidoActualizado) onPartidoActualizado(updated);
    } catch { /* */ }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal-card gpm-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 1100, width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
      >
        <header className="gpm-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky', top: 0, background: 'rgba(11, 19, 37, 0.96)',
          backdropFilter: 'blur(8px)', zIndex: 10,
        }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
            Gestión de partido
          </h3>
          <button type="button" className="action-button ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>

        {gestion.error && (
          <p className="banner banner-error" style={{ margin: '12px 18px 0' }}>
            {gestion.error}
          </p>
        )}

        {!gestion.match ? (
          <p className="empty-state" style={{ padding: 40 }}>
            {gestion.loading ? 'Cargando partido…' : 'Sin datos.'}
          </p>
        ) : (
          <div style={{ padding: '6px 16px 18px' }}>
            <MatchDetailView
              match={gestion.match}
              mode={mode}
              onTogglePlayer={gestion.togglePlayer}
              onAddAll={gestion.addAll}
              onAddEvent={gestion.addEvent}
              onDeleteEvent={gestion.deleteEvent}
              onCloseMatch={handleCloseMatch}
              onWO={handleWO}
              onCancel={handleCancel}
              onReopen={mode === 'admin' ? handleReopen : undefined}
              onCerrarSinPagoArbitraje={handleCerrarSinPago}
              onRegistrarPago={gestion.registrarPago}
              onHabilitarExcepcion={gestion.habilitarExcepcion}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionPartidoModal;
