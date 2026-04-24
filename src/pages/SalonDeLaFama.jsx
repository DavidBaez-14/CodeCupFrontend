import Navbar from '../components/Navbar';
import '../styles/salon-de-la-fama.css';

const PODIO = [
  { pos: 2, equipo: 'Barcelona',          edicion: 'Subcampeón', cls: 'pos-2' },
  { pos: 1, equipo: 'Liverpool', edicion: 'Campeón', cls: 'pos-1' },
  { pos: 3, equipo: 'Bayer Leverkusen',   edicion: 'Tercer Lugar', cls: 'pos-3' },
];

/* Initials helper */
const initials = (name) =>
  name
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const PREMIOS = [
  {
    titulo: 'Goleador del Torneo',
    nombre: 'Miguel Garcés',
    sub:    'Bayer Leverkusen',
    color:  '#ff5500',
    bg:     'rgba(255,85,0,0.12)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    titulo: 'MVP del Torneo',
    nombre: 'Neider Moreno',
    sub:    'Liverpool (Táchira FC)',
    color:  '#facc15',
    bg:     'rgba(250,204,21,0.12)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    titulo: 'Portero Menos Vencido',
    nombre: 'Sebastian Soledad',
    sub:    'Barcelona',
    color:  '#3b82f6',
    bg:     'rgba(29,111,245,0.12)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function SalonDeLaFama() {
  return (
    <>
      <Navbar mode="public" />
      <main className="public-page salon-page">

        <div className="page-hero-small">
          <h1>Salón de la <span>Fama</span></h1>
          <p>Los mejores equipos y jugadores de la historia del torneo</p>
        </div>

        <section className="salon-section">

          {/* PODIO */}
          <div className="salon-block">
            <h2 className="section-title">Podio <span>2025</span></h2>
            <div className="badge-row">
              <span className="tag tag-gold"><span>Super Copa 2025</span></span>
              <span className="tag tag-blue"><span>Champions League</span></span>
            </div>

            <div className="podium-wrap">
              {PODIO.map(({ pos, equipo, edicion, cls }) => (
                <div key={pos} className="podium-block">
                  <div className="podium-avatar">{initials(equipo)}</div>
                  <div className="podium-name">{equipo}</div>
                  <div className="podium-year">{edicion}</div>
                  <div className={`podium-step ${cls}`}>{pos}</div>
                  <div className="podium-base" style={{ width: pos === 1 ? 130 : pos === 2 ? 120 : 110 }} />
                </div>
              ))}
            </div>
          </div>

          {/* PREMIOS INDIVIDUALES */}
          <div className="salon-block">
            <h2 className="section-title">Premios <span>Individuales</span></h2>
            <div className="awards-grid">
              {PREMIOS.map((p) => (
                <div key={p.titulo} className="award-card">
                  <div className="award-icon" style={{ background: p.bg }}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="award-title">{p.titulo}</div>
                    <div className="award-name">{p.nombre}</div>
                    <div className="award-sub">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
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

export default SalonDeLaFama;
