import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, hasSession } from '../utils/session';
import brandLogo from '../assets/warp-football-ball.svg';
import '../styles/navbar.css';

const PUBLIC_LINKS = [
  { id: 'inicio', label: 'INICIO', to: '/#inicio', hash: '#inicio' },
  { id: 'torneos', label: 'TORNEOS', to: '/#torneos', hash: '#torneos' },
  { id: 'fama', label: 'SALON DE LA FAMA', to: '/#fama', hash: '#fama' },
];

function Navbar({ mode = 'simple' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logged = hasSession();

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const isPublicLinkActive = (item) => {
    if (location.pathname !== '/') {
      return false;
    }

    if (!location.hash) {
      return item.id === 'inicio';
    }

    return location.hash === item.hash;
  };

  if (mode === 'public') {
    return (
      <header className="navbar navbar-public">
        <Link className="brand" to="/">
          <img className="brand-logo" src={brandLogo} alt="Logo CODE-CUP" />
          <span>CODE-CUP</span>
        </Link>

        <nav className="public-nav-links" aria-label="Navegacion principal">
          {PUBLIC_LINKS.map((item) => (
            <Link
              key={item.label}
              className={`public-nav-link ${isPublicLinkActive(item) ? 'active' : ''}`}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className={`user-shortcut ${location.pathname === '/login' ? 'active' : ''}`} to="/login" aria-label="Ir al login">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2c-4.65 0-8.5 2.7-8.5 6v1h17v-1c0-3.3-3.85-6-8.5-6Z" fill="currentColor" />
          </svg>
        </Link>
      </header>
    );
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <img className="brand-logo" src={brandLogo} alt="Logo CODE-CUP" />
        <span>CODE-CUP</span>
      </Link>

      <div className="nav-actions">
        {!logged ? (
          <Link className="nav-button" to="/login">
            Iniciar sesion
          </Link>
        ) : (
          <button className="nav-button danger" onClick={handleLogout} type="button">
            Cerrar sesion
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
