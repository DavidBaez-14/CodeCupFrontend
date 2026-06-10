# Plan · Configurar Torneo (formatos, multas y premios) + Fixture mejorado

> **Objetivo:** habilitar que el Admin pueda elegir entre varios formatos de torneo, definir multas por tarjeta y un catálogo editable de premios (que varía entre ediciones), reutilizando lo ya construido en MS2/MS3 y los mockups de `Frontend-CodeCup/codecup/Mockups Torneos y Fixture/`.
>
> **No-objetivos de este plan:** Doble Eliminación (descartado), notificaciones automáticas (MS5), efectos cross-MS al aprobar comprobante (HU28 — fuera de scope), aplazamientos (HU13/HU17).

---

## 1. Alcance y principios

- **Formatos soportados (v1):** `LIGA`, `GRUPOS_ELIMINATORIAS`, `ELIMINACION_DIRECTA`, `CHAMPIONS` (grupos + repechaje + KO).
- **Catálogo de premios editable** — lista 1:N por torneo. El Admin agrega/quita/edita; no son campos fijos.
- **Tabla de sanciones (multas)** — vive en MS2 (HU09), MS3 la consume in-process. El formulario unificado en la UI del torneo es coherente con la arquitectura modular descrita en `supercopa/docs/arquitectura_modular_ms2_ms3.md`.
- **Regla de oro contra pérdida de datos:** el `formato` y la estructura del fixture son inmutables una vez que el torneo está `EN_CURSO`. Los premios siguen editables siempre (porque solo se materializan al cerrar el torneo). Detalle en §6.
- **Reutilizar lo existente:** `FixtureService.roundRobin()`, `Bracket.jsx`, `MatchCard`, estilos `admin-torneo.css`, `api/supercopa.js`.

---

## 2. Cambios en el modelo de datos (MS2 · schema `supercopa`)

### 2.1 Ampliar `Torneo`

Agregar a [Torneo.java](supercopa/src/main/java/terminus/co/edu/ufps/competicion/ms2supercopa/model/Torneo.java):

```java
@Enumerated(EnumType.STRING)
@Column(name = "formato", length = 30)
private FormatoTorneo formato;          // null mientras BORRADOR sin configurar

@Column(name = "num_grupos")
private Integer numGrupos;              // null si formato no usa grupos

@Column(name = "clasifican_por_grupo")
private Integer clasificanPorGrupo;     // null si formato no usa grupos

@Column(name = "repechaje", nullable = false)
@Builder.Default
private Boolean repechaje = false;

@Column(name = "rondas_playoff", length = 200)
private String rondasPlayoff;           // CSV: "OCTAVOS,CUARTOS,SEMIS,FINAL"

@Column(name = "configurado_en")
private LocalDateTime configuradoEn;    // se setea al guardar la configuración
```

Nuevo enum `FormatoTorneo`:

```java
public enum FormatoTorneo { LIGA, GRUPOS_ELIMINATORIAS, ELIMINACION_DIRECTA, CHAMPIONS }
```

Nuevo enum `FaseTorneo` (lo usa `Partido`):

```java
public enum FaseTorneo { GRUPOS, REPECHAJE, OCTAVOS, CUARTOS, SEMIS, FINAL, TERCER_PUESTO }
```

### 2.2 Anotar fase y jornada en `Partido`

Hoy la jornada se infiere por fecha en el frontend. Eso falla cuando hay dos jornadas el mismo día (grupos A y B). Agregar:

```java
@Enumerated(EnumType.STRING)
@Column(name = "fase", length = 20)
private FaseTorneo fase;                // GRUPOS por defecto en LIGA

@Column(name = "jornada")
private Integer jornada;                // 1..n dentro de la fase

@Column(name = "grupo", length = 1)
private String grupo;                   // 'A'|'B'|... null en KO
```

### 2.3 Nueva entidad `MultaConfig` (1:1 con `Torneo`)

```java
@Entity @Table(name = "multa_config", schema = "supercopa")
public class MultaConfig {
    @Id @GeneratedValue private UUID id;
    @OneToOne @JoinColumn(name = "torneo_id", unique = true) private Torneo torneo;
    private BigDecimal montoAmarilla;
    private BigDecimal montoAzul;
    private BigDecimal montoRoja;
    private BigDecimal montoRojaDirecta;
    private Integer amarillasParaSuspension;   // umbral acumulación (default 5)
    private Integer fechasSuspensionRoja;      // partidos de castigo (default 1)
}
```

MS3 lo consulta vía bean inyectado (mismo patrón del doc de arquitectura modular).

### 2.4 Nueva entidad `PremioTorneo` (1:N con `Torneo`) — **catálogo editable**

```java
@Entity @Table(name = "premios_torneo", schema = "supercopa")
public class PremioTorneo {
    @Id @GeneratedValue private UUID id;
    @ManyToOne @JoinColumn(name = "torneo_id") private Torneo torneo;

    @Enumerated(EnumType.STRING)
    private CategoriaPremio categoria;   // COLECTIVO | INDIVIDUAL

    @Enumerated(EnumType.STRING)
    private AlcancePremio alcance;       // CAMPEON, SUBCAMPEON, TERCERO, GOLEADOR,
                                         // PORTERO_MENOS_VENCIDO, MVP, OTRO

    @Column(length = 120)
    private String nombre;               // libre — útil cuando alcance=OTRO
                                         // (ej. "Fair Play", "Mejor Disciplina")
    private BigDecimal monto;
    private Integer orden;               // para mostrar Campeón > Subcampeón > 3°
}
```

Razón del enum + `nombre` libre: el 95% de los premios son los conocidos (Campeón, Goleador, …), pero el Admin puede añadir un `OTRO` con nombre custom sin tocar código. **Esto cubre tu requisito de "los premios pueden variar a lo largo del tiempo"**.

### 2.5 Migración SQL

Un solo archivo nuevo `db/supabase-migracion-iter5.sql`:

```sql
-- ampliar torneos
ALTER TABLE supercopa.torneos
  ADD COLUMN formato VARCHAR(30),
  ADD COLUMN num_grupos INT,
  ADD COLUMN clasifican_por_grupo INT,
  ADD COLUMN repechaje BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN rondas_playoff VARCHAR(200),
  ADD COLUMN configurado_en TIMESTAMP;

-- anotar partidos
ALTER TABLE supercopa.partidos
  ADD COLUMN fase VARCHAR(20),
  ADD COLUMN jornada INT,
  ADD COLUMN grupo VARCHAR(1);

-- nuevas tablas
CREATE TABLE supercopa.multa_config ( ... );
CREATE TABLE supercopa.premios_torneo ( ... );

-- Backfill: torneos existentes pasan a LIGA con la jornada inferida por fecha
UPDATE supercopa.torneos SET formato = 'LIGA' WHERE formato IS NULL;
UPDATE supercopa.partidos SET fase = 'GRUPOS' WHERE fase IS NULL;
```

---

## 3. Cambios en el backend (servicios + endpoints)

### 3.1 `TorneoAdminService`

Agregar:

```java
TorneoConfigDTO obtenerConfiguracion(UUID torneoId);
TorneoConfigDTO guardarConfiguracion(UUID torneoId, GuardarConfigRequest req);   // bloqueado si EN_CURSO/FINALIZADO
```

`GuardarConfigRequest` envía formato + numGrupos + clasificanPorGrupo + repechaje + rondas + multaConfig + lista de premios en una sola transacción. El service:

1. Valida estado del torneo (regla de oro §6).
2. Valida coherencia formato↔parámetros (ej. `LIGA` no acepta grupos).
3. Persiste `Torneo`, hace `upsert` del `MultaConfig`, sincroniza la lista de `PremioTorneo` (borra los que ya no están, agrega los nuevos).
4. Setea `configuradoEn`.

### 3.2 `FixtureService` — estrategia por formato

Refactor mínimo: convertir el método único en un dispatcher.

```java
public List<Partido> generar(UUID torneoId) {
    Torneo t = torneoRepo.findById(torneoId).orElseThrow();
    validarEstadoYConfig(t);
    return switch (t.getFormato()) {
        case LIGA                  -> generarLiga(t);              // ya existe (renombrar)
        case ELIMINACION_DIRECTA   -> generarEliminacionDirecta(t);// nuevo
        case GRUPOS_ELIMINATORIAS  -> generarGruposPlusPlayoff(t); // nuevo
        case CHAMPIONS             -> generarChampions(t);         // grupos+repechaje+KO
    };
}
```

- `generarLiga`: el actual `roundRobin` ya pone `fase=GRUPOS`, `jornada=r+1`, `grupo=null`.
- `generarEliminacionDirecta`: siembra equipos (orden de inscripción o aleatorio), genera el bracket completo con partidos placeholders donde `equipoLocalTorneo/visitanteTorneo` se rellenan al cerrar el partido previo. Esto requiere agregar campo `partidoPrevioLocal`/`partidoPrevioVisitante` en `Partido` — **postponible** si en v1 generamos solo la primera ronda real y las siguientes se materializan al cerrar.
- `generarGruposPlusPlayoff`: round-robin por grupo + crea placeholders de cuartos/semis/final.
- `generarChampions`: igual al anterior pero con jornada de repechaje extra.

**Decisión pragmática para v1:** generar todas las jornadas de grupos como partidos reales y los partidos de eliminatoria como **placeholders** (equipos `null`) — los nombres "Ganador A vs Ganador B" se resuelven en frontend hasta que el partido previo cierre. El `Bracket.jsx` actual ya hace esto con strings "Gan. Rep. 1", "Gan. CF 1".

### 3.3 `AdminTorneoController` — endpoints nuevos

```
GET    /api/supercopa/admin/torneos/{id}/configuracion
PUT    /api/supercopa/admin/torneos/{id}/configuracion
DELETE /api/supercopa/admin/torneos/{id}/fixture           ← borrar y regenerar (solo si NINGÚN partido jugado)
```

El endpoint `POST /fixture` ya existe — solo cambia internamente para llamar al nuevo dispatcher.

### 3.4 DTOs nuevos

`TorneoConfigDTO`, `GuardarConfigRequest`, `MultaConfigDTO`, `PremioTorneoDTO` — todos en `dto/admin/`.

---

## 4. Cambios en el frontend

### 4.1 `ConfigurarTorneoView.jsx` — rediseño completo

Estructura nueva siguiendo el mockup `Admin Configurar Torneo.html`:

1. **Header de contexto:** nombre del torneo + KPIs en vivo (equipos inscritos, formato, partidos estimados).
2. **Sección 1 · Plantilla** — grid de 4 tarjetas seleccionables con badge "Recomendada" (umbral basado en `aprobadosCount`, no en `13` hardcoded del mockup):
   - 4–7 equipos → `LIGA`
   - 8–10 → `GRUPOS_ELIMINATORIAS`
   - 11–16 → `CHAMPIONS`
   - cualquier tamaño → `ELIMINACION_DIRECTA` (alternativa)
3. **Sección 2 · Personalizar** — visible al seleccionar plantilla:
   - Steppers: nº grupos (1–4), clasifican por grupo
   - Chips: rondas activas (`OCTAVOS`/`CUARTOS`/`SEMIS`/`FINAL`/`TERCER_PUESTO`)
   - Toggle: repechaje (solo en `CHAMPIONS`)
   - **Preview-flow** del mockup (Grupos → Repechaje → Cuartos → … → 🏆) usando estilos del bracket
   - **Banner de validación** dinámico (igual que el mockup: detecta `totalQualifiers > playoffSlots`)
4. **Sección 3 · Multas** — 3 inputs con formateo `toLocaleString('es-CO')` (amarilla, azul, roja) + 2 steppers (umbral amarillas, fechas suspensión roja).
5. **Sección 4 · Premios** — dos sub-cards (Colectivos, Individuales) con lista editable:
   - Filas con icono (medalla oro/plata/bronce o estrella), nombre, alcance dropdown, monto input
   - Botón **"+ Agregar premio"** por categoría → abre un row nuevo con `alcance=OTRO` y nombre libre
   - Botón eliminar por fila
6. **Footer:** Restablecer · Guardar configuración (un solo POST que envía todo).

Mostrar el wizard solo cuando un torneo está **seleccionado** (selector arriba). En estado `EN_CURSO` deshabilitar Secciones 1 y 2 con tooltip "El formato no se puede cambiar con el torneo en curso"; mantener Sección 4 editable (los premios pueden variar incluso durante el torneo, se aplican al cerrarlo).

### 4.2 `FixtureView.jsx` — mejoras incrementales

- **Acordeón por jornada** con tag de grupo (A/B/—) según el campo `grupo` que ahora viene del backend (ya no se infiere por fecha).
- **Render condicional según formato:**
  - `LIGA`, `GRUPOS_ELIMINATORIAS`, `CHAMPIONS` (fase de grupos) → acordeón de jornadas que ya existe.
  - `ELIMINACION_DIRECTA` y fases KO de los otros formatos → reusar `Bracket.jsx` conectado a partidos reales.
- **Botón "Borrar y regenerar"** → llama al nuevo `DELETE /fixture`. Confirm modal con la lista de partidos a borrar. **Bloqueado si hay al menos un partido `FINALIZADO`.**
- **Exportar CSV** — puro frontend con los partidos en memoria.

### 4.3 API client (`src/api/supercopa.js`)

```js
export function getConfiguracionTorneo(torneoId, token) { ... }
export function guardarConfiguracionTorneo(torneoId, payload, token) { ... }
export function borrarFixture(torneoId, token) { ... }
```

---

## 5. Plantillas con sus presets (referencia para el code)

| Plantilla | Grupos | Clasifican/grupo | Repechaje | Rondas default | Algoritmo backend |
|---|---|---|---|---|---|
| `LIGA` | 1 | — | no | — | `generarLiga` (round-robin actual) |
| `ELIMINACION_DIRECTA` | 0 | — | no | OCTAVOS/CUARTOS/SEMIS/FINAL según N | `generarEliminacionDirecta` |
| `GRUPOS_ELIMINATORIAS` | 2 | 2 | no | CUARTOS,SEMIS,FINAL | `generarGruposPlusPlayoff` |
| `CHAMPIONS` | 2 | 2 | sí | CUARTOS,SEMIS,FINAL | `generarChampions` |

---

## 6. Regla de oro contra pérdida de datos

Estados del torneo y qué se puede editar en cada uno:

| Estado | Formato/grupos/rondas | Multas | Premios | Fixture |
|---|---|---|---|---|
| `BORRADOR` | ✅ editable | ✅ | ✅ | no existe |
| `PUBLICADO` | ✅ editable (no hay inscripciones cerradas aún) | ✅ | ✅ | no existe |
| `EN_CURSO` sin partidos jugados | ❌ bloqueado | ❌ bloqueado | ✅ | regenerable con confirmación |
| `EN_CURSO` con al menos 1 FINALIZADO | ❌ bloqueado | ❌ bloqueado | ✅ | **no regenerable** |
| `FINALIZADO` | ❌ bloqueado | ❌ bloqueado | ❌ congelado | inmutable |

Implementación: el service valida estado antes de cualquier mutación de formato/fixture; el frontend deshabilita controles + muestra banner con la razón. Los premios mantienen editabilidad en `EN_CURSO` porque su efecto económico ocurre al cierre.

---

## 7. Iteraciones de entrega

### Iter 1 · Formato (1–2 días)
- Migración SQL (campos en `torneos` y `partidos`, enum nuevo).
- `FormatoTorneo` + dispatcher en `FixtureService`.
- `generarEliminacionDirecta` nuevo + `generarLiga` (rename del actual).
- Endpoints `GET/PUT /configuracion`.
- `ConfigurarTorneoView` con Sección 1 (plantillas) + Sección 2 (personalizar) básica + preview-flow.
- Smoke test: crear torneo `ELIMINACION_DIRECTA`, generar fixture, verlo en `Bracket.jsx`.

### Iter 2 · Multas + Premios (2 días)
- Entities `MultaConfig`, `PremioTorneo`.
- Sincronización en `guardarConfiguracion` (upsert/diff de premios).
- Sección 3 (multas) + Sección 4 (premios editables con + Agregar / eliminar).
- Endpoint que MS3 ya puede consultar (`MultaConfigService.obtenerPorTorneo(uuid)` in-process).

### Iter 3 · Grupos + Playoff + Mejoras Fixture (2 días)
- `generarGruposPlusPlayoff` + `generarChampions` con placeholders de fase KO.
- Acordeón por jornada con tag de grupo en `FixtureView`.
- Botón "Borrar y regenerar" con guard contra partidos FINALIZADO.
- Render condicional fixture vs bracket según fase.

### Iter 4 (opcional · pulido)
- Animación de progreso al generar (cosmético del mockup).
- Exportar CSV.
- Selector de torneo como cards en lugar de `<select>`.
- Umbral "Recomendada" calibrado contra datos reales del torneo universitario (no FIFA).

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cambiar `numGrupos` post-fixture rompe el sorteo | Bloquear en backend si `partidoRepo.existsByTorneoId(id)`. El frontend ya deshabilita por estado (§6). |
| Placeholders de KO confunden al árbitro | El `Bracket.jsx` ya muestra "Por definir" / "Gan. CF 1". Mantener ese patrón hasta que el partido previo cierre. |
| MS3 lee `MultaConfig` antes de que exista | `MultaConfigService.obtenerPorTorneo` retorna `Optional`; MS3 cae a defaults razonables si está vacío (y log warning). |
| Premio editado en `EN_CURSO` después de que el goleador ya está identificado | Sin riesgo: los premios solo se materializan al cerrar el torneo. Si se quiere auditar, agregar `updatedAt` en `PremioTorneo`. |
| Torneos existentes sin formato | Backfill SQL los marca como `LIGA` (el comportamiento actual). |

---

## 9.1 · Mejoras pendientes (post-demo)

### Validación inteligente de la primera ronda KO en CHAMPIONS / GRUPOS_ELIMINATORIAS

Hoy "Pasan directo por grupo" está hardcodeado en **2** (top 2 de cada grupo, por el reglamento del torneo en [`docs/reglas_rondas_eliminacion.md`](reglas_rondas_eliminacion.md)). La UI no muestra ese desglose y el warning compara `totalClasifican = numGrupos × clasifican` directamente contra los cupos de la ronda elegida, sin considerar que el repechaje **mitad reduce a la mitad** el número de ganadores que avanzan.

**Caso problemático que motivó la nota:** 2 grupos × 5 equipos.
- Top 2 por grupo = **4 directos**.
- 3°-5° de cada grupo (6 eq) → repechaje (3 cruces → 3 ganadores).
- Total primera KO = 4 + 3 = **7** → no encaja en CUARTOS (8 cupos).
- SIN repechaje: 4 directos → encaja perfecto en **SEMIS** (4 cupos), no en CUARTOS.

**Lo que la UI debería hacer (futuro):**

1. **Mostrar desglose en la sección Personalizar** cuando hay grupos:
   - "Pasan directo: 4 (top 2 × grupo)"
   - "A repechaje: 6 (3°-5°)"
   - "Ganadores repechaje: 3"
   - "Cupos primera KO: 7"

2. **Sugerir la ronda KO óptima** según `equiposParaPrimeraKO`:
   - 2 → solo FINAL · 4 → SEMIS+FINAL · 8 → CUARTOS+SEMIS+FINAL · 16 → OCTAVOS+...
   - Cuando el admin elige una ronda incompatible, mostrar "sugerencia: usa SEMIS".

3. **Bloquear repechaje impar** (caso 3 equipos a repechaje → no se pueden emparejar).

4. **Hacer "Pasan directo por grupo" configurable** (variable, no fijo en 2) para soportar formatos custom donde la cabeza de serie cambia.

5. **Validar que `repechaje > 0`** cuando el toggle está activado (si clasifican ≤ pasanDirecto no quedan equipos para repechaje).

**Por qué no se hizo ahora:** el bug del warning con math incorrecta detectó el problema, pero el demo de mañana sigue funcional usando configuraciones que SÍ encajan (13 equipos / 2 grupos / 6 clasifican / repechaje → 4 directos + 4 ganadores = 8 CUARTOS ✓). El refactor de la lógica de validación + UI de desglose se posterga hasta tener feedback post-demo del Admin sobre qué configuraciones más usa.

Anclas en el código: el TODO está como bloque comentario justo arriba del `useMemo` de `warning` en [`ConfigurarTorneoView.jsx`](../src/pages/admin/ConfigurarTorneoView.jsx). El cálculo `equiposParaPrimeraKO` ya existe ahí y sirve como base para implementar la sugerencia.

---

## 9. Qué NO se hace en este plan

- Sorteo manual de equipos en grupos (queda a "orden de inscripción" en v1).
- Pago automático de premios (HU futuro de MS3).
- Notificaciones a delegados/jugadores cuando cambia la configuración (MS5).
- Aplazamientos, W.O., penales (HU17/22/23).
- Personalizar fechas/horarios por jornada (HU13/14).
- UI de "Doble Eliminación" (descartado por decisión del Admin).
