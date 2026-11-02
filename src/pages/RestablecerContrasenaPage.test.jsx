import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({
  obtenerSesion: vi.fn(),
  cambiarContrasena: vi.fn(),
  cerrarSesion: vi.fn(),
}));

import RestablecerContrasenaPage from './RestablecerContrasenaPage';
import { cambiarContrasena, cerrarSesion, obtenerSesion } from '../lib/supabase';
import { renderEnRuta } from '../test/rutas';

async function cambiar(nueva, confirmacion) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Contraseña nueva'), nueva);
  await user.type(screen.getByLabelText('Confirmar contraseña'), confirmacion);
  await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
}

// Spec 0019, criterio 15: después de cambiarla, se cierra la sesión y se vuelve al login.
describe('RestablecerContrasenaPage (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerSesion.mockResolvedValue({ user: { email: 'ana@correo.co' } });
    cambiarContrasena.mockResolvedValue({});
  });

  it('cambia_cierraSesion_yVaAlLogin', async () => {
    renderEnRuta('/restablecer-contrasena', '/restablecer-contrasena', <RestablecerContrasenaPage />);

    await cambiar('nueva12345', 'nueva12345');

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login?aviso=contrasena-actualizada'));
    expect(cambiarContrasena).toHaveBeenCalledWith('nueva12345');
    expect(cerrarSesion).toHaveBeenCalled();
  });

  it('noCoinciden_noCambia', async () => {
    renderEnRuta('/restablecer-contrasena', '/restablecer-contrasena', <RestablecerContrasenaPage />);

    await cambiar('nueva12345', 'otra123456');

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(cambiarContrasena).not.toHaveBeenCalled();
  });

  it('sinSesionDeRecuperacion_enlaceVencido', async () => {
    obtenerSesion.mockResolvedValue(null);

    renderEnRuta('/restablecer-contrasena', '/restablecer-contrasena', <RestablecerContrasenaPage />);

    expect(await screen.findByText('El enlace venció o ya se usó.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument();
  });
});
