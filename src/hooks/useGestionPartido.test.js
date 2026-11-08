import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('../utils/session', () => ({ getToken: () => 'tok' }));
vi.mock('../api/supercopa', async (importOriginal) => {
  const real = await importOriginal();
  return Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn()]));
});
vi.mock('../api/finanzas', async (importOriginal) => {
  const real = await importOriginal();
  return Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn()]));
});

import useGestionPartido from './useGestionPartido';
import * as supercopa from '../api/supercopa';
import * as finanzas from '../api/finanzas';
import partido from '../test/contrato/partido-base.json';
import miembrosLocal from '../test/contrato/miembros-local.json';
import miembrosVisitante from '../test/contrato/miembros-visitante.json';
import alineacion from '../test/contrato/alineacion.json';
import eventos from '../test/contrato/eventos.json';

// Solo el primer jugador local está en cancha: así se prueban las dos direcciones del interruptor.
const alineacionDeUno = alineacion.filter((a) => a.personaId === miembrosLocal[0].personaId);

async function renderPartido() {
  const hook = renderHook(() => useGestionPartido(partido));
  await waitFor(() => expect(hook.result.current.match?.homeRoster).toHaveLength(6));
  return hook;
}

// Spec 0027, criterios 5 a 7: lo que el árbitro hace en el partido viaja por personaId.
describe('useGestionPartido por persona (spec 0027)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supercopa.listAlineacionPartido.mockResolvedValue(alineacionDeUno);
    supercopa.listEventosPartido.mockResolvedValue(eventos);
    supercopa.listMiembrosEquipoTorneoAdmin.mockImplementation(async (id) => (
      id === partido.localEquipoTorneoId ? miembrosLocal : miembrosVisitante
    ));
    finanzas.getBloqueadosPartido.mockResolvedValue([]);
    for (const fn of [supercopa.agregarJugadorCancha, supercopa.quitarJugadorCancha, supercopa.crearEvento, finanzas.registrarPagoTodas]) {
      fn.mockResolvedValue({});
    }
  });

  it('meterYSacarDeCancha_usaLaPersona', async () => {
    const { result } = await renderPartido();

    await act(() => result.current.togglePlayer('home', 3));
    expect(supercopa.agregarJugadorCancha).toHaveBeenCalledWith(
      partido.id, miembrosLocal[2].personaId, partido.localEquipoTorneoId, 'tok',
    );

    await act(() => result.current.togglePlayer('home', 1));
    expect(supercopa.quitarJugadorCancha).toHaveBeenCalledWith(partido.id, miembrosLocal[0].personaId, 'tok');
  });

  it('registrarGol_mandaLaPersonaYElEquipo', async () => {
    const { result } = await renderPartido();

    await act(() => result.current.addEvent({ type: 'gol', side: 'away', num: 2 }));

    expect(supercopa.crearEvento).toHaveBeenCalledWith(
      partido.id,
      { personaId: miembrosVisitante[1].personaId, equipoTorneoId: partido.visitanteEquipoTorneoId, tipoEvento: 'GOL' },
      'tok',
    );
  });

  it('pagoEnCancha_usaLaPersona', async () => {
    const { result } = await renderPartido();
    const cuerpo = { comprobanteRef: 'Efectivo en campo', verificadoManual: true };

    await act(() => result.current.registrarPago(miembrosLocal[4].personaId, cuerpo));

    expect(finanzas.registrarPagoTodas).toHaveBeenCalledWith(miembrosLocal[4].personaId, cuerpo, 'tok');
  });
});
