import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { cambiarContrasena } from '../api/auth';
import { getNombre, getRol, getToken, setSession } from '../utils/session';
import '../styles/login.css';

const ROLE_ROUTE = {
  ADMINISTRADOR: '/dashboard/admin',
  ARBITRO: '/dashboard/arbitro',
  DELEGADO: '/dashboard/delegado',
};

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');

    if (contrasenaNueva.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (contrasenaNueva !== confirmacion) {
      setError('La confirmacion de contrasena no coincide.');
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      await cambiarContrasena(token, contrasenaActual, contrasenaNueva);
      setSession({
        token,
        rol: getRol(),
        nombre: getNombre() || '',
        debeCambiarContrasena: false,
      });
      setMensaje('Contrasena actualizada. Redirigiendo...');
      navigate(ROLE_ROUTE[getRol()] || '/login', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'No fue posible cambiar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page login-page">
        <section className="auth-card">
          <h1>Cambiar contrasena temporal</h1>
          <p className="auth-subtitle">Por seguridad, debes definir una contrasena nueva para continuar.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="contrasena-actual">Contrasena actual</label>
            <input
              id="contrasena-actual"
              type="password"
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
              required
            />

            <label htmlFor="contrasena-nueva">Nueva contrasena</label>
            <input
              id="contrasena-nueva"
              type="password"
              value={contrasenaNueva}
              onChange={(event) => setContrasenaNueva(event.target.value)}
              minLength={8}
              required
            />

            <label htmlFor="contrasena-confirmacion">Confirmar nueva contrasena</label>
            <input
              id="contrasena-confirmacion"
              type="password"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              minLength={8}
              required
            />

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar contrasena'}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {mensaje ? <p className="success-text">{mensaje}</p> : null}
        </section>
      </main>
    </>
  );
}

export default ChangePasswordPage;
