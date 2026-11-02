import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { me } from '../api/auth';
import { cerrarSesion } from '../lib/supabase';
import { NOMBRE_ROL, RUTA_POR_ROL } from '../utils/destino';
import { guardarSesionDesdeMe, normalizeRole } from '../utils/session';
import '../styles/login.css';

/** /pending (spec 0019): la solicitud de Delegado o Árbitro está en revisión, pero se puede jugar. */
function PendingApprovalPage() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    me()
      .then((respuesta) => { if (!cancelado) setDatos(respuesta); })
      .catch((err) => { if (!cancelado) setError(err?.message || 'No fue posible revisar tu cuenta.'); });
    return () => { cancelado = true; };
  }, []);

  const pendientes = (datos?.rolesPendientes || []).map(normalizeRole);
  const puedeJugar = (datos?.roles || []).map(normalizeRole).includes('JUGADOR');
  const nombresPendientes = pendientes.map((rol) => NOMBRE_ROL[rol] || rol).join(' y ');

  const entrarComoJugador = () => {
    guardarSesionDesdeMe(datos, 'JUGADOR');
    navigate(RUTA_POR_ROL.JUGADOR, { replace: true });
  };

  const handleLogout = async () => {
    await cerrarSesion();
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
          {pendientes.length
            ? `Tu solicitud para ser ${nombresPendientes} está en revisión. Un administrador la aprobará.`
            : 'No tienes solicitudes pendientes en este momento.'}
        </p>
        {puedeJugar && (
          <p className="pending-text-muted">Mientras tanto puedes usar CodeCup como jugador.</p>
        )}
        {error && <p className="login-error">{error}</p>}

        <div className="login-actions">
          {puedeJugar && (
            <button className="btn-login-submit" type="button" onClick={entrarComoJugador}>
              Entrar como jugador
            </button>
          )}
          <button className="btn-signup-link" type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
