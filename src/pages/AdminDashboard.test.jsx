import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({ cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), solicitarRol: vi.fn() }));
vi.mock('../api/registros', () => ({
  aprobarRol: vi.fn(),
  aprobarTodosCuenta: vi.fn(),
  listPendientes: vi.fn(),
  rechazarRol: vi.fn(),
  rechazarTodosCuenta: vi.fn(),
}));

import AdminDashboard from './AdminDashboard';
import { me } from '../api/auth';
import { listPendientes } from '../api/registros';
import rolesPendientes from '../test/contrato/roles-pendientes.json';
import { renderEnRuta } from '../test/rutas';

// Spec 0027: criterio 13 (solicitudes de rol con documento) y criterio 14 (W4 de la 0018: sin padrón).
describe('AdminDashboard sin padrón (spec 0027)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('codecup_token', 'tok');
    localStorage.setItem('codecup_rol', 'ADMINISTRADOR');
    me.mockResolvedValue({ roles: ['ADMINISTRADOR', 'JUGADOR'], rolesPendientes: [] });
    listPendientes.mockResolvedValue(rolesPendientes);
  });

  it('elMenuNoTieneCsvNiBuscarJugador_yUsuariosSigue', async () => {
    renderEnRuta('/dashboard/admin', '/dashboard/admin', <AdminDashboard />);

    const menu = await screen.findByRole('navigation');
    expect(within(menu).getByRole('button', { name: 'Usuarios' })).toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: /CSV/i })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: /Buscar jugador/i })).not.toBeInTheDocument();
  });

  it('solicitudesDeRol_muestranElDocumento', async () => {
    renderEnRuta('/dashboard/admin', '/dashboard/admin', <AdminDashboard />);

    expect(await screen.findByText(rolesPendientes[0].numeroDocumento)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Documento' })).toBeInTheDocument();
    expect(screen.queryByText(/padrón/i)).not.toBeInTheDocument();
  });
});
