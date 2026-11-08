import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignRoleModal from './AssignRoleModal';
import AssignAdminModal from './AssignAdminModal';
import RevokeRoleModal from './RevokeRoleModal';
import BloquearCuentaModal from './BloquearCuentaModal';
import UsersTable from './UsersTable';
import cuentasAdmin from '../../../test/contrato/cuentas-admin.json';

const cuenta = cuentasAdmin.content[0];
const acciones = { onAssign: vi.fn(), onAssignAdmin: vi.fn(), onRevoke: vi.fn(), onBloquear: vi.fn() };

function renderTabla(cuentas) {
  render(
    <UsersTable
      cuentas={cuentas}
      loading={false}
      page={0}
      totalPages={1}
      totalElements={cuentas.length}
      pageSize={8}
      onPageChange={vi.fn()}
      {...acciones}
    />,
  );
}

// Spec 0027, criterios 11 y 12 (W3 de la 0018): el panel de Usuarios trabaja con cuentaId y bloquea, no elimina.
describe('panel de Usuarios por cuenta (spec 0027)', () => {
  it('asignarRol_mandaCuentaId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<AssignRoleModal open cuenta={cuenta} rolPreseleccionado="ARBITRO" onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'Pitará la Copa Prueba');
    await user.click(screen.getByRole('button', { name: 'Confirmar asignación' }));

    expect(onSubmit).toHaveBeenCalledWith({ cuentaId: cuenta.id, rol: 'ARBITRO', motivo: 'Pitará la Copa Prueba' });
  });

  it('revocarRol_mandaCuentaId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<RevokeRoleModal open cuenta={cuenta} rol="DELEGADO" onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'Ya no dirige equipo');
    await user.click(screen.getByRole('button', { name: 'Revocar rol' }));

    expect(onSubmit).toHaveBeenCalledWith({ cuentaId: cuenta.id, rol: 'DELEGADO', motivo: 'Ya no dirige equipo' });
  });

  it('otorgarAdministrador_mandaCuentaId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<AssignAdminModal open cuenta={cuenta} onClose={vi.fn()} onSubmit={onSubmit} />);

    const [motivo, confirmacion] = screen.getAllByRole('textbox');
    await user.type(motivo, 'Coorganiza el torneo');
    await user.type(confirmacion, 'CONFIRMAR');
    await user.click(screen.getByRole('button', { name: 'Otorgar Administrador' }));

    expect(onSubmit).toHaveBeenCalledWith({ cuentaId: cuenta.id, rol: 'ADMINISTRADOR', motivo: 'Coorganiza el torneo' });
  });

  it('bloquear_explicaQueSeConservaElHistorial_yMandaCuentaId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<BloquearCuentaModal open cuenta={cuenta} onClose={vi.fn()} onSubmit={onSubmit} />);

    const dialogo = screen.getByRole('dialog', { name: 'Bloquear cuenta' });
    expect(within(dialogo).getByText(/se conservan sus equipos, partidos y estadísticas/)).toBeInTheDocument();
    expect(within(dialogo).queryByText(/eliminad/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Motivo/), 'Expulsado por conducta antideportiva');
    await user.click(screen.getByRole('button', { name: 'Bloquear cuenta' }));

    expect(onSubmit).toHaveBeenCalledWith({ cuentaId: cuenta.id, motivo: 'Expulsado por conducta antideportiva' });
  });

  it('bloquearSinMotivo_noLlama', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BloquearCuentaModal open cuenta={cuenta} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Bloquear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El motivo es obligatorio.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('tabla_muestraElDocumento_yLaAccionEsBloquear', async () => {
    const user = userEvent.setup();
    renderTabla(cuentasAdmin.content);

    expect(screen.getByRole('columnheader', { name: 'Documento' })).toBeInTheDocument();
    const fila = screen.getByText(cuenta.numeroDocumento).closest('tr');
    expect(within(fila).queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();

    await user.click(within(fila).getByRole('button', { name: 'Bloquear' }));
    expect(acciones.onBloquear).toHaveBeenCalledWith(cuenta);
  });

  it('cuentaBloqueada_loDice_ySinAcciones', () => {
    renderTabla([{ ...cuenta, estado: 'BLOQUEADA', roles: [] }]);

    const fila = screen.getByText(cuenta.numeroDocumento).closest('tr');
    expect(within(fila).getByText('Bloqueada')).toBeInTheDocument();
    expect(within(fila).queryByText('Sin roles')).not.toBeInTheDocument();
    expect(within(fila).queryByRole('button')).not.toBeInTheDocument();
  });
});
