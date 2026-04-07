import Navbar from '../components/Navbar';
import '../styles/landing.css';

const PARTIDOS = [
  {
    local: 'Leones FIS',
    visitante: 'Titanes 10',
    fecha: '12 Oct · 7:30 PM',
    cancha: 'Cancha A',
    dia: '12',
    mes: 'OCT',
  },
  {
    local: 'Halcones UFPS',
    visitante: 'Rojos FC',
    fecha: '14 Oct · 8:00 PM',
    cancha: 'Cancha B',
    dia: '14',
    mes: 'OCT',
  },
];

const TABLA = [
  ['1', 'Leones FIS', '3', '2', '1', '0', '7', '3', '+4', '7'],
  ['2', 'Titanes 10', '3', '2', '0', '1', '6', '4', '+2', '6'],
  ['3', 'Halcones UFPS', '3', '1', '1', '1', '4', '5', '-1', '4'],
  ['4', 'Rojos FC', '3', '0', '0', '3', '2', '7', '-5', '0'],
];

const GOLEADORES = [
  { pos: '01', nombre: 'Daniel Cardenas', equipo: 'Leones FIS', goles: 9 },
  { pos: '02', nombre: 'Juan Mena', equipo: 'Titanes 10', goles: 7 },
  { pos: '03', nombre: 'Sebastian Parra', equipo: 'Halcones UFPS', goles: 6 },
];

function LandingPage() {
  return (
    <>
      <Navbar mode="public" />
      <main className="landing-page">
        <section
          id="inicio"
          className="hero"
          style={{
            backgroundImage:
              "linear-gradient(100deg, rgba(0,0,0,0.78), rgba(0,0,0,0.62)), url('https://images.unsplash.com/photo-1552667466-07770ae110d0?w=1600')",
          }}
        >
          <div className="hero-content page">
            <span className="hero-badge">SUPER COPA 2026 · EN CURSO</span>
            <h1>
              <span className="hero-line">Super Copa 2026</span>
              <span className="hero-line accent">Mundial</span>
            </h1>
            <p className="subtitle">Facultad de Ingenieria de Sistemas · UFPS</p>
            <div className="hero-actions">
              <button className="primary-button" type="button">VER CRONOGRAMA</button>
              <button className="secondary-button" type="button">TABLA DE POSICIONES</button>
            </div>
          </div>
        </section>

        <section className="ticker-wrap">
          <div className="ticker-track">
            SUPER COPA 2026 · MUNDIAL · INSCRIPCIONES ABIERTAS · PROXIMOS PARTIDOS EN CAMINO · QUE EMPIECE EL TORNEO! ·
            SUPER COPA 2026 · MUNDIAL · INSCRIPCIONES ABIERTAS · PROXIMOS PARTIDOS EN CAMINO · QUE EMPIECE EL TORNEO!
          </div>
        </section>

        <section className="page stats-grid">
          <article className="stat-card"><h3>Equipos inscritos</h3><p>4</p></article>
          <article className="stat-card"><h3>Partidos jugados</h3><p>6</p></article>
          <article className="stat-card"><h3>Goles marcados</h3><p>19</p></article>
        </section>

        <section className="page landing-highlight-grid">
          <article className="panel-highlight matches-highlight-card">
            <div className="highlight-head">
              <h3>Proximos encuentros</h3>
              <button type="button">Ver todos</button>
            </div>

            <div className="highlight-match-list">
              {PARTIDOS.map((partido) => (
                <article key={`${partido.local}-${partido.visitante}-mini`} className="highlight-match-row">
                  <div className="match-date-pill">
                    <strong>{partido.dia}</strong>
                    <span>{partido.mes}</span>
                  </div>

                  <div className="match-teams-inline">
                    <p>{partido.local}</p>
                    <span>vs</span>
                    <p>{partido.visitante}</p>
                  </div>

                  <div className="match-court-inline">
                    <strong>{partido.cancha.toUpperCase()}</strong>
                    <small>{partido.fecha.split('·')[1]?.trim()}</small>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <aside className="highlight-side-stack">
            <article className="panel-highlight signup-cta-card">
              <h3>Se parte del torneo</h3>
              <p>Registra tu equipo de la facultad para la edicion 2026. Cupos limitados.</p>
              <button className="signup-cta-btn" type="button">INSCRIBIR MI EQUIPO</button>
            </article>
          </aside>
        </section>

        <section id="torneos" className="page landing-section">
          <h2><span />Tabla de posiciones</h2>
          <div className="table-wrap standings-wrap">
            <table>
              <thead>
                <tr>
                  <th>POS</th><th>EQUIPO</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {TABLA.map((fila, index) => (
                  <tr key={fila[1]} className={index === 0 ? 'leader-row' : ''}>
                    {fila.map((celda) => <td key={`${fila[1]}-${celda}`}>{celda}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="fama" className="page landing-section">
          <h2><span />Goleadores</h2>
          <div className="scorers-grid">
            {GOLEADORES.map((goleador) => (
              <article key={goleador.nombre} className="scorer-card">
                <strong>{goleador.pos}</strong>
                <div>
                  <p>{goleador.nombre}</p>
                  <small>{goleador.equipo}</small>
                </div>
                <span>{goleador.goles} G</span>
              </article>
            ))}
          </div>
        </section>

        <footer className="landing-footer">
          <div className="page footer-content">
            <p className="footer-brand">CODE-CUP</p>
            <p>Facultad de Ingenieria de Sistemas · UFPS · 2026</p>
            <nav>
              <a href="#">Reglamento</a>
              <a href="#">Contacto</a>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}

export default LandingPage;
