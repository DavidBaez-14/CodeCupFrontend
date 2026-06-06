# Frontend · Changelog Junio 2026

> **Versión:** Pre-release sprint del módulo de Usuarios + Signup inteligente
> **Periodo cubierto:** Cambios pendientes de commit a fecha de hoy (no incluidos en `main`)
> **Documentos relacionados:** [`docs/evolucion_y_decisiones.md`](evolucion_y_decisiones.md) (decisiones de UI/UX y patrones reutilizables), [`src/AGENT/tab_gestion_usuarios.md`](../src/AGENT/tab_gestion_usuarios.md) (guía interna del módulo).

---

## TL;DR para el equipo

Tres bloques principales:

1. **Módulo "Usuarios" en el panel del administrador** — nueva pestaña con tabla paginada, crear cuenta manual, asignar/revocar roles, eliminar. Consume los endpoints nuevos del backend MS1.
2. **Signup más inteligente** — cuando el jugador digita una cédula que ya está en el padrón oficial, se ocultan los campos académicos (rol, código, semestre) porque el backend los toma del padrón directamente.
3. **Fix global de `<select>` en dark mode** — los dropdowns nativos abrían con fondo blanco rompiendo el tema. Resuelto con `color-scheme: dark` en `global.css`.

---

## 1. Funcionalidades nuevas

### 1.1 Módulo "Usuarios" (panel admin)

Nueva entrada en el sidebar del admin debajo de "Solicitudes pendientes". Permite gestionar TODAS las cuentas del sistema, no solo aprobar/rechazar las que ya solicitaron rol.

**Estructura modular:**

```
src/pages/admin/
├── UsuariosView.jsx                  ← vista principal, orquesta estado + modales
└── usuarios/
    ├── UsersTable.jsx                ← tabla paginada + dropdown "Roles" por fila
    ├── RoleChips.jsx                 ← chips de colores por rol
    ├── Toast.jsx                     ← feedback bottom-right auto-dismiss
    ├── CreateUserModal.jsx           ← 2 pasos: formulario → password reveal con copiar
    ├── AssignRoleModal.jsx           ← delegado/árbitro + motivo
    ├── AssignAdminModal.jsx          ← modal rojo con doble confirmación (escribir "CONFIRMAR")
    ├── RevokeRoleModal.jsx           ← confirma + motivo
    └── DeleteUserModal.jsx           ← confirma + motivo
```

**Capabilities:**
- Búsqueda libre por cédula/nombre/correo (debounce 280ms para no saturar el backend).
- Filtro por rol APROBADO.
- Paginación con ventana de 5 botones.
- Modal de crear usuario muestra password aleatoria UNA sola vez con botón de copiar al clipboard.
- Modal de asignar admin requiere escribir literalmente `CONFIRMAR` para habilitar el botón rojo (única acción con esa fricción extra).
- Toast verde de éxito / rojo de error tras cada acción.

**Archivos nuevos:**
- `src/api/cuentas.js` — funciones `listarCuentas`, `crearCuenta`, `asignarRol`, `revocarRol`, `eliminarCuenta`
- `src/pages/admin/UsuariosView.jsx`
- `src/pages/admin/usuarios/` (8 componentes modulares)
- `src/styles/admin-usuarios.css` — namespace `u-` (`u-modal`, `u-btn`, `u-input`) para no colisionar con `admin.css`

**Archivos modificados:**
- `src/pages/AdminDashboard.jsx` — sumó entrada "Usuarios" al `SIDEBAR_GROUPS` y rutea el render

### 1.2 Padrón preview en signup

En `SignupPage.jsx` ahora hay un `useEffect` con debounce 400ms sobre el campo `cedula` cuando el `tipoCuenta` es JUGADOR:

1. Llama a `GET /api/auth/padron-preview/{cedula}` (endpoint público nuevo en MS1).
2. Si `enPadron = true`:
   - Banner verde "✓ Encontramos tu información en el padrón oficial: [nombre]. Tu cuenta de jugador quedará activa de inmediato."
   - **Oculta** los campos `rolJugador`, `codigoUniversitario`, `semestre`, `motivoSolicitud`.
   - La validación previa al submit deja de exigirlos.
   - El backend ignora cualquier valor que mande el frontend y copia del padrón directamente.
3. Si `enPadron = false`:
   - Banner amarillo "Tu cédula no aparece en el padrón. Completa los datos abajo: un administrador revisará tu caso."
   - Muestra los campos como antes.

**Archivos modificados:**
- `src/api/auth.js` — sumó `padronPreview(cedula)`
- `src/pages/SignupPage.jsx` — `useEffect` con debounce + render condicional de campos

**Decisión clave:** el endpoint preview NO expone semestre ni código universitario por privacidad. Solo confirma si la cédula está y el nombre.

### 1.3 Tab de gestión de usuarios (documentación interna)

Archivo nuevo: `src/AGENT/tab_gestion_usuarios.md` — guía interna para el equipo / agentes IA sobre cómo usar y extender el módulo de Usuarios. Útil si más adelante alguien tiene que agregar features al módulo.

---

## 2. Fixes globales y mejoras de UI

### 2.1 `<select>` con fondo blanco en dark mode (fix global)

**Síntoma:** cualquier `<select>` en la app abría el dropdown nativo con fondo blanco que rompía el dark theme.

**Causa:** los `<option>` heredan estilos del SO, no del CSS de la página. Por defecto se renderizan en modo claro.

**Fix aplicado en `src/styles/global.css`:**
```css
select { color-scheme: dark; }
select option, select optgroup {
  background-color: var(--color-bg-elevated, #0d1429);
  color: var(--color-fg, #ffffff);
}
select option:checked { background-color: var(--color-brand-subtle, ...); }
select option:disabled { color: var(--color-fg-disabled, ...); }
```

`color-scheme: dark` le indica al navegador que renderice el popup nativo en modo oscuro. El fallback con `background-color` cubre navegadores que ignoran la propiedad.

Aplica automáticamente a todos los `<select>` de la app (signup, complete-signup, módulo Usuarios, vista delegado, vista admin, etc.).

### 2.2 Mejoras visuales en vista del delegado

Archivos modificados:
- `src/pages/delegado/MiEquipoTab.jsx`
- `src/styles/delegado.css`

Pequeños refinos a la presentación del plantel del delegado (consistencia visual con el resto de tablas del admin).

### 2.3 Colores de chips alineados al design system

| Rol | Color | Token |
|---|---|---|
| Jugador | Verde | `--color-success` (#22c55e) |
| Delegado | Amarillo | `--color-warning` (#facc15) |
| Árbitro | Azul | `--blue-400` (#3b82f6) |
| Administrador | Naranja (brand) | `--color-brand` (#ff5500) |
| Pending (cualquier rol) | Outline punteado gris | sin fondo |

Los `menu-chip-dot` del dropdown "Roles" usan los mismos colores para consistencia visual.

### 2.4 Dropdown de "Roles" con portal

El menú flotante "Roles" en `UsersTable.jsx` se renderiza vía `createPortal` a `document.body` con `position: fixed`. Razón: el contenedor de la tabla tiene `overflow: hidden` para preservar el `border-radius`, y eso clipeaba el dropdown cuando había pocas filas. Posición calculada del `getBoundingClientRect()` del trigger, con auto-cierre en scroll/resize/Escape.

**Patrón reutilizable:** cualquier dropdown o popover dentro de un contenedor con `overflow: hidden` debe usar portal para escapar el clipping.

---

## 3. Cambios de integración con backend

### 3.1 Cliente HTTP

`src/api/cuentas.js` agregado:

```js
listarCuentas({ q, rol, page, size }, token)
crearCuenta(payload, token)            // {nombre, correo, cedula, rolInicial, motivo}
asignarRol({ cedula, rol, motivo }, token)
revocarRol({ cedula, rol, motivo }, token)
eliminarCuenta({ cedula, motivo }, token)
```

Todas pasan `Authorization: Bearer <token>` y devuelven JSON parseado vía el helper `requestJson` de `http.js`.

### 3.2 `src/api/auth.js`

Cambios:
- Agregado `padronPreview(cedula)` — `GET /api/auth/padron-preview/{cedula}` sin auth.

### 3.3 `src/api/supercopa.js`

Cambios menores en el cliente (ajustes al base URL para alinearse con el patrón del API Gateway / routing nativo de DO).

---

## 4. Archivos afectados (resumen)

### Nuevos
```
src/api/cuentas.js
src/pages/admin/UsuariosView.jsx
src/pages/admin/usuarios/UsersTable.jsx
src/pages/admin/usuarios/RoleChips.jsx
src/pages/admin/usuarios/Toast.jsx
src/pages/admin/usuarios/CreateUserModal.jsx
src/pages/admin/usuarios/AssignRoleModal.jsx
src/pages/admin/usuarios/AssignAdminModal.jsx
src/pages/admin/usuarios/RevokeRoleModal.jsx
src/pages/admin/usuarios/DeleteUserModal.jsx
src/styles/admin-usuarios.css
src/AGENT/tab_gestion_usuarios.md
docs/cambios_frontend_junio.md            (este archivo)
docs/evolucion_y_decisiones.md            (existente, generado en sprint previo)
```

### Modificados
```
src/api/auth.js                           ← padronPreview()
src/api/supercopa.js                      ← ajustes URL
src/pages/AdminDashboard.jsx              ← entrada "Usuarios" en sidebar
src/pages/SignupPage.jsx                  ← padrón preview con debounce + render condicional
src/pages/delegado/MiEquipoTab.jsx        ← refinos visuales
src/styles/delegado.css                   ← refinos visuales
src/styles/global.css                     ← fix global de <select> dark mode
```

---

## 5. Despliegue: variables de entorno en Vercel

Al levantar el deploy del nuevo build, asegurarse de que estas variables existen en Vercel (Production + Preview):

| Variable | Valor |
|---|---|
| `VITE_GATEWAY_URL` | URL pública del backend MS1 (hoy: `https://authcodecup-cykcc.ondigitalocean.app`) |
| `VITE_APPWRITE_ENDPOINT` | `https://sfo.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | `authcodecup` |

**Importante:** las variables `VITE_*` se inyectan en **build time**, no runtime. Tras cambiarlas en Vercel hay que hacer **Redeploy** del último deployment para que tomen efecto.

Si la variable se llamaba antes `VITE_BACKEND_ORIGIN` y se renombró a `VITE_GATEWAY_URL`, hay que renombrarla en Vercel también — no se autodetecta el cambio.

---

## 6. Cómo probar todo esto manualmente

1. **Levantar backend MS1** (`AuthCodeCup`) desde Spring Boot Dashboard.
2. **Levantar frontend**: `cd codecup && npm run dev`. Vite arranca en `:5173`.
3. **Login como administrador** con tu cuenta sembrada.
4. **Probar módulo Usuarios** (entrada nueva en sidebar admin):
   - Búsqueda + filtro por rol.
   - Crear usuario manual (formulario → password reveal → copiar).
   - Asignar/revocar rol con motivo.
   - Modal de asignar admin con doble confirmación.
   - Eliminar cuenta con motivo.
5. **Probar signup smart** en `localhost:5173/signup`:
   - Tipo "Jugador" + cédula que esté en padrón → debe aparecer el banner verde y ocultarse los campos académicos.
   - Tipo "Jugador" + cédula que NO esté en padrón → banner amarillo + campos visibles.
   - Tipo "Delegado" o "Árbitro" → comportamiento intacto (no se hace lookup).
6. **Probar dark mode de selects**: abrir cualquier `<select>` (signup, filtros, etc.). Dropdown debe ser oscuro, no blanco.

---

## 7. Resumen para el commit

```
feat(frontend): módulo Usuarios + signup smart + fix dark dropdowns

- Nueva pestaña "Usuarios" en panel admin: tabla paginada, crear cuenta
  manual con password reveal, asignar/revocar roles (con doble confirmación
  para admin), eliminar cuenta. 8 componentes modulares + api/cuentas.js.
- SignupPage hace lookup al padrón con debounce cuando el tipo de cuenta es
  JUGADOR. Si la cédula está oficialmente registrada, se ocultan los campos
  académicos (rol/código/semestre) porque el backend los toma del padrón.
- Fix global de <select>: agregado color-scheme: dark + fallback en
  global.css para que los dropdowns nativos respeten el dark theme.
- RolesMenu en UsersTable usa createPortal para escapar overflow:hidden.
- Chips de roles alineados al design system (verde/amarillo/azul/naranja).
- Tab de gestión de usuarios documentada en src/AGENT/ para mantenedores.
- Nuevos docs/cambios_frontend_junio.md (este changelog) y
  docs/evolucion_y_decisiones.md (decisiones del sprint).
```
