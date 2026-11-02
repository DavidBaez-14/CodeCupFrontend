import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({
  verificarEnlace: vi.fn(),
  intercambiarCodigo: vi.fn(),
  cerrarSesion: vi.fn(),
}));
vi.mock('../api/auth', () => ({ me: vi.fn() }));

import AuthCallbackPage from './AuthCallbackPage';
import { intercambiarCodigo, verificarEnlace } from '../lib/supabase';
import { me } from '../api/auth';
import { errorApi, errorAuth, renderEnRuta } from '../test/rutas';

const ubicacion = () => screen.getByTestId('ubicacion');
const sesion = { access_token: 'tok' };

// Spec 0019, criterios 7, 13 y 15: un solo callback para correos (token_hash) y Google (code).
describe('AuthCallbackPage (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    verificarEnlace.mockResolvedValue(sesion);
    intercambiarCodigo.mockResolvedValue(sesion);
  });

  it('tokenHashEmail_sinCuenta_vaACompletarRegistro', async () => {
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));

    renderEnRuta('/auth/callback?token_hash=abc&type=email', '/auth/callback', <AuthCallbackPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/complete-signup'));
    expect(verificarEnlace).toHaveBeenCalledWith('abc', 'email');
  });

  it('tokenHashEmail_conCuenta_entra', async () => {
    me.mockResolvedValue({ roles: ['JUGADOR'], rolesPendientes: [], nombre: 'Ana' });

    renderEnRuta('/auth/callback?token_hash=abc&type=email', '/auth/callback', <AuthCallbackPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard/jugador'));
  });

  it('recovery_vaARestablecer', async () => {
    renderEnRuta('/auth/callback?token_hash=r1&type=recovery', '/auth/callback', <AuthCallbackPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/restablecer-contrasena'));
    expect(verificarEnlace).toHaveBeenCalledWith('r1', 'recovery');
    expect(me).not.toHaveBeenCalled();
  });

  it('codeDeGoogle_intercambia_conElRolElegido', async () => {
    sessionStorage.setItem('codecup_login_role', 'DELEGADO');
    me.mockResolvedValue({ roles: ['JUGADOR', 'DELEGADO'], rolesPendientes: [] });

    renderEnRuta('/auth/callback?code=xyz', '/auth/callback', <AuthCallbackPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard/delegado'));
    expect(intercambiarCodigo).toHaveBeenCalledWith('xyz');
  });

  it('enlaceVencido_muestraAviso', async () => {
    verificarEnlace.mockRejectedValue(errorAuth('otp_expired', 'Email link is invalid or has expired'));

    renderEnRuta('/auth/callback?token_hash=viejo&type=email', '/auth/callback', <AuthCallbackPage />);

    expect(await screen.findByText('El enlace venció o ya se usó.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al login' })).toBeInTheDocument();
  });

  it('errorEnLaUrl_loMuestra', async () => {
    renderEnRuta(
      '/auth/callback?error=access_denied&error_description=El%20usuario%20cancel%C3%B3',
      '/auth/callback',
      <AuthCallbackPage />,
    );

    expect(await screen.findByText('El usuario canceló')).toBeInTheDocument();
    expect(verificarEnlace).not.toHaveBeenCalled();
    expect(intercambiarCodigo).not.toHaveBeenCalled();
  });

  it('enStrictMode_verificaUnaSolaVez', async () => {
    me.mockResolvedValue({ roles: ['JUGADOR'], rolesPendientes: [] });

    renderEnRuta(
      '/auth/callback?token_hash=abc&type=email',
      '/auth/callback',
      <StrictMode><AuthCallbackPage /></StrictMode>,
    );

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard/jugador'));
    expect(verificarEnlace).toHaveBeenCalledTimes(1);
  });
});
