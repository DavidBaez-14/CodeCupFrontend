import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/auth', () => ({ me: vi.fn(), solicitarRol: vi.fn() }));

import RoleSwitcherPanel from './RoleSwitcherPanel';
import RoleHeaderActions from './RoleHeaderActions';
import { me, solicitarRol } from '../api/auth';
import { errorApi } from '../test/rutas';

const datosMe = (roles, rolesPendientes = []) => ({
  roles, rolesPendientes, nombre: 'Ana Pérez', correo: 'ana@correo.co', cedula: '1090123',
});

function renderPanel(componente) {
  return render(<MemoryRouter>{componente}</MemoryRouter>);
}

// Spec 0019, criterio 16: solicitar rol con {rol, motivoSolicitud} y refrescar /me.
describe('RoleSwitcherPanel (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('codecup_rol', 'JUGADOR');
    localStorage.setItem('codecup_roles', JSON.stringify(['JUGADOR']));
    solicitarRol.mockResolvedValue({ estado: 'PENDIENTE', mensaje: 'ok' });
  });

  it('refrescaMe_alMontar', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR', 'DELEGADO']));

    renderPanel(<RoleSwitcherPanel />);

    expect(await screen.findByRole('button', { name: 'Delegado' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('codecup_roles'))).toEqual(['JUGADOR', 'DELEGADO']);
  });

  it('solicitarRol_mandaRolYMotivo_sinDatosAcademicos', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR']));
    renderPanel(<RoleSwitcherPanel />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Solicitar nuevo rol' }));
    const tipo = screen.getByLabelText('Rol solicitado');
    expect(within(tipo).queryByRole('option', { name: 'Jugador' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cedula')).not.toBeInTheDocument();
    await user.selectOptions(tipo, 'ARBITRO');
    await user.type(screen.getByLabelText('Motivo'), 'Arbitro los sábados');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(solicitarRol).toHaveBeenCalledWith({ rol: 'ARBITRO', motivoSolicitud: 'Arbitro los sábados' });
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
  });

  it('solicitudExistente_409', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR']));
    solicitarRol.mockRejectedValue(errorApi(409, 'SOLICITUD_EXISTENTE'));
    renderPanel(<RoleSwitcherPanel />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Solicitar nuevo rol' }));
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(await screen.findByText('Ya tienes una solicitud pendiente.')).toBeInTheDocument();
  });
});

describe('RoleHeaderActions (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('codecup_rol', 'JUGADOR');
    localStorage.setItem('codecup_roles', JSON.stringify(['JUGADOR']));
    localStorage.setItem('codecup_nombre', 'Ana Pérez');
    solicitarRol.mockResolvedValue({ estado: 'PENDIENTE', mensaje: 'ok' });
  });

  it('alAbrir_refrescaMe_ySolicitaConRolYMotivo', async () => {
    me.mockResolvedValue(datosMe(['JUGADOR']));
    renderPanel(<RoleHeaderActions />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Ana/ }));
    await user.click(screen.getByRole('button', { name: 'Configuraciones' }));
    expect(me).toHaveBeenCalled();
    await user.selectOptions(await screen.findByLabelText('Rol solicitado'), 'DELEGADO');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(solicitarRol).toHaveBeenCalledWith({ rol: 'DELEGADO', motivoSolicitud: '' });
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
  });
});
