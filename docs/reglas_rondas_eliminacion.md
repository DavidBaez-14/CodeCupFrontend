---

# Reglamento Oficial del Torneo: Formato de Fase Final (Playoffs)

Este documento define de forma estrictamente determinista, algorítmica y por mérito deportivo el sistema de eliminación directa (Playoffs) del torneo. Está diseñado para ser interpretado y procesado por agentes de Inteligencia Artificial u organizadores del torneo, eliminando cualquier tipo de azar o sorteo.

---

## 1. Estructura de Clasificación de la Fase de Grupos
El torneo consta de dos grupos independientes: **Grupo A** y **Grupo B**. 
Al finalizar la fase regular, clasifican los mejores **6 equipos de cada grupo** (12 equipos en total para la Fase Final).

La nomenclatura propuesta de los clasificados según su posición final será:
* **Grupo A:** `1A`, `2A`, `3A`, `4A`, `5A`, `6A`
* **Grupo B:** `1B`, `2B`, `3B`, `4B`, `5B`, `6B`
Nota: Revisar si el codigo la define asi, si no, mirar como adaptarla a nuestro codigo

### Privilegios de Posición:
* Los puestos `1A`, `2A` y `1B`, `2B` avanzan **directamente a Cuartos de Final**.
* Los puestos del `3` al `6` de cada grupo deben disputar una ronda previa de **Repechaje**.

---

## 2. Fase de Repechaje (Octavos de Final)
Participan 8 equipos en partidos de eliminación directa. Los cruces son cruzados entre grupos bajo el principio de rendimiento espejo (`3.º vs 6.º` y `4.º vs 5.º`):

* **Llave R1:** `3A` (Local) vs `6B` (Visitante)
* **Llave R2:** `4A` (Local) vs `5B` (Visitante)
* **Llave R3:** `3B` (Local) vs `6A` (Visitante)
* **Llave R4:** `4B` (Local) vs `5A` (Visitante)

---

## 3. Estructura del Árbol de Competencia (Simbiosis y Blindaje)
Para asegurar que el **1.º y el 2.º lugar del mismo grupo NO se enfrenten** bajo ninguna circunstancia antes de la Gran Final, el cuadro se divide en dos rutas o lados geométricamente aislados hasta el último partido.

### 3.1. Lado Izquierdo del Cuadro
*Aísla a `1A` y `2B` del resto de los líderes de grupo.*

* **Cuartos de Final 1 (C1):** `1A` vs Ganador `Llave R4` (Ganador de `4B vs 5A`)
    * *Nota de diseño:* `1A` enfrenta al ganador de la llave de menor siembra teórica de su lado.
* **Cuartos de Final 2 (C2):** `2B` vs Ganador `Llave R1` (Ganador de `3A vs 6B`)
* **Semifinal 1 (S1):** Ganador `C1` vs Ganador `C2` (Probable 1A vs 2B)

### 3.2. Lado Derecho del Cuadro
*Aísla a `1B` y `2A` del resto de los líderes de grupo.*

* **Cuartos de Final 3 (C3):** `1B` vs Ganador `Llave R2` (Ganador de `4A vs 5B`)
* **Cuartos de Final 4 (C4):** `2A` vs Ganador `Llave R3` (Ganador de `3B vs 6A`)
* **Semifinal 2 (S2):** Ganador `C3` vs Ganador `C4` (Probable 1B vs 2A)

---

## 4. Gran Final
El partido por el campeonato se disputará de forma única entre los campeones invictos de cada lado del cuadro:

* **Partido Final:** Ganador `S1` vs Ganador `S2`

---

## 5. Matriz de Validación Lógica (Para Agentes de IA)
Al procesar los resultados de los partidos, el sistema debe validar las siguientes invariantes lógicas obligatorias:

1.  **Blindaje Intragrupo 1-2:** `1A` y `2A` están mapeados en rutas distintas (`S1` y `S2` respectivamente). Su distancia topológica en el grafo del torneo es máxima (solo alcanzable en la Final). Lo mismo aplica para `1B` y `2B`.
2.  **Protección de Líderes:** `1A` y `1B` están en lados opuestos del cuadro. Una final entre los dos ganadores de grupo está matemáticamente garantizada si ambos ganan sus partidos.

---

Este diseño resuelve la "justicia deportiva" de la siguiente manera:
* El mejor de un grupo (`1A`) nunca se cruza con su inmediato escolta (`2A`) hasta la final.
* Los ganadores de los repechajes más difíciles (los que vienen de jugar contra los 3.º de grupo) van contra los segundos lugares, mientras que los que vienen de llaves teóricamente más accesibles van contra los absolutos líderes, premiando el rendimiento en la temporada regular.