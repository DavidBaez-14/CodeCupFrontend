import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../utils/session', () => ({ getToken: () => 'tok' }));
vi.mock('../../api/supercopa', async (importOriginal) => {
  const real = await importOriginal();
  return Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn()]));
});

import MiEquipoTab from './MiEquipoTab';
import * as supercopa from '../../api/supercopa';
import miembrosLocal from '../../test/contrato/miembros-local.json';
import { errorApi } from '../../test/rutas';

const INSCRIPCION = { id: 'et-1', torneoNombre: 'Copa Prueba 2026', estadoInscripcion: 'APROBADO' };
// Un miembro que el delegado anotó sin documento y que todavía no tiene cuenta (0018 y 0023).
const SIN_CUENTA = {
  ...miembrosLocal[1],
  personaId: 'persona-sin-cuenta',
  numeroDocumento: null,
  nombre: 'Pedro Invitado',
  numeroCamiseta: null,
  esDelegado: false,
  tieneCuenta: false,
};
const juan = miembrosLocal.find((m) => m.nombre === 'Juan Castro');
const filaDe = (nombre) => screen.getByText(nombre).closest('li');

async function renderPlantel() {
  render(<MiEquipoTab toast={vi.fn()} />);
  await screen.findByText('Juan Castro');
}

// Spec 0027, criterios 2 y 3 (W1 y W2 de la 0018): agregar con documento y nombre, y el plantel por persona.
describe('MiEquipoTab por persona (spec 0027)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supercopa.getMiEquipo.mockResolvedValue({ id: 'eq-1', nombre: 'Halcones FC' });
    supercopa.listInscripcionesDelegado.mockResolvedValue([INSCRIPCION]);
    supercopa.listMiembrosEquipoTorneo.mockResolvedValue([...miembrosLocal, SIN_CUENTA]);
  });

  it('plantel_muestraElDocumento_yMarcaSinCuentaYSinDocumento', async () => {
    await renderPlantel();

    expect(within(filaDe('Juan Castro')).getByText(juan.numeroDocumento)).toBeInTheDocument();
    expect(within(filaDe('Pedro Invitado')).getByText('Sin cuenta')).toBeInTheDocument();
    expect(within(filaDe('Pedro Invitado')).getByText('Sin documento')).toBeInTheDocument();
    expect(screen.getAllByText('Sin cuenta')).toHaveLength(1);
  });

  it('agregar_mandaTipoDocumentoYNombre_sinBusquedaPrevia', async () => {
    const user = userEvent.setup();
    supercopa.agregarMiembro.mockResolvedValue({ ...SIN_CUENTA, nombre: 'Pedro Invitado Rojas' });
    await renderPlantel();
    expect(screen.queryByRole('button', { name: /buscar/i })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Tipo de documento'), 'TI');
    await user.type(screen.getByLabelText('Número de documento'), ' 1.098.765 ');
    await user.type(screen.getByLabelText('Nombre completo'), 'Pedro Invitado');
    await user.type(screen.getByLabelText('Camiseta (opcional)'), '7');
    await user.click(screen.getByRole('button', { name: 'Agregar al plantel' }));

    expect(supercopa.agregarMiembro).toHaveBeenCalledWith(
      'et-1',
      { tipoDocumento: 'TI', numeroDocumento: '1.098.765', nombre: 'Pedro Invitado', numeroCamiseta: 7 },
      'tok',
    );
    // El aviso usa el nombre que devuelve el backend.
    expect(await screen.findByText('Pedro Invitado Rojas agregado al plantel.')).toBeInTheDocument();
  });

  it('agregarSinNombre_noLlamaAlBackend', async () => {
    const user = userEvent.setup();
    await renderPlantel();

    await user.type(screen.getByLabelText('Número de documento'), '1098765');
    await user.click(screen.getByRole('button', { name: 'Agregar al plantel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe el número de documento y el nombre completo.');
    expect(supercopa.agregarMiembro).not.toHaveBeenCalled();
  });

  it('cuentaBloqueada_muestraElMensajeDelBackend', async () => {
    const user = userEvent.setup();
    supercopa.agregarMiembro.mockRejectedValue(
      errorApi(409, 'JUGADOR_BLOQUEADO', 'La cuenta de esa persona está bloqueada: no puede entrar a un plantel.'),
    );
    await renderPlantel();

    await user.type(screen.getByLabelText('Número de documento'), '9000000303');
    await user.type(screen.getByLabelText('Nombre completo'), 'Mateo Jiménez');
    await user.click(screen.getByRole('button', { name: 'Agregar al plantel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La cuenta de esa persona está bloqueada');
  });

  it('quitar_usaLaPersona', async () => {
    const user = userEvent.setup();
    supercopa.removerMiembro.mockResolvedValue({});
    await renderPlantel();

    await user.click(within(filaDe('Juan Castro')).getByTitle('Eliminar'));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(supercopa.removerMiembro).toHaveBeenCalledWith('et-1', juan.personaId, 'tok');
  });

  it('cambiarCamiseta_usaLaPersona', async () => {
    const user = userEvent.setup();
    supercopa.actualizarCamiseta.mockResolvedValue({});
    await renderPlantel();

    await user.click(within(filaDe('Juan Castro')).getByTitle('Editar número'));
    const campo = within(filaDe('Juan Castro')).getByRole('spinbutton');
    await user.clear(campo);
    await user.type(campo, '10');
    // En el navegador, Enter envía este formulario de un solo campo numérico; user-event no
    // simula ese envío implícito para type="number", así que se envía directamente.
    fireEvent.submit(campo.closest('form'));

    await waitFor(() => expect(supercopa.actualizarCamiseta).toHaveBeenCalledWith('et-1', juan.personaId, 10, 'tok'));
  });
});
