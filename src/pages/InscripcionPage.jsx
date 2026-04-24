import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
/*import handshakeIllustration from '../assets/players-handshake.svg';*/
import '../styles/inscripcion.css';

const PLANTILLA_URL =
  'https://docs.google.com/document/d/1n5W6Rk2ejGX2oWyEfGIeDlGV2xuOd2V6/edit?usp=drive_link&ouid=108947163306010030714&rtpof=true&sd=true';

const REQUISITOS = [
  {
    num: '01',
    titulo: 'Minimo 6 jugadores',
    desc: 'Todos deben ser de la Facultad de Sistemas: estudiantes activos, graduados, profesores o administrativos.',
    color: '#ff5500',
  },
  {
    num: '02',
    titulo: 'Elegir seleccion del Mundial 2026',
    desc: 'Cada equipo debe participar con el nombre de una seleccion nacional del Mundial FIFA 2026.',
    color: '#3b82f6',
  },
  {
    num: '03',
    titulo: 'Pago de inscripcion',
    desc: 'La inscripcion tiene un valor de $60.000 por equipo y se realiza de forma presencial.',
    color: '#facc15',
  },
  {
    num: '04',
    titulo: 'Plantilla oficial diligenciada',
    desc: 'Debes completar la plantilla y llevarla a secretaria junto con el pago de inscripcion del equipo.',
    color: '#22c55e',
    link: PLANTILLA_URL,
  },
];

const PREMIOS = [
  {
    emoji: '🏆',
    titulo: 'Podio del torneo',
    desc: 'Premios para primer, segundo y tercer lugar.',
    detalle: 'Incluye trofeos y medallas para los equipos del podio.',
    cls: 'award-podio',
  },
  {
    emoji: '⚽',
    titulo: 'Goleador del torneo',
    desc: 'Reconocimiento al maximo anotador del campeonato.',
    detalle: 'Incluye trofeo y medalla individual.',
    cls: 'award-goleador',
  },
  {
    emoji: '🧤',
    titulo: 'Portero menos vencido',
    desc: 'Premio al arquero con mejor rendimiento defensivo.',
    detalle: 'Incluye trofeo y medalla individual.',
    cls: 'award-portero',
  },
];

function InscripcionPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar mode="public" />
      <main className="inscripcion-page">
        <div className="inscripcion-bg" />

        <section className="inscripcion-topbar">
          <div>
            <div className="inscripcion-eyebrow">Torneo 2026 · Inscripcion presencial</div>
            <h1 className="inscripcion-title">
              Condiciones y premios
              <em> para tu equipo</em>
            </h1>
          </div>
          <div className="inscripcion-actions">
            <a
              className="inscripcion-btn inscripcion-btn-primary"
              href={PLANTILLA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar plantilla oficial
            </a>
            <button
              className="inscripcion-btn inscripcion-btn-secondary"
              type="button"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
          </div>
        </section>

        <section className="inscripcion-content">
          <article className="inscripcion-panel">
            <h2 className="inscripcion-section-title">Requisitos de inscripcion</h2>
            <p className="inscripcion-section-desc">
              Esto es lo minimo que necesitas para registrar a tu equipo.
            </p>

            <div className="inscripcion-steps">
              {REQUISITOS.map((item) => (
                <div key={item.num} className="inscripcion-step">
                  <span
                    className="inscripcion-step-num"
                    style={{ borderColor: item.color, color: item.color }}
                  >
                    {item.num}
                  </span>
                  <div className="inscripcion-step-copy">
                    <h3>{item.titulo}</h3>
                    <p>{item.desc}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        Abrir plantilla de inscripcion
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="inscripcion-panel inscripcion-premios-panel">
            <h2 className="inscripcion-section-title">Premios que puedes ganar</h2>
            <p className="inscripcion-section-desc">
              Habra premios para podio, goleador y portero menos vencido.
            </p>

            <div className="inscripcion-awards-grid">
              {PREMIOS.map((premio) => (
                <article key={premio.titulo} className={`inscripcion-award ${premio.cls}`}>
                  <span className="inscripcion-award-emoji">{premio.emoji}</span>
                  <h3>{premio.titulo}</h3>
                  <p>{premio.desc}</p>
                  <small>{premio.detalle}</small>
                </article>
              ))}
            </div>
          </article>
        </section>

      </main>
    </>
  );
}

export default InscripcionPage;
