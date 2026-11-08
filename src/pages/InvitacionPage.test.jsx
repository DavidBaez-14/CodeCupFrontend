import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ obtenerSesion: vi.fn(), cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), aceptarInvitacion: vi.fn() }));

import InvitacionPage from './InvitacionPage';
import { obtenerSesion } from '../lib/supabase';
import { aceptarInvitacion, me } from '../api/auth';
import { errorApi, renderEnRuta } from '../test/rutas';

const ubicacion = () => screen.getByTestId('ubicacion');
const datosMe = (roles) => ({ roles, rolesPendientes: [], nombre: 'Ana Pérez', correo: 'ana@correo.co', personaId: 'p-1', numeroDocumento: '1' });

// Spec 0019, criterio 19: /invitacion/:token acepta la invitación con o sin sesión previa.
describe('InvitacionPage (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    obtenerSesion.mockResolvedValue({ user: { email: 'ana@correo.co' } });
    me.mockResolvedValue(datosMe(['JUGADOR']));
  });

  it('conSesion_acepta_yEntraConElRolNuevo', async () => {
    aceptarInvitacion.mockResolvedValue(datosMe(['JUGADOR', 'ARBITRO']));
    renderEnRuta('/invitacion/tok1', '/invitacion/:token', <InvitacionPage />);

    expect(await screen.findByText('Ya tienes el rol de Árbitro.')).toBeInTheDocument();
    expect(aceptarInvitacion).toHaveBeenCalledWith('tok1');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Entrar como Árbitro' }));

    expect(ubicacion()).toHaveTextContent('/dashboard/arbitro');
    expect(localStorage.getItem('codecup_rol')).toBe('ARBITRO');
  });

  it('sinSesion_guardaElToken_yOfreceEntrarORegistrarse', async () => {
    obtenerSesion.mockResolvedValue(null);

    renderEnRuta('/invitacion/tok1', '/invitacion/:token', <InvitacionPage />);

    expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(localStorage.getItem('codecup_invitacion')).toBe('tok1');
    expect(aceptarInvitacion).not.toHaveBeenCalled();
  });

  it('sinCuenta_vaACompletarRegistro', async () => {
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));

    renderEnRuta('/invitacion/tok1', '/invitacion/:token', <InvitacionPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/complete-signup'));
    expect(localStorage.getItem('codecup_invitacion')).toBe('tok1');
  });

  it('otroCorreo_403', async () => {
    aceptarInvitacion.mockRejectedValue(errorApi(403, 'INVITACION_OTRO_CORREO'));

    renderEnRuta('/invitacion/tok1', '/invitacion/:token', <InvitacionPage />);

    expect(await screen.findByText('Esta invitación es para otro correo.')).toBeInTheDocument();
  });

  it('yaAplicadaAlRegistrarse_cuentaComoExito', async () => {
    localStorage.setItem('codecup_invitacion', 'tok1');
    aceptarInvitacion.mockRejectedValue(errorApi(409, 'INVITACION_NO_VIGENTE'));
    me.mockResolvedValue(datosMe(['JUGADOR', 'DELEGADO']));

    renderEnRuta('/invitacion/tok1?tras=registro', '/invitacion/:token', <InvitacionPage />);

    expect(await screen.findByText('Tu invitación quedó aplicada.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar como Delegado' })).toBeInTheDocument();
    expect(localStorage.getItem('codecup_invitacion')).toBeNull();
  });

  it('noVigente_sinRegistroPrevio', async () => {
    aceptarInvitacion.mockRejectedValue(errorApi(409, 'INVITACION_NO_VIGENTE'));

    renderEnRuta('/invitacion/tok1', '/invitacion/:token', <InvitacionPage />);

    expect(await screen.findByText('La invitación ya no es válida.')).toBeInTheDocument();
  });
});
