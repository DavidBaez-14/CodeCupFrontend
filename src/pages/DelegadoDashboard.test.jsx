import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({ cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), solicitarRol: vi.fn() }));
vi.mock('../api/jugadores', () => ({ getJugadorByCedula: vi.fn() }));
vi.mock('../api/finanzas', () => ({
  getMisComprobantes: vi.fn(),
  solicitarUploadUrl: vi.fn(),
  subirComprobante: vi.fn(),
}));
// Todas las llamadas de supercopa responden vacío, salvo las que el test fija.
vi.mock('../api/supercopa', async (importOriginal) => {
  const real = await importOriginal();
  return Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn()]));
});

import DelegadoDashboard from './DelegadoDashboard';
import { me } from '../api/auth';
import * as supercopa from '../api/supercopa';
import { renderEnRuta } from '../test/rutas';

// Spec 0020, criterio 7: el delegado con el perfil deportivo vacío entra sin modal.
describe('DelegadoDashboard sin modal de perfil (spec 0020)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('codecup_token', 'tok');
    localStorage.setItem('codecup_rol', 'DELEGADO');
    localStorage.setItem('codecup_nombre', 'Delegado Uno');
    me.mockResolvedValue({ roles: ['DELEGADO', 'JUGADOR'], rolesPendientes: [] });
    for (const fn of Object.values(supercopa)) fn.mockResolvedValue([]);
    supercopa.getMiPerfil.mockResolvedValue({ alturaCm: null, piernaHabil: null, posicion: null });
    supercopa.getMiEquipo.mockResolvedValue({ id: 'eq-1', nombre: 'THE BOYS' });
  });

  it('perfilVacio_entraSinModal', async () => {
    renderEnRuta('/dashboard/delegado', '/dashboard/delegado', <DelegadoDashboard />);

    expect(await screen.findByRole('heading', { name: /Hola,/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi Equipo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Completa tu perfil deportivo')).not.toBeInTheDocument();
  });
});
