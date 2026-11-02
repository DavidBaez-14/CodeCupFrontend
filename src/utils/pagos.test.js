import { describe, it, expect } from 'vitest';
import {
  comprobanteDeInscripcion,
  puedeSubir,
  inscripcionesSubibles,
} from './pagos';

const insc = (id, estadoInscripcion = 'PENDIENTE_PAGO') => ({
  id,
  estadoInscripcion,
  torneoNombre: `Torneo ${id}`,
});

describe('comprobanteDeInscripcion', () => {
  it('encuentra el comprobante por referenciaId', () => {
    const comps = [{ referenciaId: 'a', estado: 'RECHAZADO' }, { referenciaId: 'b', estado: 'APROBADO' }];
    expect(comprobanteDeInscripcion(comps, 'b')).toEqual({ referenciaId: 'b', estado: 'APROBADO' });
  });

  it('devuelve null si no hay coincidencia o la entrada no es array', () => {
    expect(comprobanteDeInscripcion([], 'x')).toBeNull();
    expect(comprobanteDeInscripcion(undefined, 'x')).toBeNull();
  });
});

describe('puedeSubir', () => {
  it('permite subir si está PENDIENTE_PAGO', () => {
    expect(puedeSubir(insc('a'))).toBe(true);
  });

  it('permite REEMPLAZAR aunque el comprobante esté EN REVISIÓN (corregir foto)', () => {
    // El estado del comprobante ya no bloquea: mientras la inscripción siga pendiente, se puede reemplazar.
    expect(puedeSubir(insc('a'))).toBe(true);
  });

  it('NO permite subir si la inscripción no está PENDIENTE_PAGO', () => {
    expect(puedeSubir(insc('a', 'APROBADO'))).toBe(false);
    expect(puedeSubir(insc('a', 'EXPULSADO'))).toBe(false);
    expect(puedeSubir(insc('a', 'RECHAZADO'))).toBe(false);
  });
});

describe('inscripcionesSubibles', () => {
  it('incluye TODAS las PENDIENTE_PAGO (no solo una)', () => {
    const inscripciones = [insc('a'), insc('b'), insc('c')];
    expect(inscripcionesSubibles(inscripciones).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('mantiene una PENDIENTE_PAGO aunque tenga comprobante en revisión (para reemplazar)', () => {
    const inscripciones = [insc('a'), insc('b')];
    expect(inscripcionesSubibles(inscripciones).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('ignora estados de inscripción que no son PENDIENTE_PAGO', () => {
    const inscripciones = [insc('a', 'APROBADO'), insc('b', 'EXPULSADO'), insc('c')];
    expect(inscripcionesSubibles(inscripciones).map((i) => i.id)).toEqual(['c']);
  });

  it('devuelve [] si la entrada no es un array', () => {
    expect(inscripcionesSubibles(null)).toEqual([]);
  });
});
