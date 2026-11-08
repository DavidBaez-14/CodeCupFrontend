# Fixtures del contrato (spec 0027)

Respuestas del backend con la forma que tiene después de M2 (specs 0022 y 0023). Los tests las usan
en lugar de escribir objetos a mano, para que los mocks no se alejen de lo que responde el backend.

**Copiadas de respuestas reales** del ensayo local (backend `1668422` contra una copia de Supabase #1
con V4–V6, 8-nov-2026), con los usuarios del seed (`@prueba.local`):

| Archivo | Endpoint |
|---|---|
| `me-delegado.json`, `me-jugador.json` | `GET /api/auth/me` (delegado01, jugador01) |
| `partido-base.json` | un partido de `GET /api/supercopa/admin/torneos/{id}/partidos` (Liga Relámpago) |
| `miembros-local.json`, `miembros-visitante.json` | `GET /api/supercopa/admin/equipo-torneo/{id}/miembros` |
| `alineacion.json` | `GET /api/supercopa/admin/partidos/{id}/alineacion` |
| `eventos.json` | `GET /api/supercopa/admin/partidos/{id}/eventos` |
| `cuentas-admin.json` | `GET /api/admin/cuentas?q=prueba.local&page=0&size=8` |
| `inscripciones-torneo.json` | `GET /api/supercopa/admin/torneos/{id}/inscripciones` (Copa Prueba 2026) |
| `perfil-jugador.json` | `GET /api/supercopa/mi-perfil` (jugador01) |

**Armadas con los campos exactos de su DTO**, porque en el ensayo esas listas estaban vacías:
`premios.json` (`PremioDTO`), `solicitudes-pendientes.json` (`SolicitudDTO`), `bloqueados.json`
(`MultaService.JugadorBloqueadoDTO`) y `roles-pendientes.json` (`CuentaRolPendienteDTO`). Sus UUID
que empiezan por `a…-0000-4000-8000-…` son inventados.

Si el backend cambia uno de estos DTOs, hay que volver a copiar la respuesta (o ajustar el archivo).
