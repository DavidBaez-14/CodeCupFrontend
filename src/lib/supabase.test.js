import { beforeEach, describe, expect, it } from 'vitest';
import { aplicarEventoDeSesion } from './supabase';
import { getRol, getToken, setSession } from '../utils/session';

// Spec 0019, criterio 3: onAuthStateChange mantiene codecup_token para que las
// llamadas a getToken() del resto de la web no cambien.
describe('aplicarEventoDeSesion', () => {
  beforeEach(() => localStorage.clear());

  it('sincronizaElToken_segunElEvento', () => {
    aplicarEventoDeSesion('SIGNED_IN', { access_token: 'a1' });
    expect(getToken()).toBe('a1');

    aplicarEventoDeSesion('TOKEN_REFRESHED', { access_token: 'a2' });
    expect(getToken()).toBe('a2');

    aplicarEventoDeSesion('USER_UPDATED', { access_token: 'a3' });
    expect(getToken()).toBe('a3');

    setSession({ rol: 'JUGADOR', roles: ['JUGADOR'] });
    aplicarEventoDeSesion('SIGNED_OUT', null);
    expect(getToken()).toBeNull();
    expect(getRol()).toBeNull();
  });

  it('initialSessionVacia_noBorra', () => {
    setSession({ token: 'vigente', rol: 'DELEGADO' });

    aplicarEventoDeSesion('INITIAL_SESSION', null);

    expect(getToken()).toBe('vigente');
    expect(getRol()).toBe('DELEGADO');
  });
});
