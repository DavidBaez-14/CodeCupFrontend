import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { exchange } from '../api/auth';
import { appwriteCreateJwt, appwriteCurrentUser, appwriteLogout } from '../lib/appwrite';
import { pickPrimaryRole, setSession } from '../utils/session';
import '../styles/login.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
  JUGADOR: '/dashboard/jugador',
};

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Confirma que tras el redirect quedamos con sesión activa en Appwrite.
        const user = await appwriteCurrentUser();
        if (!user) {
          throw new Error('No se obtuvo sesión de Google. Intenta de nuevo.');
        }

        const appwriteJwt = await appwriteCreateJwt();
        const data = await exchange(appwriteJwt);
        if (cancelled) return;

        const rolPrimario = pickPrimaryRole(data.roles);
        setSession({
          token: data.token,
          rol: rolPrimario,
          nombre: data.nombre,
          email: data.correo,
        });
        navigate(ROLE_ROUTE[rolPrimario] || '/login', { replace: true });
      } catch (err) {
        if (cancelled) return;
        const mensaje = err?.message || 'No fue posible completar el login con Google.';

        // Cuenta existe pero todos sus roles están PENDIENTE / PENDIENTE_VALIDACION
        // → backend tira "Cuenta sin roles aprobados" o "...pendiente...".
        if (/pendiente/i.test(mensaje) || /sin roles/i.test(mensaje)) {
          navigate('/pending', { replace: true });
          return;
        }
        // Primera vez por Google: la sesión Appwrite ya existe pero no hay Cuenta en DB
        // → backend tira "Cuenta no registrada" (también legacy "sin rol asignado" / "Perfil no registrado").
        if (
          /sin rol asignado/i.test(mensaje) ||
          /no registrad[ao]/i.test(mensaje) ||
          /perfil no registrado/i.test(mensaje)
        ) {
          const params = new URLSearchParams(location.search);
          const tipo = params.get('tipo');
          const destino = tipo ? `/complete-signup?tipo=${encodeURIComponent(tipo)}` : '/complete-signup';
          navigate(destino, { replace: true });
          return;
        }

        setError(mensaje);
        await appwriteLogout();
      }
    }

    run();
    return () => { cancelled = true; };
  }, [location.search, navigate]);

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card pending-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        {error ? (
          <>
            <div className="pending-icon" aria-hidden="true">⚠️</div>
            <div className="login-title">No se pudo iniciar sesión</div>
            <p className="pending-text">{error}</p>
            <button className="btn-login-submit" type="button" onClick={() => navigate('/login', { replace: true })}>
              Volver al login
            </button>
          </>
        ) : (
          <>
            <div className="pending-icon" aria-hidden="true">⏳</div>
            <div className="login-title">Conectando con Google…</div>
            <p className="pending-text">Validando tu sesión y obteniendo tu rol del sistema.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
