import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({ requestJson: vi.fn(async () => ({})) }));

import { requestJson } from './http';
import { actualizarCamiseta, agregarJugadorCancha, quitarJugadorCancha, removerMiembro } from './supercopa';
import { getElegibilidadDetalle, getMultasPendientesJugador, registrarPagoTodas } from './finanzas';
import { asignarRol, bloquearCuenta, revocarRol } from './cuentas';

const PERSONA = '7edf4b7a-871e-4350-9433-28e42d907390';
const PARTIDO = '7cbf1204-40db-46b4-a17d-3fc96cc22169';
const EQUIPO = 'b229c34f-c24a-4839-80f6-1d234f112513';

/** URL (sin el origen del gateway) y opciones de la última llamada a requestJson. */
function ultimaLlamada() {
  const [url, opciones] = requestJson.mock.calls.at(-1);
  return { ruta: new URL(url, 'http://web.test').pathname, opciones, cuerpo: opciones.body ? JSON.parse(opciones.body) : undefined };
}

// Spec 0027: las rutas y los cuerpos que cambiaron en la 0022 llevan personaId (o cuentaId), no la cédula.
describe('rutas por persona (spec 0027)', () => {
  beforeEach(() => requestJson.mockClear());

  it('alineacion_agregarYQuitar', async () => {
    await agregarJugadorCancha(PARTIDO, PERSONA, EQUIPO, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/supercopa/admin/partidos/${PARTIDO}/alineacion`,
      opciones: { method: 'POST' },
      cuerpo: { personaId: PERSONA, equipoTorneoId: EQUIPO },
    });

    await quitarJugadorCancha(PARTIDO, PERSONA, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/supercopa/admin/partidos/${PARTIDO}/alineacion/${PERSONA}`,
      opciones: { method: 'DELETE' },
    });
  });

  it('plantel_quitarYCamiseta', async () => {
    await removerMiembro('et-1', PERSONA, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/supercopa/delegado/equipo-torneo/et-1/miembros/${PERSONA}/remover`,
      opciones: { method: 'POST' },
    });

    await actualizarCamiseta('et-1', PERSONA, 10, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/supercopa/delegado/equipo-torneo/et-1/miembros/${PERSONA}/camiseta`,
      opciones: { method: 'PATCH' },
      cuerpo: { numeroCamiseta: 10 },
    });
  });

  it('panelDeCuentas_vaPorCuentaId', async () => {
    const CUENTA = '9960b02f-b6ba-48d7-8da9-771ca2098e4f';

    await asignarRol({ cuentaId: CUENTA, rol: 'ARBITRO', motivo: 'm' }, 'tok');
    expect(ultimaLlamada()).toMatchObject({ ruta: '/api/admin/roles/asignar', cuerpo: { cuentaId: CUENTA, rol: 'ARBITRO', motivo: 'm' } });

    await revocarRol({ cuentaId: CUENTA, rol: 'ARBITRO', motivo: 'm' }, 'tok');
    expect(ultimaLlamada()).toMatchObject({ ruta: '/api/admin/roles/revocar', cuerpo: { cuentaId: CUENTA, rol: 'ARBITRO' } });

    await bloquearCuenta({ cuentaId: CUENTA, motivo: 'conducta' }, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/admin/roles/cuenta/${CUENTA}`,
      opciones: { method: 'DELETE' },
      cuerpo: { motivo: 'conducta' },
    });
  });

  it('multasDeUnJugador_vanPorPersona', async () => {
    await getElegibilidadDetalle(PERSONA, 'torneo-1', 'tok');
    expect(ultimaLlamada().ruta).toBe(`/api/finanzas/multas/elegibilidad/${PERSONA}/detalle`);

    await getMultasPendientesJugador(PERSONA, 'torneo-1', 'tok');
    expect(ultimaLlamada().ruta).toBe(`/api/finanzas/multas/jugador/${PERSONA}/pendientes`);

    await registrarPagoTodas(PERSONA, { torneoId: 'torneo-1' }, 'tok');
    expect(ultimaLlamada()).toMatchObject({
      ruta: `/api/finanzas/multas/jugador/${PERSONA}/registrar-pago-todas`,
      opciones: { method: 'POST' },
      cuerpo: { torneoId: 'torneo-1' },
    });
  });
});
