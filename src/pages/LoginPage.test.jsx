import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({
  entrarConContrasena: vi.fn(),
  entrarConGoogle: vi.fn(),
  cerrarSesion: vi.fn(),
}));
vi.mock('../api/auth', () => ({ me: vi.fn() }));

import LoginPage from './LoginPage';
import { cerrarSesion, entrarConContrasena, entrarConGoogle } from '../lib/supabase';
import { me } from '../api/auth';
import { errorApi, errorAuth, renderEnRuta } from '../test/rutas';

const BLOQUEADA = 'Tu cuenta está bloqueada. Si crees que es un error, escribe a un administrador.';

function datosMe(roles, rolesPendientes = []) {
  return {
    roles, rolesPendientes, nombre: 'Ana Pérez', correo: 'ana@correo.co',
    cuentaId: 'c-1', personaId: 'p-1', tipoDocumento: 'CC', numeroDocumento: '1090123',
  };
}

async function entrar({ rol } = {}) {
  const user = userEvent.setup();
  if (rol) await user.click(screen.getByRole('button', { name: rol }));
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.co');
  await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

const ubicacion = () => screen.getByTestId('ubicacion');

describe('LoginPage — Supabase (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    entrarConContrasena.mockResolvedValue({ session: { access_token: 'tok' } });
  });

  it('conRol_entraASuDashboard', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR', 'DELEGADO']));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar({ rol: 'Delegado' });

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard/delegado'));
    expect(entrarConContrasena).toHaveBeenCalledWith('ana@correo.co', 'secreta123');
    expect(localStorage.getItem('codecup_rol')).toBe('DELEGADO');
    expect(JSON.parse(localStorage.getItem('codecup_roles'))).toEqual(['JUGADOR', 'DELEGADO']);
    // Spec 0027: la sesión guarda la persona y la cuenta, no el documento.
    expect(localStorage.getItem('codecup_persona_id')).toBe('p-1');
    expect(localStorage.getItem('codecup_cuenta_id')).toBe('c-1');
    expect(localStorage.getItem('codecup_cedula')).toBeNull();
  });

  it('adminSinRol_noEntra', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR']));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar({ rol: 'Administrador' });

    expect(await screen.findByText('Tu cuenta no tiene el rol de Administrador.')).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalled();
    expect(ubicacion()).toHaveTextContent('/login');
  });

  it('delegadoPendiente_vaAPending', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR'], ['DELEGADO']));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar({ rol: 'Delegado' });

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/pending'));
  });

  it('delegadoSinSolicitud_vaASolicitar', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR']));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar({ rol: 'Delegado' });

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/complete-signup?tipo=DELEGADO'));
  });

  it('sinCuenta_vaACompletar', async () => {
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar();

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/complete-signup'));
  });

  it('bloqueada_avisa', async () => {
    me.mockRejectedValue(errorApi(403, 'CUENTA_BLOQUEADA'));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar();

    expect(await screen.findByText(BLOQUEADA)).toBeInTheDocument();
    expect(cerrarSesion).toHaveBeenCalled();
  });

  it('conInvitacionPendiente_vaALaInvitacion', async () => {
    localStorage.setItem('codecup_invitacion', 'tok9');
    me.mockResolvedValue(datosMe(['JUGADOR']));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar();

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/invitacion/tok9'));
  });

  it('erroresEnEspanol', async () => {
    entrarConContrasena.mockRejectedValueOnce(errorAuth('invalid_credentials', 'Invalid login credentials'));
    renderEnRuta('/login', '/login', <LoginPage />);

    await entrar();
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument();

    entrarConContrasena.mockRejectedValueOnce(errorAuth('email_not_confirmed', 'Email not confirmed'));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Confirma tu correo antes de entrar.')).toBeInTheDocument();
    expect(me).not.toHaveBeenCalled();
  });

  it('avisosDeLaUrl', async () => {
    const { unmount } = renderEnRuta('/login?aviso=bloqueada', '/login', <LoginPage />);
    expect(screen.getByText(BLOQUEADA)).toBeInTheDocument();
    unmount();

    renderEnRuta('/login?aviso=contrasena-actualizada', '/login', <LoginPage />);
    expect(screen.getByText('Ya puedes entrar con tu contraseña nueva.')).toBeInTheDocument();
  });

  it('olvideMiContrasena_lleva', async () => {
    renderEnRuta('/login', '/login', <LoginPage />);

    await userEvent.setup().click(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }));

    expect(ubicacion()).toHaveTextContent('/recuperar-contrasena');
  });

  it('google_guardaElRolElegido', async () => {
    renderEnRuta('/login', '/login', <LoginPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Arbitro' }));
    await user.click(screen.getByRole('button', { name: /Continuar con Google/ }));

    expect(entrarConGoogle).toHaveBeenCalled();
    expect(sessionStorage.getItem('codecup_login_role')).toBe('ARBITRO');
  });
});
