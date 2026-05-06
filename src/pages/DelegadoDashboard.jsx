import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { getJugadorByCedula } from '../api/jugadores';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getEmail, getNombre, getToken } from '../utils/session';
import '../styles/admin.css';
import '../styles/role-shell.css';

function DelegadoDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Delegado';
  const email = getEmail() || '';

  const [cedula, setCedula] = useState('');
  const [jugador, setJugador] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!cedula.trim()) return;
    setLoading(true);
    setError('');
    setJugador(null);
    try {
      const data = await getJugadorByCedula(cedula.trim(), getToken());
      setJugador(data);
    } catch (err) {
      setError(err?.message || 'No fue posible obtener el jugador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="role-shell">
      <header className="role-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de delegado</p>
          </div>
        </div>
        <div className="role-user">
          <div className="role-user-info">
            <p className="user-name">{nombre}</p>
            <small className="user-email">{email}</small>
          </div>
          <button className="logout-btn" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="role-content">
        <article className="ds-panel welcome-panel">
          <p className="role-tag">DELEGADO</p>
          <h1>Hola, {nombre.split(' ')[0]}</h1>
          <p>Aquí podrás verificar elegibilidad de jugadores y, en próximos sprints, gestionar tu equipo, pagos y cronograma.</p>
        </article>

        <article className="ds-panel">
          <header className="panel-header">
            <h2>Verificar jugador</h2>
            <p>Consulta por cédula a la base oficial de la facultad para confirmar elegibilidad.</p>
          </header>

          <form className="inline-search" onSubmit={handleSearch}>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="Ej: 1090000001"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
            />
            <button className="action-button primary" type="submit" disabled={loading}>
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {error && <p className="banner banner-error">{error}</p>}

          {jugador && (
            <div className="player-card">
              <header className="player-card-header">
                <span className={`role-pill role-${(jugador.rolJugador || '').toLowerCase()}`}>
                  {jugador.rolJugador || '—'}
                </span>
                <span className={`status-pill ${jugador.activo ? 'on' : 'off'}`}>
                  {jugador.activo ? 'Activo' : 'Inactivo'}
                </span>
              </header>
              <h3 className="player-name">{jugador.nombre || '—'}</h3>
              <dl className="player-grid">
                <div><dt>Cédula</dt><dd className="mono">{jugador.cedula || '—'}</dd></div>
                <div><dt>Código universitario</dt><dd>{jugador.codigoUniversitario || '—'}</dd></div>
                <div><dt>Semestre</dt><dd>{jugador.semestre ?? '—'}</dd></div>
              </dl>
            </div>
          )}
        </article>

        <article className="ds-panel placeholder">
          <h2>Funcionalidades en construcción</h2>
          <p>Mi Equipo, Pagos y Cronograma se habilitan en próximos sprints. La consulta de jugadores ya está operativa contra el backend.</p>
        </article>
      </section>
    </main>
  );
}

export default DelegadoDashboard;
