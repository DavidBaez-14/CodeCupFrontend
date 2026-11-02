import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { intercambiarCodigo, verificarEnlace } from '../lib/supabase';
import { despuesDeEntrar } from '../utils/destino';
import { MENSAJE_ENLACE_VENCIDO, mensajeDeErrorAuth } from '../utils/erroresAuth';
import { getLoginRole } from '../utils/session';
import '../styles/login.css';

/**
 * /auth/callback (spec 0019): un solo destino para
 * - los enlaces de los correos (?token_hash=…&type=email|recovery), que se resuelven con verifyOtp;
 * - la vuelta de Google (?code=…), que se intercambia por la sesión (PKCE).
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const yaCorrio = useRef(false);

  useEffect(() => {
    // El token de un correo es de un solo uso: en StrictMode el efecto corre dos veces.
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    const errorEnUrl = searchParams.get('error_description') || searchParams.get('error');
    const tokenHash = searchParams.get('token_hash');
    const tipo = searchParams.get('type');
    const codigo = searchParams.get('code');

    async function procesar() {
      if (errorEnUrl) {
        setError(errorEnUrl);
        return;
      }

      try {
        if (tokenHash && tipo) await verificarEnlace(tokenHash, tipo);
        else if (codigo) await intercambiarCodigo(codigo);
        else {
          setError(MENSAJE_ENLACE_VENCIDO);
          return;
        }
      } catch (err) {
        setError(mensajeDeErrorAuth(err, MENSAJE_ENLACE_VENCIDO));
        return;
      }

      if (tipo === 'recovery') {
        navigate('/restablecer-contrasena', { replace: true });
        return;
      }

      try {
        const { error: mensaje } = await despuesDeEntrar({ navigate, rolElegido: getLoginRole() });
        if (mensaje) setError(mensaje);
      } catch (err) {
        setError(err?.message || 'No fue posible completar el ingreso.');
      }
    }

    procesar();
  }, [navigate, searchParams]);

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card pending-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        {error ? (
          <>
            <div className="pending-icon" aria-hidden="true">⚠️</div>
            <div className="login-title">No se pudo completar el ingreso</div>
            <p className="pending-text">{error}</p>
            <button className="btn-login-submit" type="button" onClick={() => navigate('/login', { replace: true })}>
              Volver al login
            </button>
          </>
        ) : (
          <>
            <div className="pending-icon" aria-hidden="true">⏳</div>
            <div className="login-title">Validando tu ingreso…</div>
            <p className="pending-text">Un momento, estamos revisando tu enlace y tu cuenta.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallbackPage;
