import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { exchange } from '../api/auth';
import { appwriteCreateJwt, appwriteLogin, appwriteLogout, appwriteOAuthGoogle } from '../lib/appwrite';
import { pickPrimaryRole, setSession } from '../utils/session';
import '../styles/login.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
  JUGADOR: '/dashboard/jugador',
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('oauthError') || '';
  });
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    try {
      // Cierra cualquier sesión Appwrite previa para que el callback de Google sea limpio.
      await appwriteLogout();
      const origin = window.location.origin;
      appwriteOAuthGoogle({
        successUrl: `${origin}/oauth/callback`,
        failureUrl: `${origin}/login?oauthError=${encodeURIComponent('No se pudo autenticar con Google.')}`,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar el login con Google.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Cierra sesión previa de Appwrite por si quedó una colgada de otro usuario.
      await appwriteLogout();

      // 2. Login en Appwrite -> sesión activa de este usuario.
      await appwriteLogin({ email: correo, password: contrasena });

      // 3. JWT corto de Appwrite (~15 min) que el backend va a verificar.
      const appwriteJwt = await appwriteCreateJwt();

      // 4. Exchange contra el backend -> JWT propio + roles.
      const data = await exchange(appwriteJwt);

      const rolPrimario = pickPrimaryRole(data.roles);
      setSession({
        token: data.token,
        rol: rolPrimario,
        nombre: data.nombre,
        email: data.correo,
      });

      navigate(ROLE_ROUTE[rolPrimario] || '/login', { replace: true });
    } catch (requestError) {
      const mensaje = requestError?.message || 'No fue posible iniciar sesión.';

      // Si el perfil aún está pendiente, mandamos al usuario a la pantalla de espera.
      if (/pendiente/i.test(mensaje)) {
        navigate('/pending', { replace: true });
        return;
      }

      // Si no está registrado en el backend, lo invitamos a completar el registro.
      if (/no registrado/i.test(mensaje)) {
        navigate('/signup', { replace: true, state: { hint: 'Completa tu registro.' } });
        return;
      }

      setError(mensaje);
      await appwriteLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        <div className="login-title">Bienvenido</div>
        <div className="login-sub">Ingresa con tu cuenta para gestionar el torneo</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              className="form-input"
              type="email"
              placeholder="tu@ufps.edu.co"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          <button className="btn-login-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <div className="login-separator">— o —</div>

        <button className="btn-google" type="button" onClick={handleGoogle}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
            <path fill="#EA4335" d="M12 10.2v3.95h5.49c-.24 1.28-.97 2.37-2.06 3.1l3.33 2.58c1.94-1.79 3.06-4.43 3.06-7.58 0-.73-.07-1.44-.2-2.12H12Z" />
            <path fill="#34A853" d="M6.2 14.29 5.45 14l-2.66 2.07A9.97 9.97 0 0 0 12 22c2.7 0 4.96-.89 6.61-2.41l-3.33-2.58c-.92.62-2.1.99-3.28.99-2.59 0-4.78-1.75-5.56-4.11Z" />
            <path fill="#4A90E2" d="M2.79 7.93A10 10 0 0 0 2 12c0 1.44.3 2.81.79 4.07l3.41-2.65a5.96 5.96 0 0 1 0-2.84L2.79 7.93Z" />
            <path fill="#FBBC05" d="M12 5.98c1.47 0 2.78.51 3.81 1.5l2.86-2.87A9.96 9.96 0 0 0 12 2a9.97 9.97 0 0 0-9.21 5.93l3.41 2.65C7.22 7.73 9.41 5.98 12 5.98Z" />
          </svg>
          Continuar con Google
        </button>

        <Link to="/signup" className="btn-signup-link">
          Crear cuenta nueva
        </Link>

        <div className="login-back">
          <button type="button" onClick={() => navigate('/')}>← Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
