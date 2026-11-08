import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = process.cwd();

function archivosDe(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivosDe(ruta) : [ruta];
  });
}

// Spec 0027, criterios 14 y 17: la web identifica a las personas por personaId (y a las cuentas
// por cuentaId), nunca por la cédula, y no llama al padrón eliminado (/api/jugadores).
// Se permiten:
// - "Cédula de ciudadanía" y "Cédula de extranjería": son nombres de tipos de documento;
// - 'codecup_cedula': la clave de una sesión vieja, que session.js borra de localStorage.
const PERMITIDO = /C[ée]dula de (ciudadan|extranjer)|codecup_cedula/gi;
const PROHIBIDO = [/c[eé]dula/i, /\/api\/jugadores/];

/** Archivos que todavía faltan por adaptar. Se vacía commit a commit hasta quedar vacía. */
const PENDIENTES = [
  'src/api/cuentas.js',
  'src/api/jugadores.js',
  'src/api/supercopa.js',
  'src/pages/AdminDashboard.jsx',
  'src/pages/JugadorDashboard.jsx',
  'src/pages/admin/ConfigurarTorneoView.jsx',
  'src/pages/admin/GestionarEquiposView.jsx',
  'src/pages/admin/UsuariosView.jsx',
  'src/pages/admin/finanzas/MultasActivasView.jsx',
  'src/pages/admin/usuarios/AssignAdminModal.jsx',
  'src/pages/admin/usuarios/AssignRoleModal.jsx',
  'src/pages/admin/usuarios/DeleteUserModal.jsx',
  'src/pages/admin/usuarios/RevokeRoleModal.jsx',
  'src/pages/admin/usuarios/UsersTable.jsx',
  'src/pages/delegado/MiEquipoTab.jsx',
  'src/pages/delegado/SolicitudesTab.jsx',
];

/** Código de src/ (sin tests ni helpers de test) que todavía nombra la cédula o el padrón. */
function archivosConCedula() {
  return archivosDe(join(raiz, 'src'))
    .filter((f) => /\.(js|jsx)$/.test(f))
    .filter((f) => !/\.test\.(js|jsx)$/.test(f) && !f.includes(`${sep}test${sep}`))
    .filter((f) => {
      const texto = readFileSync(f, 'utf8').replace(PERMITIDO, '');
      return PROHIBIDO.some((patron) => patron.test(texto));
    })
    .map((f) => relative(raiz, f).split(sep).join('/'))
    .sort();
}

describe('sin cédula (spec 0027)', () => {
  it('ningunArchivoNuevoUsaLaCedulaNiElPadron', () => {
    expect(archivosConCedula().filter((f) => !PENDIENTES.includes(f))).toEqual([]);
  });

  it('laListaDePendientesSoloTieneArchivosSinAdaptar', () => {
    const conCedula = new Set(archivosConCedula());
    expect(PENDIENTES.filter((f) => !conCedula.has(f))).toEqual([]);
  });
});
