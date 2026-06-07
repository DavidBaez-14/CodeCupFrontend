# Estado del Sistema: Funcionalidades y Roadmap

Este documento resume el estado actual del sistema tras la finalización del sprint de despliegue, detallando las funcionalidades operativas por microservicio y las tareas pendientes.

---

## 1. Qué debe funcionar: Login como Admin

### MS1 — Identidad (Totalmente funcional)
- **Autenticación:** Login / Signup con padrón preview.
- **Gestión de Usuarios:**
  - Listar usuarios.
  - Crear cuentas manualmente.
  - Asignar/revocar roles.
  - Eliminar cuentas.
- **Gestión de Solicitudes:** Aprobar/rechazar solicitudes pendientes.
- **Administración:** Cargar jugadores vía CSV (si está implementado en MS1).

### MS2 — Super-Copa (HUs cerradas)
- **Funcionalidades de Administrador:**
  - Crear, publicar e iniciar torneos (HU08).
  - Listar inscripciones (HU15).
  - Aprobar/rechazar inscripciones.
  - Generar fixture (HU12).
  - Ver partidos del torneo.
  - Registrar eventos del partido (HU20, HU46).
  - Cerrar partido con resultado (HU21).
- **Funcionalidades de Delegado:**
  - Crear equipo (HU05).
  - Inscribir equipo en torneo (HU07).
  - Gestionar plantel (HU44).
  - Ver/aprobar/rechazar solicitudes entrantes (HU43).
- **Funcionalidades de Jugador:**
  - Solicitar unirse a equipo (HU42).
  - Ver perfil deportivo (HU41 backend listo).

### MS3 — Finanzas (Skeleton)
- **Endpoints disponibles (via Swagger):**
  - `POST /api/finanzas/comprobantes`
  - `GET /api/finanzas/comprobantes/mis-comprobantes`
  - `GET /api/finanzas/multas/mias`
  - `GET /api/finanzas/multas/elegibilidad/{cedula}`
- **Pendientes (No funcional aún):**
  - HU29: Generar multas automáticas al cerrar partido (requiere lógica de sanciones).
  - HU28: Efectos cross-MS al aprobar comprobante.
  - Integración con Supabase Storage para archivos de comprobantes.

---

## 2. Frontend (UI operativa)
- Tema dark sin glitches en `<select>` (fix global aplicado).
- Módulo Usuarios (tabla, modales, dropdown Roles).
- Signup smart con padrón preview.
- Dashboards diferenciados por rol (Admin / Delegado / Árbitro / Jugador).

---

## 3. Roadmap: Trabajo sugerido (Orden de impacto)

| Prioridad | Tarea | Microservicio |
| :--- | :--- | :--- |
| **Alta** | HU09 (montos multas/premios) + HU29 (multas auto) | MS2 + MS3 |
| **Alta** | HU19 (verificar elegibilidad pre-partido) | MS2 ↔ MS3 |
| **Alta** | HU28 (efectos cross-MS al aprobar comprobante) | MS3 → MS2 |
| **Media** | HU13, HU14 (asignar horarios + publicar cronograma) | MS2 |
| **Media** | HU10, HU11 (plantillas + personalización) | MS2 |
| **Media** | HU16 (descalificación de equipo) | MS2 |
| **Baja** | HU17, HU22, HU23 (aplazamiento, W.O., penales) | MS2 |
| **Baja** | HU41 UI (perfil deportivo) | Frontend |
| **Baja** | Reemplazar mock_pago por HU28 real | MS2 ↔ MS3 |

---
*Nota: La base de infraestructura (deploy, schemas separados, JWT cross-service) se encuentra sólida y sin deuda técnica pendiente.*