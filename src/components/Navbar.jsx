import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, hasSession } from '../utils/session';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import '../styles/navbar.css';

const PUBLIC_LINKS = [
  { id: 'inicio',  label: 'Inicio',           to: '/'                },
  { id: 'torneos', label: 'Torneos',           to: '/torneos'         },
  { id: 'fama',    label: 'Salón de la Fama',  to: '/salon-de-la-fama'},
  { id: 'galeria', label: 'Galería',           to: '/galeria'         },
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
    if (item.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.to);
  };

  if (mode === 'public') {
    return (
      <header className="navbar navbar-public">
        <Link className="nav-logo" to="/">
          <img src={brandLogo} alt="Code Cup" />
          <span className="nav-logo-text"><em>Code</em> Cup</span>
        </Link>

        <nav className="nav-links" aria-label="Navegación principal">
          {PUBLIC_LINKS.map((item) => (
            <Link
              key={item.id}
              className={`nav-link${isPublicLinkActive(item) ? ' active' : ''}`}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="nav-btn" to="/login" aria-label="Ingresar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Ingresar
        </Link>
      </header>
    );
  }

  return (
    <header className="navbar">
      <Link className="nav-logo" to="/">
        <img src={brandLogo} alt="Code Cup" />
        <span className="nav-logo-text"><em>Code</em> Cup</span>
      </Link>

      <div className="nav-actions">
        {!logged ? (
          <Link className="nav-btn" to="/login">Iniciar sesión</Link>
        ) : (
          <button className="nav-btn nav-btn-danger" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
