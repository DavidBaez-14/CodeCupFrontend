# MEJORA DE INTERFAZ — CODE-CUP Frontend
# El proyecto React ya existe y funciona. NO tocar la lógica
# de autenticación, las llamadas a la API ni el manejo del JWT.
# Este prompt es SOLO de interfaz y estructura de navegación.

## CONTEXTO VISUAL DE REFERENCIA
La identidad visual objetivo es deportiva universitaria:
- Fondo: negro profundo (#0a0a0a) con gradientes oscuros
- Acento primario: naranja (#f97316) con gradiente hacia rojo (#ef4444)
- Texto: blanco puro para títulos, gris claro (#a1a1aa) para subtítulos
- Cards: fondo #1a1a1a con borde sutil #2a2a2a
- Tipografía display: Barlow Condensed (Google Fonts) para títulos
- Tipografía cuerpo: DM Sans (Google Fonts) para texto general
- Botón primario: gradiente linear de #f97316 a #ef4444, texto blanco,
  sin border-radius exagerado (8px máximo)
- Íconos: Lucide React (ya instalado)

---

## TAREA 1 — PÁGINA PÚBLICA (ruta "/")

Rediseñar completamente la vista pública para que tenga:

### Navbar fijo superior
- Fondo semitransparente con blur (backdrop-filter)
- Izquierda: logo "CODE-CUP" con ícono de balón (Lucide: Trophy o
  el más cercano a fútbol) en naranja
- Centro: links de navegación — INICIO · TORNEOS · SALÓN DE LA FAMA
  El link activo lleva subrayado naranja
- Derecha: ícono de persona (UserCircle de Lucide) que al hacer clic
  redirige a "/login". Sin texto, solo el ícono.

### Hero section (pantalla completa con imagen de fondo)
- Imagen de fondo: usar esta URL de Unsplash como background-image
  con overlay oscuro sobre ella:
  https://images.unsplash.com/photo-1552667466-07770ae110d0?w=1600
- Badge pill superior: "SUPER COPA 2026 · EN CURSO" fondo naranja
- Título grande en Barlow Condensed:
  línea 1 blanca: "Super Copa 2026"
  línea 2 naranja: "Mundial"
- Subtítulo: "Facultad de Ingeniería de Sistemas · UFPS"
- Dos botones: "VER CRONOGRAMA" (primario naranja) y
  "TABLA DE POSICIONES" (secundario con borde blanco)

### Ticker de novedades
Barra horizontal que corre de derecha a izquierda con animación CSS
continua (no JS). Texto de ejemplo por ahora:
"SUPER COPA 2026 · MUNDIAL  ·  INSCRIPCIONES ABIERTAS  ·
 PRÓXIMOS PARTIDOS EN CAMINO  ·  ¡QUE EMPIECE EL TORNEO!"
Fondo naranja, texto negro, tipografía Barlow Condensed.

### Sección de estadísticas (3 cards)
Cards horizontales con número grande en naranja y etiqueta en gris:
- Equipos inscritos: 0
- Partidos jugados: 0
- Goles marcados: 0
Los números se mostrarán en 0 por ahora (se conectarán al backend
en un sprint posterior).

### Sección "Próximos encuentros" (placeholder)
Título de sección con línea decorativa naranja a la izquierda.
3 cards de partido placeholder con: Equipo A vs Equipo B,
fecha ficticia, cancha ficticia. Diseño oscuro con el marcador
central entre los dos nombres de equipo.

### Sección "Tabla de posiciones" (placeholder)
Tabla oscura con 3 filas de ejemplo. Columnas: POS, EQUIPO, PJ,
PG, PE, PP, GF, GC, DG, PTS. Primera fila resaltada en naranja
tenue para indicar el líder.

### Sección "Goleadores" (placeholder)
Top 3 cards horizontales con: posición numerada en naranja,
nombre ficticio, equipo ficticio, cantidad de goles. Diseño
tipo ranking deportivo.

### Footer
Fondo #111111, logo CODE-CUP, "Facultad de Ingeniería de Sistemas
· UFPS · 2026", links: Reglamento (placeholder), Contacto
(placeholder).

---

## TAREA 2 — PÁGINA DE LOGIN (ruta "/login")

Mantener toda la lógica actual (fetch a /api/auth/login,
guardado del JWT, redirección por rol). Solo rediseñar la UI.

### Diseño
- Fondo: mismo que la landing (oscuro con gradiente)
- Card centrada, máximo 480px de ancho, padding generoso,
  borde sutil, sin border-radius mayor a 12px
- Logo CODE-CUP en la parte superior de la card
- Título: "Iniciar sesión" en Barlow Condensed tamaño grande
- Subtítulo gris: "Ingresa con tu cuenta institucional"

### Selección de rol — MANTENER LA LÓGICA ACTUAL
Tres pills/tabs horizontales en la parte superior de la card:
- 🛡 Administrador (Shield de Lucide)
- ⚖ Árbitro (Scale o Whistle — usar Scale)
- 👥 Delegado (Users de Lucide)
El tab activo tiene fondo naranja y texto blanco.
Los inactivos tienen fondo #2a2a2a y texto gris.
Al cambiar de tab el formulario debajo se mantiene igual
(correo + contraseña) — no cambia nada funcional, solo indica
con qué rol intenta entrar.

### Formulario
- Labels en gris claro sobre los inputs
- Inputs: fondo #1a1a1a, borde #3a3a3a, texto blanco,
  borde naranja al focus
- Botón "Ingresar": gradiente naranja a rojo, ancho completo
- Mensaje de error: bajo el botón, texto rojo, fondo rojo
  tenue (#2a0a0a), borde izquierdo rojo

### Separador y Google
- Separador "— o —" en gris
- Botón "Continuar con Google": fondo blanco, texto negro,
  ícono de Google SVG inline (no librería), ancho completo

---

## TAREA 3 — DASHBOARD ADMINISTRADOR (ruta "/dashboard/admin")

### Estructura: Sidebar fijo + área de contenido

#### Sidebar (240px de ancho, fijo a la izquierda)
Fondo #111111, borde derecho #2a2a2a.

Secciones con sus ítems (cada ítem tiene ícono Lucide + label):

IDENTIDAD
- Usuarios del sistema (Users)
- Cargar jugadores CSV (Upload)

TORNEO
- Configurar torneo (Settings)
- Gestionar equipos (Shield)
- Fixture y cronograma (Calendar)
- Aplazamientos (Clock)

PARTIDO
- Partidos en curso (Activity)
- Resultados (CheckSquare)

FINANZAS
- Comprobantes pendientes (FileText)
- Multas activas (AlertTriangle)

REPORTES
- Estadísticas (BarChart2)
- Reporte PDF (Download)
- Salón de la Fama (Trophy)

El ítem activo tiene fondo naranja tenue (#2a1500) y borde
izquierdo naranja de 3px. Los ítems inactivos son gris
con hover en #1f1f1f.

En la parte inferior del sidebar: avatar con inicial del nombre
del admin, su nombre y correo, y botón "Cerrar sesión" (LogOut).

#### Header del área de contenido
Muestra el título de la sección activa y un breadcrumb simple.

#### Vista inicial del admin: "Usuarios del sistema"
Esta vista SÍ está conectada al backend existente.
Mantener toda la lógica actual de crear usuario y cargar CSV.
Solo rediseñar la UI:

- Dos columnas en desktop: formulario de crear usuario (izquierda)
  y cargar CSV (derecha). Mismo layout actual pero con los nuevos
  estilos.
- Debajo: tabla de usuarios existentes con columnas:
  Nombre, Correo, Rol (badge de color: azul=Admin,
  naranja=Árbitro, verde=Delegado), Estado (activo/inactivo),
  Acciones (toggle de estado).
- El campo "Proveedor" del formulario actual: eliminarlo del
  formulario visible. Siempre enviar LOCAL en el request.
  (El campo proveedor_auth se está simplificando según decisión
  de arquitectura previa.)

#### Las demás secciones del sidebar
Mostrar un placeholder con el título de la sección, el ícono
correspondiente grande y el texto "Módulo disponible en Sprint 2".
No conectar al backend aún.

---

## TAREA 4 — DASHBOARD DELEGADO (ruta "/dashboard/delegado")

### Estructura: Navbar de tabs horizontal + área de contenido

#### Navbar superior del dashboard
Fondo #111111, logo CODE-CUP a la izquierda.
Tabs horizontales en el centro:
- Mi Equipo (Shield)
- Jugadores (Users)
- Pagos (CreditCard)
- Cronograma (Calendar)
- Mi Perfil (User)

Tab activo: texto naranja con subrayado naranja.
A la derecha: nombre del delegado + botón "Cerrar sesión".

#### Tab activo por defecto: "Jugadores"
Esta vista SÍ está conectada al backend existente.
Mantener la lógica actual de consulta por cédula.
Rediseñar la UI:

- Card de búsqueda con input de cédula y botón "Buscar"
- Resultado: card con diseño tipo ficha de jugador:
  badge de color según rol (ESTUDIANTE=azul, GRADUADO=verde,
  PROFESOR=morado, ADMINISTRATIVO=gris), nombre grande,
  semestre si aplica, código universitario, estado activo/inactivo
  con pill de color.

#### Los demás tabs
Mostrar placeholder: ícono grande, título del tab, texto
"Disponible en Sprint 2".

---

## REGLAS ESTRICTAS

1. NO modificar ningún archivo en src/api/. La capa de llamadas
   al backend no se toca.
2. NO modificar la lógica de AuthContext, PrivateRoute ni el
   manejo del JWT en localStorage.
3. NO instalar librerías nuevas. Usar solo lo que ya existe:
   React, Tailwind, React Router, Lucide React.
4. Todos los estilos van en clases Tailwind. No usar style
   inline salvo para el background-image del hero.
5. Los cambios se hacen archivo por archivo. Antes de modificar
   cada componente, dime qué archivo vas a tocar y espera
   confirmación.
6. El campo "Proveedor" se elimina del formulario del admin
   pero el código subyacente puede mantener el campo si ya
   existe en el backend — simplemente no mostrarlo en la UI.

---

## ORDEN DE TRABAJO

1. Instalar fuentes Barlow Condensed y DM Sans en index.html
   via Google Fonts link tag.
2. Actualizar las variables de color base en index.css o
   tailwind.config.js si es necesario.
3. Rediseñar Navbar público + Landing page.
4. Rediseñar LoginPage.
5. Rediseñar Dashboard Admin con sidebar.
6. Rediseñar Dashboard Delegado con tabs.

Empieza por el paso 1 y espera confirmación antes de continuar.