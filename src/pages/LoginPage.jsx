import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { login, startGoogleLogin } from '../api/auth';
import { setSession } from '../utils/session';
import '../styles/login.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauthError');
    if (oauthError) {
      setError(oauthError);
    }
  }, [location.search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(correo, contrasena);
      setSession({
        token: data.token,
        rol: data.rol,
        nombre: data.nombre,
        debeCambiarContrasena: data.debeCambiarContrasena,
      });
      navigate(data.debeCambiarContrasena ? '/cambiar-contrasena' : (ROLE_ROUTE[data.rol] || '/login'), { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'No fue posible iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar mode="public" />
      <main className="page login-page">
        <section className="auth-card">
          <p className="auth-brand">CODE-CUP</p>
          <h1>Iniciar sesion</h1>
          <p className="auth-subtitle">Ingresa con tu correo institucional o correo registrado por el administrador.</p>
          <p className="oauth-note">Primer ingreso: tu contraseña es tu cedula. Al entrar, deberas cambiarla por seguridad.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="Ej: lionelandresmc@ufps.edu.co"
              required
            />

            <label htmlFor="contraseña">Contraseña</label>
            <input
              id="contraseña"
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="Ej: 1098765432"
              required
            />

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}

          <p className="separator">- o -</p>
          <button className="google-button" onClick={startGoogleLogin} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="#EA4335" d="M12 10.2v3.95h5.49c-.24 1.28-.97 2.37-2.06 3.1l3.33 2.58c1.94-1.79 3.06-4.43 3.06-7.58 0-.73-.07-1.44-.2-2.12H12Z" />
              <path fill="#34A853" d="M6.2 14.29 5.45 14l-2.66 2.07A9.97 9.97 0 0 0 12 22c2.7 0 4.96-.89 6.61-2.41l-3.33-2.58c-.92.62-2.1.99-3.28.99-2.59 0-4.78-1.75-5.56-4.11Z" />
              <path fill="#4A90E2" d="M2.79 7.93A10 10 0 0 0 2 12c0 1.44.3 2.81.79 4.07l3.41-2.65a5.96 5.96 0 0 1 0-2.84L2.79 7.93Z" />
              <path fill="#FBBC05" d="M12 5.98c1.47 0 2.78.51 3.81 1.5l2.86-2.87A9.96 9.96 0 0 0 12 2a9.97 9.97 0 0 0-9.21 5.93l3.41 2.65C7.22 7.73 9.41 5.98 12 5.98Z" />
            </svg>
            Continuar con Google
          </button>
        </section>
      </main>
    </>
  );
}

export default LoginPage;
