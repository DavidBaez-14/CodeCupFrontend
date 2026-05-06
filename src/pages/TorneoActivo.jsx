import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ClasificacionTab from '../components/supercopa/ClasificacionTab';
import PartidosTab from '../components/supercopa/PartidosTab';
import EstadisticasTab from '../components/supercopa/EstadisticasTab';
import '../styles/torneo-activo.css';

const TABS = [
  {
    id: 'clasificacion',
    label: 'Clasificación',
    icon: (
      <svg className="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'partidos',
    label: 'Partidos',
    icon: (
      <svg className="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'estadisticas',
    label: 'Estadísticas',
    icon: (
      <svg className="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

function TorneoActivo() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('clasificacion');

  const openMatch = (matchKey) => {
    navigate(`/torneos/2026/partido/${matchKey}`);
  };

  return (
    <>
      <Navbar mode="public" />
      <main className="torneo-activo-page">
        <section className="torneo-hero">
          <div className="torneo-hero-inner">
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="torneo-eyebrow">
                <span className="live-dot" />
                Torneo Activo · 2026
              </div>
              <h1 className="torneo-title">
                Supercopa<br />
                <em>Copa del Mundo</em>
              </h1>
            </div>
          </div>
        </section>

        <nav className="tabs-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'clasificacion' && <ClasificacionTab />}
        {tab === 'partidos' && <PartidosTab onOpenMatch={openMatch} />}
        {tab === 'estadisticas' && <EstadisticasTab />}

        <footer className="torneo-footer">
          <div className="torneo-footer-logo"><em>Code</em> Cup</div>
          <div className="torneo-footer-text">
            © 2026 · Facultad de Ingeniería de Sistemas · UFPS Cúcuta
          </div>
        </footer>
      </main>
    </>
  );
}

export default TorneoActivo;
