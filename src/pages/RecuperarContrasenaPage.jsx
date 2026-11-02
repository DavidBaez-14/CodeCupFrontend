import { useState } from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { enviarRecuperacion } from '../lib/supabase';
import { mensajeDeErrorAuth } from '../utils/erroresAuth';
import '../styles/login.css';

/** /recuperar-contrasena (spec 0019): envía el correo de recuperación sin revelar si la cuenta existe. */
function RecuperarContrasenaPage() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await enviarRecuperacion(correo);
      setEnviado(true);
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No fue posible enviar el correo. Intenta de nuevo.'));
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

        <div className="login-title">Recuperar contraseña</div>

        {enviado ? (
          <p className="pending-text">Si hay una cuenta con ese correo, te enviamos un enlace.</p>
        ) : (
          <>
            <div className="login-sub">Te enviaremos un enlace para elegir una contraseña nueva.</div>
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
              <button className="btn-login-submit" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <Link to="/login" className="btn-signup-link">Volver al login</Link>
      </div>
    </div>
  );
}

export default RecuperarContrasenaPage;
