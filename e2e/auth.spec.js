import { test, expect } from '@playwright/test';

/**
 * E2E de la entrada a la web con Supabase (spec 0019), en móvil y con la red simulada:
 * Supabase Auth (/auth/v1/*) y el backend (/api/*) responden desde aquí, así que no se
 * envía ningún correo ni se toca Supabase #1.
 */

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

function jwtFalso(email) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const ahora = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'ES256', typ: 'JWT' })}.${b64({
    sub: 'u-1', email, role: 'authenticated', aud: 'authenticated', iat: ahora, exp: ahora + 3600,
  })}.firma`;
}

function usuario(email) {
  return {
    id: 'u-1',
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
}

function sesion(email) {
  const ahora = Math.floor(Date.now() / 1000);
  return {
    access_token: jwtFalso(email),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: ahora + 3600,
    refresh_token: 'refresh-falso',
    user: usuario(email),
  };
}

const CORREO = 'ana@correo.test';
const meJugador = {
  cuentaId: 'c-1', personaId: 'p-1', nombre: 'Ana María Pérez', nombres: 'Ana María', apellidos: 'Pérez',
  correo: CORREO, tipoDocumento: 'CC', numeroDocumento: '1090123', estado: 'ACTIVA', roles: ['JUGADOR'], rolesPendientes: [],
  vinculoPendiente: null,
};

/**
 * Simula Supabase Auth y el backend. `registrado` arranca en false para el flujo de registro:
 * /api/auth/me responde 404 hasta que llega POST /api/auth/registro. Una cuenta recién
 * registrada no tiene perfil deportivo (spec 0020): /mi-perfil lo devuelve vacío.
 */
async function simularRed(page, { registrado = true } = {}) {
  const estado = { registrado, registroBody: null, nuevaContrasena: null, recuperacionPedida: false };

  await page.route((url) => url.pathname.startsWith('/auth/v1/'), async (route) => {
    const req = route.request();
    const { pathname, searchParams } = new URL(req.url());
    if (pathname.endsWith('/token') && searchParams.get('grant_type') === 'password') return route.fulfill(json(sesion(CORREO)));
    if (pathname.endsWith('/signup')) return route.fulfill(json({ ...usuario(CORREO), email_confirmed_at: null, confirmation_sent_at: new Date().toISOString() }));
    if (pathname.endsWith('/verify')) return route.fulfill(json(sesion(CORREO)));
    if (pathname.endsWith('/recover')) {
      estado.recuperacionPedida = true;
      return route.fulfill(json({}));
    }
    if (pathname.endsWith('/user') && req.method() === 'PUT') {
      estado.nuevaContrasena = req.postDataJSON()?.password ?? null;
      return route.fulfill(json(usuario(CORREO)));
    }
    if (pathname.endsWith('/user')) return route.fulfill(json(usuario(CORREO)));
    if (pathname.endsWith('/logout')) return route.fulfill({ status: 204, body: '' });
    return route.fulfill(json({}));
  });

  // Solo rutas que EMPIEZAN por /api/: un glob **/api/** también atraparía los módulos /src/api/*.js.
  await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());
    if (pathname === '/api/auth/me') {
      return estado.registrado
        ? route.fulfill(json(meJugador))
        : route.fulfill(json({ code: 'CUENTA_NO_REGISTRADA', mensaje: 'Completa tu registro.', status: 404 }, 404));
    }
    if (pathname === '/api/auth/registro' && req.method() === 'POST') {
      estado.registroBody = req.postDataJSON();
      estado.registrado = true;
      return route.fulfill(json(meJugador, 201));
    }
    if (pathname.endsWith('/api/supercopa/mi-perfil')) {
      const deportivo = estado.registroBody
        ? { alturaCm: null, piernaHabil: null, posicion: null }
        : { alturaCm: 170, piernaHabil: 'DERECHA', posicion: 'DELANTERO' };
      return route.fulfill(json({ nombre: 'Ana María Pérez', ...deportivo, equipos: [], partidos: [], titulos: [] }));
    }
    return route.fulfill(json([]));
  });

  return estado;
}

test.describe('Entrar a la web con Supabase (spec 0019, móvil, red simulada)', () => {
  test('login con contraseña → dashboard del jugador', async ({ page }) => {
    await simularRed(page);
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill(CORREO);
    await page.getByLabel('Contraseña').fill('secreta123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/dashboard\/jugador$/);
    expect(await page.evaluate(() => localStorage.getItem('codecup_rol'))).toBe('JUGADOR');
    expect(await page.evaluate(() => localStorage.getItem('codecup_token'))).toBeTruthy();
  });

  test('registro completo: correo → enlace → completar datos → dashboard', async ({ page }) => {
    const estado = await simularRed(page, { registrado: false });
    await page.goto('/signup');

    await page.getByLabel('Correo electrónico').fill(CORREO);
    await page.getByLabel('Contraseña', { exact: true }).fill('secreta123');
    await page.getByLabel('Confirmar contraseña').fill('secreta123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByText('Revisa tu correo')).toBeVisible();

    // El enlace del correo de confirmación.
    await page.goto('/auth/callback?token_hash=hash-de-prueba&type=email');
    await expect(page).toHaveURL(/\/complete-signup$/);

    await page.getByLabel('Nombres').fill('Ana María');
    await page.getByLabel('Apellidos').fill('Pérez');
    await page.getByLabel('Número de documento').fill('1090123');
    await page.getByRole('button', { name: 'Completar registro' }).click();

    await expect(page).toHaveURL(/\/dashboard\/jugador$/);
    expect(estado.registroBody).toEqual({
      nombres: 'Ana María', apellidos: 'Pérez', tipoDocumento: 'CC', numeroDocumento: '1090123',
    });

    // Spec 0020: sin perfil deportivo entra directo al panel, sin modal de bienvenida.
    await expect(page.getByRole('heading', { name: 'Unirme a un equipo' })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('recuperar la contraseña: pedir enlace → elegir otra → volver al login', async ({ page }) => {
    const estado = await simularRed(page);
    await page.goto('/login');

    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await page.getByLabel('Correo electrónico').fill(CORREO);
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.getByText('Si hay una cuenta con ese correo, te enviamos un enlace.')).toBeVisible();
    expect(estado.recuperacionPedida).toBe(true);

    // El enlace del correo de recuperación.
    await page.goto('/auth/callback?token_hash=hash-recuperacion&type=recovery');
    await expect(page).toHaveURL(/\/restablecer-contrasena$/);

    await page.getByLabel('Contraseña nueva').fill('nueva12345');
    await page.getByLabel('Confirmar contraseña').fill('nueva12345');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    await expect(page).toHaveURL(/\/login\?aviso=contrasena-actualizada$/);
    await expect(page.getByText('Ya puedes entrar con tu contraseña nueva.')).toBeVisible();
    expect(estado.nuevaContrasena).toBe('nueva12345');
  });
});
