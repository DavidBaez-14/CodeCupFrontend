import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), solicitarRol: vi.fn() }));
vi.mock('../api/supercopa', () => ({ listTorneosAdmin: vi.fn(), listPartidosTorneo: vi.fn() }));

import ArbitroDashboard from './ArbitroDashboard';
import { cerrarSesion } from '../lib/supabase';
import { me } from '../api/auth';
import { listPartidosTorneo, listTorneosAdmin } from '../api/supercopa';
import { renderEnRuta } from '../test/rutas';

// Spec 0019, criterio 20: el logout de los dashboards cierra la sesión de Supabase.
describe('Logout de un dashboard (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('codecup_token', 'tok');
    localStorage.setItem('codecup_rol', 'ARBITRO');
    me.mockResolvedValue({ roles: ['ARBITRO'], rolesPendientes: [] });
    listTorneosAdmin.mockResolvedValue([]);
    listPartidosTorneo.mockResolvedValue([]);
  });

  it('cerrarSesion_llamaASupabase_yVaAlInicio', async () => {
    renderEnRuta('/dashboard/arbitro', '/dashboard/arbitro', <ArbitroDashboard />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(cerrarSesion).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/$/));
  });
});
