import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setSession } from '../utils/session';
import '../styles/login.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
};

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token');
  const rol = params.get('rol');
  const nombre = params.get('nombre') || '';
  const debeCambiarContrasena = params.get('debeCambiarContrasena') === 'true';

  useEffect(() => {
    if (!token || !rol) {
      return;
    }

    setSession({ token, rol, nombre, debeCambiarContrasena });
    navigate(debeCambiarContrasena ? '/cambiar-contrasena' : (ROLE_ROUTE[rol] || '/login'), { replace: true });
  }, [token, rol, nombre, debeCambiarContrasena, navigate]);

  if (!token || !rol) {
    return (
      <main className="page login-page">
        <section className="auth-card">
          <h1>No fue posible completar Google Login</h1>
          <p className="auth-subtitle">La respuesta no incluye token o rol valido.</p>
          <Link className="primary-button" to="/login">Volver al login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page login-page">
      <section className="auth-card">
        <h1>Autenticando con Google...</h1>
        <p className="auth-subtitle">Estamos validando tu sesion, espera un momento.</p>
      </section>
    </main>
  );
}

export default GoogleCallbackPage;
