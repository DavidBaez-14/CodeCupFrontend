import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { registrar, registrarJugador } from '../api/auth';
import { appwriteCreateJwt, appwriteLogin, appwriteLogout, appwriteOAuthGoogle, appwriteSignup } from '../lib/appwrite';
import { pickPrimaryRole, setSession } from '../utils/session';
import '../styles/login.css';

const TIPOS_CUENTA = [
  { value: 'JUGADOR', label: 'Jugador' },
  { value: 'ARBITRO', label: 'Árbitro' },
  { value: 'DELEGADO', label: 'Delegado' },
];

const ROLES_JUGADOR = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'GRADUADO', label: 'Graduado' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hint = location.state?.hint;

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    contrasenaConfirm: '',
    cedula: '',
    tipoCuenta: 'JUGADOR',
    rolJugador: 'ESTUDIANTE',
    codigoUniversitario: '',
    semestre: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await appwriteLogout();
      const origin = window.location.origin;
      const tipo = encodeURIComponent(form.tipoCuenta || 'JUGADOR');
      appwriteOAuthGoogle({
        successUrl: `${origin}/oauth/callback?tipo=${tipo}`,
        failureUrl: `${origin}/login?oauthError=${encodeURIComponent('No se pudo autenticar con Google.')}`,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar el registro con Google.');
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
    if (!/^\d{6,15}$/.test(form.cedula.trim())) {
      setError('La cédula debe contener entre 6 y 15 dígitos.');
      return;
    }
    if (form.tipoCuenta === 'JUGADOR' && form.rolJugador === 'ESTUDIANTE') {
      if (!form.codigoUniversitario.trim()) {
        setError('El código estudiantil es obligatorio.');
        return;
      }
      if (!/^[1-9]\d*$/.test(String(form.semestre).trim())) {
        setError('El semestre debe ser un número válido.');
        return;
      }
    }

    setLoading(true);
    try {
      // Limpia cualquier sesión Appwrite previa.
      await appwriteLogout();

      // 1. Crea el usuario en Appwrite. Sin labels: queda sin rol hasta que el admin apruebe.
      await appwriteSignup({
        email: form.correo,
        password: form.contrasena,
        name: form.nombre,
      });

      // 2. Inicia sesión inmediatamente para poder generar un JWT.
      await appwriteLogin({ email: form.correo, password: form.contrasena });

      // 3. JWT corto que el backend va a verificar.
      const appwriteJwt = await appwriteCreateJwt();

      if (form.tipoCuenta === 'JUGADOR') {
        const data = await registrarJugador({
          appwriteJwt,
          cedula: form.cedula.trim(),
          rolJugador: form.rolJugador,
          codigoUniversitario: form.rolJugador === 'ESTUDIANTE' ? form.codigoUniversitario.trim() : null,
          semestre: form.rolJugador === 'ESTUDIANTE' ? Number(form.semestre) : null,
        });
        const rolPrimario = pickPrimaryRole(data.roles);
        setSession({
          token: data.token,
          rol: rolPrimario,
          nombre: data.nombre,
          email: data.correo,
        });
        navigate('/dashboard/jugador', { replace: true });
        return;
      }

      // 4. Crea el Perfil PENDIENTE en el backend (árbitro / delegado).
      await registrar({
        appwriteJwt,
        cedula: form.cedula.trim(),
        rolSolicitado: form.tipoCuenta,
      });

      navigate('/pending', { replace: true });
    } catch (requestError) {
      const mensaje = requestError?.message || 'No fue posible registrarse.';
      setError(mensaje);
      // Si el registro falla después de haber creado la sesión Appwrite, la cerramos
      // para que el usuario pueda volver a intentar sin estado a medias.
      await appwriteLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card signup-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        <div className="login-title">Crear cuenta</div>
        <div className="login-sub">
          {form.tipoCuenta === 'JUGADOR'
            ? 'Tu cuenta de jugador quedará activa de inmediato.'
            : 'Tu solicitud quedará pendiente de aprobación por un administrador.'}
        </div>
        {hint && <div className="login-hint">{hint}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              className="form-input"
              type="text"
              placeholder="Ej: María Pérez"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                name="cedula"
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="1090000001"
                value={form.cedula}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tipoCuenta">Tipo de cuenta</label>
              <select
                id="tipoCuenta"
                name="tipoCuenta"
                className="form-input"
                value={form.tipoCuenta}
                onChange={handleChange}
              >
                {TIPOS_CUENTA.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.tipoCuenta === 'JUGADOR' && (
            <div className="form-group">
              <label className="form-label" htmlFor="rolJugador">Rol del jugador</label>
              <select
                id="rolJugador"
                name="rolJugador"
                className="form-input"
                value={form.rolJugador}
                onChange={handleChange}
              >
                {ROLES_JUGADOR.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {form.tipoCuenta === 'JUGADOR' && form.rolJugador === 'ESTUDIANTE' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="codigoUniversitario">Código estudiantil</label>
                <input
                  id="codigoUniversitario"
                  name="codigoUniversitario"
                  className="form-input"
                  type="text"
                  placeholder="1155404..."
                  value={form.codigoUniversitario}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="semestre">Semestre actual</label>
                <input
                  id="semestre"
                  name="semestre"
                  className="form-input"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="7"
                  value={form.semestre}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="contrasena">Contraseña (mínimo 8 caracteres)</label>
            <input
              id="contrasena"
              name="contrasena"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.contrasena}
              onChange={handleChange}
              minLength={8}
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
              minLength={8}
              required
            />
          </div>

          <button className="btn-login-submit" type="submit" disabled={loading}>
            {loading ? 'Enviando solicitud...' : 'Crear cuenta'}
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
