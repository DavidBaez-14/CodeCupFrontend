import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession } from '../utils/session';
import '../styles/login.css';

function PendingApprovalPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/', { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card pending-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        <div className="pending-icon" aria-hidden="true">⏳</div>
        <div className="login-title">Solicitud en revisión</div>
        <p className="pending-text">
          Tu cuenta fue creada con éxito. Un administrador debe aprobarla antes de que puedas acceder al sistema.
        </p>
        <p className="pending-text-muted">
          Te avisaremos al correo registrado cuando tu cuenta esté lista. Puedes intentar iniciar sesión más tarde.
        </p>

        <button className="btn-login-submit" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>

        <div className="login-back">
          <button type="button" onClick={() => navigate('/login')}>← Volver al inicio de sesión</button>
        </div>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
