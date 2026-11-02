import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { entrarConContrasena, entrarConGoogle } from '../lib/supabase';
import { despuesDeEntrar } from '../utils/destino';
import {
  MENSAJE_BLOQUEADA,
  MENSAJE_CONTRASENA_ACTUALIZADA,
  MENSAJE_SESION_VENCIDA,
  mensajeDeErrorAuth,
} from '../utils/erroresAuth';
import { getLoginRole, normalizeRole, setLoginRole } from '../utils/session';
import '../styles/login.css';

const DEFAULT_ROLE = 'JUGADOR';

// Avisos que llegan en la URL (/login?aviso=…) desde otras pantallas o desde api/http.js.
const AVISOS = {
  bloqueada: { tipo: 'error', texto: MENSAJE_BLOQUEADA },
  'sesion-vencida': { tipo: 'error', texto: MENSAJE_SESION_VENCIDA },
  'contrasena-actualizada': { tipo: 'info', texto: MENSAJE_CONTRASENA_ACTUALIZADA },
};

const ROLE_OPTIONS = [
  {
    value: 'JUGADOR',
    label: 'Jugador',
    caption: 'Cancha, perfil y estadisticas',
  },
  {
    value: 'DELEGADO',
    label: 'Delegado',
    caption: 'Equipo y gestion de inscripcion',
  },
  {
    value: 'ARBITRO',
    label: 'Arbitro',
    caption: 'Partidos, resultados y reglamento',
  },
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador',
    caption: 'Aprobaciones y control general',
  },
];

const ROLE_ICONS = {
  JUGADOR: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4.2" fill="currentColor" opacity="0.85" />
      <path
        d="M5.2 20.2c.6-3.5 3.4-6 6.8-6s6.1 2.5 6.8 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  DELEGADO: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 4h12v8a6 6 0 0 1-12 0V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 11h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  ARBITRO: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18.2" cy="12" r="2.2" fill="currentColor" />
      <path d="M8 10h4M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ADMINISTRADOR: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8.5l1.1 2.2 2.5.4-1.8 1.7.4 2.5-2.2-1.1-2.2 1.1.4-2.5-1.8-1.7 2.5-.4L12 8.5Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  ),
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialRole = normalizeRole(getLoginRole() || DEFAULT_ROLE);
  const safeInitialRole = ROLE_OPTIONS.some((opt) => opt.value === initialRole)
    ? initialRole
    : DEFAULT_ROLE;
  const [selectedRole, setSelectedRole] = useState(safeInitialRole);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const params = new URLSearchParams(location.search);
  const aviso = AVISOS[params.get('aviso')];
  const [error, setError] = useState(() => params.get('oauthError') || (aviso?.tipo === 'error' ? aviso.texto : ''));
  const [info, setInfo] = useState(aviso?.tipo === 'info' ? aviso.texto : '');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    try {
      // El rol elegido viaja en sessionStorage hasta /auth/callback.
      setLoginRole(selectedRole);
      await entrarConGoogle();
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No se pudo iniciar el login con Google.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await entrarConContrasena(correo, contrasena);
    } catch (err) {
      setError(mensajeDeErrorAuth(err, 'No fue posible iniciar sesión.'));
      setLoading(false);
      return;
    }

    try {
      // /me decide: completar registro, solicitar rol, esperar o entrar al dashboard del rol elegido.
      const { error: mensaje } = await despuesDeEntrar({ navigate, rolElegido: selectedRole });
      if (mensaje) setError(mensaje);
    } catch (err) {
      setError(err?.message || 'No fue posible iniciar sesión.');
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

          <Link to="/recuperar-contrasena" className="login-forgot">¿Olvidaste tu contraseña?</Link>

          <button className="btn-login-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {info && <p className="login-hint">{info}</p>}
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

        <div className="role-icons" role="group" aria-label="Selecciona tu rol">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              type="button"
              aria-label={role.label}
              title={role.label}
              data-label={role.label}
              className={`role-icon-button ${selectedRole === role.value ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedRole(role.value);
                setLoginRole(role.value);
              }}
            >
              {ROLE_ICONS[role.value]}
            </button>
          ))}
        </div>

        <div className="login-back">
          <button type="button" onClick={() => navigate('/')}>← Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
