import { describe, expect, it } from 'vitest';
import partido from '../test/contrato/partido-base.json';
import miembrosLocal from '../test/contrato/miembros-local.json';
import miembrosVisitante from '../test/contrato/miembros-visitante.json';
import alineacion from '../test/contrato/alineacion.json';
import eventos from '../test/contrato/eventos.json';
import bloqueados from '../test/contrato/bloqueados.json';
import { armarPartido, cuerpoEvento } from './partido';

const roster = { home: miembrosLocal, away: miembrosVisitante };
const armar = (cambios = {}) => armarPartido({ partido, roster, alineacion, eventos, bloqueados: [], ...cambios });

// Spec 0027, criterios 5 a 7: el partido se arma por personaId con las respuestas reales del backend.
describe('armarPartido por persona (spec 0027)', () => {
  it('cadaJugadorTieneSuNumero_yNingunoSeRepite', () => {
    const m = armar();

    expect(m.homeRoster).toHaveLength(6);
    expect(m.awayRoster).toHaveLength(6);
    expect(m.homeRoster.map((p) => p.num)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(m.homeRoster.map((p) => p.personaId)).size).toBe(6);
    expect(m.homeRoster[0]).toMatchObject({ num: 1, personaId: miembrosLocal[0].personaId, name: 'Andrés Gómez' });
  });

  it('alineacion_marcaEnCanchaPorPersona', () => {
    const soloDosLocales = alineacion.filter((a) => [miembrosLocal[0].personaId, miembrosLocal[2].personaId].includes(a.personaId));

    const m = armar({ alineacion: soloDosLocales });

    expect(m.onFieldHome).toEqual([1, 3]);
    expect(m.onFieldAway).toEqual([]);
    expect(armar().onFieldAway).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('miembroSinCuentaNiDocumento_esUnJugadorMasConSuNombre', () => {
    const sinCuenta = { ...miembrosLocal[1], personaId: 'persona-sin-cuenta', numeroDocumento: null, nombre: 'Pedro Invitado', tieneCuenta: false };

    const m = armar({ roster: { home: [...miembrosLocal, sinCuenta], away: miembrosVisitante } });

    expect(m.homeRoster).toHaveLength(7);
    expect(m.homeRoster[6]).toMatchObject({ num: 7, personaId: 'persona-sin-cuenta', name: 'Pedro Invitado' });
    expect(new Set(m.homeRoster.map((p) => p.num)).size).toBe(7);
  });

  it('eventos_seCruzanConElRosterPorPersona', () => {
    const m = armar();
    const gol = m.events.find((e) => e.type === 'gol');

    expect(gol).toMatchObject({ side: 'home', player: 'Juan Castro', personaId: eventos[0].personaId });
    expect(gol.num).toBe(miembrosLocal.findIndex((x) => x.personaId === eventos[0].personaId) + 1);
    expect(m.scoreH).toBe(eventos.filter((e) => e.tipoEvento === 'GOL' && e.equipoTorneoId === partido.localEquipoTorneoId).length);
  });

  it('golDeWO_sinPersona_saleComoWO_yCuentaEnElMarcador', () => {
    const golWO = { ...eventos[0], id: 'wo-1', orden: 99, personaId: null, jugadorNombre: null, equipoTorneoId: partido.visitanteEquipoTorneoId };

    const m = armar({ eventos: [...eventos, golWO] });
    const wo = m.events.find((e) => e.id === 'wo-1');

    expect(wo).toMatchObject({ num: null, player: '(WO)', personaId: null, side: 'away' });
    expect(m.scoreA).toBe(armar().scoreA + 1);
  });

  it('suspendido_seMarcaPorPersona', () => {
    const m = armar({ bloqueados });
    const suspendida = m.homeRoster.find((p) => p.personaId === bloqueados[0].personaId);

    expect(suspendida.suspension).toEqual(bloqueados[0]);
    expect(m.homeRoster.filter((p) => p.suspension)).toHaveLength(1);
  });

  it('cuerpoDelEvento_llevaPersonaId', () => {
    const m = armar();

    expect(cuerpoEvento(m.awayRoster[1], partido.visitanteEquipoTorneoId, 'amarilla')).toEqual({
      personaId: miembrosVisitante[1].personaId,
      equipoTorneoId: partido.visitanteEquipoTorneoId,
      tipoEvento: 'AMARILLA',
    });
  });
});
