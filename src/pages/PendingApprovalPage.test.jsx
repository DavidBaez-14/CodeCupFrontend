import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn() }));

import PendingApprovalPage from './PendingApprovalPage';
import { cerrarSesion } from '../lib/supabase';
import { me } from '../api/auth';
import { renderEnRuta } from '../test/rutas';

// Spec 0019, criterio 17: la espera no bloquea; se puede entrar como jugador.
describe('PendingApprovalPage (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    me.mockResolvedValue({
      roles: ['JUGADOR'], rolesPendientes: ['DELEGADO'], nombre: 'Ana Pérez', correo: 'ana@correo.co', cedula: '1',
    });
  });

  it('muestraElRolPendiente_sinPadron', async () => {
    renderEnRuta('/pending', '/pending', <PendingApprovalPage />);

    expect(await screen.findByText(/Delegado/)).toBeInTheDocument();
    expect(screen.queryByText(/padrón/i)).not.toBeInTheDocument();
  });

  it('entrarComoJugador', async () => {
    renderEnRuta('/pending', '/pending', <PendingApprovalPage />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Entrar como jugador' }));

    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/dashboard/jugador');
    expect(localStorage.getItem('codecup_rol')).toBe('JUGADOR');
  });

  it('cerrarSesion_vaAlInicio', async () => {
    renderEnRuta('/pending', '/pending', <PendingApprovalPage />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/$/));
    expect(cerrarSesion).toHaveBeenCalled();
  });
});
