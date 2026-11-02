import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ registrarseConCorreo: vi.fn(), entrarConGoogle: vi.fn() }));

import SignupPage from './SignupPage';
import { registrarseConCorreo } from '../lib/supabase';
import { renderEnRuta } from '../test/rutas';

async function llenar(contrasena, confirmacion) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.co');
  await user.type(screen.getByLabelText('Contraseña'), contrasena);
  await user.type(screen.getByLabelText('Confirmar contraseña'), confirmacion);
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
}

// Spec 0019, criterio 6: el registro solo pide correo y contraseña.
describe('SignupPage — Supabase (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registrarseConCorreo.mockResolvedValue({ user: { id: 'u1' }, session: null });
  });

  it('envia_yMuestraRevisaTuCorreo', async () => {
    renderEnRuta('/signup', '/signup', <SignupPage />);

    await llenar('secreta123', 'secreta123');

    expect(registrarseConCorreo).toHaveBeenCalledWith('ana@correo.co', 'secreta123');
    expect(await screen.findByText('Revisa tu correo')).toBeInTheDocument();
  });

  it('contrasenasDistintas_noEnvia', async () => {
    renderEnRuta('/signup', '/signup', <SignupPage />);

    await llenar('secreta123', 'otra12345');

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(registrarseConCorreo).not.toHaveBeenCalled();
  });

  it('contrasenaCorta_noEnvia', async () => {
    renderEnRuta('/signup', '/signup', <SignupPage />);

    await llenar('corta1', 'corta1');

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(registrarseConCorreo).not.toHaveBeenCalled();
  });

  it('sinPadronNiTipoDeCuenta', () => {
    renderEnRuta('/signup', '/signup', <SignupPage />);

    expect(screen.queryByLabelText('Cédula')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de cuenta')).not.toBeInTheDocument();
    expect(screen.queryByText(/padrón/i)).not.toBeInTheDocument();
  });
});
