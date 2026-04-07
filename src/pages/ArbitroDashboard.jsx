import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getNombre } from '../utils/session';
import '../styles/dashboard.css';

const TABS = [
  { id: 'elegibilidad', label: 'Elegibilidad' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'cierre', label: 'Cierre / W.O.' },
];

const EQUIPOS = [
  {
    nombre: 'Leones FIS',
    jugadores: [
      { nombre: 'Juan Cardenas', estado: 'habilitado', detalle: 'Apto para jugar' },
      { nombre: 'Santiago Ruiz', estado: 'inhabilitado', detalle: 'Sancion activa (suspendido 18/04)' },
      { nombre: 'Andres Mora', estado: 'inhabilitado', detalle: 'Deuda pendiente de $25.000 COP' },
      { nombre: 'Felipe Ochoa', estado: 'habilitado', detalle: 'Apto para jugar' },
    ],
  },
  {
    nombre: 'Titanes 10',
    jugadores: [
      { nombre: 'Kevin Diaz', estado: 'habilitado', detalle: 'Apto para jugar' },
      { nombre: 'Nicolas Vera', estado: 'habilitado', detalle: 'Apto para jugar' },
      { nombre: 'Jorge Solano', estado: 'inhabilitado', detalle: 'Deuda pendiente de $18.000 COP' },
      { nombre: 'David Lobo', estado: 'habilitado', detalle: 'Apto para jugar' },
    ],
  },
];

const EVENTOS = [
  { minuto: "05'", tipo: 'Gol', detalle: 'Leones FIS · Juan Cardenas' },
  { minuto: "11'", tipo: 'Tarjeta Amarilla', detalle: 'Titanes 10 · Jorge Solano' },
  { minuto: "18'", tipo: 'Gol', detalle: 'Titanes 10 · Kevin Diaz' },
  { minuto: "27'", tipo: 'Expulsion (doble amarilla)', detalle: 'Titanes 10 · Jorge Solano' },
];

function ArbitroDashboard() {
  const [activeTab, setActiveTab] = useState('elegibilidad');

  return (
    <>
      <Navbar mode="simple" />
      <main className="page arbitro-layout">
        <header className="arbitro-header panel-card">
          <p className="arbitro-chip">Partido asignado · Jornada 4</p>
          <h1>Leones FIS vs Titanes 10</h1>
          <p>Arbitro principal: {getNombre() || 'Arbitro'} · Inicio 7:30 PM · Cancha A</p>

          <div className="arbitro-score-strip">
            <strong>1</strong>
            <span>Tiempo 2T · 32:15</span>
            <strong>1</strong>
          </div>

          <nav className="arbitro-tabs" aria-label="Secciones del arbitro">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`arbitro-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'elegibilidad' ? (
          <section className="dashboard-grid">
            <article className="panel-card">
              <h2>Verificacion de elegibilidad (HU19)</h2>
              <p className="arbitro-sub">Revisa y confirma la alineacion oficial antes del inicio.</p>

              <div className="arbitro-team-grid">
                {EQUIPOS.map((equipo) => (
                  <article key={equipo.nombre} className="arbitro-team-card">
                    <h3>{equipo.nombre}</h3>
                    <ul className="arbitro-player-list">
                      {equipo.jugadores.map((jugador) => (
                        <li key={`${equipo.nombre}-${jugador.nombre}`}>
                          <div>
                            <p>{jugador.nombre}</p>
                            <small>{jugador.detalle}</small>
                          </div>
                          <div className="arbitro-player-actions">
                            <span className={`estado-chip ${jugador.estado}`}>{jugador.estado === 'habilitado' ? 'Habilitado' : 'Inhabilitado'}</span>
                            {jugador.detalle.toLowerCase().includes('deuda') ? (
                              <button className="ghost-action" type="button">Habilitar deuda</button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <button className="primary-button" type="button">Confirmar alineacion oficial</button>
            </article>
          </section>
        ) : null}

        {activeTab === 'eventos' ? (
          <section className="dashboard-grid arbitro-events-grid">
            <article className="panel-card">
              <h2>Registrar evento en tiempo real (HU20)</h2>
              <p className="arbitro-sub">Selecciona tipo de evento, equipo y jugador. La razon es opcional.</p>

              <div className="event-quick-actions">
                <button type="button">+ Gol</button>
                <button type="button">+ Amarilla</button>
                <button type="button">+ Roja</button>
                <button type="button">+ Doble amarilla</button>
              </div>

              <form className="panel-form" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="evento-tipo">Tipo de evento</label>
                <select id="evento-tipo" defaultValue="GOL">
                  <option value="GOL">Gol</option>
                  <option value="AMARILLA">Tarjeta Amarilla</option>
                  <option value="ROJA">Tarjeta Roja Directa</option>
                  <option value="DOBLE_AMARILLA">Expulsion por doble amarilla</option>
                </select>

                <label htmlFor="evento-equipo">Equipo</label>
                <select id="evento-equipo" defaultValue="Leones FIS">
                  <option>Leones FIS</option>
                  <option>Titanes 10</option>
                </select>

                <label htmlFor="evento-jugador">Jugador</label>
                <select id="evento-jugador" defaultValue="Juan Cardenas">
                  <option>Juan Cardenas</option>
                  <option>Kevin Diaz</option>
                  <option>Nicolas Vera</option>
                </select>

                <label htmlFor="evento-razon">Razon (opcional)</label>
                <textarea id="evento-razon" rows="3" placeholder="Ej: Juego brusco grave en mitad de cancha" />

                <button className="primary-button" type="submit">Registrar evento</button>
              </form>
            </article>

            <article className="panel-card">
              <h2>Historial cronologico (inmutable)</h2>
              <ul className="timeline-list">
                {EVENTOS.map((evento) => (
                  <li key={`${evento.minuto}-${evento.tipo}`}>
                    <span className="timeline-minute">{evento.minuto}</span>
                    <div>
                      <p>{evento.tipo}</p>
                      <small>{evento.detalle}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeTab === 'cierre' ? (
          <section className="dashboard-grid two-columns">
            <article className="panel-card">
              <h2>Cerrar partido (HU21)</h2>
              <p className="arbitro-sub">Confirma el marcador final y bloquea edicion de eventos.</p>

              <div className="final-score-card">
                <div>
                  <p>Leones FIS</p>
                  <strong>1</strong>
                </div>
                <span>FINAL</span>
                <div>
                  <p>Titanes 10</p>
                  <strong>1</strong>
                </div>
              </div>

              <ul className="rule-list">
                <li>Actualizar tabla: PJ, PG, PE, PP, GF, GC, DG, Pts.</li>
                <li>Si es eliminatoria y empatan, habilitar penales.</li>
                <li>Bloquear reapertura sin autorizacion de administrador.</li>
              </ul>

              <button className="primary-button" type="button">Cerrar partido y confirmar resultado</button>
            </article>

            <article className="panel-card wo-card">
              <h2>Registrar W.O. (HU22)</h2>
              <p className="arbitro-sub">Usa esta accion si un equipo no se presenta o no cumple minimo.</p>

              <form className="panel-form" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="wo-equipo">Equipo que no se presento</label>
                <select id="wo-equipo" defaultValue="Titanes 10">
                  <option>Titanes 10</option>
                  <option>Leones FIS</option>
                </select>

                <label htmlFor="wo-motivo">Motivo</label>
                <select id="wo-motivo" defaultValue="No presentación">
                  <option>No presentación</option>
                  <option>Menos de 4 jugadores</option>
                  <option>Partido no arbitrado por falta de pago</option>
                  <option>Suspendido por lluvia</option>
                  <option>Otro</option>
                </select>

                <label htmlFor="wo-observacion">Observacion arbitral</label>
                <textarea id="wo-observacion" rows="3" placeholder="Describe lo observado en cancha" />

                <button className="primary-button" type="submit">Registrar W.O. y aplicar 3-0</button>
              </form>
            </article>
          </section>
        ) : null}
      </main>
    </>
  );
}

export default ArbitroDashboard;
