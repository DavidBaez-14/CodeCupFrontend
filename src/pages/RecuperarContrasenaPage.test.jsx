import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ enviarRecuperacion: vi.fn() }));

import RecuperarContrasenaPage from './RecuperarContrasenaPage';
import { enviarRecuperacion } from '../lib/supabase';
import { errorAuth, renderEnRuta } from '../test/rutas';

async function enviar() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.co');
  await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
}

// Spec 0019, criterio 14: no revela si el correo existe.
describe('RecuperarContrasenaPage (spec 0019)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia_yNoRevelaSiExiste', async () => {
    enviarRecuperacion.mockResolvedValue({});
    renderEnRuta('/recuperar-contrasena', '/recuperar-contrasena', <RecuperarContrasenaPage />);

    await enviar();

    expect(enviarRecuperacion).toHaveBeenCalledWith('ana@correo.co');
    expect(await screen.findByText('Si hay una cuenta con ese correo, te enviamos un enlace.')).toBeInTheDocument();
  });

  it('limiteDeCorreos_loExplica', async () => {
    enviarRecuperacion.mockRejectedValue(errorAuth('over_email_send_rate_limit', 'Email rate limit exceeded'));
    renderEnRuta('/recuperar-contrasena', '/recuperar-contrasena', <RecuperarContrasenaPage />);

    await enviar();

    expect(await screen.findByText('Hiciste demasiados intentos. Espera unos minutos.')).toBeInTheDocument();
  });
});
