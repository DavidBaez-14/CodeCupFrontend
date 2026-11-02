import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({ renovarSesion: vi.fn(), cerrarSesion: vi.fn() }));
vi.mock('../utils/navegacion', () => ({ irA: vi.fn() }));

import { requestJson } from './http';
import { cerrarSesion, renovarSesion } from '../lib/supabase';
import { irA } from '../utils/navegacion';

function respuesta(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function headerAuth(llamada) {
  const headers = llamada[1]?.headers;
  return headers instanceof Headers ? headers.get('Authorization') : headers?.Authorization;
}

// Spec 0019, criterio 4: el 401 renueva la sesión una sola vez; la cuenta bloqueada cierra la sesión.
describe('requestJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('401_renuevaYReintentaUnaVez', async () => {
    fetch
      .mockResolvedValueOnce(respuesta(401, { code: 'NO_AUTENTICADO', mensaje: 'Inicia sesión' }))
      .mockResolvedValueOnce(respuesta(200, { ok: 1 }));
    renovarSesion.mockResolvedValue('nuevo');

    const data = await requestJson('/api/x', { headers: { Authorization: 'Bearer viejo' } });

    expect(data).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(headerAuth(fetch.mock.calls[1])).toBe('Bearer nuevo');
    expect(renovarSesion).toHaveBeenCalledTimes(1);
  });

  it('401_otraVez_noReintentaMas', async () => {
    fetch.mockResolvedValue(respuesta(401, { code: 'NO_AUTENTICADO', mensaje: 'Inicia sesión' }));
    renovarSesion.mockResolvedValue('nuevo');

    await expect(requestJson('/api/x', { headers: { Authorization: 'Bearer viejo' } }))
      .rejects.toMatchObject({ status: 401 });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(renovarSesion).toHaveBeenCalledTimes(1);
  });

  it('renovacionFallida_limpiaYVaAlLogin', async () => {
    fetch.mockResolvedValue(respuesta(401, { code: 'NO_AUTENTICADO', mensaje: 'Inicia sesión' }));
    renovarSesion.mockResolvedValue(null);

    await expect(requestJson('/api/x', { headers: { Authorization: 'Bearer viejo' } }))
      .rejects.toMatchObject({ status: 401 });

    expect(cerrarSesion).toHaveBeenCalled();
    expect(irA).toHaveBeenCalledWith('/login?aviso=sesion-vencida');
  });

  it('cuentaBloqueada_cierraSesion', async () => {
    fetch.mockResolvedValue(respuesta(403, { code: 'CUENTA_BLOQUEADA', mensaje: 'bloqueada' }));

    await expect(requestJson('/api/x', { headers: { Authorization: 'Bearer t' } }))
      .rejects.toMatchObject({ status: 403 });

    expect(cerrarSesion).toHaveBeenCalled();
    expect(irA).toHaveBeenCalledWith('/login?aviso=bloqueada');
  });

  it('401SinAuthorization_noRenueva', async () => {
    fetch.mockResolvedValue(respuesta(401, { code: 'NO_AUTENTICADO', mensaje: 'Inicia sesión' }));

    await expect(requestJson('/api/x', {})).rejects.toMatchObject({ status: 401 });

    expect(renovarSesion).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('otro403_noCierraSesion', async () => {
    fetch.mockResolvedValue(respuesta(403, { code: 'ACCESO_DENEGADO', mensaje: 'Sin permisos' }));

    await expect(requestJson('/api/x', { headers: { Authorization: 'Bearer t' } }))
      .rejects.toThrow('Sin permisos');

    expect(cerrarSesion).not.toHaveBeenCalled();
  });
});
