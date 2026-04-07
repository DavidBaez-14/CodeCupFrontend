# Historias de Usuario - Actor: Árbitro

## HU19: Verificar elegibilidad de jugadores antes del partido
**Microservicio:** MS3 · Partido  
**Como:** Árbitro (interfaz móvil)  
**Puntos:** 5 pts | **Horas est.:** 10 h  

**Quiero:** Ver la lista de jugadores de ambos equipos con indicadores visuales de elegibilidad (habilitado / inhabilitado por sanción o deuda) antes de iniciar el partido.  
**Para:** Evitar que participen jugadores no autorizados y registrar de forma oficial la alineación que se aprobó al inicio del partido.

### Escenario principal
1. El árbitro accede desde su móvil al módulo del partido asignado antes del inicio.
2. El sistema presenta la lista de jugadores inscritos de ambos equipos con un indicador visual: verde (habilitado) o rojo (inhabilitado por sanción activa o deuda pendiente).
3. El árbitro revisa la lista con los delegados presentes.
4. El árbitro puede habilitar manualmente a un jugador inhabilitado por deuda si el delegado demuestra el pago en cancha.
5. El árbitro confirma la alineación oficial y el sistema la registra antes de iniciar el partido.

### Criterios de aceptación
- ✔ La lista se carga en tiempo real consultando MS4 para deudas y el registro de sanciones de MS3.
- ✔ El indicador rojo muestra la razón específica: 'Sanción activa (suspendido X fecha)' o 'Deuda pendiente de $X COP'.
- ✔ El árbitro puede habilitar un jugador con deuda; la acción queda registrada con el nombre del árbitro y la hora.
- ✔ La alineación confirmada queda bloqueada; no se pueden agregar jugadores no confirmados después del inicio.
- ✔ La interfaz es completamente responsiva y funcional en pantallas de 5 a 7 pulgadas sin necesidad de zoom.

---

## HU20: Registrar eventos del partido con trazabilidad cronológica
**Microservicio:** MS3 · Partido  
**Como:** Árbitro (interfaz móvil)  
**Puntos:** 8 pts | **Horas est.:** 16 h  

**Quiero:** Registrar en tiempo real los eventos del partido (gol, tarjeta amarilla, tarjeta roja, doble amarilla = expulsión) asociados al jugador correspondiente y con una razón opcional.  
**Para:** Que el sistema mantenga un historial cronológico del partido visible en el frontend y calcule automáticamente el marcador, las sanciones y las multas al momento de cada evento.

### Escenario principal
1. El árbitro accede al panel del partido en curso desde su móvil.
2. El árbitro selecciona el tipo de evento (Gol, Tarjeta Amarilla, Tarjeta Roja), el equipo y el jugador; ingresa una razón opcional.
3. El sistema registra el evento y actualiza el marcador en tiempo real.
4. Si es la segunda tarjeta amarilla del mismo jugador, el sistema lo expulsa automáticamente y genera la multa.
5. El frontend público muestra la secuencia cronológica del partido.

### Criterios de aceptación
- ✔ Los tipos de evento disponibles son: Gol, Tarjeta Amarilla, Tarjeta Roja Directa, Expulsión por doble amarilla.
- ✔ Al registrar una tarjeta, el sistema llama a MS4 para generar automáticamente la multa según los montos configurados.
- ✔ La doble amarilla genera expulsión automática y aparece en el historial como un evento único con ambas tarjetas.
- ✔ El marcador visible en el frontend se actualiza en tiempo real (polling máx. 10 segundos o WebSocket).
- ✔ El historial cronológico de eventos es inmutable; el árbitro no puede editar ni borrar eventos ya registrados sin autorización del administrador.

---

## HU21: Registrar resultado final del partido
**Microservicio:** MS3 · Partido  
**Como:** Árbitro  
**Puntos:** 3 pts | **Horas est.:** 6 h  

**Quiero:** Confirmar y cerrar el resultado final del partido al finalizar el tiempo reglamentario.  
**Para:** Que el sistema actualice automáticamente la tabla de posiciones del grupo o el marcador acumulado de la llave eliminatoria correspondiente.

### Escenario principal
1. El árbitro selecciona 'Cerrar partido' en el módulo del partido.
2. El sistema muestra el marcador final basado en los eventos registrados y solicita confirmación.
3. El árbitro confirma; el partido pasa al estado 'Finalizado'.
4. El sistema recalcula la tabla de posiciones o el avance en la llave eliminatoria.
5. En fases eliminatorias con partidos de ida y vuelta, el sistema acumula los puntos y determina si se necesitan penales.

### Criterios de aceptación
- ✔ Al cerrar el partido, el sistema calcula y actualiza PJ, PG, PE, PP, GF, GC, DG y Pts de ambos equipos en la tabla.
- ✔ En fases eliminatorias a partido único: si el marcador final es empate, el sistema habilita el módulo de penales.
- ✔ En fases eliminatorias ida y vuelta: el sistema calcula los puntos acumulados de ambos partidos; si empatan en puntos, habilita el módulo de penales.
- ✔ Un partido finalizado no puede reabrirse para edición sin la autorización explícita del administrador.
- ✔ El resultado final es inmediatamente visible en el cronograma público sin recargar la página.

---

## HU22: Registrar W.O. con observación del árbitro
**Microservicio:** MS3 · Partido  
**Como:** Árbitro  
**Puntos:** 3 pts | **Horas est.:** 6 h  

**Quiero:** Registrar un partido como W.O. cuando un equipo no se presenta o no reúne el mínimo de 4 jugadores, y añadir una observación sobre la causa.  
**Para:** Documentar oficialmente la inasistencia y asignar automáticamente el resultado 3-0 al equipo asistente para actualizar la tabla de posiciones.

### Escenario principal
1. El árbitro accede al módulo del partido y selecciona 'Registrar W.O.'.
2. El sistema pregunta qué equipo no se presentó.
3. El árbitro selecciona el motivo: No presentación, Menos de 4 jugadores, Partido no arbitrado por falta de pago, Suspendido por lluvia, Otro.
4. El árbitro puede agregar un comentario libre adicional.
5. El sistema registra el resultado 3-0 para el equipo asistente.

### Criterios de aceptación
- ✔ El resultado de 3-0 se aplica automáticamente a la tabla de posiciones a favor del equipo que sí cumplió.
- ✔ El sistema genera una observación automática en el cronograma público explicando el W.O.
- ✔ La razón del W.O. queda guardada para auditoría del administrador.