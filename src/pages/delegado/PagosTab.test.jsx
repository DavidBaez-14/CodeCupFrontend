import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mocks de las dependencias externas del componente (resueltos relativos a ESTE archivo,
// que vive en el mismo directorio que PagosTab.jsx).
vi.mock('../../utils/session', () => ({ getToken: () => 'tok' }));
vi.mock('../../api/supercopa', () => ({ listInscripcionesDelegado: vi.fn() }));
vi.mock('../../api/finanzas', () => ({
  getMisComprobantes: vi.fn(),
  solicitarUploadUrl: vi.fn(),
  subirComprobante: vi.fn(),
}));

import PagosTab from './PagosTab';
import { listInscripcionesDelegado } from '../../api/supercopa';
import { getMisComprobantes, solicitarUploadUrl, subirComprobante } from '../../api/finanzas';

const insc = (id, nombre, estadoInscripcion = 'PENDIENTE_PAGO', monto = 50000) => ({
  id,
  torneoNombre: nombre,
  equipoNombre: `Equipo ${id}`,
  estadoInscripcion,
  montoInscripcion: monto,
  fechaInscripcion: '2026-01-01T00:00:00',
});

function pickFile() {
  return new File(['contenido'], 'pago.pdf', { type: 'application/pdf' });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMisComprobantes.mockResolvedValue([]);
  solicitarUploadUrl.mockResolvedValue({ uploadUrl: 'http://storage/upload', fileKey: 'key-123' });
  subirComprobante.mockResolvedValue({});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});

describe('PagosTab — selector de torneo', () => {
  it('con 2 pendientes muestra UN selector con una opción por torneo', async () => {
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A'), insc('B', 'Copa B')]);

    render(<PagosTab />);

    const select = await screen.findByLabelText(/torneo/i);
    const opciones = within(select).getAllByRole('option');
    expect(opciones).toHaveLength(2);
    // Un único selector en la pantalla
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('sube el comprobante al torneo SELECCIONADO (no al primero)', async () => {
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A'), insc('B', 'Copa B')]);
    const user = userEvent.setup();

    const { container } = render(<PagosTab />);
    const select = await screen.findByLabelText(/torneo/i);

    await user.selectOptions(select, 'B');
    const fileInput = container.querySelector('input[type="file"]');
    await user.upload(fileInput, pickFile());
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => expect(solicitarUploadUrl).toHaveBeenCalled());
    expect(solicitarUploadUrl).toHaveBeenCalledWith({ equipoTorneoId: 'B' }, 'tok');
    expect(subirComprobante).toHaveBeenCalledWith(
      { tipo: 'INSCRIPCION', referenciaId: 'B', urlArchivo: 'key-123' },
      'tok',
    );
  });

  it('no muestra selector y avisa cuando no hay pagos pendientes subibles', async () => {
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A', 'APROBADO')]);

    render(<PagosTab />);

    await waitFor(() => expect(listInscripcionesDelegado).toHaveBeenCalled());
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText(/no tienes pagos pendientes/i)).toBeInTheDocument();
  });

  it('deshabilita Enviar mientras no se elige archivo', async () => {
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A')]);

    render(<PagosTab />);

    await screen.findByLabelText(/torneo/i);
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled();
  });

  it('no muestra "En revisión" en el historial de una inscripción ya resuelta por el admin', async () => {
    // Inscripción APROBADA pero con comprobante aún en PENDIENTE_REVISION (dato desincronizado en
    // el backend): la línea del comprobante no debe aparecer una vez resuelta la inscripción.
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A', 'APROBADO')]);
    getMisComprobantes.mockResolvedValue([{ referenciaId: 'A', estado: 'PENDIENTE_REVISION' }]);

    render(<PagosTab />);

    await waitFor(() => expect(listInscripcionesDelegado).toHaveBeenCalled());
    expect(screen.queryByText(/en revisi/i)).not.toBeInTheDocument();
  });

  it('permite reemplazar: una inscripción pendiente con comprobante en revisión sigue en el selector', async () => {
    listInscripcionesDelegado.mockResolvedValue([insc('A', 'Copa A', 'PENDIENTE_PAGO')]);
    getMisComprobantes.mockResolvedValue([{ referenciaId: 'A', estado: 'PENDIENTE_REVISION' }]);

    render(<PagosTab />);

    const select = await screen.findByLabelText(/torneo/i);
    expect(within(select).getAllByRole('option')).toHaveLength(1);
    // El selector aparece con las inscripciones; el botón cambia a "Reemplazar" cuando llegan
    // los comprobantes, que es otra petición. Hay que esperarlo: con la suite completa a veces llega después.
    expect(await screen.findByRole('button', { name: /reemplazar/i })).toBeInTheDocument();
  });
});
