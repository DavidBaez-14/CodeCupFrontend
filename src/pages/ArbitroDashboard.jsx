import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getEmail, getNombre } from '../utils/session';
import '../styles/admin.css';
import '../styles/role-shell.css';

function ArbitroDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Árbitro';
  const email = getEmail() || '';

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  return (
    <main className="role-shell">
      <header className="role-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de árbitro</p>
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
          <p className="role-tag">ÁRBITRO</p>
          <h1>Bienvenido, {nombre.split(' ')[0]}</h1>
          <p>Tu cuenta está activa. Las herramientas de elegibilidad, eventos en vivo y cierre de partido se habilitarán en el siguiente sprint del proyecto.</p>
        </article>

        <article className="ds-panel placeholder">
          <h2>Funcionalidades en construcción</h2>
          <p>Próximamente podrás validar la alineación, registrar goles y tarjetas, y cerrar el partido o un W.O. desde aquí.</p>
        </article>
      </section>
    </main>
  );
}

export default ArbitroDashboard;
