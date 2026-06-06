# Frontend · Evolución y Decisiones Técnicas

> **Propósito:** Registro consolidado de los cambios y decisiones de diseño aplicadas al frontend de Code Cup durante el sprint del módulo de Usuarios y la alineación con el modelo multi-microservicio.
>
> Sirve como referencia para futuros mantenedores: qué se construyó, por qué, y qué patrones conviene seguir o evitar.

---

## 1. Nuevo módulo "Usuarios" en el panel admin

### Funcionalidad

Pestaña nueva en el sidebar del admin (bajo "Identidad", debajo de "Solicitudes pendientes") que permite:

- Listar todas las cuentas del sistema con búsqueda libre (cédula/nombre/correo) y filtro por rol.
- Crear cuentas manualmente para personas que no saben registrarse solas (caso del árbitro no técnico).
- Asignar/revocar roles (DELEGADO, ÁRBITRO, ADMINISTRADOR) a cuentas existentes.
- Eliminar cuentas completas (BD + Appwrite) con motivo obligatorio.

### Estructura modular

```
src/pages/admin/
├── UsuariosView.jsx                    ← vista principal, orquesta estado + modales
└── usuarios/
    ├── UsersTable.jsx                  ← tabla paginada con dropdown "Roles" por fila
    ├── RoleChips.jsx                   ← chips de colores por rol
    ├── Toast.jsx                       ← feedback bottom-right auto-dismiss
    ├── CreateUserModal.jsx             ← 2 pasos: form → password reveal con copiar
    ├── AssignRoleModal.jsx             ← delegado/árbitro + motivo
    ├── AssignAdminModal.jsx            ← modal rojo con doble confirmación
    ├── RevokeRoleModal.jsx             ← confirma + motivo
    └── DeleteUserModal.jsx             ← confirma + motivo
```

### Decisión: doble confirmación solo para ADMINISTRADOR

`AssignAdminModal` requiere que el usuario:
1. Escriba un motivo obligatorio (textarea).
2. Escriba literalmente la palabra `CONFIRMAR` en un input dedicado.

Recién entonces se habilita el botón "Otorgar Administrador" (rojo).

**Por qué solo admin y no para revocar/eliminar:** asignar admin es la única acción que crea otro super-usuario con permisos para eliminar cuentas y promover más admins. El resto son acciones reversibles o de menor impacto (revocar solo quita un rol, eliminar tiene guards del backend).

### API client (`src/api/cuentas.js`)

Funciones nuevas: `listarCuentas`, `crearCuenta`, `asignarRol`, `revocarRol`, `eliminarCuenta`. Todas envían `Authorization: Bearer <token>`.

---

## 2. Padrón preview en signup (UX inteligente)

### Problema que resolvía

El formulario de signup pedía al jugador digitar `rol_jugador`, `codigoUniversitario` y `semestre` siempre, aunque la cédula ya estuviera en el padrón oficial. Esto era redundante y abría la puerta a manipulación (digitar "PROFESOR" cuando el padrón dice "ESTUDIANTE").

### Solución

En `SignupPage.jsx`:

1. `useEffect` con debounce 400ms sobre `form.cedula` cuando `tipoCuenta = JUGADOR`.
2. Llama a `GET /api/auth/padron-preview/{cedula}` (endpoint público nuevo en MS1).
3. Si responde `enPadron = true`:
   - Muestra banner verde "✓ Encontramos tu información en el padrón oficial: [nombre]"
   - **Oculta** los campos `rolJugador`, `codigoUniversitario`, `semestre`, `motivoSolicitud`.
   - La validación previa al submit deja de exigirlos.
   - El backend ignora cualquier valor que mande el frontend y copia del padrón.
4. Si `enPadron = false`:
   - Banner amarillo "Tu cédula no aparece en el padrón. Completa los datos abajo".
   - Muestra los campos como antes; el admin validará después.

### Decisión: el endpoint preview NO expone semestre ni código

Por privacidad, `padron-preview` solo devuelve `{ enPadron, esEstudiante, nombre }`. Si se necesitan los campos exactos, los toma el backend en el `solicitarRol` desde el padrón directamente. **El frontend nunca recibe ni envía la verdad académica**.

---

## 3. Fix global de `<select>` con fondo blanco en dark mode

### Síntoma

Cualquier `<select>` (en módulo Usuarios, en filtros del admin, en signup, en complete-signup, etc.) abría el dropdown nativo con fondo blanco que rompía visualmente el dark theme.

### Causa

Los `<option>` heredan estilos del sistema operativo, no del CSS de la página. Sin una directiva específica, todos los navegadores los renderizan en modo claro por defecto.

### Fix aplicado (un solo cambio global)

En `src/styles/global.css`:

```css
select {
  color-scheme: dark;
}

select option,
select optgroup {
  background-color: var(--color-bg-elevated, #0d1429);
  color: var(--color-fg, #ffffff);
}

select option:checked {
  background-color: var(--color-brand-subtle, rgba(255, 85, 0, 0.18));
  color: var(--color-fg, #ffffff);
}

select option:disabled {
  color: var(--color-fg-disabled, #606070);
}
```

- `color-scheme: dark` le indica al navegador que renderice el popup nativo en modo oscuro (Chromium/Firefox/Safari modernos lo respetan).
- Fallback con `background-color` + `color` por si el navegador ignora `color-scheme`.

**Decisión:** se aplicó en `global.css` (no en un componente específico) porque hay 15+ archivos con `<select>` y resolver caso por caso sería incoherente. Un solo cambio cubre todo.

---

## 4. Fix dropdown de "Roles" que se escondía detrás de la tabla

### Síntoma

En `UsersTable.jsx`, el menú flotante "Roles" se recortaba/escondía cuando la tabla tenía pocas filas (caso de búsqueda con un solo resultado). Cuando la tabla tenía muchas filas, se veía bien.

### Causa

El `.usuarios-table-wrap` tiene `overflow: hidden` (necesario para el `border-radius`). Cuando el dropdown se renderizaba como hijo de la fila (`position: absolute`), quedaba clipeado por el ancestro `overflow: hidden`.

### Fix

Refactor del componente `RolesMenu` dentro de `UsersTable.jsx`:

- Renderizar el panel con **`createPortal`** a `document.body`.
- Posicionar con `position: fixed` calculado del `getBoundingClientRect()` del botón trigger.
- Auto-cerrar en scroll, resize, click fuera y Escape.

```jsx
{open && createPortal(
  <div
    ref={menuRef}
    className="roles-menu portal open"
    style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
  >
    ...
  </div>,
  document.body,
)}
```

**Lección general:** cualquier dropdown/popover dentro de un contenedor con `overflow: hidden` debe usar portal para escapar el clipping. Patrón reutilizable.

---

## 5. Colores de roles alineados al design system

| Rol | Color | Token |
|---|---|---|
| Jugador | Verde | `--color-success` (#22c55e) |
| Delegado | Amarillo | `--color-warning` (#facc15) |
| Árbitro | Azul | `--blue-400` (#3b82f6) |
| Administrador | Naranja (brand) | `--color-brand` (#ff5500) |
| Pending (cualquier rol) | Outline punteado gris | sin background |

Los `menu-chip-dot` del dropdown "Roles" usan los mismos colores para consistencia visual.

**Decisión:** `pending` se diseñó con outline punteado (no con un color sólido propio) para evitar competencia visual con delegado (que ya es amarillo).

---

## 6. Bug "rol fantasma" en la tabla de usuarios

### Síntoma

Strickland aparecía con chip "ÁRBITRO" en la tabla, pero al filtrar por "Árbitro" no salía.

### Causa

Backend devolvía todos los `CuentaRol` (incluyendo `RECHAZADO`) y el `RoleChips.jsx` no diferenciaba estado RECHAZADO, lo pintaba como rol normal.

### Fix

Una línea en el backend (`AdminCuentasService.toDto`): filtrar fuera los rechazados. Frontend no requirió cambio.

**Lección:** el frontend debe asumir que los datos que recibe son los "vigentes". El filtrado por estado de auditoría es responsabilidad del backend.

---

## 7. Variables de entorno en Vercel — fix del deploy roto

### Síntoma

Tras un refactor previo donde se renombró `VITE_BACKEND_ORIGIN` → `VITE_GATEWAY_URL`, el frontend en Vercel dejó de funcionar mientras que en local seguía OK.

### Causa

Vercel tenía solo `VITE_BACKEND_ORIGIN` (nombre viejo). El código nuevo lee `VITE_GATEWAY_URL`. Como las variables `VITE_*` se inyectan en **build time**, `import.meta.env.VITE_GATEWAY_URL` resolvía a `undefined`. Todas las llamadas API iban a URL relativa (`https://codecup.games/api/...`) → 404 en Vercel (sin proxy).

Además faltaban `VITE_APPWRITE_ENDPOINT` y `VITE_APPWRITE_PROJECT_ID`, lo que rompía el cliente Appwrite.

### Variables que el frontend usa actualmente (confirmadas vía grep)

| Variable | Donde se usa | Valor en prod |
|---|---|---|
| `VITE_GATEWAY_URL` | `api/http.js`, `api/supercopa.js` | URL única de DO App Platform |
| `VITE_APPWRITE_ENDPOINT` | `lib/appwrite.js` | `https://sfo.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | `lib/appwrite.js` | `authcodecup` |

### Notas para futuros despliegues

- **Después de modificar variables `VITE_*` en Vercel hay que hacer Redeploy** (no se hot-reload, son build-time).
- **Si el CORS falla** desde el browser, revisar que `FRONTEND_URL` del backend MS1 apunte a `https://codecup.games` (no a localhost).
- **El `vite.config.js` con proxy a `localhost:8080` solo aplica en dev**. En Vercel se sirve estático sin proxy.

---

## 8. Arquitectura del cliente HTTP (`api/http.js`)

Patrón compartido por todas las llamadas:

```js
export async function requestJson(path, options = {}) {
  const url = /^https?:\/\//i.test(path) ? path : `${GATEWAY_ORIGIN}${path}`;
  const response = await fetch(url, options);
  const body = await parseBody(response);
  if (!response.ok) {
    const error = new Error(body?.mensaje || body?.error || 'Error en la solicitud.');
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}
```

- Parsea automáticamente JSON o texto.
- Si el backend responde 4xx/5xx con `{ mensaje, error }`, lo expone como `error.message` para que la UI lo muestre.
- Acepta URL absoluta si se necesita (ej. para Supabase Realtime configurado por separado).

### Convención para los DTOs de error del backend

Todos los `@ExceptionHandler` en MS1 devuelven:
```json
{
  "timestamp": "...",
  "status": 409,
  "error": "Conflicto",
  "mensaje": "Ya existe una cuenta con esa cédula.",
  "path": "/api/admin/cuentas"
}
```

El frontend muestra `mensaje` por defecto. Mantener esto coherente cuando se agreguen nuevos endpoints.

---

## 9. Próximas iteraciones sugeridas

### Frontend para gestión de perfil deportivo (MS2)

El backend MS2 ya tiene los campos `apodo`, `fotoUrl` en `Jugador` y los atributos deportivos (`alturaCm`, `piernaHabil`, `posicion`). Falta UI para que el jugador edite su perfil:
- Subir foto al Supabase Storage y guardar la URL en `fotoUrl`.
- Editar apodo (que el frontend ya prioriza sobre el nombre oficial para vistas de jugador).
- Editar altura/pierna/posición.

### Reportes públicos (MS4)

Cuando MS4 (Analytics) esté desplegado, las páginas `Torneos`, `SalonDeLaFama` y `TorneoActivo` consumirán endpoints `/api/analytics/*` para mostrar tablas de posiciones, goleadores, reporte completo de torneo (similar al informe oficial del torneo 2024). Ver `modelo_despliegue.md` para arquitectura de vistas materializadas.

### Realtime para partidos en vivo

Supabase Realtime ya está disponible. Cuando se quiera ver el marcador actualizado en vivo (durante un partido), suscribirse desde el componente correspondiente:

```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const channel = supabase
  .channel(`partido:${partidoId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'eventos_partido',
        filter: `partido_id=eq.${partidoId}` },
      (payload) => actualizarMarcador(payload.new))
  .subscribe();
```

---

## 10. Convenciones y patrones para futuros componentes

- **Modales en portales**: cualquier modal o dropdown debe escapar contenedores con `overflow: hidden`. Usar `createPortal` a `document.body`.
- **Estilos con namespace**: los estilos del módulo Usuarios usan prefijos `u-` (`u-modal`, `u-btn`, `u-input`, `usuarios-table`) para no colisionar con `admin.css` previo. Replicar el patrón en módulos futuros si conviven con estilos antiguos.
- **Color tokens del design system**: nunca hardcodear colores hex. Siempre `var(--color-brand)`, `var(--color-success)`, etc. Tokens definidos en `design-tokens.css`.
- **Debounce de inputs que pegan al backend**: si un `useEffect` hace fetch en cada cambio (búsqueda, padrón preview, etc.), envolver en `setTimeout` 280-400ms para no inundar la red.
- **Toast feedback en acciones admin**: cualquier acción que mute estado (crear, asignar, eliminar) debe disparar un Toast verde de éxito o rojo de error. Component `Toast.jsx` ya existe.
- **Confirmación obligatoria con motivo**: cualquier acción destructiva o sensible (eliminar, revocar, asignar admin) exige textarea `motivo` que viaja al backend para audit log.
