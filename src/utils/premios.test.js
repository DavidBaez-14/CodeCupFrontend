import { describe, expect, it } from 'vitest';
import premios from '../test/contrato/premios.json';
import { nombreGanador, premioTieneGanador } from './premios';

const [campeon, mvp, juegoLimpio] = premios;

// Spec 0027, criterio 8: el ganador de un premio individual se reconoce por ganadorPersonaId y se muestra por nombre.
describe('ganador de un premio (spec 0027)', () => {
  it('premioDeEquipo_ganaElEquipo', () => {
    expect(premioTieneGanador(campeon)).toBe(true);
    expect(nombreGanador(campeon)).toBe('Halcones FC');
  });

  it('premioIndividual_ganaLaPersonaPorSuNombre', () => {
    expect(premioTieneGanador(mvp)).toBe(true);
    expect(nombreGanador(mvp)).toBe('Juan Castro');
  });

  it('sinGanador_quedaLibre', () => {
    expect(premioTieneGanador(juegoLimpio)).toBe(false);
    expect(nombreGanador(juegoLimpio)).toBeNull();
  });

  it('individualSinNombre_noMuestraUnIdentificador', () => {
    expect(nombreGanador({ ...mvp, ganadorNombre: null })).toBe('Jugador');
  });
});
