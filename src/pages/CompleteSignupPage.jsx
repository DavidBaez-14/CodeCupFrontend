import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { registrar } from '../api/auth';
import { appwriteCreateJwt, appwriteCurrentUser, appwriteLogout } from '../lib/appwrite';
import '../styles/login.css';

const ROLES_SOLICITABLES = [
  { value: 'ARBITRO', label: 'Árbitro' },
  { value: 'DELEGADO', label: 'Delegado' },
];

function CompleteSignupPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cedula, setCedula] = useState('');
  const [rolSolicitado, setRolSolicitado] = useState('ARBITRO');
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
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6,15}$/.test(cedula.trim())) {
      setError('La cédula debe contener entre 6 y 15 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const appwriteJwt = await appwriteCreateJwt();
      await registrar({
        appwriteJwt,
        cedula: cedula.trim(),
        rolSolicitado,
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
          {user ? `${user.name || user.email}, ` : ''}solo necesitamos tu cédula y el rol que solicitas. Tu cuenta queda pendiente de aprobación.
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
              <label className="form-label" htmlFor="rolSolicitado">Rol solicitado</label>
              <select
                id="rolSolicitado"
                className="form-input"
                value={rolSolicitado}
                onChange={(e) => setRolSolicitado(e.target.value)}
              >
                {ROLES_SOLICITABLES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

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
