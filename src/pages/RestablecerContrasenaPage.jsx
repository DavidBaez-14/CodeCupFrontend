import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { cambiarContrasena, cerrarSesion, obtenerSesion } from '../lib/supabase';
import { MENSAJE_ENLACE_VENCIDO, mensajeDeErrorAuth } from '../utils/erroresAuth';
import '../styles/login.css';

/**
 * /restablecer-contrasena (spec 0019): llega desde el enlace de recuperación, que ya abrió
 * una sesión. Al guardar se cierra la sesión y se vuelve al login para elegir el rol.
 */
function RestablecerContrasenaPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelado = false;
    obtenerSesion().then((sesion) => {
      if (!cancelado) setEstado(sesion ? 'listo' : 'sin-sesion');
    });
    return () => { cancelado = true; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await cambiarContrasena(nueva);
      await cerrarSesion();
      navigate('/login?aviso=contrasena-actualizada', { replace: true });
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No fue posible cambiar la contraseña.'));
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

        <div className="login-title">Elige una contraseña nueva</div>

        {estado === 'sin-sesion' && (
          <>
            <p className="pending-text">{MENSAJE_ENLACE_VENCIDO}</p>
            <Link to="/recuperar-contrasena" className="btn-signup-link">Pedir otro enlace</Link>
          </>
        )}

        {estado === 'listo' && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="nueva">Contraseña nueva</label>
              <input
                id="nueva"
                className="form-input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmacion">Confirmar contraseña</label>
              <input
                id="confirmacion"
                className="form-input"
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                required
              />
            </div>
            <button className="btn-login-submit" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default RestablecerContrasenaPage;
