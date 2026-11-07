import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), solicitarRol: vi.fn() }));
vi.mock('../api/supercopa', () => ({
  actualizarMiPerfil: vi.fn(),
  getMiPerfil: vi.fn(),
  getMisSolicitudes: vi.fn(),
  listEquiposPorTorneo: vi.fn(),
  listTorneos: vi.fn(),
  solicitarIngreso: vi.fn(),
}));

import JugadorDashboard from './JugadorDashboard';
import { me } from '../api/auth';
import {
  actualizarMiPerfil,
  getMiPerfil,
  getMisSolicitudes,
  listEquiposPorTorneo,
  listTorneos,
  solicitarIngreso,
} from '../api/supercopa';
import { renderEnRuta } from '../test/rutas';

const PERFIL_VACIO = {
  cedula: '9000000322',
  nombre: 'Jugador Veintidós',
  alturaCm: null,
  piernaHabil: null,
  posicion: null,
  equipos: [],
  partidos: [],
  titulos: [],
};

function renderPanel() {
  return renderEnRuta('/dashboard/jugador', '/dashboard/jugador', <JugadorDashboard />);
}

async function abrirPerfil(user) {
  await user.click(await screen.findByRole('button', { name: 'Perfil' }));
  return screen.findByRole('heading', { name: 'Datos deportivos' });
}

// Spec 0020: el perfil deportivo es opcional; no hay modal de bienvenida.
describe('JugadorDashboard sin modal de perfil (spec 0020)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('codecup_token', 'tok');
    localStorage.setItem('codecup_rol', 'JUGADOR');
    me.mockResolvedValue({ roles: ['JUGADOR'], rolesPendientes: [] });
    getMiPerfil.mockResolvedValue(PERFIL_VACIO);
    getMisSolicitudes.mockResolvedValue([]);
    listTorneos.mockResolvedValue([{ id: 't1', nombre: 'Copa Prueba 2026', estado: 'PUBLICADO' }]);
    listEquiposPorTorneo.mockResolvedValue([
      { equipoTorneoId: 'et1', equipoNombre: 'THE BOYS', miembros: 3, estadoInscripcion: 'APROBADO' },
    ]);
    solicitarIngreso.mockResolvedValue({ id: 's1', estado: 'PENDIENTE' });
    actualizarMiPerfil.mockImplementation(async (payload) => ({ ...PERFIL_VACIO, ...payload }));
  });

  it('perfilVacio_entraSinModal_ySolicitaIngreso', async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(await screen.findByRole('heading', { name: 'Unirme a un equipo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Completa tu perfil deportivo')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Solicitar ingreso' }));

    await waitFor(() => expect(solicitarIngreso).toHaveBeenCalledWith({ equipoTorneoId: 'et1' }, 'tok'));
    expect(await screen.findByText(/Solicitud enviada para "THE BOYS"/)).toBeInTheDocument();
  });

  it('perfilVacio_camposSinIndicar_yGuardaParcialConNull', async () => {
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    expect(screen.getByLabelText('Altura (cm)')).toHaveValue(null);
    expect(screen.getByLabelText('Pierna hábil')).toHaveValue('');
    expect(screen.getByLabelText('Posición')).toHaveValue('');

    await user.type(screen.getByLabelText('Altura (cm)'), '180');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(actualizarMiPerfil).toHaveBeenCalledWith(
      { alturaCm: 180, piernaHabil: null, posicion: null }, 'tok',
    ));
    expect(await screen.findByText('Perfil deportivo actualizado.')).toBeInTheDocument();
  });

  it('perfilVacio_guardarTodoVacio_mandaNull', async () => {
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(actualizarMiPerfil).toHaveBeenCalledWith(
      { alturaCm: null, piernaHabil: null, posicion: null }, 'tok',
    ));
  });

  it('perfilConDatos_prellena_yEdita', async () => {
    getMiPerfil.mockResolvedValue({ ...PERFIL_VACIO, alturaCm: 175, piernaHabil: 'IZQUIERDA', posicion: 'PORTERO' });
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    expect(screen.getByLabelText('Altura (cm)')).toHaveValue(175);
    expect(screen.getByLabelText('Pierna hábil')).toHaveValue('IZQUIERDA');
    expect(screen.getByLabelText('Posición')).toHaveValue('PORTERO');

    await user.clear(screen.getByLabelText('Altura (cm)'));
    await user.selectOptions(screen.getByLabelText('Posición'), 'DELANTERO');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(actualizarMiPerfil).toHaveBeenCalledWith(
      { alturaCm: null, piernaHabil: 'IZQUIERDA', posicion: 'DELANTERO' }, 'tok',
    ));
  });

  it('alturaFueraDeRango_noEnvia', async () => {
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    await user.type(screen.getByLabelText('Altura (cm)'), '99');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Altura debe estar entre 100 y 250 cm.')).toBeInTheDocument();
    expect(actualizarMiPerfil).not.toHaveBeenCalled();
  });
});
