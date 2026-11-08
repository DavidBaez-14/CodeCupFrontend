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
import meJugador from '../test/contrato/me-jugador.json';
import perfilJugador from '../test/contrato/perfil-jugador.json';

const PERFIL_VACIO = {
  personaId: 'a4000000-0000-4000-8000-000000000022',
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

// Spec 0027, criterios 15 y 16: el documento sale de /me (el perfil ya no lo trae) y se avisa del vínculo pendiente.
describe('JugadorDashboard por persona (spec 0027)', () => {
  const AVISO = /Tu documento ya estaba en el plantel de un equipo/;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('codecup_token', 'tok');
    localStorage.setItem('codecup_rol', 'JUGADOR');
    me.mockResolvedValue(meJugador);
    getMiPerfil.mockResolvedValue(perfilJugador);
    getMisSolicitudes.mockResolvedValue([]);
    listTorneos.mockResolvedValue([]);
    listEquiposPorTorneo.mockResolvedValue([]);
  });

  it('perfil_muestraElDocumentoDeMe', async () => {
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    expect(await screen.findByText(`CC ${meJugador.numeroDocumento}`)).toBeInTheDocument();
  });

  it('sinDocumento_loDice', async () => {
    me.mockResolvedValue({ ...meJugador, tipoDocumento: null, numeroDocumento: null });
    const user = userEvent.setup();
    renderPanel();
    await abrirPerfil(user);

    expect(await screen.findByText('Sin documento')).toBeInTheDocument();
  });

  it('vinculoPendiente_muestraElAviso', async () => {
    me.mockResolvedValue({
      ...meJugador,
      vinculoPendiente: { id: 'v-1', personaId: 'p-historial', estado: 'PENDIENTE', creadoEn: '2026-11-08T10:00:00' },
    });
    renderPanel();

    expect(await screen.findByRole('status')).toHaveTextContent(AVISO);
  });

  it('sinVinculo_noHayAviso', async () => {
    renderPanel();

    await screen.findByRole('heading', { name: 'Unirme a un equipo' });
    await waitFor(() => expect(me).toHaveBeenCalled());
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
  });
});
