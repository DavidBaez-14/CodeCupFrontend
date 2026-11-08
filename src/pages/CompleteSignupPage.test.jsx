import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', () => ({ obtenerSesion: vi.fn(), cerrarSesion: vi.fn() }));
vi.mock('../api/auth', () => ({ me: vi.fn(), registro: vi.fn(), solicitarRol: vi.fn() }));

import CompleteSignupPage from './CompleteSignupPage';
import { obtenerSesion } from '../lib/supabase';
import { me, registro, solicitarRol } from '../api/auth';
import { errorApi, renderEnRuta } from '../test/rutas';

const ubicacion = () => screen.getByTestId('ubicacion');
const respuestaMe = (roles, rolesPendientes = []) => ({
  roles, rolesPendientes, nombre: 'Ana María Pérez', correo: 'ana@correo.co', cedula: '1090123',
});

async function completar({ tipoCuenta, motivo } = {}) {
  const user = userEvent.setup();
  const nombres = screen.getByLabelText('Nombres');
  const apellidos = screen.getByLabelText('Apellidos');
  await user.clear(nombres);
  await user.type(nombres, 'Ana María');
  await user.clear(apellidos);
  await user.type(apellidos, 'Pérez');
  await user.type(screen.getByLabelText('Número de documento'), '1090123');
  if (tipoCuenta) await user.selectOptions(screen.getByLabelText('Tipo de cuenta'), tipoCuenta);
  if (motivo) await user.type(screen.getByLabelText('Motivo'), motivo);
  await user.click(screen.getByRole('button', { name: 'Completar registro' }));
}

// Spec 0019, criterios 8 y 9: datos personales después de confirmar el correo, solo a nuestro backend.
describe('CompleteSignupPage (spec 0019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    obtenerSesion.mockResolvedValue({ user: { email: 'ana@correo.co', user_metadata: {} } });
    registro.mockResolvedValue(respuestaMe(['JUGADOR']));
    solicitarRol.mockResolvedValue({ estado: 'PENDIENTE' });
  });

  it('registroJugador_entra', async () => {
    me.mockRejectedValueOnce(errorApi(404, 'CUENTA_NO_REGISTRADA')).mockResolvedValue(respuestaMe(['JUGADOR']));
    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);
    await screen.findByLabelText('Nombres');

    await completar();

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard/jugador'));
    expect(registro).toHaveBeenCalledWith({
      nombres: 'Ana María', apellidos: 'Pérez', tipoDocumento: 'CC', numeroDocumento: '1090123',
    });
    expect(solicitarRol).not.toHaveBeenCalled();
  });

  it('registroDelegado_solicitaRol_yVaAPending', async () => {
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));
    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);
    await screen.findByLabelText('Nombres');

    await completar({ tipoCuenta: 'DELEGADO', motivo: 'Tengo un equipo' });

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/pending'));
    expect(solicitarRol).toHaveBeenCalledWith({ rol: 'DELEGADO', motivoSolicitud: 'Tengo un equipo' });
  });

  it('documentoRegistrado_409', async () => {
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));
    registro.mockRejectedValue(errorApi(409, 'DOCUMENTO_REGISTRADO'));
    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);
    await screen.findByLabelText('Nombres');

    await completar();

    expect(await screen.findByText('Ya existe una cuenta con este documento. Entra con la forma que usaste la primera vez (Google o tu correo y contraseña).')).toBeInTheDocument();
    expect(ubicacion()).toHaveTextContent('/complete-signup');
  });

  it('google_prellenaNombres', async () => {
    obtenerSesion.mockResolvedValue({
      user: { email: 'laura@gmail.com', user_metadata: { given_name: 'Laura', family_name: 'Gómez' } },
    });
    me.mockRejectedValue(errorApi(404, 'CUENTA_NO_REGISTRADA'));

    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);

    expect(await screen.findByLabelText('Nombres')).toHaveValue('Laura');
    expect(screen.getByLabelText('Apellidos')).toHaveValue('Gómez');
  });

  it('registro_conInvitacionPendiente_vuelveALaInvitacion', async () => {
    localStorage.setItem('codecup_invitacion', 'tok7');
    me.mockRejectedValueOnce(errorApi(404, 'CUENTA_NO_REGISTRADA')).mockResolvedValue(respuestaMe(['JUGADOR', 'ARBITRO']));
    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);
    await screen.findByLabelText('Nombres');

    await completar();

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/invitacion/tok7?tras=registro'));
  });

  it('yaRegistrado_soloPideMotivo', async () => {
    me.mockResolvedValue(respuestaMe(['JUGADOR']));
    renderEnRuta('/complete-signup?tipo=ARBITRO', '/complete-signup', <CompleteSignupPage />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Motivo'), 'Arbitro los sábados');
    expect(screen.queryByLabelText('Nombres')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/pending'));
    expect(solicitarRol).toHaveBeenCalledWith({ rol: 'ARBITRO', motivoSolicitud: 'Arbitro los sábados' });
    expect(registro).not.toHaveBeenCalled();
  });

  it('sinSesion_vaAlLogin', async () => {
    obtenerSesion.mockResolvedValue(null);

    renderEnRuta('/complete-signup', '/complete-signup', <CompleteSignupPage />);

    await waitFor(() => expect(ubicacion()).toHaveTextContent('/login'));
  });
});
