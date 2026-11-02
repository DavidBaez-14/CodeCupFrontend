import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import { me, registro, solicitarRol } from '../api/auth';
import { cerrarSesion, obtenerSesion } from '../lib/supabase';
import { despuesDeEntrar, NOMBRE_ROL, RUTA_POR_ROL } from '../utils/destino';
import {
  getInvitacionPendiente,
  getLoginRole,
  guardarSesionDesdeMe,
  normalizeRole,
} from '../utils/session';
import '../styles/login.css';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

const TIPOS_CUENTA = [
  { value: 'JUGADOR', label: 'Jugador' },
  { value: 'DELEGADO', label: 'Delegado (necesita aprobación)' },
  { value: 'ARBITRO', label: 'Árbitro (necesita aprobación)' },
];

const ROL_SOLICITABLE = new Set(['DELEGADO', 'ARBITRO']);

/** Nombres y apellidos que trae Google (o el nombre completo partido en dos). */
function nombresDeProveedor(user) {
  const datos = user?.user_metadata || {};
  if (datos.given_name || datos.family_name) {
    return { nombres: datos.given_name || '', apellidos: datos.family_name || '' };
  }
  const partes = String(datos.full_name || datos.name || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombres: '', apellidos: '' };
  const corte = partes.length >= 4 ? 2 : 1;
  return { nombres: partes.slice(0, corte).join(' '), apellidos: partes.slice(corte).join(' ') };
}

async function solicitarSinDuplicar(rol, motivo) {
  try {
    await solicitarRol({ rol, motivoSolicitud: motivo });
  } catch (err) {
    if (err?.body?.code !== 'SOLICITUD_EXISTENTE') throw err;
  }
}

/**
 * /complete-signup (spec 0019):
 * - sin cuenta en CodeCup: pide nombres, apellidos y documento (POST /api/auth/registro) y el tipo de cuenta;
 * - ya registrado y con ?tipo=DELEGADO|ARBITRO: solo pide el motivo y solicita ese rol.
 */
function CompleteSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoUrl = normalizeRole(searchParams.get('tipo'));
  const tipoInicial = [tipoUrl, normalizeRole(getLoginRole())].find((t) => ROL_SOLICITABLE.has(t)) || 'JUGADOR';

  const [modo, setModo] = useState('cargando');
  const [correo, setCorreo] = useState('');
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    tipoCuenta: tipoInicial,
    motivo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const sesion = await obtenerSesion();
      if (cancelado) return;
      if (!sesion) {
        navigate('/login', { replace: true });
        return;
      }
      setCorreo(sesion.user?.email || '');

      let datos;
      try {
        datos = await me();
      } catch (err) {
        if (cancelado) return;
        if (err?.status === 404) {
          setForm((prev) => ({ ...prev, ...nombresDeProveedor(sesion.user) }));
          setModo('registro');
          return;
        }
        setError(err?.message || 'No fue posible revisar tu cuenta.');
        return;
      }
      if (cancelado) return;

      if (!ROL_SOLICITABLE.has(tipoUrl)) {
        // Ya está registrado y no viene a pedir un rol: entra normalmente.
        const { error: mensaje } = await despuesDeEntrar({ navigate, rolElegido: getLoginRole() });
        if (mensaje && !cancelado) setError(mensaje);
        return;
      }
      if ((datos.roles || []).map(normalizeRole).includes(tipoUrl)) {
        guardarSesionDesdeMe(datos, tipoUrl);
        navigate(RUTA_POR_ROL[tipoUrl], { replace: true });
        return;
      }
      if ((datos.rolesPendientes || []).map(normalizeRole).includes(tipoUrl)) {
        navigate('/pending', { replace: true });
        return;
      }
      setModo('solicitar');
    }

    cargar();
    return () => { cancelado = true; };
  }, [navigate, tipoUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistro = async (event) => {
    event.preventDefault();
    setError('');
    const nombres = form.nombres.trim();
    const numeroDocumento = form.numeroDocumento.trim();
    if (!nombres) {
      setError('Escribe tus nombres.');
      return;
    }
    if (!/^[A-Za-z0-9. ]{1,20}$/.test(numeroDocumento)) {
      setError('Escribe tu número de documento: solo letras, números, puntos y espacios (máximo 20).');
      return;
    }

    setLoading(true);
    try {
      const datos = await registro({
        nombres,
        apellidos: form.apellidos.trim(),
        tipoDocumento: form.tipoDocumento,
        numeroDocumento,
      });

      if (ROL_SOLICITABLE.has(form.tipoCuenta)) {
        // Todos quedan como jugador; Delegado o Árbitro esperan la aprobación de un admin.
        await solicitarSinDuplicar(form.tipoCuenta, form.motivo.trim());
        guardarSesionDesdeMe(datos, 'JUGADOR');
        navigate('/pending', { replace: true });
        return;
      }

      const invitacion = getInvitacionPendiente();
      if (invitacion) {
        // El registro ya aplicó las invitaciones de este correo; la página lo confirma.
        navigate(`/invitacion/${encodeURIComponent(invitacion)}?tras=registro`, { replace: true });
        return;
      }

      const { error: mensaje } = await despuesDeEntrar({ navigate, rolElegido: getLoginRole() });
      if (mensaje) setError(mensaje);
    } catch (err) {
      const code = err?.body?.code;
      if (code === 'DOCUMENTO_REGISTRADO') setError('Ese documento ya está registrado.');
      else setError(err?.message || 'No fue posible completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitar = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await solicitarSinDuplicar(tipoUrl, form.motivo.trim());
      navigate('/pending', { replace: true });
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  const campoMotivo = (
    <div className="form-group">
      <label className="form-label" htmlFor="motivo">Motivo</label>
      <textarea
        id="motivo"
        name="motivo"
        className="form-input"
        rows={3}
        maxLength={500}
        placeholder="Opcional: cuéntale al administrador por qué."
        value={form.motivo}
        onChange={handleChange}
      />
    </div>
  );

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card signup-card">
        <div className="login-logo">
          <img src={brandLogo} alt="Code Cup" />
          <span className="login-logo-text"><em>Code</em> Cup</span>
        </div>

        {modo === 'cargando' && !error && (
          <div className="login-title">Revisando tu cuenta…</div>
        )}

        {modo === 'registro' && (
          <>
            <div className="login-title">Casi listo</div>
            <div className="login-sub">
              {correo ? `${correo}: ` : ''}completa tus datos. Tu cuenta de jugador queda activa al instante.
            </div>

            <form onSubmit={handleRegistro} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="nombres">Nombres</label>
                  <input id="nombres" name="nombres" className="form-input" type="text" value={form.nombres} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="apellidos">Apellidos</label>
                  <input id="apellidos" name="apellidos" className="form-input" type="text" value={form.apellidos} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="tipoDocumento">Tipo de documento</label>
                  <select id="tipoDocumento" name="tipoDocumento" className="form-input" value={form.tipoDocumento} onChange={handleChange}>
                    {TIPOS_DOCUMENTO.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="numeroDocumento">Número de documento</label>
                  <input
                    id="numeroDocumento"
                    name="numeroDocumento"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    value={form.numeroDocumento}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tipoCuenta">Tipo de cuenta</label>
                <select id="tipoCuenta" name="tipoCuenta" className="form-input" value={form.tipoCuenta} onChange={handleChange}>
                  {TIPOS_CUENTA.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {ROL_SOLICITABLE.has(form.tipoCuenta) && campoMotivo}

              <button className="btn-login-submit" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Completar registro'}
              </button>
            </form>
          </>
        )}

        {modo === 'solicitar' && (
          <>
            <div className="login-title">Solicitar rol de {NOMBRE_ROL[tipoUrl]}</div>
            <div className="login-sub">Un administrador revisará tu solicitud. Mientras tanto sigues como jugador.</div>
            <form onSubmit={handleSolicitar}>
              {campoMotivo}
              <button className="btn-login-submit" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <div className="login-back">
          <button type="button" onClick={handleCancel}>Cancelar y cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

export default CompleteSignupPage;
