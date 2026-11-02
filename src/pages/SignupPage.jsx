import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { entrarConGoogle, registrarseConCorreo } from '../lib/supabase';
import { mensajeDeErrorAuth } from '../utils/erroresAuth';
import '../styles/login.css';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
    <path fill="#EA4335" d="M12 10.2v3.95h5.49c-.24 1.28-.97 2.37-2.06 3.1l3.33 2.58c1.94-1.79 3.06-4.43 3.06-7.58 0-.73-.07-1.44-.2-2.12H12Z" />
    <path fill="#34A853" d="M6.2 14.29 5.45 14l-2.66 2.07A9.97 9.97 0 0 0 12 22c2.7 0 4.96-.89 6.61-2.41l-3.33-2.58c-.92.62-2.1.99-3.28.99-2.59 0-4.78-1.75-5.56-4.11Z" />
    <path fill="#4A90E2" d="M2.79 7.93A10 10 0 0 0 2 12c0 1.44.3 2.81.79 4.07l3.41-2.65a5.96 5.96 0 0 1 0-2.84L2.79 7.93Z" />
    <path fill="#FBBC05" d="M12 5.98c1.47 0 2.78.51 3.81 1.5l2.86-2.87A9.96 9.96 0 0 0 12 2a9.97 9.97 0 0 0-9.21 5.93l3.41 2.65C7.22 7.73 9.41 5.98 12 5.98Z" />
  </svg>
);

/**
 * Registro (spec 0019): solo correo y contraseña. Los datos personales se piden después
 * de confirmar el correo, en /complete-signup, y van solo a nuestro backend.
 */
function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hint = location.state?.hint;
  const [form, setForm] = useState({ correo: '', contrasena: '', contrasenaConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviadoA, setEnviadoA] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await entrarConGoogle();
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No se pudo iniciar el registro con Google.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.contrasena !== form.contrasenaConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // Supabase no revela si el correo ya existe: en los dos casos se pide revisar el correo.
      await registrarseConCorreo(form.correo, form.contrasena);
      setEnviadoA(form.correo.trim());
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No fue posible crear la cuenta.'));
    } finally {
      setLoading(false);
    }
  };

  if (enviadoA) {
    return (
      <div className="login-wrap">
        <div className="login-bg" />
        <div className="login-card pending-card">
          <div className="login-logo">
            <img src={brandLogo} alt="Code Cup" />
            <span className="login-logo-text"><em>Code</em> Cup</span>
          </div>
          <div className="pending-icon" aria-hidden="true">📬</div>
          <div className="login-title">Revisa tu correo</div>
          <p className="pending-text">
            Te enviamos un enlace a <strong>{enviadoA}</strong> para confirmar tu cuenta.
            Ábrelo para completar tu registro.
          </p>
          <p className="pending-text-muted">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
          <Link to="/login" className="btn-signup-link">Volver al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card signup-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        <div className="login-title">Crear cuenta</div>
        <div className="login-sub">Te enviaremos un correo para confirmarla.</div>
        {hint && <div className="login-hint">{hint}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              name="correo"
              className="form-input"
              type="email"
              placeholder="tu@ufps.edu.co"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              className="form-input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.contrasena}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contrasenaConfirm">Confirmar contraseña</label>
            <input
              id="contrasenaConfirm"
              name="contrasenaConfirm"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.contrasenaConfirm}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn-login-submit" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <div className="login-separator">— o —</div>

        <button className="btn-google" type="button" onClick={handleGoogle}>
          {GOOGLE_ICON}
          Registrarme con Google
        </button>

        <Link to="/login" className="btn-signup-link">
          Ya tengo cuenta — Ingresar
        </Link>

        <div className="login-back">
          <button type="button" onClick={() => navigate('/')}>← Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
