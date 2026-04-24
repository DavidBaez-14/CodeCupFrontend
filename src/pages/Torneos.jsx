import Navbar from '../components/Navbar';
import '../styles/torneos.css';

/* Glob imports — Vite resolves paths with spaces/special chars at build time */
const imgs2024 = import.meta.glob(
  '../assets/imagenes_torneo/2024/*',
  { eager: true, query: '?url', import: 'default' },
);
const imgs2025 = import.meta.glob(
  '../assets/imagenes_torneo/2025/*',
  { eager: true, query: '?url', import: 'default' },
);

function findImg(map, keyword) {
  const key = Object.keys(map).find((k) =>
    k.toLowerCase().includes(keyword.toLowerCase()),
  );
  return key ? map[key] : null;
}

const img2024 = findImg(imgs2024, 'tachira fc campeon');
const img2025 = findImg(imgs2025, 'liverpool');

const TORNEOS = [
  {
    year:    '2026',
    titulo:  'SUPER COPA – COPA DEL MUNDO 2026',
    meta:    '13 equipos inscritos · En curso',
    activo:  true,
    ganador: null,
    foto:    null,
  },
  {
    year:    '2025',
    titulo:  'SUPER COPA – CHAMPIONS LEAGUE',
    meta:    'Formato Champions League · Finalizado',
    activo:  false,
    ganador: 'Liverpool (Táchira FC)',
    foto:    img2025,
  },
  {
    year:    '2024',
    titulo:  'SUPER COPA DE INGENIERÍA DE SISTEMAS 2024',
    meta:    'Finalizado',
    activo:  false,
    ganador: 'Táchira FC',
    foto:    img2024,
  },
];

function TorneoCard({ torneo }) {
  return (
    <article className="hud-card">
      <div className="hud-glow" />
      <div className="corner-tr" />
      <div className="corner-bl" />

      {/* Thumbnail: photo or year watermark */}
      {torneo.foto ? (
        <div className="t-card-photo">
          <img src={torneo.foto} alt={`Campeones ${torneo.year}`} />
          <div className="t-card-photo-overlay" />
        </div>
      ) : (
        <div className="t-year-bg">{torneo.year}</div>
      )}

      {/* Badge */}
      <div className={`t-badge ${torneo.activo ? 'active' : 'done'}`}>
        <div className="t-badge-dot" />
        {torneo.activo ? 'Activo' : 'Finalizado'}
      </div>

      {/* Info */}
      <div className="t-title">{torneo.titulo}</div>
      <div className="t-meta">{torneo.meta}</div>
      <div className="t-divider" />

      <div className="t-winner">
        {torneo.ganador ? (
          <>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span className="t-winner-label">Campeón:</span>
            {torneo.ganador}
          </>
        ) : (
          <>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="t-winner-label">En curso</span>
          </>
        )}
      </div>
    </article>
  );
}

function Torneos() {
  return (
    <>
      <Navbar mode="public" />
      <main className="public-page torneos-page">

        <div className="page-hero-small">
          <h1><span>Torneos</span></h1>
          <p>Historial completo de todas las ediciones del campeonato</p>
        </div>

        <section className="torneos-section">
          <div className="torneos-grid">
            {TORNEOS.map((t) => <TorneoCard key={t.year} torneo={t} />)}
          </div>
        </section>

        <footer className="landing-footer">
          <div className="footer-logo"><em>Code</em> Cup</div>
          <div className="footer-text">© 2026 · Facultad de Ingeniería de Sistemas · UFPS Cúcuta</div>
        </footer>

      </main>
    </>
  );
}

export default Torneos;
