import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import heroIllustration from '../assets/hero-player-painting.png';
import '../styles/landing.css';

const CAMPEON = {
  nombre: 'Liverpool FC',
  meta: 'Facultad de Ingeniería de Sistemas · UFPS Cúcuta',
  edicion: 'Campeones · Super Copa - Champions League 2025',
  partidos: 12,
  goles: 47,
  derrotas: 3,
};

function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar mode="public" />
      <main className="landing">

        {/* HERO */}
        <section id="inicio" className="hero">
          <div className="hero-bg" />
          <div className="hero-grid-lines" />
          <img className="hero-illustration" src={heroIllustration} alt="" aria-hidden="true" />

          <div className="hero-content">
            <div className="hero-eyebrow">Torneo Activo · 2026</div>
            <h1 className="hero-title">
              Campeonato
              <em>Fútbol Sala</em>
              INGENIERÍA DE SISTEMAS
            </h1>
            <p className="hero-desc">
              El torneo más esperado de la Facultad de Ingeniería de Sistemas regresa.
            </p>
            <div className="hero-actions">
              <button
                className="btn-hero-primary"
                type="button"
                onClick={() => navigate('/inscripcion')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Inscribir Equipo
              </button>
              <button
                className="btn-hero-secondary"
                type="button"
                onClick={() => navigate('/galeria')}
              >
                Explorar Galería
              </button>
            </div>

            <div className="hero-enrollment">
              <span className="hero-enrollment-val">13</span>
              <div className="hero-enrollment-info">
                <span className="hero-enrollment-label">Equipos inscritos</span>
                <span className="hero-enrollment-deadline">Plazo de inscripción: 2 semanas</span>
                <span className="hero-enrollment-meeting">Proxima reunion Lunes 27 de Abril - 3:30 PM Auditorio SA Cuarto Piso</span>
              </div>
            </div>
          </div>
        </section>

        <div className="divider-orange" />

        {/* ÚLTIMO CAMPEÓN */}
        <section id="fama" className="landing-section">
          <div className="section-header">
            <h2 className="section-title">Último <span>Campeón</span></h2>
          </div>
          <div className="champion-banner">
            <div className="champ-trophy">🏆</div>
            <div className="champ-info">
              <div className="champ-eyebrow">{CAMPEON.edicion}</div>
              <div className="champ-name">{CAMPEON.nombre}</div>
              <div className="champ-meta">{CAMPEON.meta}</div>
            </div>
            <div className="champ-stats">
              <div className="champ-stat">
                <div className="champ-stat-val"><span>{CAMPEON.partidos}</span></div>
                <div className="champ-stat-lbl">Partidos</div>
              </div>
              <div className="champ-stat">
                <div className="champ-stat-val"><span>{CAMPEON.goles}</span></div>
                <div className="champ-stat-lbl">Goles</div>
              </div>
              <div className="champ-stat">
                <div className="champ-stat-val"><span>{CAMPEON.derrotas}</span></div>
                <div className="champ-stat-lbl">Derrotas</div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="galeria" className="landing-footer">
          <div className="footer-logo"><em>Code</em> Cup</div>
          <div className="footer-text">© 2026 · Facultad de Ingeniería de Sistemas · UFPS Cúcuta</div>
        </footer>

      </main>
    </>
  );
}

export default LandingPage;
