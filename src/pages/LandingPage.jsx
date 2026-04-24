import { useEffect, useState } from 'react';
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

const PLANTILLA_URL =
  'https://docs.google.com/document/d/1n5W6Rk2ejGX2oWyEfGIeDlGV2xuOd2V6/edit?usp=drive_link&ouid=108947163306010030714&rtpof=true&sd=true';

const REQUISITOS = [
  {
    num: '01',
    titulo: 'Mínimo 6 jugadores',
    desc: 'Todos deben pertenecer a la Facultad de Sistemas — estudiantes activos, graduados, profesores o administrativos.',
    color: '#ff5500',
  },
  {
    num: '02',
    titulo: 'Elige tu equipo del Mundial 2026',
    desc: 'Cada equipo adopta el nombre de una selección nacional participante del Mundial FIFA 2026.',
    color: '#3b82f6',
  },
  {
    num: '03',
    titulo: 'Inscripción: $60.000 por equipo',
    desc: 'Pago único presencial. Se realiza directamente en secretaría de la facultad.',
    color: '#facc15',
  },
  {
    num: '04',
    titulo: 'Diligencia la plantilla oficial',
    desc: 'Descarga el formulario de inscripción, complétalo y llévalo a secretaría junto con el pago.',
    color: '#22c55e',
    link: PLANTILLA_URL,
  },
];

const PREMIOS = [
  {
    emoji: '🥇',
    titulo: 'Primer lugar',
    desc: 'Trofeo + medallas para todo el equipo',
    cls: 'prize-gold',
  },
  {
    emoji: '🥈',
    titulo: 'Segundo lugar',
    desc: 'Trofeo + medallas para todo el equipo',
    cls: 'prize-silver',
  },
  {
    emoji: '🥉',
    titulo: 'Tercer lugar',
    desc: 'Trofeo + medallas para todo el equipo',
    cls: 'prize-bronze',
  },
  {
    emoji: '⚽',
    titulo: 'Goleador del torneo',
    desc: 'Trofeo y medalla individual',
    cls: 'prize-orange',
  },
  {
    emoji: '🧤',
    titulo: 'Portero menos vencido',
    desc: 'Trofeo y medalla individual',
    cls: 'prize-blue',
  },
];

function InscripcionModal({ onClose }) {
  /* Close on Escape key */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Inscripción de equipo" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">Super Copa · Copa del Mundo 2026</div>
            <h2 className="modal-title">Inscribe tu <em>Equipo</em></h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">

          {/* REQUISITOS */}
          <p className="modal-section-label">Requisitos de inscripción</p>
          <div className="modal-steps">
            {REQUISITOS.map((r) => (
              <div key={r.num} className="modal-step">
                <div className="modal-step-num" style={{ color: r.color, borderColor: r.color }}>
                  {r.num}
                </div>
                <div className="modal-step-body">
                  <div className="modal-step-title">{r.titulo}</div>
                  <div className="modal-step-desc">{r.desc}</div>
                  {r.link && (
                    <a
                      className="modal-step-link"
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar plantilla
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PREMIOS */}
          <p className="modal-section-label" style={{ marginTop: '28px' }}>Premios del torneo</p>
          <div className="modal-prizes">
            {PREMIOS.map((p) => (
              <div key={p.titulo} className={`modal-prize ${p.cls}`}>
                <span className="modal-prize-emoji">{p.emoji}</span>
                <div>
                  <div className="modal-prize-title">{p.titulo}</div>
                  <div className="modal-prize-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA footer */}
          <div className="modal-footer">
            <div className="modal-footer-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Lleva la plantilla diligenciada y el pago a secretaría de la Facultad de Sistemas para completar tu inscripción.
            </div>
            <a
              className="modal-cta-btn"
              href={PLANTILLA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar plantilla oficial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

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
                onClick={() => setModalOpen(true)}
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

      {/* MODAL */}
      {modalOpen && <InscripcionModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

export default LandingPage;
