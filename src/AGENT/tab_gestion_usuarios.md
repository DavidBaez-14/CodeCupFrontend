Update Todos

Crear DTOs nuevos (AsignarRolRequest, RevocarRolRequest, CrearCuentaRequest, CrearCuentaResponse, CuentaAdminDTO, RolEstadoDTO)

Eliminar PromoverAdminRequestDTO (ya no se usa)

Crear PasswordGenerator utility para passwords temporales

Refactorizar NotificacionPublisher a métodos genéricos (asignación/revocación/creación)

Refactorizar AdminRolesService: eliminar promoverAdmin, agregar asignarRol/revocarRol, audit logs

Refactorizar AdminRolesController: eliminar promover-admin, agregar asignar/revocar

Agregar query con filtros a CuentaRepository

Crear AdminCuentasService (listar paginado + crear cuenta manual)

Crear AdminCuentasController con GET /api/admin/cuentas y POST /api/admin/cuentas

Actualizar contexto_ms5.md con eventos renombrados
Backend listo. Resumen para que pruebes en Swagger:

Endpoints nuevos / refactorizados
AdminRolesController (/api/admin/roles, requiere rol ADMINISTRADOR):

Método	Path	Body	Notas
POST	/asignar	{ cedula, rol, motivo }	Reemplaza /promover-admin. Acepta ADMINISTRADOR / DELEGADO / ARBITRO (JUGADOR rechazado con 400). 409 si ya tiene el rol APROBADO.
POST	/revocar	{ cedula, rol, motivo }	Guards: no auto-revocarse admin, no revocar último admin. 404 si no tiene ese rol APROBADO.
DELETE	/cuenta/{cedula}	{ motivo }	(sin cambios) Guards: no auto-eliminar, no eliminar último admin.
AdminCuentasController (/api/admin/cuentas, requiere rol ADMINISTRADOR):

Método	Path	Notas
GET	?q=&rol=&page=0&size=20	Lista paginada. q busca en cédula/nombre/correo (LIKE). rol filtra cuentas que tengan ese rol APROBADO. Ordenado por fechaCreacion DESC.
POST	(body CrearCuentaRequestDTO)	Crea cuenta manual. Genera password de 16 chars (alfabeto sin ambiguos: I, l, 0, O, 1) y la devuelve UNA vez en passwordTemporal. Crea usuario en Appwrite, Cuenta y CuentaRol aprobado. JUGADOR rechazado con 400.
Logs de auditoría a observar
Cuando pruebes, busca en la consola líneas con estos prefijos:

[AUDIT][ROL_ASIGNADO] caller=... cedula=... rol=... motivo=...
[AUDIT][ROL_REVOCADO] caller=... cedula=... rol=... motivo=...
[AUDIT][CUENTA_CREADA] caller=... cedula=... correo=... rolInicial=... motivo=...
[AUDIT][CUENTA_ELIMINADA] caller=... cedula=... motivo=...
Y los [NOTIF][...] correspondientes que mañana consumirá MS5.
Casos sugeridos para probar en Swagger
GET /api/admin/cuentas sin filtros → debe listar tu cuenta admin.
POST /api/admin/cuentas con un correo nuevo + cedula nueva + rol DELEGADO → respuesta trae passwordTemporal, guárdala. Luego prueba loguear esa cuenta vía Appwrite con esa password.
POST /api/admin/roles/asignar con la cédula del paso 2 y rol ADMINISTRADOR → 204. Verifica con GET que ya tiene 2 roles APROBADOS.
POST /api/admin/roles/asignar otra vez con el mismo rol → 409.
POST /api/admin/roles/revocar con tu propia cédula y rol ADMINISTRADOR → 400 (auto-revocación).
DELETE /api/admin/roles/cuenta/{tu_cedula} → 400 (auto-eliminación).
DELETE /api/admin/roles/cuenta/{cedula_del_paso_2} → 204, cuenta desaparece y se ven los logs.