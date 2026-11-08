import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

vi.mock('../../utils/session', () => ({ getToken: () => 'tok' }));
vi.mock('../../api/supercopa', async (importOriginal) => {
  const real = await importOriginal();
  return Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn()]));
});
vi.mock('../../api/finanzas', () => ({ getComprobantesPendientes: vi.fn(), getDownloadUrl: vi.fn() }));

import GestionarEquiposView from './GestionarEquiposView';
import { listInscripcionesTorneo, listTorneosAdmin } from '../../api/supercopa';
import { getComprobantesPendientes } from '../../api/finanzas';
import inscripciones from '../../test/contrato/inscripciones-torneo.json';

// Spec 0027, criterio 9: la columna Delegado muestra su nombre (delegadoNombre), no un documento.
describe('GestionarEquiposView por persona (spec 0027)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTorneosAdmin.mockResolvedValue([{ id: inscripciones[0].torneoId, nombre: 'Copa Prueba 2026', estado: 'PUBLICADO' }]);
    listInscripcionesTorneo.mockResolvedValue(inscripciones);
    getComprobantesPendientes.mockResolvedValue([]);
  });

  it('delegado_salePorNombre', async () => {
    render(<GestionarEquiposView />);

    const fila = (await screen.findByText('Halcones FC')).closest('tr');
    expect(within(fila).getByText('Andrés Gómez')).toBeInTheDocument();
    expect(within(fila).queryByText(inscripciones[0].delegadoPersonaId)).not.toBeInTheDocument();
  });
});
