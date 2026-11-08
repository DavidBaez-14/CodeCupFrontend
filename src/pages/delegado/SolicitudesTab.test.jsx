import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../utils/session', () => ({ getToken: () => 'tok' }));
vi.mock('../../api/supercopa', () => ({
  aprobarSolicitud: vi.fn(),
  listSolicitudesPendientes: vi.fn(),
  rechazarSolicitud: vi.fn(),
}));

import SolicitudesTab from './SolicitudesTab';
import { aprobarSolicitud, listSolicitudesPendientes } from '../../api/supercopa';
import solicitudes from '../../test/contrato/solicitudes-pendientes.json';

// Spec 0027, criterio 4: las solicitudes muestran el documento (numeroDocumento), no la cédula.
describe('SolicitudesTab por persona (spec 0027)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aprobarSolicitud.mockResolvedValue({});
  });

  it('muestraElDocumento_yAvisaConElNombre', async () => {
    const user = userEvent.setup();
    listSolicitudesPendientes.mockResolvedValue(solicitudes);
    render(<SolicitudesTab />);

    expect(await screen.findByText('9000000322')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Documento' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aprobar' }));

    expect(aprobarSolicitud).toHaveBeenCalledWith(solicitudes[0].id, 'tok');
    expect(await screen.findByText('Solicitud de Valeria Ibáñez aprobada.')).toBeInTheDocument();
  });

  it('sinDocumento_loDice', async () => {
    listSolicitudesPendientes.mockResolvedValue([{ ...solicitudes[0], numeroDocumento: null }]);
    render(<SolicitudesTab />);

    expect(await screen.findByText('Sin documento')).toBeInTheDocument();
  });
});
