import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { aceptarInvitacion, me } from '../api/auth';
import { obtenerSesion } from '../lib/supabase';
import { NOMBRE_ROL, RUTA_POR_ROL } from '../utils/destino';
import {
  clearInvitacionPendiente,
  guardarSesionDesdeMe,
  normalizeRole,
  pickPrimaryRole,
  setInvitacionPendiente,
} from '../utils/session';
import '../styles/login.css';

function rolesNuevos(antes, despues) {
  const previos = new Set((antes?.roles || []).map(normalizeRole));
  return (despues?.roles || []).map(normalizeRole).filter((rol) => !previos.has(rol));
}

/**
 * /invitacion/:token (spec 0019). El backend aplica la invitación:
 * - con sesión y cuenta: POST /api/auth/invitaciones/{token}/aceptar;
 * - sin sesión: se guarda el token y se acepta después del login;
 * - sin cuenta: el registro la aplica solo (por correo) y se vuelve aquí con ?tras=registro.
 */
function InvitacionPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const trasRegistro = searchParams.get('tras') === 'registro';
  const navigate = useNavigate();
  const [estado, setEstado] = useState({ tipo: 'cargando' });
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    async function procesar() {
      const sesion = await obtenerSesion();
      if (!sesion) {
        setInvitacionPendiente(token);
        setEstado({ tipo: 'sin-sesion' });
        return;
      }

      let antes;
      try {
        antes = await me();
      } catch (err) {
        if (err?.status === 404) {
          setInvitacionPendiente(token);
          navigate('/complete-signup', { replace: true });
          return;
        }
        setEstado({ tipo: 'error', mensaje: err?.message || 'No fue posible revisar tu cuenta.' });
        return;
      }

      try {
        const despues = await aceptarInvitacion(token);
        clearInvitacionPendiente();
        const [nuevo] = rolesNuevos(antes, despues);
        setEstado({
          tipo: 'exito',
          datos: despues,
          rol: nuevo || pickPrimaryRole(despues.roles),
          titulo: nuevo ? `Ya tienes el rol de ${NOMBRE_ROL[nuevo] || nuevo}.` : 'Tu invitación quedó aplicada.',
        });
      } catch (err) {
        clearInvitacionPendiente();
        const code = err?.body?.code;
        if (code === 'INVITACION_OTRO_CORREO') {
          setEstado({ tipo: 'error', mensaje: 'Esta invitación es para otro correo.' });
          return;
        }
        if (code === 'INVITACION_NO_VIGENTE' && trasRegistro) {
          setEstado({ tipo: 'exito', datos: antes, rol: pickPrimaryRole(antes.roles), titulo: 'Tu invitación quedó aplicada.' });
          return;
        }
        setEstado({ tipo: 'error', mensaje: 'La invitación ya no es válida.' });
      }
    }

    procesar();
  }, [navigate, token, trasRegistro]);

  const entrar = () => {
    guardarSesionDesdeMe(estado.datos, estado.rol);
    navigate(RUTA_POR_ROL[estado.rol] || RUTA_POR_ROL.JUGADOR, { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card pending-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        {estado.tipo === 'cargando' && (
          <>
            <div className="pending-icon" aria-hidden="true">⏳</div>
            <div className="login-title">Revisando tu invitación…</div>
          </>
        )}

        {estado.tipo === 'sin-sesion' && (
          <>
            <div className="pending-icon" aria-hidden="true">✉️</div>
            <div className="login-title">Te invitaron a CodeCup</div>
            <p className="pending-text">
              Entra o crea tu cuenta con el correo al que te llegó la invitación. El rol se aplica solo.
            </p>
            <div className="login-actions">
              <Link to="/login" className="btn-login-submit">Iniciar sesión</Link>
              <Link to="/signup" className="btn-signup-link">Crear cuenta</Link>
            </div>
          </>
        )}

        {estado.tipo === 'exito' && (
          <>
            <div className="pending-icon" aria-hidden="true">✅</div>
            <div className="login-title">{estado.titulo}</div>
            <button className="btn-login-submit" type="button" onClick={entrar}>
              Entrar como {NOMBRE_ROL[estado.rol] || 'Jugador'}
            </button>
          </>
        )}

        {estado.tipo === 'error' && (
          <>
            <div className="pending-icon" aria-hidden="true">⚠️</div>
            <div className="login-title">No se pudo aplicar la invitación</div>
            <p className="pending-text">{estado.mensaje}</p>
            <Link to="/login" className="btn-signup-link">Ir al login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default InvitacionPage;
