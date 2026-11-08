import { beforeEach, describe, expect, it } from 'vitest';
import meDelegado from '../test/contrato/me-delegado.json';
import { clearSession, getCuentaId, getPersonaId, guardarSesionDesdeMe } from './session';

// Spec 0027, criterio 1: la sesión guarda personaId y cuentaId, no el documento.
describe('sesión por persona (spec 0027)', () => {
  beforeEach(() => localStorage.clear());

  it('guardaPersonaYCuentaDesdeMe_sinDocumento', () => {
    guardarSesionDesdeMe(meDelegado, 'DELEGADO');

    expect(getPersonaId()).toBe(meDelegado.personaId);
    expect(getCuentaId()).toBe(meDelegado.cuentaId);
    expect(localStorage.getItem('codecup_rol')).toBe('DELEGADO');
    const guardado = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join(' ');
    expect(guardado).not.toContain(meDelegado.numeroDocumento);
  });

  it('borraLaClaveDeUnaSesionVieja', () => {
    localStorage.setItem('codecup_cedula', '1090123');

    guardarSesionDesdeMe(meDelegado, null);

    expect(localStorage.getItem('codecup_cedula')).toBeNull();
  });

  it('cerrarSesion_borraPersonaCuentaYClaveVieja', () => {
    guardarSesionDesdeMe(meDelegado, 'DELEGADO');
    localStorage.setItem('codecup_cedula', '1090123');

    clearSession();

    expect(getPersonaId()).toBeNull();
    expect(getCuentaId()).toBeNull();
    expect(localStorage.getItem('codecup_cedula')).toBeNull();
  });
});
