import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = process.cwd();

function archivosDe(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivosDe(ruta) : [ruta];
  });
}

// Spec 0019, criterio 1: Appwrite sale por completo de la web.
describe('sin Appwrite', () => {
  it('noEsDependencia_ySeUsaSupabase', () => {
    const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies)).not.toContain('appwrite');
    expect(Object.keys(pkg.dependencies)).toContain('@supabase/supabase-js');
  });

  it('nadaLoImporta_yNoExisteLibAppwrite', () => {
    const fuentes = archivosDe(join(raiz, 'src')).filter((f) => /\.(js|jsx)$/.test(f) && !f.endsWith('sinAppwrite.test.js'));
    const conAppwrite = fuentes.filter((f) => /from ['"](appwrite|[./]+lib\/appwrite)['"]/.test(readFileSync(f, 'utf8')));
    expect(conAppwrite).toEqual([]);
    expect(fuentes.some((f) => f.endsWith(join('lib', 'appwrite.js')))).toBe(false);
  });
});
