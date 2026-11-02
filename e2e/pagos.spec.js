import { test, expect } from '@playwright/test';

/**
 * E2E del flujo de pagos del delegado (móvil, red mockeada).
 * Milestone M3 / spec 0011+0014: elegir torneo y subir el comprobante al correcto,
 * sin tocar el backend ni Supabase de producción.
 */

const inscripciones = [
  { id: 'et-A', torneoNombre: 'Copa A', equipoNombre: 'THE BOYS', estadoInscripcion: 'PENDIENTE_PAGO', montoInscripcion: 50000, fechaInscripcion: '2026-01-01T00:00:00' },
  { id: 'et-B', torneoNombre: 'Copa B', equipoNombre: 'THE BOYS', estadoInscripcion: 'PENDIENTE_PAGO', montoInscripcion: 80000, fechaInscripcion: '2026-02-01T00:00:00' },
];

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

test.describe('Pagos — flujo del delegado (móvil, red mockeada)', () => {
  let subirBody = null;

  test.beforeEach(async ({ page }) => {
    subirBody = null;

    // Sesión de delegado autenticado (lo que dejaría el login real en localStorage).
    await page.addInitScript(() => {
      localStorage.setItem('codecup_token', 'fake.jwt');
      localStorage.setItem('codecup_rol', 'DELEGADO');
      localStorage.setItem('codecup_nombre', 'Test Delegado');
      localStorage.setItem('codecup_cedula', '12345');
      localStorage.setItem('codecup_roles', JSON.stringify(['DELEGADO']));
    });

    // Solo interceptamos llamadas cuya ruta EMPIEZA por /api/ (las peticiones reales al backend).
    // OJO: un glob **/api/** también matchearía los módulos fuente /src/api/*.js y rompería la app.
    await page.route((url) => url.pathname.startsWith('/api/'), (route) => {
      const p = new URL(route.request().url()).pathname;
      const method = route.request().method();
      if (p.endsWith('/api/supercopa/mi-perfil')) {
        return route.fulfill(json({ alturaCm: 175, piernaHabil: 'DERECHA', posicion: 'MEDIOCAMPISTA', nombre: 'Test Delegado' }));
      }
      if (p.endsWith('/delegado/equipos/mi-equipo')) return route.fulfill(json({ id: 'eq-1', nombre: 'THE BOYS' }));
      if (p.endsWith('/delegado/inscripciones/mias')) return route.fulfill(json(inscripciones));
      if (p.endsWith('/comprobantes/mis-comprobantes')) return route.fulfill(json([]));
      if (p.endsWith('/comprobantes/upload-url')) return route.fulfill(json({ uploadUrl: 'https://storage.test/put/comprobante', fileKey: 'et-B/comprobante' }));
      if (p.endsWith('/api/finanzas/comprobantes') && method === 'POST') {
        subirBody = route.request().postDataJSON();
        return route.fulfill(json({ id: 'comp-1', ...subirBody, estado: 'PENDIENTE_REVISION' }));
      }
      return route.fulfill(json([])); // fallback para cualquier otro /api
    });
    // PUT del archivo al Storage (URL firmada simulada) — no es /api.
    await page.route('https://storage.test/**', (r) => r.fulfill({ status: 200, body: '' }));
  });

  test('elige el torneo y sube el comprobante al SELECCIONADO', async ({ page }) => {
    await page.goto('/dashboard/delegado');

    // Ir a la pestaña Pagos.
    await page.getByRole('button', { name: /pagos/i }).click();

    // Un único selector con una opción por torneo pendiente.
    const select = page.getByLabel(/torneo/i);
    await expect(select).toBeVisible();
    await expect(select.locator('option')).toHaveCount(2);

    // Elegir Copa B, adjuntar archivo y enviar.
    await select.selectOption('et-B');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'pago.pdf', mimeType: 'application/pdf', buffer: Buffer.from('contenido-pdf'),
    });
    await page.getByRole('button', { name: /enviar pago/i }).click();

    // Se registró contra el torneo seleccionado (et-B), y hay confirmación en pantalla
    // (aparece como banner y como toast, por eso .first()).
    await expect(page.getByText(/comprobante enviado/i).first()).toBeVisible();
    expect(subirBody).toMatchObject({ tipo: 'INSCRIPCION', referenciaId: 'et-B' });
  });
});
