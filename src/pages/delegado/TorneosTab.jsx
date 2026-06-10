import { useCallback, useEffect, useState } from 'react';
import { inscribirEquipo, listTorneosDisponibles } from '../../api/supercopa';
import { getToken } from '../../utils/session';
import ballIcon from '../../assets/soccer-ball-sci-fi-192.png';

const ESTADO_INSC = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', cls: 'pending' },
  APROBADO: { label: 'Aprobado', cls: 'done' },
  RECHAZADO: { label: 'Rechazado', cls: 'rejected' },
  EXPULSADO: { label: 'Descalificado', cls: 'expelled' },
};

const HISTORIAL = [
  { name: 'Copa Apertura 2025-II', dates: 'Ago 2025 — Nov 2025', equipos: 'Campeón: Brasil' },
  { name: 'Copa Inicio 2025-I', dates: 'Feb 2025 — May 2025', equipos: '4° lugar' },
];

function SectionLabel({ children }) {
  return <div className="dg-section-label">{children}</div>;
}

function EmptyState({ title, sub }) {
  return (
    <div className="dg-empty">
      <div className="dg-empty-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <div className="dg-empty-title">{title}</div>
      {sub ? <div className="dg-empty-sub">{sub}</div> : null}
    </div>
  );
}

function TorneosTab({ tieneEquipo, onInscripcion, toast }) {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listTorneosDisponibles(getToken());
      setTorneos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar los torneos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInscribir = async (torneo) => {
    if (!tieneEquipo) {
      setError('Primero crea tu equipo en la pestaña "Mi Equipo".');
      return;
    }
    setActioningId(torneo.id);
    setError('');
    setFeedback('');
    try {
      await inscribirEquipo(torneo.id, getToken());
      toast?.(`Inscripción enviada a "${torneo.nombre}"`);
      setFeedback(`Te inscribiste en "${torneo.nombre}".`);
      await load();
      onInscripcion?.();
    } catch (err) {
      setError(err?.message || 'No fue posible inscribirse.');
    } finally {
      setActioningId(null);
    }
  };

  const abiertos = torneos.filter((t) => !t.inscrito);
  const activos = torneos.filter((t) => t.inscrito);

  return (
    <div className="dg-panel dg-panel-animated">
      {!tieneEquipo && (
        <p className="banner banner-warning" style={{ marginBottom: 20 }}>
          Aún no tienes equipo. Crea el tuyo en la pestaña <strong>Mi Equipo</strong> antes de inscribirte.
        </p>
      )}

      {activos.length > 0 && (
        <div className="dg-inscription-banner">
          <div className="dg-inscription-banner-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2">
              <path d="M12 2 L4 7 L4 17 L12 22 L20 17 L20 7 Z" />
              <path d="M12 12 L20 7" />
              <path d="M12 12 L12 22" />
              <path d="M12 12 L4 7" />
            </svg>
          </div>
          <div className="dg-inscription-banner-text">
            <strong>Tienes inscripciones activas</strong> — los torneos resaltados están en curso.
            Revisa el estado de pago en la pestaña Pagos.
          </div>
        </div>
      )}

      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <SectionLabel>Abiertos a inscripción</SectionLabel>
      {loading ? (
        <EmptyState title="Cargando torneos…" />
      ) : abiertos.length === 0 ? (
        <EmptyState title="No hay torneos abiertos" sub="Revisa más tarde" />
      ) : (
        abiertos.map((t) => (
          <TournamentCard
            key={t.id}
            t={{ ...t, id: t.id }}
            ctx="abierto"
            actioningId={actioningId}
            onInscribir={handleInscribir}
          />
        ))
      )}

      <SectionLabel>Mis torneos</SectionLabel>
      {activos.length === 0 ? (
        <EmptyState title="No estás inscrito en ningún torneo" />
      ) : (
        activos.map((t) => {
          const estado = ESTADO_INSC[t.estadoInscripcion] || { label: t.estadoInscripcion, cls: 'pending' };
          return (
            <div key={t.id} className={`dg-tournament-card inscribed`}>
              <div className="dg-tc-icon">
                <img src={ballIcon} alt="" />
              </div>
              <div className="dg-tc-info">
                <div className="dg-tc-title">{t.nombre}</div>
                <div className="dg-tc-meta">
                  <span>Edición {t.edicion}</span>
                  <span className="dg-sep" />
                  <span>{t.estado}</span>
                </div>
                {t.estadoInscripcion === 'EXPULSADO' && t.motivoExpulsion && (
                  <div className="tc-expulsion-note" style={{ marginTop: 8 }}>
                    Tu equipo fue descalificado. Motivo: {t.motivoExpulsion}
                  </div>
                )}
              </div>
              <div className="dg-tc-cta">
                <span className={`dg-status-chip ${estado.cls}`}>{estado.label}</span>
              </div>
            </div>
          );
        })
      )}

      <SectionLabel>Historial</SectionLabel>
      {HISTORIAL.map((h, i) => (
        <div key={i} className="dg-tournament-card">
          <div className="dg-tc-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="dg-tc-info">
            <div className="dg-tc-title">{h.name}</div>
            <div className="dg-tc-meta">
              <span>{h.dates}</span>
              <span className="dg-sep" />
              <span>{h.equipos}</span>
            </div>
          </div>
          <div className="dg-tc-cta">
            <span className="dg-status-chip done">Finalizado</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentCard({ t, ctx, actioningId, onInscribir }) {
  const cta = ctx === 'abierto' ? (
    <button
      type="button"
      className="dg-btn-primary"
      onClick={() => onInscribir(t)}
      disabled={actioningId === t.id}
    >
      {actioningId === t.id ? '…' : 'Inscribirme'}
    </button>
  ) : null;

  return (
    <div className={`dg-tournament-card${ctx === 'abierto' && t.isInscribed ? ' inscribed' : ''}`}>
      <div className="dg-tc-icon">
        <img src={ballIcon} alt="" />
      </div>
      <div className="dg-tc-info">
        <div className="dg-tc-title">{t.nombre}</div>
        <div className="dg-tc-meta">
          <span>Edición {t.edicion}</span>
          {t.fechaInicio && (
            <>
              <span className="dg-sep" />
              <span>{t.fechaInicio} → {t.fechaFin || '—'}</span>
            </>
          )}
          <span className="dg-sep" />
          <span>{t.estado}</span>
        </div>
      </div>
      <div className="dg-tc-cta">{cta}</div>
    </div>
  );
}

export default TorneosTab;
