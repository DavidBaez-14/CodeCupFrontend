import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * E2E de la spec 0027 (identidad por persona), en móvil y con la red simulada.
 * Las respuestas salen de src/test/contrato/, copiadas del backend real después de M2,
 * así que los flujos se prueban con la forma que tiene el contrato de verdad.
 */

const contrato = (archivo) => JSON.parse(readFileSync(new URL(`../src/test/contrato/${archivo}`, import.meta.url), 'utf8'));

const meDelegado = contrato('me-delegado.json');
const partidoBase = contrato('partido-base.json');
const miembrosLocal = contrato('miembros-local.json');
const miembrosVisitante = contrato('miembros-visitante.json');
const alineacionReal = contrato('alineacion.json');
const cuentasAdmin = contrato('cuentas-admin.json');

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

/** Sesión ya iniciada (lo que dejaría el login real en localStorage). */
async function iniciarSesion(page, { rol, roles, nombre }) {
  await page.addInitScript(([r, rs, n]) => {
    localStorage.setItem('codecup_token', 'fake.jwt');
    localStorage.setItem('codecup_rol', r);
    localStorage.setItem('codecup_nombre', n);
    localStorage.setItem('codecup_roles', JSON.stringify(rs));
  }, [rol, roles, nombre]);
}

/** Solo las peticiones al backend: un glob **\/api/** también atraparía los módulos /src/api/*.js. */
function alBackend(url) {
  return url.pathname.startsWith('/api/');
}

test.describe('Identidad por persona (spec 0027, móvil, red simulada)', () => {
  test('delegado: agrega a alguien sin cuenta con documento y nombre, y lo quita por personaId', async ({ page }) => {
    await iniciarSesion(page, { rol: 'DELEGADO', roles: ['DELEGADO', 'JUGADOR'], nombre: meDelegado.nombre });
    const plantel = [...miembrosLocal];
    const llamadas = { agregar: null, remover: null };

    await page.route(alBackend, async (route) => {
      const req = route.request();
      const p = new URL(req.url()).pathname;
      if (p === '/api/auth/me') return route.fulfill(json(meDelegado));
      if (p.endsWith('/delegado/equipos/mi-equipo')) return route.fulfill(json({ id: 'eq-1', nombre: 'Halcones FC' }));
      if (p.endsWith('/delegado/inscripciones/mias')) {
        return route.fulfill(json([{ id: 'et-1', torneoNombre: 'Copa Prueba 2026', estadoInscripcion: 'APROBADO' }]));
      }
      if (p.endsWith('/delegado/equipo-torneo/et-1/miembros') && req.method() === 'GET') return route.fulfill(json(plantel));
      if (p.endsWith('/delegado/equipo-torneo/et-1/miembros') && req.method() === 'POST') {
        llamadas.agregar = req.postDataJSON();
        const nuevo = {
          ...miembrosLocal[1],
          personaId: 'persona-nueva',
          numeroDocumento: llamadas.agregar.numeroDocumento.replace(/\D/g, ''),
          nombre: llamadas.agregar.nombre,
          numeroCamiseta: llamadas.agregar.numeroCamiseta,
          esDelegado: false,
          tieneCuenta: false,
        };
        plantel.push(nuevo);
        return route.fulfill(json(nuevo));
      }
      const remover = p.match(/\/delegado\/equipo-torneo\/et-1\/miembros\/([^/]+)\/remover$/);
      if (remover) {
        llamadas.remover = remover[1];
        plantel.splice(plantel.findIndex((m) => m.personaId === remover[1]), 1);
        return route.fulfill(json({}));
      }
      return route.fulfill(json([]));
    });

    await page.goto('/dashboard/delegado');
    await expect(page.getByText('Juan Castro')).toBeVisible();

    await page.getByLabel('Número de documento').fill('1.098.765');
    await page.getByLabel('Nombre completo').fill('Pedro Invitado');
    await page.getByRole('button', { name: 'Agregar al plantel' }).click();

    await expect(page.getByText('Pedro Invitado agregado al plantel.', { exact: true })).toBeVisible();
    expect(llamadas.agregar).toEqual({ tipoDocumento: 'CC', numeroDocumento: '1.098.765', nombre: 'Pedro Invitado', numeroCamiseta: null });
    const fila = page.locator('li', { hasText: 'Pedro Invitado' });
    await expect(fila.getByText('Sin cuenta')).toBeVisible();

    await fila.getByTitle('Eliminar').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect.poll(() => llamadas.remover).toBe('persona-nueva');
    await expect(page.locator('li', { hasText: 'Pedro Invitado' })).toHaveCount(0);
  });

  test('árbitro: mete a una jugadora en cancha y le registra un gol, por personaId', async ({ page }) => {
    await iniciarSesion(page, { rol: 'ARBITRO', roles: ['ARBITRO', 'JUGADOR'], nombre: 'Árbitro Uno' });
    const partido = { ...partidoBase, estado: 'EN_CURSO' };
    const sofia = miembrosLocal.find((m) => m.nombre === 'Sofía Moreno');
    // Al empezar solo el capitán local está en cancha.
    let alineacion = alineacionReal.filter((a) => a.personaId === miembrosLocal[0].personaId);
    const eventos = [];
    const llamadas = { alineacion: null, evento: null };

    await page.route(alBackend, async (route) => {
      const req = route.request();
      const p = new URL(req.url()).pathname;
      const base = `/api/supercopa/admin/partidos/${partido.id}`;
      if (p === '/api/auth/me') return route.fulfill(json({ ...meDelegado, roles: ['ARBITRO', 'JUGADOR'] }));
      if (p === '/api/supercopa/admin/torneos') {
        return route.fulfill(json([{ id: partido.torneoId, nombre: 'Liga Relámpago (prueba)', estado: 'EN_CURSO' }]));
      }
      if (p === `/api/supercopa/admin/torneos/${partido.torneoId}/partidos`) return route.fulfill(json([partido]));
      if (p === `/api/supercopa/admin/equipo-torneo/${partido.localEquipoTorneoId}/miembros`) return route.fulfill(json(miembrosLocal));
      if (p === `/api/supercopa/admin/equipo-torneo/${partido.visitanteEquipoTorneoId}/miembros`) return route.fulfill(json(miembrosVisitante));
      if (p === `${base}/alineacion` && req.method() === 'GET') return route.fulfill(json(alineacion));
      if (p === `${base}/alineacion` && req.method() === 'POST') {
        llamadas.alineacion = req.postDataJSON();
        const fila = { ...alineacionReal[0], id: 'pj-nueva', ...llamadas.alineacion, jugadorNombre: sofia.nombre, jugo: true };
        alineacion = [...alineacion, fila];
        return route.fulfill(json(fila));
      }
      if (p === `${base}/eventos` && req.method() === 'GET') return route.fulfill(json(eventos));
      if (p === `${base}/eventos` && req.method() === 'POST') {
        llamadas.evento = req.postDataJSON();
        const evento = { id: 'ev-1', orden: 1, ...llamadas.evento, jugadorNombre: sofia.nombre, equipoNombre: partido.localNombre };
        eventos.push(evento);
        return route.fulfill(json(evento));
      }
      return route.fulfill(json([]));
    });

    await page.goto('/dashboard/arbitro');
    await page.getByRole('button', { name: /Halcones FC/ }).first().click();

    const filaSofia = page.locator('.ar-player-row', { hasText: 'Sofía Moreno' });
    await filaSofia.getByTitle('Agregar a cancha').click();
    await expect.poll(() => llamadas.alineacion).toEqual({ personaId: sofia.personaId, equipoTorneoId: partido.localEquipoTorneoId });
    await expect(filaSofia.getByText('En cancha')).toBeVisible();

    await page.getByRole('button', { name: 'Eventos', exact: true }).click();
    await page.locator('.ar-player-chip', { hasText: 'Sofía Moreno' }).click();
    await page.getByRole('button', { name: 'Registrar evento' }).click();
    await expect.poll(() => llamadas.evento).toEqual({
      personaId: sofia.personaId,
      equipoTorneoId: partido.localEquipoTorneoId,
      tipoEvento: 'GOL',
    });
  });

  test('admin: bloquea una cuenta por cuentaId desde Usuarios y conserva el historial', async ({ page }) => {
    await iniciarSesion(page, { rol: 'ADMINISTRADOR', roles: ['ADMINISTRADOR', 'JUGADOR'], nombre: 'Admin Uno' });
    const objetivo = cuentasAdmin.content[1];
    const llamadas = { bloquear: null, motivo: null };

    await page.route(alBackend, async (route) => {
      const req = route.request();
      const p = new URL(req.url()).pathname;
      if (p === '/api/auth/me') return route.fulfill(json({ ...meDelegado, roles: ['ADMINISTRADOR', 'JUGADOR'] }));
      if (p === '/api/admin/cuentas') {
        const content = cuentasAdmin.content.map((c) => (c.id === llamadas.bloquear ? { ...c, estado: 'BLOQUEADA', roles: [] } : c));
        return route.fulfill(json({ ...cuentasAdmin, content }));
      }
      const bloquear = p.match(/^\/api\/admin\/roles\/cuenta\/([^/]+)$/);
      if (bloquear && req.method() === 'DELETE') {
        llamadas.bloquear = bloquear[1];
        llamadas.motivo = req.postDataJSON()?.motivo;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fulfill(json([]));
    });

    await page.goto('/dashboard/admin');
    await page.getByRole('button', { name: 'Usuarios' }).click();

    const fila = page.locator('tr', { hasText: objetivo.correo });
    await fila.getByRole('button', { name: 'Bloquear' }).click();
    await expect(page.getByText(/se conservan sus equipos, partidos y estadísticas/)).toBeVisible();
    await page.getByLabel(/Motivo/).fill('Expulsada por conducta antideportiva');
    await page.getByRole('button', { name: 'Bloquear cuenta' }).click();

    await expect.poll(() => llamadas.bloquear).toBe(objetivo.id);
    expect(llamadas.motivo).toBe('Expulsada por conducta antideportiva');
    await expect(fila.getByText('Bloqueada')).toBeVisible();
  });
});
