import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude/ guarda worktrees con su propia copia del proyecto: no se lintean desde aquí.
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { import: importPlugin },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      // Resuelve imports sin extensión a .js/.jsx (el resto los maneja Vite).
      'import/resolver': { node: { extensions: ['.js', '.jsx', '.json'] } },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Caza imports a archivos LOCALES inexistentes (lo que dejó pasar el build
      // roto de JugadorPreview). Se verifican solo rutas relativas: los paquetes
      // de node_modules ya los valida npm/build, y los assets (css/imágenes) los
      // resuelve Vite, no la resolución de Node.
      'import/no-unresolved': ['error', {
        ignore: ['^[^.]', '\\.css$', '\\.png$', '\\.jpe?g$', '\\.svg$'],
      }],
    },
  },
  {
    // Archivos que corren en Node (E2E de Playwright y configs), no en el navegador.
    files: ['e2e/**/*.js', 'playwright.config.js', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Tests de Vitest y sus helpers: corren en Node y no pasan por fast refresh.
    files: ['src/**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
