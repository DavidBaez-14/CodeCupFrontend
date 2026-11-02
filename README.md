# CodeCup — Web

React 19 + Vite. Consume `BackendCodeCup` (Spring Boot, `:8082`) y entra con **Supabase Auth** (spec 0019).

## Arrancar en local

1. Copia `.env.example` como `.env.local` y completa:
   - `VITE_SUPABASE_URL`: la URL de Supabase #1;
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: la clave `sb_publishable_…`. Es pública por diseño; **nunca** pongas aquí la clave secreta;
   - `VITE_GATEWAY_URL=http://localhost:8082`.
2. Arranca el backend desde el Spring Boot Dashboard de VS Code.
3. `npm install` y `npm run dev`. La web queda en `http://localhost:5173`, que es el Site URL configurado en Supabase.

## Cómo se entra (spec 0019)

- **Registro:** correo y contraseña → correo de confirmación → `/auth/callback?token_hash=…` → `/complete-signup` (nombres y documento, solo a nuestro backend).
- **Login:** con contraseña o con Google. Los íconos eligen el rol con el que se entra.
- **Recuperación:** `/recuperar-contrasena` → correo → `/restablecer-contrasena`.
- **Invitaciones:** el admin crea el enlace en "Usuarios → Invitar usuario"; quien lo abre (`/invitacion/:token`) recibe el rol.
- **Sesión:** `codecup_token` guarda el access token de Supabase y se renueva solo. Ante un `401`, `api/http.js` renueva y reintenta una vez.

## Pruebas

```bash
npm test          # Vitest + Testing Library
npm run test:e2e  # Playwright con la red simulada (no toca Supabase ni el backend)
npm run lint
npm run build
```

Para probar contra Supabase #1 con datos, el backend trae un seed de usuarios de prueba (`@prueba.local`); ver el README de `BackendCodeCup`.
