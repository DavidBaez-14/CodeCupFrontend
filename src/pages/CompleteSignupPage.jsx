import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { registrar, registrarJugador } from '../api/auth';
import { appwriteCreateJwt, appwriteCurrentUser, appwriteLogout } from '../lib/appwrite';
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

function CompleteSignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cedula, setCedula] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('JUGADOR');
  const [rolJugador, setRolJugador] = useState('ESTUDIANTE');
  const [codigoUniversitario, setCodigoUniversitario] = useState('');
  const [semestre, setSemestre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    appwriteCurrentUser().then((u) => {
      if (cancelled) return;
      if (!u) {
        navigate('/login', { replace: true });
      } else {
        setUser(u);
      }
    });
    const params = new URLSearchParams(location.search);
    const tipo = params.get('tipo');
    if (tipo && TIPOS_CUENTA.some((item) => item.value === tipo.toUpperCase())) {
      setTipoCuenta(tipo.toUpperCase());
    }
    return () => { cancelled = true; };
  }, [location.search, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6,15}$/.test(cedula.trim())) {
      setError('La cédula debe contener entre 6 y 15 dígitos.');
      return;
    }
    if (tipoCuenta === 'JUGADOR' && rolJugador === 'ESTUDIANTE') {
      if (!codigoUniversitario.trim()) {
        setError('El código estudiantil es obligatorio.');
        return;
      }
      if (!/^[1-9]\d*$/.test(String(semestre).trim())) {
        setError('El semestre debe ser un número válido.');
        return;
      }
    }
    setLoading(true);
    try {
      const appwriteJwt = await appwriteCreateJwt();
      if (tipoCuenta === 'JUGADOR') {
        const data = await registrarJugador({
          appwriteJwt,
          cedula: cedula.trim(),
          rolJugador,
          codigoUniversitario: rolJugador === 'ESTUDIANTE' ? codigoUniversitario.trim() : null,
          semestre: rolJugador === 'ESTUDIANTE' ? Number(semestre) : null,
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

      await registrar({
        appwriteJwt,
        cedula: cedula.trim(),
        rolSolicitado: tipoCuenta,
      });
      navigate('/pending', { replace: true });
    } catch (err) {
      setError(err?.message || 'No fue posible completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await appwriteLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card signup-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        <div className="login-title">Casi listo</div>
        <div className="login-sub">
          {user ? `${user.name || user.email}, ` : ''}solo necesitamos tu cédula y el tipo de cuenta.
          {tipoCuenta === 'JUGADOR'
            ? ' Tu cuenta de jugador queda activa al instante.'
            : ' Tu cuenta queda pendiente de aprobación.'}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="1090000001"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tipoCuenta">Tipo de cuenta</label>
              <select
                id="tipoCuenta"
                className="form-input"
                value={tipoCuenta}
                onChange={(e) => setTipoCuenta(e.target.value)}
              >
                {TIPOS_CUENTA.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {tipoCuenta === 'JUGADOR' && (
            <div className="form-group">
              <label className="form-label" htmlFor="rolJugador">Rol del jugador</label>
              <select
                id="rolJugador"
                className="form-input"
                value={rolJugador}
                onChange={(e) => setRolJugador(e.target.value)}
              >
                {ROLES_JUGADOR.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {tipoCuenta === 'JUGADOR' && rolJugador === 'ESTUDIANTE' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="codigoUniversitario">Código estudiantil</label>
                <input
                  id="codigoUniversitario"
                  className="form-input"
                  type="text"
                  placeholder="1155404..."
                  value={codigoUniversitario}
                  onChange={(e) => setCodigoUniversitario(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="semestre">Semestre actual</label>
                <input
                  id="semestre"
                  className="form-input"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="7"
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button className="btn-login-submit" type="submit" disabled={loading}>
            {loading ? 'Enviando solicitud…' : 'Enviar solicitud'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <div className="login-back">
          <button type="button" onClick={handleCancel}>← Cancelar y cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

export default CompleteSignupPage;
