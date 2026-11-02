import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../api/invitaciones', () => ({ invitarUsuario: vi.fn() }));

import InvitarUsuarioModal from './InvitarUsuarioModal';
import { invitarUsuario } from '../../../api/invitaciones';
import { errorApi } from '../../../test/rutas';

async function invitar() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Correo electrónico'), 'arbitro@correo.co');
  await user.selectOptions(screen.getByLabelText('Rol'), 'ARBITRO');
  await user.click(screen.getByRole('button', { name: 'Crear invitación' }));
  return user;
}

// Spec 0019, criterio 18: "Crear usuario" pasa a "Invitar usuario".
describe('InvitarUsuarioModal (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invitarUsuario.mockResolvedValue({
      id: 'i1', correo: 'arbitro@correo.co', rol: 'ARBITRO', estado: 'PENDIENTE',
      token: 'tok123', enlace: 'http://localhost:5173/invitacion/tok123',
    });
  });

  it('invita_yMuestraElEnlaceParaCopiar', async () => {
    const onInvitado = vi.fn();
    render(<InvitarUsuarioModal open onClose={vi.fn()} onInvitado={onInvitado} />);

    const user = await invitar();

    expect(invitarUsuario).toHaveBeenCalledWith({ correo: 'arbitro@correo.co', rol: 'ARBITRO' });
    expect(await screen.findByText('http://localhost:5173/invitacion/tok123')).toBeInTheDocument();
    // userEvent.setup() instala su propio portapapeles: el mock va después.
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await user.click(screen.getByRole('button', { name: 'Copiar enlace' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:5173/invitacion/tok123');
    expect(onInvitado).toHaveBeenCalled();
  });

  it('duplicada_409', async () => {
    invitarUsuario.mockRejectedValue(errorApi(409, 'INVITACION_DUPLICADA'));
    render(<InvitarUsuarioModal open onClose={vi.fn()} />);

    await invitar();

    expect(await screen.findByText('Ya hay una invitación pendiente para ese correo y ese rol.')).toBeInTheDocument();
  });

  it('noOfreceInvitarJugador', () => {
    render(<InvitarUsuarioModal open onClose={vi.fn()} />);

    const opciones = Array.from(screen.getByLabelText('Rol').querySelectorAll('option')).map((o) => o.value);
    expect(opciones).toEqual(['ADMINISTRADOR', 'ARBITRO', 'DELEGADO']);
  });
});
