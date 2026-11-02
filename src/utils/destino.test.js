import { describe, expect, it } from 'vitest';
import { resolverDestino } from './destino';

const me = (roles, rolesPendientes = []) => ({ roles, rolesPendientes });

// Spec 0019, criterio 10: a dónde entra cada quien según /me y el rol elegido con los íconos.
describe('resolverDestino', () => {
  it('conElRolElegido_entraASuDashboard', () => {
    expect(resolverDestino(me(['JUGADOR', 'DELEGADO']), 'DELEGADO'))
      .toEqual({ tipo: 'entrar', rol: 'DELEGADO', ruta: '/dashboard/delegado' });
  });

  it('adminElegidoSinElRol_noEntra', () => {
    expect(resolverDestino(me(['JUGADOR']), 'ADMINISTRADOR')).toEqual({ tipo: 'sin-admin' });
  });

  it('delegadoPendiente_vaAEspera', () => {
    expect(resolverDestino(me(['JUGADOR'], ['DELEGADO']), 'DELEGADO'))
      .toEqual({ tipo: 'pendiente', rol: 'DELEGADO' });
  });

  it('arbitroSinSolicitud_vaASolicitar', () => {
    expect(resolverDestino(me(['JUGADOR']), 'ARBITRO')).toEqual({ tipo: 'solicitar', rol: 'ARBITRO' });
  });

  it('sinRolElegido_entraConElPrincipal', () => {
    expect(resolverDestino(me(['JUGADOR', 'DELEGADO', 'ADMINISTRADOR']), null))
      .toEqual({ tipo: 'entrar', rol: 'ADMINISTRADOR', ruta: '/dashboard/admin' });
  });

  it('jugadorElegidoQueNoLoTiene_entraConElPrincipal', () => {
    expect(resolverDestino(me(['ARBITRO']), 'JUGADOR'))
      .toEqual({ tipo: 'entrar', rol: 'ARBITRO', ruta: '/dashboard/arbitro' });
  });

  it('normalizaMayusculas', () => {
    expect(resolverDestino(me(['jugador']), 'jugador'))
      .toEqual({ tipo: 'entrar', rol: 'JUGADOR', ruta: '/dashboard/jugador' });
  });
});
