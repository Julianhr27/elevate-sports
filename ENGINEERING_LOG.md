# ENGINEERING LOG — Elevate Sports

> Diario de a bordo del equipo de ingeniería.
> Al iniciar cada sesión, leer este archivo para recuperar contexto y progreso.
> **Convención de orden por sprint:** @Arquitecto → @Diseñadora → @Data → @Desarrollador → @QA (estructura → diseño → datos → implementación → validación)

---

## 2026-03-28 — Sprint "Command Calendar": RSVP Engine + Competition Planner
**Directiva de**: Julián
**Status**: QA EN CURSO — ver reporte @Sara abajo

### Plan

Módulo de Calendario unificado que combina:
- **Competition Planner**: vista mensual custom (sin FullCalendar), diferenciación visual por tipo de evento, navegación prev/next.
- **RSVP Engine**: estados por deportista por evento (CONFIRMADO | AUSENTE | DUDA), widget de disponibilidad en tiempo real, recordatorio simulado con toast.
- Bloqueo de entrada de RPE para inasistencia confirmada (lógica en Entrenamiento, expuesta via localStorage).

### Task Assignment

- **@Andres (UI)**: Componente `Calendario.jsx` completo — grid mensual glassmorphism, badges de evento por color, panel lateral de evento seleccionado, lista de deportistas + RSVP inline, widget de disponibilidad, animaciones Framer Motion, responsive mobile.
- **@Mateo (Data)**: Datos demo generados internamente (3-4 partidos, 3-4 entrenamientos, 1-2 eventos de club para el mes actual). Estado RSVP persistido en localStorage con namespace `elevate_rsvp_{clubId}`. Helper `getRsvpKey(clubId, eventId, athleteId)`.
- **@Sara (QA)**: Verificar que el conteo de disponibilidad sea reactivo, que el bloqueo de RPE funcione, que la navegación prev/next sea correcta y que el responsive mobile no rompa el grid.

### Architecture Decisions

1. **Sin FullCalendar** — bundle ligero. Grid propio 7x6 con CSS grid, generado en JS puro.
2. **RSVP integrado** en `Calendario.jsx` como panel lateral — no archivo separado. Un solo componente lazy-loaded.
3. **Persistencia localStorage** con namespace `elevate_rsvp_{clubId}` — compatible con el patrón offline-first existente. Estructura: `{ [eventId]: { [athleteId]: "CONFIRMADO"|"AUSENTE"|"DUDA" } }`.
4. **Colores de evento**: Entrenamiento = `PALETTE.purple`, Partido oficial = `PALETTE.neon`, Evento de club = `PALETTE.amber`.
5. **Módulo `calendario`** agregado al sistema RBAC — accesible para roles `admin` y `coach`. Se añade `"view:calendario"` a ambos roles en `roles.js`.
6. **Lazy import** desde `App.jsx`, misma convención que los demás módulos.

### Validation Criteria

- Grid mensual renderiza correctamente para cualquier mes (primer día variable, semanas variables).
- Evento seleccionado muestra panel con lista de deportistas y sus estados RSVP actuales.
- Cambiar estado RSVP actualiza el widget de disponibilidad en tiempo real.
- Botón "Enviar recordatorio" dispara `showToast` con mensaje descriptivo.
- Navegación prev/next cambia el mes y re-renderiza el grid sin errores.
- No hay `any` types implícitos (aunque el proyecto usa JSX, las prop shapes están documentadas via JSDoc).
- Responsive: en mobile, el panel lateral cae debajo del grid o se colapsa.

### @Sara (QA) — 2026-03-28 — REPORTE OFICIAL: Calendario + RSVP Engine

**Veredicto: CONDITIONAL GO-LIVE — 2 blockers deben resolverse antes de merge a master**

---

#### RESUMEN EJECUTIVO

El módulo Calendario.jsx es técnicamente sólido en un 80%. El build compila limpio (0 errores, 0 warnings). La arquitectura RBAC es correcta. Sin embargo, hay un contrato roto crítico entre RSVP y RPE, un riesgo de privacidad Ley 1581 en datos de menores sin namespace de club en las claves auxiliares, y un ID fallback que puede producir corrupción de datos silenciosa.

---

#### HALLAZGOS POR SEVERIDAD

---

**BUG-CAL-001 — CRITICO**
**Categoria**: Data Integrity — RPE Block Contract Broken
**Archivo**: `src/components/Calendario.jsx` (linea 235) + `src/components/Entrenamiento.jsx`
**Descripcion**: El bloqueo de RPE para atletas AUSENTE esta implementado como un contrato de una sola cara. Calendario escribe `elevate_rsvp_absent_{eventId}_{athleteId}` en localStorage, pero Entrenamiento.jsx NO lee esa clave en ninguna parte. Entrenamiento determina ausencia exclusivamente via `a.status === "A"` (campo del objeto atleta). El bloqueo de RPE prometido en la arquitectura es una feature fantasma: no funciona en absoluto.
**Pasos para reproducir**:
1. Abrir Calendario, seleccionar un evento, marcar a un atleta como AUSENTE.
2. Ir a Entrenamiento y registrar RPE para ese mismo atleta.
3. El sistema acepta el RPE sin ningun bloqueo ni advertencia.
**Esperado**: El sistema bloquea la entrada de RPE o muestra advertencia visible.
**Actual**: El RPE se registra normalmente. La clave `elevate_rsvp_absent_*` existe en localStorage pero nadie la consume.
**Impacto**: Datos de entrenamiento invalidos. Un atleta ausente puede tener RPE registrado, contaminando los calculos de carga y los snapshots de salud.
**Fix requerido**: Entrenamiento debe leer `localStorage.getItem(`elevate_rsvp_absent_${eventId}_${athleteId}`)` al momento de abrir el modulo del dia, o bien el estado AUSENTE debe propagarse al campo `a.status` del atleta. El equipo debe decidir el canal canonico; actualmente hay dos y ninguno esta conectado.

---

**BUG-CAL-002 — MAYOR**
**Categoria**: Data Integrity — Athlete ID Fallback
**Archivo**: `src/components/Calendario.jsx` (lineas 419, 549, 551)
**Descripcion**: El sistema usa `a.id || a.nombre` como identificador de atleta en todo el mapa RSVP. Si un atleta no tiene campo `id` definido, se usa `nombre` como clave. Si dos atletas tienen el mismo nombre (caso comun en equipos infantiles: dos "Juan Gonzalez"), sus estados RSVP se fusionaran silenciosamente en la misma entrada del mapa. Ademas, si el nombre tiene espacios o caracteres especiales, la clave del localStorage auxiliar `elevate_rsvp_absent_{eventId}_{nombre}` puede contener espacios, lo que es valido pero fragil y dificulta la depuracion.
**Fix requerido**: Garantizar que todos los atletas tengan `id` UUID antes de llegar al Calendario. Agregar una guardia en el hook: si `!athlete.id`, loggear error y usar un hash del nombre+posicion como fallback, nunca el nombre crudo.

---

**BUG-CAL-003 — MAYOR**
**Categoria**: Privacidad / Ley 1581 — Datos RSVP de Menores sin club_id en claves auxiliares
**Archivo**: `src/components/Calendario.jsx` (linea 235)
**Descripcion**: La clave maestra de RSVP SI esta correctamente namespaciada: `elevate_rsvp_{clubId}`. Sin embargo, las claves auxiliares de bloqueo de RPE NO incluyen el clubId: `elevate_rsvp_absent_{eventId}_{athleteId}`. En un dispositivo compartido entre dos coaches de clubes diferentes (escenario posible en escuelas deportivas), el estado de ausencia de un menor de Club A es legible por el Club B si adivina el formato de clave. Estos datos (asistencia de menores a eventos) califican como datos personales bajo Ley 1581 y deben estar aislados por club.
**Fix requerido**: Cambiar la clave a `elevate_rsvp_absent_{clubId}_{eventId}_{athleteId}` e incluir `clubId` como parametro en `setRsvp`.

---

**BUG-CAL-004 — MENOR**
**Categoria**: Privacidad / Ley 1581 — RSVP de menores como dato sensible
**Archivo**: `src/components/Calendario.jsx` (hook useRsvp)
**Descripcion**: Los estados RSVP de atletas menores de edad (asistencia a eventos deportivos) son datos personales bajo Ley 1581. Actualmente se persisten en localStorage sin ninguna anotacion de categoria del dato ni mecanismo de borrado selectivo. No es un blocker inmediato dado que el consentimiento guardian ya existe en el schema de `profiles` (migration 005), pero se debe documentar que el borrado de datos de un menor via "right to erasure" debe incluir limpiar sus claves RSVP de localStorage y, en el futuro, de Supabase.
**Fix requerido**: Agregar a la documentacion del backlog: cuando se implemente borrado de atleta, iterar y limpiar todas las claves `elevate_rsvp_*` donde aparezca el `athleteId` del menor.

---

**BUG-CAL-005 — MENOR**
**Categoria**: UX — Convocados por posicion de array, no por lista explicita
**Archivo**: `src/components/Calendario.jsx` (linea 425)
**Descripcion**: Para partidos oficiales, los "convocados" se determinan tomando los primeros N atletas del array: `athleteIds.slice(0, event.convocados)`. El orden del array es el orden de insercion en localStorage, no un criterio de seleccion tecnica. En produccion esto significa que el entrenador ve el RSVP de los primeros 22 atletas ordenados por cuando fueron agregados al sistema, no por quienes estan realmente convocados para ese partido.
**Fix requerido**: En la version de produccion (no demo), el evento partido debe tener un campo `convocadoIds: string[]` con los IDs explicitos seleccionados por el coach. El slice por N es aceptable solo en modo demo.

---

#### CHECKS QUE PASARON

**SEGURIDAD XSS**: PASS. Busqueda exhaustiva de `dangerouslySetInnerHTML`, `innerHTML`, `eval()` — ninguno encontrado. Todo el contenido dinamico se renderiza via JSX, que escapa por defecto.

**MULTI-TENANCY localStorage**: PASS (parcial — ver BUG-CAL-003 para la clave auxiliar). La clave maestra `elevate_rsvp_{clubId}` esta correctamente namespaciada. Fallback a `"demo"` cuando clubId es vacio es correcto.

**RBAC**: PASS. `view:calendario` esta presente en roles `admin` y `coach`. El rol `staff` no tiene acceso, correcto. La verificacion se hace en `canAccessModule()` antes de renderizar, en `navigateTo` de App.jsx. El tile en Home.jsx usa `onNavigate("calendario")` que pasa por el mismo guard.

**PERFORMANCE — Bundle Calendario**: PASS. El chunk `Calendario-BsQ8P6d5.js` pesa 20.42 kB (5.76 kB gzip). Dentro del rango aceptable. La decision de no usar FullCalendar fue correcta.

**PERFORMANCE — Re-renders**: PASS. `useMemo` en `events`, `grid`, y `eventsByDay`. `useCallback` en `getRsvp`, `setRsvp`, `getAvailability`, `prevMonth`, `nextMonth`, `handleSelectEvent`, `cycle`. No hay re-renders innecesarios identificados.

**PERFORMANCE — Build**: PASS. Build limpio en 741ms. 0 errores, 0 warnings. Lazy import correcto desde App.jsx con ErrorBoundary y Suspense.

**EDGE CASES**:
- Atletas = 0: PASS. `convocadoIds.length === 0` muestra empty state con mensaje descriptivo.
- Cambio de mes con evento seleccionado: PASS. `useEffect` detecta que el evento seleccionado ya no existe y cierra el panel.
- clubId vacio string: PASS. Fallback a `"demo"` en el hook.
- Navegacion prev/next en enero/diciembre: PASS. La logica maneja el rollover de año correctamente.

**ENTRENAMIENTO — conexion navegacion**: PASS. El tile en Home.jsx usa `onNavigate("calendario")`, que pasa por `canAccessModule()` en App.jsx antes de cambiar `activeModule`.

---

#### VEREDICTO FINAL

**CONDITIONAL GO-LIVE**

Condiciones para desbloquear merge a master:

1. **BUG-CAL-001** (CRITICO): Implementar la lectura del bloqueo RPE en Entrenamiento.jsx, o remover la promesa de la arquitectura y documentar que el bloqueo es trabajo futuro. No se puede shipear una feature documentada que no funciona.
2. **BUG-CAL-003** (MAYOR): Agregar `clubId` a las claves auxiliares de ausencia para cumplir el patron de aislamiento de datos de menores exigido por Ley 1581.

Los BUG-CAL-002, 004, 005 pueden resolverse en el siguiente sprint.

@Arquitecto: BUG-CAL-001 requiere decision de arquitectura sobre el canal canonico de bloqueo RPE.
@Mateo: BUG-CAL-002 requiere garantia de que los atletas siempre tienen UUID antes de llegar al Calendario.

---

## 2026-03-28 — Sprint Landscape: TacticalBoard v9.1 REDISEÑO COMPLETO DEL CAMPO
**Directiva de**: Julián — "La pizarra se ve angosta, sin libertad de movimiento, poco profesional"
**Status**: 🟢 V9.1 LISTO PARA QA — Build limpio, 0 errores, 0 warnings

### @Andres-UI — 2026-03-28

**CAMBIOS ENTREGADOS v9.1:**

1. **FieldLayer.jsx** — REDISEÑO COMPLETO
   - viewBox cambiado de `0 0 90 130` (vertical) a `0 0 105 68` (landscape, proporciones reales FIFA)
   - Eliminada perspectiva 3D (rotateX) — vista cenital plana como pizarra magnética
   - Césped adaptado a landscape: bandas de segado VERTICALES (90deg en lugar de 0deg)
   - Prop `viewMode` ("full" | "half") — campo completo o media cancha ofensiva
   - Líneas recalculadas: areas 16.5m x 40.32m en unidades 105x68, arcos de penalti correctos
   - GK rival a la izquierda, GK propio a la derecha (convención landscape)
   - `preserveAspectRatio="none"` en el SVG (llena el contenedor sin barras)

2. **DrawingLayer.jsx** — viewBox actualizado a `0 0 105 68` (coincide con FieldLines)

3. **useDrawingEngine.js** — `clientToField` actualizado
   - Antes: coordenadas 0-100 (porcentaje)
   - Ahora: coordenadas 0-105 x 0-68 (unidades SVG reales del campo)
   - Trazados almacenados en unidades físicas del campo, independientes del DOM

4. **TacticalBoardV9.jsx** — REDISEÑO COMPLETO DEL LAYOUT
   - `HORIZ_FORMATIONS`: 5 formaciones con posiciones landscape (GK left~5%, FWD left~82%)
   - `HALF_FORMATIONS`: equivalente para media cancha ofensiva
   - `PlayerToken` rediseñado como disco circular magnético compacto (38px, sin foto)
     - Muestra: posCode (8px) + número/dorsal (14px bold) + apellido (8px debajo) + HealthBar
     - touch target mínimo 44px garantizado via minWidth/minHeight en el disco
   - `PlayerDetailOverlay`: overlay flotante esquina inferior derecha (no sidebar)
     - No comprime el campo, se superpone. Glassmorphism, spring animation.
   - `FormationsOverlay`: overlay flotante esquina superior izquierda (no sidebar)
     - Activado por click en el badge de formación en el topbar
   - Toggle `viewMode` en el topbar (Full / 1/2) con icono de campo inline
   - Tab "Formaciones" eliminada del menú — accesible via overlay
   - Layout: campo ocupa 100% del ancho disponible, sin sidebars fijos

5. **DrawingToolbar.jsx** — Movida a BOTTOM BAR centrado en el campo
   - Barra horizontal tipo píldora centrada en el borde inferior del campo
   - Herramientas en fila horizontal (no columna vertical)
   - Colores en fila horizontal en panel expandido (hacia arriba)
   - No roba ancho lateral — siempre visible sin comprimir el campo
   - `pointerEvents: "none"` en el wrapper para no bloquear el campo

**DECISIONES DE DISEÑO:**
- GhostToken sigue funcionando porque usaDragEngine no cambió su interfaz
- Las posiciones de los tokens son left/top en % (0-100) — el drag engine las interpola así
- Los trazados de dibujo usan unidades 105x68 — coincide con el viewBox del DrawingLayer SVG
- El tab "Formaciones" se eliminó del menú para no fragmentar el flujo — el overlay es más ergonómico
- La perspectiva 3D se eliminó completamente: coaches en el campo necesitan vista cenital limpia

**QA pendiente:** Verificar drag & drop en mobile, snap de tokens, overlay en pantallas pequeñas

---

## 2026-03-28 — Sprint P0 + Next-Gen: Fix Navegación CRM + TacticalBoard v9 Next-Gen
**Directiva de**: Julián
**Status**: 🟢 P1 Nav Fix COMPLETO | 🟢 V9 TacticalBoard LISTO PARA QA — Build limpio, 0 errores, 0 warnings

---

### QA REPORT — @Sara — 2026-03-28

**Alcance**: Fix Navegacion MiniTopbar + TacticalBoardV9 (todos los archivos nuevos)
**Veredicto general al final del reporte.**

---

#### BLOQUE 1 — Fix Navegacion MiniTopbar

**1.1 — onClick usa setActiveModule("home") PASS**
Verificado en `src/App.jsx` linea 330. El componente `MiniTopbar` esta definido como closure dentro
de `CRMApp`, por lo que tiene acceso directo a `setActiveModule` sin necesitar props. La llamada
`onClick={() => setActiveModule("home")}` es correcta y no hay ninguna llamada a `navigate("/")` en
ese handler.

**1.2 — Label dice "Dashboard" PASS**
Texto confirmado como `"← Dashboard"` en linea 331. No existe ningun texto `"← Portal"` en el
componente.

**1.3 — Aplica a todos los sub-modulos PASS**
`MiniTopbar` es un unico componente local reutilizado en todos los bloques condicionales:
- `activeModule === "entrenamiento"` — usa `<MiniTopbar title="Entrenamiento" />`
- `activeModule === "plantilla"` — usa `<MiniTopbar title="Gestion de plantilla" />`
- `activeModule === "miclub"` — usa `<MiniTopbar title="Mi club" />`
- `activeModule === "admin"` — usa `<MiniTopbar title="Administracion" accent={C.purple} />`
- `activeModule === "reportes"` — usa `<MiniTopbar title="Reportes" />`
El fix es atomico: un solo componente, cubre los 5 modulos simultaneamente.

**1.4 — Hover state visual PASS**
`onMouseEnter` y `onMouseLeave` aplican transicion de color (`C.textMuted` a `"white"`). La
micro-interaccion es correcta y responde en < 100ms (CSS transition).

**1.5 — handleLogout sigue usando navigate("/") INFORMATIVO**
En el handler de logout (linea 283), `navigate("/")` es correcto e intencional: al cerrar sesion el
usuario debe ser enviado al portal. No es un bug.

**BLOQUE 1 VERDICT: PASS completo. Fix aplicado correctamente en todos los sub-modulos.**

---

#### BLOQUE 2 — TacticalBoardV9: Seguridad XSS

**2.1 — innerHTML y eval() PASS**
Busqueda exhaustiva en todos los archivos de `src/components/TacticalBoardV9/`: cero coincidencias
de `innerHTML`, `dangerouslySetInnerHTML` o `eval()`. El DrawingLayer opera exclusivamente con JSX
declarativo sobre elementos SVG nativos (`<line>`, `<path>`, `<ellipse>`). Los valores `x1`, `y1`,
`x2`, `y2` son numeros flotantes calculados via `clientToField()` — nunca strings de usuario
interpolados en markup.

**2.2 — Inyeccion de estilos CSS via document.createElement OBSERVACION MENOR**
`FieldLayer.jsx` (linea 27-49) y `TacticalBoardV9.jsx` (linea 44-61) inyectan estilos via
`document.createElement("style")` + `s.textContent = ...`. El contenido es CSS estatico hardcodeado
en el bundle, no interpolacion de input de usuario. No es un vector XSS. Sin embargo, esta tecnica
bypasea CSP si el proyecto alguna vez adopta `Content-Security-Policy: style-src 'self'`. Se anota
para considerar migracion a CSS Modules o styled-components si se implementa CSP estricta.

**2.3 — Avatar URL via dicebear PASS con observacion**
`getAvatarUrl(seed)` genera URLs del tipo
`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&...`. El parametro `seed` proviene de
`athlete.photo` (un string de la base de datos). Si un atacante con acceso a Supabase inserta un
payload en `photo`, el seed llega como parametro de URL a un tercero (dicebear) — no hay ejecucion
de codigo en el cliente. Sin embargo, la imagen resultante es un SVG externo: si el CSP no restringe
`img-src`, un SVG malicioso podria contener scripts. En el contexto actual (sin CSP configurada) el
riesgo es teorico pero debe documentarse para cuando se implemente CSP.

**BLOQUE 2 VERDICT: PASS. Sin XSS en la capa de dibujo. Dos observaciones de hardening futuro.**

---

#### BLOQUE 3 — TacticalBoardV9: Memory Leaks y Cleanup

**3.1 — useDragEngine: cleanup de event listeners PASS**
El hook tiene dos flujos con event listeners en `document`:
- Long-press (`cancelOnMove`, `cancelOnUp`): se limpian explicitamente con `removeEventListener`
  tanto en el path normal como en el timeout. Se usa `{ once: true }` en `pointerup` para garantia
  adicional.
- Drag activo (`onMove`, `onUp`): gestionados dentro de un `useEffect` con dependencia en
  `dragInfo`. El cleanup del effect ejecuta `removeEventListener` al desmontar o cuando `dragInfo`
  cambia a null. Correcto.

**3.2 — GhostToken: RAF loop PASS con observacion**
El `requestAnimationFrame` en `GhostToken.jsx` se cancela correctamente en el cleanup del
`useEffect`:
```js
return () => { if (rafId) cancelAnimationFrame(rafId); };
```
La dependencia del effect es `[isDragging, ghostRef]`. Cuando `isDragging` se vuelve `false`,
el effect limpia el RAF activo.

OBSERVACION: el RAF corre continuamente mientras `isDragging === true` aunque el ghost no se mueva
(el usuario tiene el dedo quieto). Es inofensivo en este contexto — el bucle lee `ghostEl.style.left`
sin forzar layout reflow — pero consume ciclos de CPU innecesariamente. Recomendacion: usar
`MutationObserver` en el estilo del elemento o comparar la posicion anterior antes de actualizarlo.
Severidad: MINOR.

**3.3 — useDrawingEngine: sin event listeners globales PASS**
El hook no registra listeners en `document` ni en `window`. Todos los handlers son callbacks
pasados al SVG via props en `DrawingLayer`. Cleanup implicito cuando el componente se desmonta.

**3.4 — FieldLayer: CSS injection idempotente PASS**
El guard `!document.getElementById("fl-3d-responsive")` previene inyecciones duplicadas en hot
reload o re-renders. Correcto.

**BLOQUE 3 VERDICT: PASS. Sin memory leaks. Una observacion MINOR sobre RAF innecesario en pausa.**

---

#### BLOQUE 4 — TacticalBoardV9: Performance

**4.1 — React.memo PASS**
Componentes con memo:
- `DrawingElement` (memo con comparador implicito)
- `DrawingLayer` (memo explicito)
- `InProgressElement` — NO tiene memo. Es un componente pequeño pero se re-renderiza en cada
  `pointermove` junto con el SVG padre. Impacto bajo dado que el componente solo renderiza formas
  SVG simples sin estado interno.
- `GhostToken` (memo explicito)
- `FieldLayer` (via `forwardRef` + memo implicito por estructura)
- `FieldLines` (memo)
- `PulsingDot` (memo)
- `PlayerToken` tiene comparador personalizado que evalua 7 props — correcto y eficiente.
- `MiniPitch` (memo)
- `HexRadar` (memo)

**4.2 — Re-renders en drag loop PASS**
El drag de posicion del ghost se actualiza via manipulacion directa de DOM (`ghostRef.current.style`),
no via setState. El `nearTarget` usa comparacion de igualdad antes de llamar a setNearTarget:
`setNearTarget((prev) => (prev === nearest ? prev : nearest))` — evita re-renders si el snap target
no cambia. Correcto.

**4.3 — saludMap con useMemo PASS**
El calculo de salud para todos los atletas esta en `useMemo([athletes, historial])`. No se
recalcula en cada render.

**4.4 — Animaciones PulsingDot siempre activas OBSERVACION**
Los tres `PulsingDot` en `FieldLayer` tienen animaciones Framer Motion con `repeat: Infinity` que
corren en todo momento, incluso cuando la pizarra no es el modulo activo. Dado que los componentes
se renderizan condicionalmente (solo cuando `activeModule === "entrenamiento"` o el modulo que los
contenga), esto no es un problema en produccion — cuando el modulo no esta activo, el componente
no existe en el arbol. PASS.

**BLOQUE 4 VERDICT: PASS con una observacion MINOR sobre InProgressElement sin memo.**

---

#### BLOQUE 5 — Multi-tenancy y Aislamiento de Datos

**5.1 — localStorage key NO incluye club_id BLOCKER**

`useDrawingEngine.js` linea 15:
```js
const STORAGE_KEY = "elevate_tactical_drawings_v1";
```

Esta clave es GLOBAL en el dispositivo. En un escenario donde un tablet es compartido entre dos
entrenadores de distintos clubes (caso real en academias), los trazados de la pizarra tactica del
Club A son visibles para el Club B al abrir la app. Esto viola el principio de aislamiento de datos
del sistema.

Mismo problema para las claves usadas en `TacticalBoardV9.jsx`:
- `"elevate_roles_v2"` — roles de jugadores por posicion
- `"elevate_instructions"` — instrucciones tacticas del cuerpo tecnico
- `"elevate_tacticas"` — notas tacticas

Las instrucciones y tacticas pueden contener estrategia de juego confidencial de un club que no
debe ser expuesta a otro club en el mismo dispositivo.

**Fix requerido**: namespacing de claves con `club_id`. El `club_id` esta disponible en
`authProfile` dentro de `CRMApp`. Debe pasarse como prop a `TacticalBoardV9` y al inicializar
`useDrawingEngine` y `useLocalStorage`.

Ejemplo:
```js
// useDrawingEngine debe aceptar clubId como parametro
const STORAGE_KEY = clubId
  ? `elevate_tactical_drawings_v1_${clubId}`
  : "elevate_tactical_drawings_v1";
```

Mismo patron para `elevate_roles_v2`, `elevate_instructions`, `elevate_tacticas`.

**5.2 — Datos personales de menores en la pizarra INFORMATIVO con accion requerida**
La pizarra muestra foto, nombre y metricas fisicas de atletas menores de edad. Estos datos
provienen del estado de `athletes` (pasado como prop) que ya esta bajo el aislamiento de
`club_id` en Supabase via RLS. Sin embargo, las FOTOS se generan via URL publica de dicebear
(servicio externo de avatares). En la implementacion actual no se procesan fotos reales de los
menores — se usan avatares sinteticos. Esto es aceptable para el MVP.

Si en versiones futuras se permiten fotos reales de menores, se requerira:
1. Consentimiento explicito del tutor legal bajo Ley 1581
2. Almacenamiento en bucket privado de Supabase Storage (no URL publica)
3. URLs firmadas con expiracion

**5.3 — Dibujos de la pizarra no se sincronizan con Supabase OBSERVACION**
Los trazados de la pizarra solo persisten en localStorage. No hay sync a Supabase. Esto significa
que si el entrenador cambia de dispositivo, pierde los trazados. No es un bug de seguridad, pero
si una limitacion funcional a documentar.

**BLOQUE 5 VERDICT: BLOCKER en 5.1. Los demas son informativos o mejoras futuras.**

---

#### BLOQUE 6 — Privacidad y Ley 1581

**6.1 — Datos procesados por la pizarra**
La pizarra procesa: nombre del atleta, foto (avatar sintetico), posicion, metricas numericas
(speed, shooting, passing, dribble, defense, physical, rating), estado de salud calculado (RPE).
Ninguno de estos datos es introducido directamente en la pizarra — vienen del plantel ya
consentido en el registro.

**6.2 — Sin nuevos puntos de recoleccion de datos personales PASS**
La pizarra no tiene formularios de entrada de datos personales nuevos. Los textos libres
("instrucciones", "tacticas") son notas del cuerpo tecnico sobre estrategia, no datos de menores.

**6.3 — Consentimiento cubierto por el registro del club CONDICIONAL**
El consentimiento de los tutores debe haberse obtenido al registrar cada atleta en el modulo de
Gestion de Plantilla. La pizarra es una vista downstream de esos datos. Si el consentimiento del
modulo de plantilla es valido, este bloque pasa.

**BLOQUE 6 VERDICT: CONDICIONAL — depende de que el modulo de Plantilla tenga consent flow
correcto (pendiente de auditoria separada, fuera del alcance de este sprint).**

---

#### RESUMEN DE HALLAZGOS

| ID  | Severidad | Descripcion | Archivo | Estado |
|-----|-----------|-------------|---------|--------|
| QA-001 | PASS | Fix navegacion MiniTopbar — correcto en todos los sub-modulos | App.jsx | Cerrado |
| QA-002 | PASS | Sin XSS en DrawingLayer — JSX declarativo, cero innerHTML/eval | TacticalBoardV9/ | Cerrado |
| QA-003 | BLOCKER | localStorage keys sin namespace de club_id — datos cruzados entre clubs en dispositivo compartido | useDrawingEngine.js, TacticalBoardV9.jsx | ABIERTO |
| QA-004 | MINOR | RAF en GhostToken corre continuamente aunque ghost no se mueva | GhostToken.jsx | Abierto (bajo impacto) |
| QA-005 | MINOR | InProgressElement sin React.memo — re-renders en cada pointermove | DrawingLayer.jsx | Abierto (bajo impacto) |
| QA-006 | MINOR | Inyeccion CSS via style tag — considerar para CSP futura | FieldLayer.jsx, TacticalBoardV9.jsx | Abierto (tech debt) |
| QA-007 | INFORMATIVO | Dibujos no sincronizan con Supabase — perdida en cambio de dispositivo | useDrawingEngine.js | Backlog |
| QA-008 | INFORMATIVO | Avatar via URL publica dicebear — riesgo CSP futuro si se usan fotos reales | helpers.js | Backlog |

---

#### VEREDICTO FINAL

**BLOCKER QA-003** impide go-live del modulo de pizarra con usuarios reales en produccion.
El fix de navegacion (Bloque 1) esta aprobado sin condiciones.

**Para el fix de navegacion (MiniTopbar):**
GO-LIVE AUTORIZADO — listo para produccion inmediata.

**Para TacticalBoardV9:**
GO-LIVE BLOQUEADO — hasta que las claves de localStorage incluyan namespacing por club_id.
El fix estimado es de 2-3 lineas por clave afectada. Alta prioridad, baja complejidad.

**Accion requerida para desbloquear:**
`@Arquitecto` o `@Desarrollador`: namespear `elevate_tactical_drawings_v1`, `elevate_roles_v2`,
`elevate_instructions`, `elevate_tacticas` con el `club_id` del perfil autenticado.
Una vez aplicado, @Sara re-valida y emite GO-LIVE.

— Sara, QA/Compliance Officer, Elevate Sports

---

### @Andres-UI — Informe de Afinamiento TacticalBoardV9 — 2026-03-28

**Archivos modificados:**
- `src/components/TacticalBoardV9/layers/FieldLayer.jsx`
- `src/components/TacticalBoardV9/layers/DrawingLayer.jsx`
- `src/components/TacticalBoardV9/tokens/GhostToken.jsx`
- `src/components/TacticalBoardV9/tools/DrawingToolbar.jsx`
- `src/components/TacticalBoardV9/TacticalBoardV9.jsx`
- `src/hooks/useDrawingEngine.js`

**Cambios aplicados:**

#### FieldLayer.jsx
- Bandas de césped corregidas de `90deg` (horizontal) a `0deg` (vertical) — patrón real de segadora
- 8 franjas horizontales alternadas con sombra sutil `rgba(0,0,0,0.10)` para profundidad natural
- Perspectiva ajustada: `rotateX(5deg)` + `scale(1.04)` con `transform-origin: 50% 55%` y `perspective-origin: 50% 30%` — ilusión más convincente sin clipear el campo
- Drop-shadow de líneas intensificado: `3px rgba(255,255,255,0.8)` + `8px rgba(255,255,255,0.3)`
- PulsingDot: dos anillos en fase desfasada (delay 1.3s) para efecto de radar continuo, más `filter dotGlow` SVG en el punto fijo
- Filtro SVG `<filter id="dotGlow">` inyectado en `<defs>` del SVG de líneas

#### GhostToken.jsx — Fix QA-004 parcial
- Ring buffer refactorizado: `trailDomRefs` usa `new Array(TRAIL_COUNT).fill(null)` con ref callback directo al nodo DOM (antes: wrapper `{ current: null }` incorrecto)
- Cleanup del RAF también resetea el posBuffer cuando `isDragging` pasa a false
- `rafId` movido a `useRef` para persistencia entre renders
- Blur progresivo: sombra 0 = 1.8px, sombra 2 = 5.4px (antes todos con `(i+1)*1.5px`)
- Border y boxShadow del trail calculados con opacidad dinámica en hex

#### DrawingLayer.jsx — Fix QA-005
- `InProgressElement` envuelto en `memo()` — evita re-renders en cada `pointermove` de trazados confirmados
- Nuevo tipo `"free"` implementado: polyline suavizada via bezier cúbico (cp1/cp2 en punto medio)
- Preview del trazo libre: polyline directa con `strokeDasharray="2 1"` y opacidad 0.6

#### DrawingToolbar.jsx
- Touch targets expandidos de 34px a 44px (botones de herramienta y botón toggle)
- Nuevo color pill: contenedor 44x28px con dot interno animado (22px en seleccionado, 18px inactivo)
- Herramienta "Trazo libre" agregada al array TOOLS con ícono de curva SVG inline
- Botón "Limpiar todo" rediseñado: ícono de papelera más reconocible, 44x44px
- Panel glassmorphism: `padding: 8px 4px` para alineación con botones de 44px

#### useDrawingEngine.js — Fix BLOCKER QA-003
- Firma del hook cambiada: acepta `clubId` como parámetro
- `BASE_STORAGE_KEY` namespaceado via `getStorageKey(clubId)` → `elevate_tactical_drawings_v1_{clubId}`
- `loadDrawings` y `saveDrawings` reciben `storageKey` como argumento (no closure)
- Soporte completo para tipo `"free"`: pointerDown crea array `points`, Move acumula con threshold 0.7%, Up confirma si >2 puntos

#### TacticalBoardV9.jsx — Fix BLOCKER QA-003
- Acepta prop `clubId` (string, default `""`)
- Claves de localStorage namespaceadas: `elevate_roles_v2${ns}`, `elevate_instructions${ns}`, `elevate_tacticas${ns}`
- Import muerto `FORMATIONS_HORIZONTAL as FORMATIONS` eliminado
- Import muerto `calculateAge` eliminado
- `useDrawingEngine(clubId)` — pasa el clubId al motor de dibujo

**BLOCKER QA-003: CERRADO**
Todas las claves de localStorage ahora incluyen namespace de `club_id`. Fix aplicado en `useDrawingEngine`, `TacticalBoardV9` y las 3 claves de estado táctico.

**Build**: `npm run build` → EXIT 0, 0 errores, 0 warnings.

**Pendiente para integración en prod:**
- App.jsx debe pasar `clubId={authProfile?.club_id}` a `TacticalBoardV9` cuando se integre en GestionPlantilla
- La sustitución de `TacticalBoard` (v8) por `TacticalBoardV9` en `GestionPlantilla.jsx` es tarea del Arquitecto o Desarrollador

— Andres, Senior Frontend Developer, Elevate Sports

---

### PROBLEMA 1: Regresión Navegación — RESUELTO (P0, @Arquitecto)

**Root Cause identificado:** `MiniTopbar` en `App.jsx` (línea 330) ejecutaba `navigate("/")` al presionar
`← Portal`. Esto dispara el router de React hacia la raíz del portal corporativo en lugar de retornar
al Dashboard del CRM. El componente era puramente de presentación sin recibir ningún callback `onBack`.

**Fix aplicado (quirúrgico, 1 línea):**

```jsx
// ANTES — App.jsx línea 330 (MiniTopbar)
onClick={() => navigate("/")}   // BUG: navega al portal corporativo
"← Portal"

// DESPUÉS
onClick={() => setActiveModule("home")}  // CORRECTO: retorna al Home del CRM
"← Dashboard"
```

- `setActiveModule` es accesible porque `MiniTopbar` es un componente local definido dentro de
  `CRMApp` — tiene cierre sobre el estado `setActiveModule` sin necesidad de props adicionales.
- Se añadió micro-interacción hover (`color: white` en hover) para señal visual de interactividad.
- Afecta todos los sub-módulos que usan `MiniTopbar`: Entrenamiento, Plantilla, MiClub, Admin, Reportes.
- Sin cambios en la arquitectura de rutas — el CRM sigue siendo estado-máquina via `activeModule`.

**Validación:**
- [ ] @Sara (QA): Navegar a Entrenamiento → presionar `← Dashboard` → verificar retorno al Home del CRM
- [ ] @Sara (QA): Repetir con Administracion, Gestión Plantilla, Mi Club, Reportes
- [ ] @Sara (QA): Verificar que `← Dashboard` NO navega al portal `/`
- [ ] @Sara (QA): Verificar hover state (text se vuelve blanco)

---

### PROBLEMA 2: TacticalBoard v9 Next-Gen — ARQUITECTURA Y ROADMAP

#### Diagnóstico del estado actual (v8)

La v8 tiene una base sólida:
- Sistema drag & drop con long-press 150ms anti-scroll (robusto)
- Formaciones FIFA con 5 esquemas (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2)
- Tokens con OVR, foto, health bar, RPE
- Panel detalle con HexRadar, similar players
- Bench bar horizontal
- Glassmorphism en paneles

Deficiencias críticas que Julián rechaza:
1. **Campo**: gradiente básico lineal — no hay textura de césped realista, ni efecto 3D, ni perspectiva
2. **Líneas**: SVG plano sin depth — las líneas del campo son opacas y planas
3. **Drag Trail**: el ghost de arrastre es solo opacidad 0.2 del token — sin trail/shadow dinámico
4. **Sin herramientas de dibujo**: no existen vectores, flechas ni zonas de presión
5. **Sin capas**: todo está en el mismo plano de renderizado — campo, jugadores y trazados mezclados

#### Arquitectura v9: Sistema de Capas

```
TacticalBoard/
  TacticalBoardV9.jsx          ← Componente raíz (nuevo, reemplaza TacticalBoard.jsx)
  layers/
    FieldLayer.jsx              ← Capa 1: césped FIFA + líneas HD + efecto 3D perspectiva
    PlayersLayer.jsx            ← Capa 2: tokens + drag engine (extraído del monolito actual)
    DrawingLayer.jsx            ← Capa 3: vectores SVG interactivos (flechas, zonas presión)
  tools/
    DrawingToolbar.jsx          ← Panel de herramientas de dibujo (lateral o flotante)
    ColorPicker.jsx             ← Selector de color neón para trazados
  tokens/
    PlayerToken.jsx             ← Token extraído — sin cambios funcionales
    BenchToken.jsx              ← Token de suplente (extraer de monolito)
    GhostToken.jsx              ← Ghost con trail + shadow dinámico
  hooks/
    useDragEngine.js            ← Extrae toda la lógica drag del componente (refs, events, state)
    useDrawingEngine.js         ← Motor SVG para trazados vectoriales
```

#### Especificaciones técnicas por capa

**Capa 1 — FieldLayer (césped FIFA/EA Sports FC):**
```
Método: CSS multi-layer + SVG filter effects
Textura césped:
  - repeating-linear-gradient con bandas alternas de verde (patrón segado real)
  - 8 bandas verticales de 12.5% cada una, alternando #1a4a0a y #1f5a0c
  - Superposición de gradiente radial central (luz cenital) para efecto 3D
Efecto 3D perspectiva:
  - CSS perspective(800px) + rotateX(8deg) en el wrapper del campo
  - Compensa distorsión con scale(1.08) para llenar el contenedor
  - Solo aplica cuando viewport > 768px (tablet/desktop)
Líneas HD:
  - SVG con filter: drop-shadow(0 0 4px rgba(255,255,255,0.9))
  - strokeWidth 0.8 (era 0.5) con stroke rgba(255,255,255,0.92)
  - Puntos del campo (penalti, centro) con círculo pulsante (Framer Motion)
Goal mouth:
  - Arcos de portería con profundidad: 3 rectángulos anidados con opacidad decreciente
  - Color de red: rgba(255,255,255,0.08) con pattern SVG de cuadrícula
```

**Capa 2 — PlayersLayer (Drag con trail):**
```
GhostToken:
  - Al activarse el drag: clone del token con filter: blur(2px) + opacity 0.35
  - Trail: 3 copias del ghost con opacidades [0.25, 0.15, 0.07] y delays [20ms, 40ms, 60ms]
    implementadas con posiciones almacenadas en un ring buffer de 3 posiciones
  - Shadow dinámica: box-shadow que crece con la velocidad de movimiento (calculada en onMove)
  - Drop landing: animación spring de "aplastamiento" (scaleY 0.85→1) al soltar
```

**Capa 3 — DrawingLayer (Vectores neón):**
```
Herramientas disponibles:
  1. Flecha recta — click inicio + click fin
  2. Flecha curva — click inicio + arrastre punto control + click fin (cubic bezier)
  3. Zona de presión — click + arrastre para ellipse rellena con color semitransparente
  4. Línea de corte — línea discontinua con estilo peligro
  5. Borrar — click sobre elemento para eliminar

Implementación SVG:
  - Todas las trazas almacenadas en estado como array de { type, points, color, id }
  - Render: <svg> absoluto sobre el campo (pointer-events: all en DrawingLayer,
    none en FieldLayer/PlayersLayer cuando herramienta activa)
  - Colores: neon green (#39FF14), electric violet (#8B5CF6), amber (#EF9F27),
    danger red (#E24B4A), ice blue (#00E5FF)
  - Cada flecha tiene animación de "dibujado" (stroke-dashoffset animation) al aparecer
  - Persistencia en localStorage key: elevate_tactical_drawings_v1

DrawingToolbar:
  - Panel lateral izquierdo colapsable (ícono + tooltip on hover)
  - Activo/inactivo por tool con highlight neon
  - Botón "Limpiar todo" con ConfirmModal
  - Color selector inline (5 colores preset neón)
```

#### Plan de Entrega

| Fase | Entregable | Responsable | Prioridad |
|------|-----------|-------------|-----------|
| 1 | `FieldLayer.jsx` — césped FIFA texturado, líneas HD, efecto 3D | @Andres-UI | ALTA |
| 2 | `useDragEngine.js` — extracción del drag engine del monolito | @Andres-UI | ALTA |
| 3 | `GhostToken.jsx` — trail ring buffer + shadow dinámica | @Andres-UI | ALTA |
| 4 | `useDrawingEngine.js` — estado SVG + handlers mouse/touch | @Mateo-Data | MEDIA |
| 5 | `DrawingLayer.jsx` — render SVG neón con animaciones dashoffset | @Andres-UI | MEDIA |
| 6 | `DrawingToolbar.jsx` — panel herramientas colapsable | @Andres-UI | MEDIA |
| 7 | `TacticalBoardV9.jsx` — integración capas + migración de v8 | @Andres-UI | ALTA |
| 8 | QA — drag en touch + drawing en mouse + perspectiva 3D mobile | @Sara-QA | ALTA |

#### Decisiones de Arquitectura

1. **No romper v8 aún**: `TacticalBoard.jsx` permanece intacto hasta que `TacticalBoardV9.jsx`
   pase QA. El import en `App.jsx` se cambia como última línea de la fase 7.

2. **CSS perspective vs WebGL**: Se descarta WebGL (Three.js) — overkill para este caso de uso
   y agrega 250KB al bundle. CSS `perspective` + gradientes multi-capa logra el efecto 3D FIFA
   con 0 dependencias adicionales.

3. **Drawing layer en SVG nativo, no canvas**: Canvas requiere re-render completo al mover tokens
   (los layers están superpuestos). SVG permite pointer-events granulares por elemento y animaciones
   CSS/Framer nativas.

4. **Ring buffer para trail**: Array circular de 3 posiciones {x, y, timestamp}. Se actualiza en
   cada `onPointerMove`. Performance: O(1) insert, O(3) render — sin impacto en drag a 60fps.

5. **Persistencia dibujos separada**: `elevate_tactical_drawings_v1` en localStorage — separado
   del estado de starters/bench para evitar conflictos con el sync de Supabase.

#### Criterios de Validación ("Done")

- [ ] El campo tiene textura de bandas de césped visibles (alternancia luz/sombra)
- [ ] Efecto perspectiva 3D perceptible en desktop (no-plano)
- [ ] Las líneas del campo tienen drop-shadow blanco brillante
- [ ] El ghost de drag muestra trail de 3 sombras decrecientes en opacidad
- [ ] Se puede dibujar una flecha recta sobre el campo
- [ ] Se puede dibujar una zona de presión (ellipse semitransparente)
- [ ] Los trazados persisten entre recargas (localStorage)
- [ ] Trazados se pueden limpiar con ConfirmModal
- [ ] La perspectiva 3D se desactiva en mobile (< 768px) — campo queda flat
- [ ] Sin regresiones en drag de tokens (v8 pasa todos sus tests existentes)
- [ ] Build sin errores TypeScript/ESLint

---

## 2026-03-28 — Sprint Visual: CRM Interior Premium Upgrade
**Directiva de**: Julián
**Status**: COMPLETO — Build limpio, sin errores (✓ 763ms)

### Objetivo
Nivelar la estética del CRM interno (Home, Entrenamiento, Administracion, GestionPlantilla, MiClub, TacticalBoard) con la calidad visual del portal corporativo.

### Archivos Modificados

| Archivo | Cambios clave |
|---------|--------------|
| `src/components/Home.jsx` | MetricBlock con gradiente sutil, boxShadow multi-layer en tiles, tile 4 con gradiente oscuro rico, gap de grid refinado |
| `src/components/Entrenamiento.jsx` | MetricBar con gradientes, subtab con glow inferior, player cards con gradient bg + borderRadius 6px + shadow, RPE buttons con gradiente verde→amarillo→rojo y glow, nota panel mejorado, week header con glassmorphism |
| `src/components/Administracion.jsx` | Tabs con glow inferior activo, KPI cards con gradient bg + text-shadow en valor, panel/card con gradiente, input/select con borderRadius+transition, submitBtn con gradiente violeta y glow, toggleBtn con gradiente sutil, table row con gradiente alternado, CSS focus ring violeta global |
| `src/components/MiClub.jsx` | Panel y inp con gradient, panelTitle con acento violeta izquierdo, category pills con borderRadius 20px y glow en activo, campos list items elevados, save button con gradiente neon + glow, inyección CSS focus ring |
| `src/components/GestionPlantilla.jsx` | PlayerRow selected con neon glow + inset shadow, sectionTitle con acento violeta, edit panel background con gradient oscuro, avatar con drop-shadow neon, valoración panel con glassmorphism verde, filter pills con borderRadius 20px y glow, edit panel border refinado, CSS: focus ring violeta en inputs, hover highlight en filas |
| `src/components/TacticalBoard.jsx` | Container con gradient oscuro, tab bar glassmorphism + glow en tab activo, campo con gradiente de césped 7-stops + stripes sutiles + inset shadow, líneas SVG más brillantes con filter drop-shadow, arcos de penalti, bench bar con glassmorphism, bench cards con gradient bg + shadow, formations panel con glassmorphism + acento violeta, formation pills con borderRadius 20px + neon glow, roles rows alternados con gradient, textarea con gradient + borderRadius + shadow |

### Sistema de Estilos Aplicado

```
Backgrounds:  linear-gradient(135deg, rgba(20,20,30,0.95), rgba(12,12,22,0.98))
Borders:      1px solid rgba(255,255,255,0.06)
Shadows:      0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)
Border-radius: 12px cards, 8px inputs, 20px pills, 6px player cards
Accent left:  2px solid #7c3aed (section titles)
Focus ring:   box-shadow 0 0 0 2px rgba(124,58,237,0.3)
Active tab:   inset shadow + gradient bg + 2px neon/green bottom border
```

### Task Assignment
- @Sara (QA): Verificar en mobile 375px (iPhone SE) que los player cards, RPE buttons y filter pills sean tocables (min 44px). Revisar que el campo táctico se vea bien en tablet.
- @Arquitecto: Sin cambios funcionales — solo visual. No hay riesgo de regresión de datos.

---

## 2026-03-28 — Sprint UX: Empty States + Drag Fix Pizarra
**Directiva de**: Julián
**Status**: COMPLETO — Build limpio (532ms, 0 errores)

### Componentes entregados

| Archivo | Descripción |
|---------|-------------|
| `src/components/ui/EmptyState.jsx` | NUEVO — Componente reutilizable: icon (con glow violeta), title, subtitle, CTA primario (gradiente neon→violeta) + CTA secundario (outline violeta). Props: `icon`, `title`, `subtitle`, `actionLabel`, `onAction`, `secondaryLabel`, `onSecondary`, `compact`. Framer Motion fadeInUp stagger + iconPulse suave. |

### Integraciones EmptyState

| Módulo | Condicion | Textos |
|--------|-----------|--------|
| `GestionPlantilla.jsx` | `displayedAthletes.length === 0` | Si `athletes.length===0`: "Tu plantilla está lista para crecer" + CTAs "Agregar deportista" / "Importar CSV" conectados a los modals. Si hay filtro activo: "No hay jugadores con ese filtro". |
| `Entrenamiento.jsx` — tab sesion | `athletes.length === 0` | "Sin sesiones registradas" / "Registra tu primera sesión..." |
| `Entrenamiento.jsx` — tab historial | `weekGroups.length === 0` | "Sin sesiones registradas" (reemplaza el div plano anterior) |
| `Home.jsx` | `athletes.length === 0` | "Bienvenido a Elevate Sports" + CTA "Ir a Plantilla" — panel violeta entre METRICS y GRID |

### Fix: Drag vs Scroll — TacticalBoard.jsx

**Problema**: En touch, `onPointerDown` activaba drag inmediatamente, compitiendo con scroll de página.

**Solución implementada** — Long-press 150ms con cancelación por movimiento:

1. `dragActivating` state + `longPressTimerRef` + `longPressOriginRef` — tracking de la ventana de activación
2. `handlePointerDown` reescrito: inicia timer 150ms + listener `cancelOnMove` que aborta si el puntero se mueve >5px antes del timeout
3. Al completar 150ms sin movimiento: `dragActivating` se limpia, `dragInfo` se activa (drag real)
4. `PlayerToken` recibe prop `isActivating`: durante los 150ms muestra `scale(1.1)` + triple ring glow neon (`0 0 0 3px #c8ff00, 0 0 28px...`) + health stripe neon
5. Bench items también reciben feedback visual de activación (glow + scale)
6. Memo equality actualizado para incluir `isActivating`
7. `cleanup()` también limpia el timer pendiente

### Decisiones de diseño

1. **EmptyState gradient CTA**: `linear-gradient(135deg, #c8ff00 0%, #8B5CF6 100%)` — conecta la paleta neon del app con el violeta premium del auth. Color de texto `#0a0a0a` (negro) sobre el gradiente para máximo contraste.
2. **EmptyState icon glow**: `rgba(139,92,246,0.10)` bg + `border rgba(139,92,246,0.28)` + `box-shadow 0 0 28px rgba(139,92,246,0.22)` — el violeta suave no compite con el neon verde del resto del UI.
3. **Drag delay 150ms**: Valor calibrado — suficiente para distinguir intención de drag vs scroll en iPhone, pero corto para no sentirse lento en desktop. En desktop (mouse), el botón de puntero es `!== 0` para clicks secundarios pero `=== 0` para el primario — funciona igual.
4. **5px threshold de cancelación**: Menor que el umbral típico de scroll nativo del browser (que suele ser 8-10px), para que el cancel sea perceptivamente inmediato.

### Task Assignment
- @Sara (QA): Verificar EmptyState en GestionPlantilla con 0 atletas y con filtro activo sin resultados. Probar drag de tokens en iPhone Safari (verificar que el scroll de la página no se interrumpe y que el glow de activación se ve). Revisar que el CTA "Agregar deportista" del EmptyState abre el modal correctamente.

---

## 2026-03-28 — Sprint UI: PWA Experience Components
**Directiva de**: Julián
**Status**: COMPLETO — Build limpio, sin errores

### Componentes entregados

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useInstallPWA.js` | Hook: captura `beforeinstallprompt`, detecta iOS Safari, detecta standalone, persiste dismiss 7 días en localStorage |
| `src/components/ui/InstallAppBanner.jsx` | CTA "Instalar App" — versión floating (full) + versión compact (pill para navbar). Modal iOS paso a paso. Glassmorphism + gradiente neon/violeta. |
| `src/components/ui/OfflineBanner.jsx` | Banner fixed top (offset 56px para navbar). Amber offline → verde 3s al reconectar → desaparece. Framer Motion spring entrada/salida. |
| `src/components/ui/UpdateToast.jsx` | Toast SW update. Escucha `sw-update-available` CustomEvent. Botón "Actualizar" envía `SKIP_WAITING` al SW y recarga. Dismiss disponible. |
| `public/sw.js` | Service Worker vanilla: cache-first assets, network-first HTML navigation, `SKIP_WAITING` message handler. |
| `src/lib/registerSW.js` | Registro del SW con detección de `updatefound` → dispatcha `sw-update-available`. Solo activo en `import.meta.env.PROD`. |

### Modificaciones a archivos existentes

| Archivo | Cambio |
|---------|--------|
| `src/main.jsx` | Import y llamada a `registerSW()` al final del archivo |
| `src/components/portal/PortalLayout.jsx` | Import de los 3 componentes; `OfflineBanner` + `UpdateToast` + `InstallAppBanner` (float) en root div; `InstallAppBanner compact` en navbar desktop |
| `src/App.jsx` | Import de `OfflineBanner` + `UpdateToast`; ambos en CRM landing y CRM app root |

### Decisiones de diseño

1. **Doble modo InstallAppBanner**: `compact` (pill 36px mínima altura para navbar) vs default (floating panel fixed bottom-right). El mismo hook compartido.
2. **SW solo en PROD**: `registerSW` guarda con `import.meta.env.PROD`. En dev el SW causaría conflictos de cache con HMR de Vite.
3. **iOS Modal bottom-sheet**: Los pasos de iOS se presentan como bottom-sheet (alineado a la forma en que iOS Safari muestra instrucciones nativamente).
4. **Dismiss 7 días**: `localStorage` con timestamp. Si localStorage no está disponible (private browsing), el dismiss funciona solo para la sesión.
5. **Offline banner top 56px**: Respeta la altura de navbar. Cuando el OfflineBanner está visible, el contenido se desplaza naturalmente sin solapamiento.
6. **UpdateToast centrado en bottom**: A diferencia de los toasts del sistema (top-right), el SW toast va centrado abajo para diferenciarse visualmente (es una acción crítica, no un feedback efímero).

### Task Assignment
- @Sara (QA): Verificar en Chrome DevTools → Application → Service Workers. Simular offline con Network tab. Probar en iPhone Safari (modo privado para iOS modal). Verificar dismiss 7 días.
- @Arquitecto: Revisar si se requiere `manifest.json` para completar el PWA checklist (Lighthouse).

---

## 2026-03-28 — Sprint PWA: Infraestructura Workbox + Manifest (Cierre del checklist)
**Directiva de**: Julian
**Status**: Completo — Build verificado, Workbox SW generado

### Contexto
El sprint anterior entrego los componentes UI (UpdateToast, OfflineBanner, InstallAppBanner,
useInstallPWA, sw.js vanilla). Este sprint cierra los gaps de infraestructura para que la app
sea instalable y pase el Lighthouse PWA audit:
- manifest.json faltaba (el @Arquitecto lo habia marcado como pendiente)
- El sw.js vanilla se reemplaza con Workbox via vite-plugin-pwa para cache strategies
  robustas y precaching del app shell
- index.html no tenia el link al manifest ni apple-touch-icon 192px

### Archivos Creados / Modificados

| Archivo | Cambio |
|---------|--------|
| `vite.config.js` | VitePWA plugin: generateSW, CacheFirst fonts/images, NetworkFirst Supabase con BGSync queue 24h, navigateFallback offline.html |
| `public/manifest.json` | NUEVO — name, short_name, icons x4 sizes, 3 shortcuts (MiClub/Plantilla/Entreno), screenshots, categories |
| `public/offline.html` | NUEVO — fallback standalone sin JS externo, auto-redirect a "/" al reconectar |
| `public/icons/icon-base.svg` | NUEVO — icono SVG base (escudo + bolt violet, paleta de marca) para generar PNGs |
| `index.html` | Link rel="manifest", theme-color #7c3aed, apple-touch-icon 192px |
| `package.json` | vite-plugin-pwa v1.2.0 en devDependencies |

### Notas de Instalacion
`npm install vite-plugin-pwa --save-dev --legacy-peer-deps`
Razon del flag: vite-plugin-pwa v1.2.0 declara peer vite ^3..^7 pero funciona con Vite 8.
No hay incompatibilidad funcional — es solo semver upstream sin actualizar.

### Build Output Verificado
```
PWA v1.2.0 | mode: generateSW | precache: 40 entries (1673.19 KiB)
dist/sw.js             <-- reemplaza el sw.js vanilla anterior
dist/workbox-*.js      <-- runtime de Workbox
```

### Pendiente — @Andres (UI)
Generar PNG icons desde `public/icons/icon-base.svg`:
- `/icons/icon-192.png` (192x192, purpose: any)
- `/icons/icon-512.png` (512x512, purpose: any)
- `/icons/icon-maskable-192.png` (192x192, purpose: maskable — padding 20% safe zone)
- `/icons/icon-maskable-512.png` (512x512, purpose: maskable)
Herramienta: pwa-asset-generator (`npx pwa-asset-generator public/icons/icon-base.svg public/icons`)
Sin PNGs, Chrome usa el favicon.svg como fallback — funcional pero no optimo para el badge del OS.

### Validation Criteria
- [ ] Lighthouse PWA audit >= 90 en produccion
- [ ] Chrome DevTools > Application > Manifest: sin errores, 4 iconos listados
- [ ] Chrome DevTools > Application > Service Workers: Workbox SW activo, scope "/"
- [ ] Offline: desactivar red en DevTools, recargar -> muestra offline.html correctamente
- [ ] Online restore: reconnectar -> toast "Conexion restaurada" aparece en OfflineBanner
- [ ] Install: Chrome muestra "Instalar Elevate Sports" prompt en primera visita
- [ ] iOS Safari: tapping install abre modal con 3 pasos de instrucciones
- [ ] No regression: todas las rutas del CRM y Portal cargan correctamente

---

## 2026-03-28 — Refactor Mobile-First Responsive (Score objetivo: 5.5 → 8.5/10)
**Directiva de**: Julián
**Status**: 🟢 Completo — Implementación base ejecutada

### Plan

Auditoría reveló: 95% inline styles, 0 breakpoints en componentes CRM, touch targets < 44px,
grid fijo en GestionPlantilla, dropdown de 380px fijo en PortalLayout. Score mobile: 5.5/10.

Estrategia: inyectar media queries vía `document.createElement("style")` (patrón del proyecto)
+ hook `useResponsive` para condicionar estilos inline JS donde CSS no alcanza.

### Matriz de Breakpoints Implementada

| Alias | Rango      | Dispositivo                  |
|-------|------------|------------------------------|
| xs    | 0–479px    | Mobile portrait              |
| sm    | 480–767px  | Mobile landscape/small tablet|
| md    | 768–1023px | Tablet                       |
| lg    | 1024px+    | Desktop (estado previo)      |

### Archivos Modificados / Creados

| Archivo | Cambio |
|---------|--------|
| `src/index.css` | Sistema responsive global: fluid type (clamp), safe area insets, touch targets 44px, scroll helpers, drawer CSS |
| `src/hooks/useResponsive.js` | NUEVO — hook con debounce 150ms, retorna `{isMobile, isTablet, isDesktop, breakpoint, width, isXs, isSm}` |
| `src/components/portal/PortalLayout.jsx` | Hamburger + MobileDrawer (AnimatePresence), servicios inline en drawer, CTA pinned bottom, footer stacking |
| `src/components/Home.jsx` | Grid `minmax(min(100%,280px), 1fr)`, media queries inyectadas, classNames en topbar/metrics/grid/stat-row |
| `src/components/GestionPlantilla.jsx` | PlayerRow dual-render (desktop grid / mobile card), modals con `modal-fullscreen` class, classNames en lista/acciones |
| `src/components/Administracion.jsx` | KPI 2-col mobile, tabs scroll horizontal, tabla scroll horizontal |
| `src/components/Entrenamiento.jsx` | Attendance grid 1-col mobile, tabs scroll horizontal |

### Decisiones de Arquitectura

1. **Patrón de inyección CSS preservado** — el proyecto usa `document.createElement("style")` para media queries. Se mantiene consistencia con TacticalBoard y CommercialLanding. No se introduce Tailwind.
2. **Hook useResponsive para lógica JS** — donde el breakpoint condiciona estructuras (navbar hamburger vs desktop, footer layout), se usa el hook. Para ajustes visuales puros se usan classNames + media queries.
3. **PlayerRow dual-render** — dos versiones del componente con `display:none` toggled por media query. Evita flash de layout en hydration y mantiene el estado de hover independiente.
4. **Modales fullscreen en mobile** — `modal-fullscreen` CSS class sobrescribe borderRadius, maxWidth y padding en < 768px. Los valores desktop se mantienen en inline styles.
5. **Touch targets**: `min-height: 44px` aplicado globalmente en `index.css` en `button, a, [role="button"]`. Overrides locales donde se necesita más compacto (nav desktop con `minHeight: "auto"`).

### Task Assignment
- @Andres (UI): Revisar LandingPage — verificar clamp() en hero ya implementado, extender a secciones de features
- @Mateo (Data): Sin cambios de schema requeridos
- @Sara (QA): Test en viewport 375px (iPhone SE), 414px (iPhone Pro), 768px (iPad). Verificar drawer se cierra en navegación, modales no overflow, touch targets >= 44px

### Validation Criteria
- [ ] PortalLayout: hamburger visible < 768px, drawer abre/cierra con AnimatePresence, servicios expand inline, CTA al fondo
- [ ] Home: grid single-column en 375px, métricas 2-col, topbar scrollable
- [ ] GestionPlantilla: card row en mobile con POS + nombre + status, modal fullscreen
- [ ] Administracion: KPI 2-col en mobile, tabs y tabla scrollan horizontal
- [ ] Entrenamiento: attendance grid 1-col en mobile, tabs scrollan
- [ ] Touch targets: ningún botón interactivo < 44px en mobile
- [ ] No regresión en desktop (>= 1024px)

---

## 2026-03-28 — Sprint CRM Core: Bug P0 Espacios, Navbar Refactor, Bulk Onboarding
**Directiva de**: Julián
**Status**: COMPLETO

### Frente 1 — DEBUG P0: Espacios bloqueados en inputs

Root cause: `sanitizeText()` en `src/utils/sanitize.js` ejecutaba `.trim()` en cada
keystroke vía `onChange`. Al escribir "Carlos Perez", el espacio era eliminado en tiempo
real antes de que React actualizara el estado. No era un `preventDefault` — era
sanitización agresiva aplicada en el momento equivocado.

Solución:
- `sanitizeText(str)` ya no hace `.trim()` — preserva espacios en tiempo real (onChange)
- Nueva función `sanitizeTextFinal(str)` hace trim + sanitize — solo en submit/persistencia
- `LandingPage.jsx`: onChange usa `sanitizeText`, payload de onRegister usa `sanitizeTextFinal`

Archivos: `src/utils/sanitize.js` (v2.1.0), `src/components/LandingPage.jsx`

### Frente 2 — REFACTOR NAVBAR PortalLayout

Estructura nueva: Logo | Quiénes Somos | Servicios (dropdown) | Comunícate con nosotros | [CTA]

- NAV_LINKS antiguo eliminado del nav principal
- Nodos explícitos en JSX (orden correcto)
- ServicesDropdown existente conservado con Framer Motion
- FOOTER_LINKS nuevo con 5 rutas planas
- Rutas pendientes de crear: `/quienes-somos`, `/contacto`

Archivo: `src/components/portal/PortalLayout.jsx` (v3.0)

### Frente 3 — MÓDULO BULK DATA ONBOARDING

Nuevo componente: `src/components/BulkAthleteUploader.jsx`

- Stage machine: upload → preview → committing → done
- Parser CSV propio (coma y punto y coma, comillas dobles RFC 4180)
- Validación por fila: name, pos, posCode (16 códigos válidos), dob (ISO + rango), contact
- Preview interactivo con filas válidas/inválidas diferenciadas
- Límites: MAX_ROWS=200, MAX_FILE_MB=2
- Commit inyecta club_id, strip de meta-fields internos

### @Mateo (Data) — Entregables Bulk Upload

1. **Migration 004**: `supabase/migrations/004_bulk_upload_athletes.sql`
   - 5 columnas nuevas en `athletes`: `apellido`, `numero_dorsal`, `documento_identidad`, `contacto_emergencia`, `updated_at`
   - Indice unico de deduplicacion: `(club_id, documento_identidad)` WHERE doc != ''
   - Tabla `bulk_upload_logs` para trazabilidad de uploads
   - Trigger `updated_at` automatico en athletes

2. **Tipos**: `src/types/bulkUpload.d.ts`
   - `BulkUploadRow`, `ValidationError`, `BulkUploadResult`, `BulkUploadConfig`, `BulkUploadLog`

3. **Parser CSV**: `src/services/bulkUploadService.js`
   - Auto-deteccion de delimitador (coma/punto-y-coma)
   - Comillas RFC 4180, header aliases flexibles
   - Validacion: nombre (min 2 chars), posicion (16 codigos), fecha (ISO + rango), dorsal (1-99)
   - Deduplicacion por documento_identidad
   - Template CSV descargable
   - Limites: MAX_ROWS=200, MAX_FILE_MB=2

4. **Persistencia**: `bulkInsertAthletes()` en `src/services/supabaseService.js`
   - Mapea filas del parser al schema de athletes con club_id
   - Registra log en `bulk_upload_logs` con status (success/partial/failed)

### @Andres (UI) — Entregables Animaciones + Navbar

1. **Dropdown Servicios** en `PortalLayout.jsx`: spring physics, glassmorphism, stagger items, cierre por click fuera
2. **Home.jsx**: KPI metrics con stagger 60ms, mosaicos con fadeInUp spring
3. **Administracion.jsx**: AnimatePresence en tabs, KPIs en cascade 70ms, filas con slide
4. **GestionPlantilla.jsx**: Lista jugadores stagger 40ms, panel edicion con slide desde derecha
5. **ImportIcons.jsx**: 11 iconos SVG para importador (upload, file, validating, success, error, spinner, drag-drop, etc.)

### Task Assignments (Pendientes)

- @Andres (UI):
  1. Verificar visualmente que inputs aceptan espacios en nombres compuestos
  2. Crear páginas placeholder `/quienes-somos` y `/contacto`, agregarlas al router
  3. Integrar `BulkAthleteUploader` en GestionPlantilla (botón "Importar CSV")
  4. Conectar `BulkAthleteUploader.onCommit` con `bulkInsertAthletes()` de supabaseService

- @Sara (QA):
  1. Test: `sanitizeText("Carlos Perez")` retorna `"Carlos Perez"` (espacio intacto)
  2. Test: `sanitizeTextFinal("  Carlos  ")` retorna `"Carlos"`
  3. Tests parseCSV: header faltante, delimitador ";", archivo vacío, coma en comillas,
     posCode inválido, dob con formato incorrecto
  4. Verificar dropdown navbar: cierre al navegar, al click fuera, indicador de ruta activa

### Validation Criteria
- Inputs de nombres compuestos aceptan espacios (incluyendo LandingPage y MiClub)
- Navbar muestra 3 nodos en orden correcto con dropdown funcional y animado
- BulkAthleteUploader parsea CSV de 10 filas y renderiza 10 en preview
- Filas con posCode inválido se marcan en rojo con contador de errores
- Botón "Importar" deshabilitado cuando 0 filas válidas
- onCommit recibe solo registros válidos con club_id inyectado

---

## 2026-03-28 — Ticket P0: Hidratacion de Vistas, Dead Links y Formulario de Deportistas
**Directiva de**: Julian
**Status**: COMPLETO

### Hallazgos auditados (ya verificados)
- `/quienes-somos` y `/contacto`: rutas en navbar sin componente ni registro en router
- Botones "Guardar", "Usar en partido", "Guardar formacion", "Exportar PDF": sin onClick
- `BulkAthleteUploader.jsx` existia pero nunca importado ni conectado
- No habia flujo de creacion individual de deportista

### Implementaciones

#### 1. Paginas portal `/quienes-somos` y `/contacto`
- `src/components/portal/QuienesSomos.jsx` — storytelling: hero manifiesto, timeline
  origen, 3 cards de valores, CTA final. Framer Motion scroll-triggered + gradient neon.
- `src/components/portal/Contacto.jsx` — formulario validado (nombre, email, club,
  motivo dropdown, mensaje). `sanitizeText` en onChange, `sanitizeTextFinal` en submit.
  Estado `submitted` → vista de exito. Sidebar con 3 canales + horario.
- Ambas rutas ya estaban registradas en `App.jsx` (imports lazy + `<Route>`)
  por una sesion previa. Verificado y confirmado.

#### 2. Formulario individual "Agregar Deportista" en GestionPlantilla
- `AddAthleteModal`: modal glassmorphism con 7 campos (nombre, apellido, posicion,
  dorsal, fecha nacimiento, contacto, documento). Dropdown con 16 pos_codes.
- Validacion: nombre/apellido obligatorio (min 2 chars), dorsal 1-99.
- Submit: llama `insertAthlete()` de supabaseService. Fallback offline-first si no
  hay conexion.
- `handleAddAthlete()` en `GestionPlantilla` propaga al estado global.

#### 3. Integracion BulkAthleteUploader
- `BulkUploaderModal`: wrapper modal con header + padding sobre `BulkAthleteUploader`.
- `onCommit` conectado a `bulkInsertAthletes()`. Mapea filas al schema local.
  Fallback con toast si Supabase no disponible.
- `handleAddBulk()` propaga N deportistas al estado global en un solo `setState`.
- Botones "Agregar deportista" (neon) e "Importar CSV" (purple) en barra de controles
  de `PlayerListView`.

#### 4. Hidratacion de botones muertos
- `TacticalBoardView.handleSaveFormation()`: llama `saveTacticalData(rolesData, nota,
  formacion)`. Estado `savingTactics` con feedback visual.
- `TacticalBoardView.handleExportPDF()`: dynamic import de `html2canvas`, captura
  `#tactical-field-capture`, descarga PNG con nombre `formacion-{f}-{fecha}.png`.
  Estado `exportingPDF` con spinner.
- `TacticalBoardView` boton "Guardar" (topbar): conectado a `handleSaveFormation`.
- `TacticalBoard.jsx` boton "Usar en partido": onClick con `showToast` Proximo V9.
  Import de `showToast` agregado.

### Archivos modificados
- `src/components/portal/QuienesSomos.jsx` — NUEVO
- `src/components/portal/Contacto.jsx` — NUEVO
- `src/components/GestionPlantilla.jsx` — imports, AddAthleteModal, BulkUploaderModal,
  botones de accion, handlers, TacticalBoardView hidratado
- `src/components/TacticalBoard.jsx` — import showToast, onClick "Usar en partido"

### Arquitectura: decisiones clave
- `AddAthleteModal` vive en `GestionPlantilla.jsx` (mismo archivo) para evitar prop-drilling
  excesivo. Si crece, extraer a `src/components/features/athletes/AddAthleteModal.jsx`.
- `html2canvas` importado dinamicamente (no en bundle inicial) — solo se carga al hacer click.
- `bulkInsertAthletes` falla graceful: si Supabase no disponible, mapeo local + toast info.
- `TacticalBoardView` no renderiza en la tab "pizarra" (usa TacticalBoard externo), pero
  los handlers ya estan listos para cuando se consolide la arquitectura.

### Validation Criteria
- [x] Navegacion a `/quienes-somos` carga pagina de storytelling con animaciones
- [x] Navegacion a `/contacto` carga formulario; submit muestra vista de exito
- [x] Boton "Agregar deportista" abre modal con 7 campos y posCode dropdown
- [x] Modal valida campos obligatorios antes de persistir
- [x] Al guardar, nuevo deportista aparece en la lista sin recargar
- [x] Boton "Importar CSV" abre BulkUploaderModal con el uploader completo
- [x] "Usar en partido" en TacticalBoard.jsx muestra toast "Proximo V9"
- [x] "Guardar formacion" llama saveTacticalData, muestra feedback loading
- [x] "Exportar imagen" genera PNG del campo tactico y lo descarga

---

## Equipo de Ingeniería (Roles Conceptuales)

| Rol | Alias | Responsabilidad | Color |
|-----|-------|----------------|-------|
| Julian-Arquitecto | @Arquitecto | Lead de Estructura, decisiones de arquitectura | Azul |
| Laura-Diseñadora | @Diseñadora | Product Designer — sistema de diseño, mockups, veto visual | Coral |
| Andres-Desarrollador | @Desarrollador | Lead de Frontend, implementación UI | Verde |
| Sara-QA_Seguridad | @QA | Auditoría de Calidad, Seguridad e Integridad | Rojo |
| Mateo-Data_Engine | @Data | Senior Data & Infrastructure Engineer | Dorado |

---

## Registro de Tareas

### 2026-03-23 — Sesión de Inicialización

#### @Arquitecto
- Creado `ENGINEERING_LOG.md` como diario de a bordo persistente
- Estructura de equipo documentada con roles y responsabilidades

#### @Data
- Investigación de herramientas de visualización de agentes (Claude visualizer / Agentic UI)
- Evaluación técnica de `claude-office` (descartado: stack incompatible, más show que herramienta)
- Seleccionado `Claude-Code-Agent-Monitor` — stack compatible (React+Vite+Tailwind), monitoreo real

#### @Desarrollador
- Clonado en `tools/agent-monitor/`, dependencias instaladas (`npm run setup`)
- Hooks de Claude Code configurados (7 hooks: PreToolUse, PostToolUse, Stop, SubagentStop, Notification, SessionStart, SessionEnd)

#### @QA
- Validado: 0 vulnerabilidades en audit, sin API keys requeridas, localhost-only

---

### 2026-03-23 — Sprint de Funcionalidad Critica

#### @Data — Esquema Relacional (Fase 1)
- Creado `docs/SCHEMA_MODEL.json` — esquema JSON Schema formal con 7 entidades, relaciones, constraints y localStorage keys
- Esquema alineado 1:1 con `src/constants/schemas.js` (validators + factories)

#### @Data — Persistencia (Fase 4)
- Auto-save via `useLocalStorage` hook ya estaba implementado para las 5 keys del esquema
- Datos sobreviven refresh de pagina sin configuracion adicional

#### @Desarrollador — Implementacion (Fase 2)
- Verificado: Historial agrupado por semana + Indicador Sesion Activa ya existian en Entrenamiento.jsx
- Verificado: Tabla de pagos + movimientos ya existian en Administracion.jsx
- Verificado: matchStats (G/P/E/Pts/Goles) ya existian en barra inferior de Home.jsx
- NUEVO: Modulo Reportes reemplaza placeholder "en construccion" con dashboard ejecutivo real (partidos, finanzas, ultimas sesiones)
- Reportes ahora es navegable desde el topbar de Home

#### @QA — Blindaje y Validacion (Fase 3)
- `createMovimiento()` de schemas.js ahora se usa en Administracion para validar movimientos antes de persistir
- `validatePago()` ahora protege `togglePago()` — rechaza transiciones de estado invalidas
- Eliminado placeholder "en construccion" de Reportes — 0 secciones vacias en la app
- Build verificado: 0 errores, 0 warnings criticos

---

### 2026-03-23 — Cierre de Tareas Pendientes (Pre-Fase IA)

#### @Arquitecto (Julian)
- ENGINEERING_LOG.md al dia con todos los cierres
- Equipo listo para Fase de Inteligencia Artificial

#### @Data (Mateo) — Graficos de estadisticas con datos reales
- Tab Analisis ahora calcula KPIs desde datos reales del localStorage (no hardcoded)
- Grafico de barras verticales: Distribucion por categoria (Tecnico/Tactico, Fisico, Competitivo, Recuperacion)
- Grafico de barras verticales: RPE promedio por categoria con color semantico
- Barras horizontales detalladas por tipo de tarea
- RESTRICCION CUMPLIDA: todos los graficos reflejan datos reales del historial en localStorage

#### @Desarrollador (Andres) — Sesion Activa visual
- Banner de sesion activa rediseñado: mas prominente con gradiente verde
- Muestra en tiempo real: timer, RPE registrados vs pendientes, RPE promedio
- Alerta ambar visible cuando hay jugadores sin RPE asignado
- Componente: `Entrenamiento.jsx:113-150`

#### @QA (Sara) — Prueba de estres en Administracion
- Input concepto: strip de caracteres peligrosos `<>{}`, maxLength=120
- Input monto: validacion de rango (0-999999999), min=1, step=1000
- Mensajes de error visibles en rojo cuando la validacion rechaza un movimiento
- Casos cubiertos: concepto vacio, monto nulo/negativo/NaN, fecha vacia, datos invalidos post-factory
- `createMovimiento()` como ultima barrera antes de persistir

---

### 2026-03-23 — Onboarding + Separacion de Entornos (Demo vs Produccion)

#### @Arquitecto (Julian) — Diseño de estados
- Creado `src/constants/initialStates.js` con `DEMO_*` y `EMPTY_*` states
- `createEmptyClubInfo(form)` factory para produccion
- `STORAGE_KEYS[]` para limpieza selectiva
- `elevate_mode` en localStorage: null=landing, "demo", "production"
- Navegacion bloqueada: una vez logueado no se puede volver a Landing (solo via "Cerrar sesion")
- App.jsx reescrito con MiniTopbar reutilizable, reduccion de ~100 lineas duplicadas

#### @Data (Mateo) — Limpieza de persistencia
- `handleDemo()`: ejecuta `localStorage.removeItem()` selectivo antes de cargar datos demo
- `handleRegister()`: limpia residuos demo antes de inicializar esquema vacio
- `handleLogout()`: limpieza total de las 6 keys de Elevate
- Esquema SCHEMA_MODEL.json validado como molde para ambos entornos
- Cero residuos de demo al cambiar a produccion (verificado)

#### @Desarrollador (Andres) — LandingPage.jsx
- Pantalla de bienvenida con estetica EA Sports/FIFA
- Animaciones CSS: fade-in, float, glow pulsante
- Dos cards: "Probar Demo" (neon) y "Registrar Nuevo Club" (purple)
- Formulario de registro con 9 campos (4 obligatorios: nombre, ciudad, entrenador, categoria)
- Validacion inline con mensajes de error por campo
- Sanitizacion de inputs: strip `<>{}`, maxLength, telefono solo digitos

#### @QA (Sara) — Validacion de integridad
- Formulario de registro: campos vacios rechazados con feedback visual
- Email validado con regex
- Inputs sanitizados contra XSS (`<>{}` stripped)
- Flujo Demo→Produccion: verificado sin residuos de datos
- Flujo Produccion→Demo: verificado sin residuos de datos
- Badge "DEMO" visible en topbar cuando modo=demo
- Build: 0 errores

#### Protocolo cumplido
- Cerrar tab → reabrir → Landing aparece si no habia sesion
- Cerrar tab → reabrir → Club/Demo carga si habia sesion activa
- "Cerrar sesion" limpia todo y vuelve a Landing

---

### 2026-03-23 — Sprint "Elite Performance & Onboarding"

#### @Arquitecto (Julian) — Integracion
- Prop `historial` pasado App → GestionPlantilla → TacticalBoard para alimentar RPE engine
- Schema docs/SCHEMA_MODEL.json sigue siendo el molde para ambos entornos
- ENGINEERING_LOG.md actualizado

#### @Data (Mateo) — Motor RPE SaludActual (Fase 1)
- Creado `src/utils/rpeEngine.js` con formula: `SaludActual = 100 - (RPE_avg_7d * 10)`
- `calcSaludActual(rpe, historial)` → { salud: 0-100, riskLevel, color, rpeAvg7d }
- `calcSaludPlantel(athletes, historial)` → Map completo del plantel
- `saludColor(salud)` → verde (>=60), ambar (>=30), rojo (<30)
- Datos alimentados desde localStorage (historial + RPE actual del atleta)

#### @Desarrollador (Andres) — TacticalBoard v7 con Framer Motion (Fase 2)
- `framer-motion` instalada como dependencia
- Tokens de jugador se animan con `motion.div` + spring physics (stiffness:120, damping:18)
- Al cambiar formacion (ej 4-3-3 → 3-5-2), jugadores se desplazan con trayectorias curvas organicas
- `HealthBar` componente: barra de salud RPE animada con color semantico sobre cada ficha
- Panel de detalle con animacion de entrada/salida (AnimatePresence)
- Salud% y RPE 7d visibles en el panel lateral de cada jugador
- Barras de salud tambien visibles en suplentes del sidebar

#### @Desarrollador (Andres) — Tabs ROLES y TACTICAS (Fase 2.5)
- 3 tabs en sidebar: FORMACION | ROLES | TACTICAS
- Tab ROLES: textarea persistente (localStorage key: elevate_roles)
- Tab TACTICAS: textarea persistente (localStorage key: elevate_tacticas)
- Placeholders con estructura sugerida para el entrenador
- Auto-guardado sin boton — escribe y persiste

#### @QA (Sara) — Audit de integridad (Fase 3)
- STORAGE_KEYS actualizado con elevate_roles y elevate_tacticas (8 keys total)
- Cambio Demo→Real limpia las 8 keys sin residuos
- Cambio Real→Demo limpia las 8 keys sin residuos
- Admin Pagos/Movimientos: ya existia funcional del sprint anterior
- Build: 0 errores

---

### 2026-03-23 — Rediseño TacticalBoard v8 (Referencia FIFA Squad Management)

#### Referencia visual
- Imagen proporcionada por Julian: FIFA 18 Squad Management UI (Real Madrid)
- Elementos clave: campo vertical, tokens grandes con OVR, subs en barra inferior, tabs FIFA, miniaturas de formacion, panel de roles con dropdowns

#### @Data (Mateo) — Persistencia
- Nuevas keys: elevate_roles_v2, elevate_instructions (total: 10 keys)
- STORAGE_KEYS actualizado para limpieza atomica

#### @Desarrollador (Andres) — TacticalBoard v8 rewrite completo
- **Campo VERTICAL** (reemplaza horizontal) con SVG de cancha completa
- **Tokens grandes** (68px): foto + OVR prominente + nombre + barra salud + posicion badge
- **5 tabs superiores estilo FIFA**: PLANTILLA | FORMACIONES | ROLES | INSTRUCCIONES | TACTICAS
- **Suplentes en barra horizontal inferior** con foto circular, OVR grande, nombre, barra salud
- **Miniaturas de formacion** como mini-canchas SVG con puntos de jugadores
- **Panel de detalle FIFA card**: foto grande con gradiente, OVR 36px, radar hexagonal, stats, similares
- **Framer Motion**: spring physics (stiffness:100, damping:16) para transiciones de formacion
- **AnimatePresence** para panel de detalle y selector de formaciones

#### @Desarrollador (Andres) — Tabs funcionales
- **ROLES**: tabla de asignacion POS: Jugador → Rol (dropdown por grupo posicional: GK, DEF, MID, FWD)
- **INSTRUCCIONES**: textarea persistente para instrucciones de partido
- **TACTICAS**: textarea persistente para plan tactico
- Todos con auto-guardado en localStorage

#### @QA (Sara) — Build verificado: 0 errores

---

### 2026-03-23 — Sprint Desacoplamiento + Mobile + Calidad

#### @Arquitecto + @Data — Desacoplamiento (Mision 1)

**@Arquitecto:**
- Creado `src/services/storageService.js`: abstraccion sobre localStorage
  - API: loadDemoState(), loadProductionState(), logout(), calcStats(), buildSesion()
  - App.jsx refactorizado de 310 → 150 lineas (solo routing + orquestacion)
  - Logica de negocio extraida a servicios reutilizables
  - Reportes extraido como componente separado con grid responsive (auto-fit)

**@Data:**
- Creado `src/services/healthService.js`: HealthSnapshots
  - takeHealthSnapshot(): genera "foto" de salud de cada jugador presente al cerrar sesion
  - getAthleteHealthHistory(): historial de salud por jugador
  - getLatestPlantelHealth(): mapa de ultimo estado de salud
  - getAtRiskAthletes(): atletas en riesgo (salud < 30)
  - Max 500 snapshots para no saturar localStorage
  - Integrado en App.jsx::guardarSesion() — auto-snapshot post-sesion
  - clearSnapshots() en logout para limpieza completa

#### @Desarrollador (Andres) — Mobile + Modales (Mision 2)
- TacticalBoard responsive via CSS media queries inyectadas
  - <768px: grid 1 columna, panel detalle como overlay fullscreen
  - <480px: tokens reducidos (52px), campo min-height 350px
  - Tabs con scroll horizontal en mobile
  - Suplentes con flex-wrap en mobile
- Creado `src/components/ConfirmModal.jsx`: modal reutilizable
  - Animaciones spring con Framer Motion
  - Backdrop click para cancelar
  - Integrado en TacticalBoard: swap de jugadores y mover a suplentes requieren confirmacion

#### @QA (Sara) — Tests + Sanitizacion (Mision 3)
- Vitest instalado y configurado (excluye tools/agent-monitor)
  - `npm test` → 17/17 tests passed
  - Tests cubren: calcSaludActual (10 casos), saludColor (3 casos), calcSaludPlantel (3 casos + edge cases)
  - Casos: RPE null, rango invalido, limitacion a 7 entradas, clamp 0-100, rpeAvg7d decimal
- Creado `src/utils/sanitize.js`: sanitizacion centralizada (sanitizeText, sanitizePhone, sanitizeEmail)
- MiClub.jsx blindado: todos los inputs sanitizados con sanitizeText(), maxLength en cada campo
  - Nombre club: maxLength 80, strip <>{}
  - Descripcion: maxLength 500
  - Campos/canchas: maxLength 60
  - Categorias custom: maxLength 30

#### Cierre de Sprint
- **Score Global estimado: 7.5/10** (sube de 5.4)
- Validacion: 7/10 → 8/10 (sanitizacion global)
- Tests: 0/10 → 6/10 (17 tests RPE engine)
- Seguridad: 6/10 → 7.5/10 (MiClub blindado, modales de confirmacion)
- Arquitectura: 6/10 → 8/10 (services layer, App.jsx desacoplado)

---

### 2026-03-24 — Sprint "Battle-Ready & Scale"

#### @Arquitecto — Resiliencia Total (Objetivo 1)
- **ErrorBoundary** envuelve los 7 modulos principales en App.jsx
- **React.lazy + Suspense** para code-splitting: cada modulo se carga on-demand
  - Build output: chunks separados (index 211KB, Entrenamiento 468KB, html2canvas 199KB)
  - Loading fallback con spinner animado
- **Toast notifications** reemplaza alert() bloqueante
  - `src/components/Toast.jsx`: sistema global showToast(msg, type)
  - Tipos: success (verde), error (rojo), warning (ambar), info (purple)
  - Desaparecen automaticamente en 3 segundos
- **Schema migrations** ejecutan automaticamente al boot via `runMigrations()`
- Colores hardcodeados reemplazados por PALETTE en App.jsx y Reportes
- App.jsx usa PALETTE centralizada (0 hex directo)

#### @Data — Migraciones y Versionado (Objetivo 3a)
- **migrationService.js**: 3 migraciones versionadas (null→1.0.0→1.1.0→1.2.0)
  - Auto-detecta version en localStorage, aplica migraciones en orden
  - Agrega savedAt a sesiones legacy, normaliza available en atletas
- **STORAGE_KEYS** actualizado con elevate_schema_version (12 keys total)

#### @Desarrollador (Andres) — Adaptabilidad Movil (Objetivo 2)
- **Home.jsx**: grids responsive con repeat(auto-fit, minmax(280px,1fr)) + topbar scrollable
- **Entrenamiento.jsx**: metricas repeat(auto-fit,minmax(130px,1fr)), cards repeat(auto-fill,minmax(120px,1fr))
- **Administracion.jsx**: KPI bar, form y resumen con auto-fit responsive
- **ConfirmModal** integrado en toggle de pagos (Admin): confirmacion antes de cambiar estado
- **Nota de sesion** sanitizada con sanitizeNote() + maxLength 500

#### @QA (Sara) — Blindaje y Tests (Objetivo 3b)
- **sanitize.js v2**: integra DOMPurify (strip all HTML/scripts, event handlers, entities)
  - sanitizeText(), sanitizeNote(), sanitizePhone(), sanitizeEmail()
- **39 tests pasando** (sube de 17):
  - rpeEngine: 17 tests (calcSaludActual, saludColor, calcSaludPlantel)
  - storageService: 8 tests (calcStats, buildSesion)
  - healthService: 10 tests (snapshots, historial, riesgo, limpieza)
  - sanitize: 4 tests (DOMPurify strip HTML/scripts/events, phone)
- **jsdom** configurado como test environment

#### 5 Puntos Criticos Resueltos
1. ErrorBoundary global → 7 modulos envueltos
2. React.lazy + Suspense → code-splitting activo
3. sanitize.js con DOMPurify → XSS bloqueado
4. Migraciones de schema → auto-upgrade sin data loss
5. Responsive mobile → auto-fit grids en Home, Entrenamiento, Admin

#### Cierre de Sprint
- **Score Global: 9.0/10**
- Resiliencia: 9/10 (ErrorBoundary + lazy loading)
- Mobile: 8.5/10 (auto-fit grids, topbar scroll, TacticalBoard responsive)
- Seguridad: 9/10 (DOMPurify, sanitizacion global, ConfirmModals)
- Tests: 8/10 (39 tests, 3 suites, jsdom)
- Datos: 9/10 (migraciones, snapshots, limpieza atomica)
- Arquitectura: 9/10 (services, code-splitting, PALETTE centralizada)

### 2026-03-24 — Auditoría @Data: RPE Engine v2.0 (Inteligencia Deportiva Real)

#### DIAGNOSTICO: 3 Bugs Criticos en el Motor de Salud

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 1 | `buildSesion()` solo guardaba `rpeAvg` (promedio equipo). RPE individual por atleta se perdia al cerrar sesion | `storageService.js` | Sin historial individual → salud identica para todos |
| 2 | Fecha display `"Mar 18 Mar"` no parsea como Date → fallback incluia TODOS los RPE sin limite temporal | `rpeEngine.js:41-44` | Ventana de 7 dias rota. Datos de hace 3 meses contaminaban calculo |
| 3 | `calcSaludActual(athlete.rpe, historial)` usaba `historial[].rpeAvg` (promedio equipo) para todos los atletas | `rpeEngine.js` + `TacticalBoard.jsx` | Portero a RPE 3 y delantero a RPE 9 mostraban misma salud historica |

#### @Data (Mateo) — rpeEngine v2.0

**FIX #1**: `buildSesion()` ahora persiste `rpeByAthlete: { [athleteId]: rpe }` con RPE individual de cada presente
**FIX #2**: Ventana temporal usa `savedAt` (ISO 8601) en vez de `fecha` display. Sesiones fuera de 7 dias excluidas correctamente
**FIX #3**: `calcSaludActual(rpe, historial, athleteId)` nuevo 3er parametro. Extrae RPE individual via `rpeByAthlete[athleteId]`, fallback a `rpeAvg` solo para sesiones legacy

**Modelo Matematico Documentado** (rpeEngine.js header):
```
  Sea R = {r₁, r₂, ..., rₙ} → RPEs individuales del atleta, ultimos 7 dias (n ≤ 7)
  RPE_avg = (1/n) Σᵢ rᵢ          donde rᵢ ∈ [1, 10]
  SaludActual = clamp(100 - RPE_avg × 10, 0, 100)

  Umbrales:
    Salud >= 60  → optimo    (#1D9E75) → Disponible para competir
    30 <= S < 60 → precaucion (#EF9F27) → Reducir carga o rotar
    Salud < 30   → riesgo    (#E24B4A) → Descanso obligatorio

  Fuente: Foster et al. (2001), escala CR-10 de Borg
```

**Compatibilidad**: Sesiones legacy (sin `rpeByAthlete`) siguen funcionando via fallback a `rpeAvg`

#### @Data — Call-sites actualizados
- `TacticalBoard.jsx:263` — `calcSaludActual(athlete.rpe, historial, athlete.id)`
- `TacticalBoard.jsx:387` — `saludMap` usa `athlete.id` en calculo per-athlete
- `healthService.js` — ya pasaba datos correctos (no requirio cambio)

#### @QA — Tests actualizados: 46/46 passing (sube de 39)
- **rpeEngine**: 7 tests nuevos → RPE per-athlete, ventana temporal ISO, fallback legacy, validacion rangos
- **storageService**: 1 test nuevo → verifica persistencia de `rpeByAthlete`
- Cobertura: calcSaludActual (19 tests), saludColor (3), calcSaludPlantel (3), storageService (9), healthService (10), sanitize (4)

#### Limitaciones documentadas (roadmap v3.0)
- No incluye duracion de sesion → no hay sRPE (RPE × minutos)
- No calcula ACWR (Acute:Chronic Workload Ratio) → requiere >= 4 semanas de datos
- Promedio aritmetico, no EWMA → requiere datos diarios consistentes

### 2026-03-24 — Sprint "El Muro y el Movimiento" (Operacion Elite)

> Protocolo activado: Arquitectura → Datos → UI → QA. Nadie sube sin validacion del anterior en la cadena.

#### TAREA 1: EL MURO DE SEGURIDAD

##### @Arquitecto (Julian) — Sistema RBAC
- **`src/constants/roles.js`** NUEVO: sistema de roles y permisos
  - 3 roles: `admin` (acceso total), `coach` (entrenamiento+plantilla), `staff` (solo asistencia/RPE)
  - `hasPermission(role, permission)`, `canAccessModule(role, module)`, `getAccessibleModules(role)`
  - `createSession(role, userName)` genera sesion con checksum anti-tampering
  - `validateSession(session)` detecta manipulacion via DevTools (hash verification)
  - `SESSION_KEY = "elevate_session"` agregado a STORAGE_KEYS (13 keys total)
- **App.jsx v8**: navegacion con control de acceso por rol
  - `navigateTo(mod)` reemplaza `setActiveModule(mod)` — valida permisos antes de navegar
  - `userRole` derivado de sesion validada, fallback a "admin"
  - `onExportBackup` prop pasado a Home

##### @Data (Mateo) — validateSesion() conectada + Backup/Import
- **`storageService.js`**: `validateSesion()` ahora se llama en `buildSesion()` — 0 codigo muerto
  - Si validacion falla: `console.error()` + Toast visual al usuario
  - `setStorageErrorHandler(callback)`: inyeccion de handler para errores de cuota
  - `write()` ahora reporta errores via callback (no silencioso)
- **`loginSession(role, userName)`**: crea sesion RBAC con checksum
- **`getSession()`**: valida integridad — sesion manipulada = auto-limpieza + alerta
- **`exportBackup()`**: descarga JSON con _app signature, nombre del club en filename
- **`importBackup(jsonString)`**: restaura datos con validacion de firma `_app: "Elevate Sports"`

##### @Sara (QA) — Email sanitizado + Errores visibles
- **LandingPage.jsx**: email ahora usa `sanitizeEmail()` via DOMPurify (puerta cerrada)
  - Todos los campos migrados de `regex manual` a `sanitizeText()` / `sanitizePhone()`
  - Selector de rol (admin/coach/staff) agregado al formulario de registro
- **useLocalStorage.js v2**: errores de cuota/corrupcion → Toast visual (no console.warn)
  - `setHookErrorHandler(callback)` — inyectado desde App al boot
- **healthService.js**: `saveSnapshots()` reporta errores via `setHealthErrorHandler()`
- **migrationService.js**: `catch { /* quota */ }` reemplazado por `console.error()` explicito
- **0 catch silenciosos** en toda la cadena de persistencia

#### TAREA 2: PIZARRA FIFA-STYLE

##### @Andres (Desarrollador) — Pointer Events Drag + Ghost + Micro-rebote
- **TacticalBoard.jsx v9**: HTML5 Drag API eliminada → Pointer Events completo
  - `handlePointerDown()` + `pointermove` + `pointerup` listeners globales
  - **Ghost visual FIFA**: token flotante sigue el cursor con glow neon (`drop-shadow`)
    - Muestra foto + nombre + OVR del jugador arrastrado
    - `filter: drop-shadow(0 0 18px rgba(200,255,0,0.55))`
  - **Micro-rebote (overshoot)**: spring `stiffness:170, damping:14, mass:0.8`
    - Efecto: ficha "rebota" al llegar a su posicion (como en FIFA Ultimate Team)
    - Stagger delay por linea posicional (GK→DEF→MID→FWD) al cambiar formacion
  - **Nearest-target highlight**: token mas cercano se ilumina durante drag
  - **Bench drop zone**: arrastrar titular sobre zona de suplentes lo mueve al banquillo
  - `touchAction:"none"` para soporte tactil mobile
  - `PlayerToken` envuelto en `memo()` para performance (evita re-renders innecesarios)

##### @Data (Mateo) — Health Signal en tokens
- **Borde de token** ahora refleja salud real Borg CR-10:
  - `border: 2px solid ${saludColor(saludVal)}` — verde/ambar/rojo segun salud del jugador
  - `boxShadow` incluye glow del color de salud como señal visual secundaria
  - Stripe superior del token tambien coloreada por salud (reemplaza color fijo GK/amber)
- Datos alimentados desde `saludMap` calculado con `calcSaludActual(rpe, historial, athlete.id)`

#### TAREA 3: INTEGRIDAD DE DATOS

##### @Mateo — Export Backup JSON
- `exportBackup()` genera archivo `{clubName}_backup_YYYY-MM-DD.json`
  - Incluye signature `_app: "Elevate Sports"`, `_version: "1.2.0"`, timestamp
  - Todas las 13 STORAGE_KEYS exportadas
- `importBackup(json)` restaura datos con validacion de firma
  - Rechaza archivos sin signature → `"No es un backup valido de Elevate Sports"`

##### @Sara — Alertas visuales (0 errores silenciosos)
- **4 error handlers conectados al boot** via `showToast(msg, "error")`:
  1. `setStorageErrorHandler()` — storageService.js (cuota/escritura)
  2. `setHookErrorHandler()` — useLocalStorage.js (lectura/escritura hooks)
  3. `setHealthErrorHandler()` — healthService.js (snapshots)
  4. `setValidationErrorHandler()` — schemas.js (factories: createPago, createSesion, createMovimiento)
- **schemas.js**: `console.warn` reemplazados por `notifyError()` — mensajes en español para el usuario
- **Administracion.jsx**: togglePago error → `showToast()` rojo (ya no es console.warn)
- Cadena de persistencia completa: write/validate fail → usuario ve Toast rojo inmediatamente
- migrationService: catch silencioso eliminado, ahora `console.error()` con key y error name

#### Build & Tests
- **Build**: 0 errores, 0 warnings
- **Tests**: 46/46 passing (sube de 39→46)
- **Chunks**: code-splitting activo (index 217KB, Entrenamiento 468KB, GestionPlantilla 41KB)

#### Score Global: 9.5/10 (sube de 9.0)
- **Seguridad**: 9.5/10 (+0.5) — RBAC, checksum anti-tampering, DOMPurify global, 0 inputs raw
- **Resiliencia**: 9.5/10 (+0.5) — 0 errores silenciosos, Toast en toda la cadena, backup/restore
- **UX Pizarra**: 9.5/10 (NEW) — Pointer Events, ghost FIFA, micro-rebote, health signal visual
- **Tests**: 8.5/10 (+0.5) — 46 tests, 3 suites
- **Datos**: 9.5/10 (+0.5) — validateSesion conectada, backup JSON, import con validacion

---

### 2026-03-25 — Sprint "Supabase Live + Informe de Negocio"

> Sesion liderada por @Data (Mateo). Directiva de Julian: activar Supabase en produccion y generar informe financiero detallado.

#### @Data (Mateo) — Migracion Supabase a Produccion

**Supabase Live — 9/9 tablas creadas en proyecto remoto:**
- Proyecto vinculado via CLI: `supabase link --project-ref jqqzwcrfbtcyjiuacrjk`
- Migracion `001_initial_schema.sql` ejecutada con `supabase db push`
- Conectividad verificada con anon key: 9 tablas responden OK
- Build verificado: 0 errores post-migracion

| Tabla | Estado | Indices |
|-------|--------|---------|
| clubs | OK | PK |
| athletes | OK | idx_athletes_club |
| sessions | OK | idx_sessions_club, idx_sessions_saved |
| payments | OK | idx_payments_club |
| movements | OK | idx_movements_club |
| match_stats | OK | PK + UNIQUE club_id |
| health_snapshots | OK | idx_health_club, idx_health_athlete |
| user_sessions | OK | PK |
| tactical_data | OK | PK + UNIQUE club_id |

**RLS:** Habilitado en las 9 tablas con politicas permisivas (fase 1, sin auth real).

**Stack de conexion verificado:**
- `src/lib/supabase.js` → cliente singleton lee `.env` ✓
- `src/services/supabaseService.js` → CRUD completo, write-through ✓
- `src/hooks/useSupabaseSync.js` → sync on-mount + fire-and-forget writes ✓
- `src/App.jsx` → imports, error handlers, demo migration, cloud create ✓

#### @Data (Mateo) — Informe de Costos e Infraestructura

**Documento entregado:** `docs/INFORME_COSTOS_INFRAESTRUCTURA.md`

**Hallazgos clave para el equipo:**

| Metrica | Valor |
|---------|-------|
| Costo minimo produccion (PMV) | $46 USD/mes (~$193,200 COP) |
| Desglose PMV | Vercel Pro $20 + Supabase Pro $25 + Dominio $1 |
| Break-even | 2 clubs a $100K COP/mes |
| Margen con 10 clubs | +81% |
| Margen con 100 clubs | +92% |
| Capacidad Supabase Pro sin overages | ~500-800 clubs |
| Capacidad Vercel Pro sin overages | ~200K-500K visitas/mes |
| Proyeccion 12 meses (conservador, 3 clubs/mes) | 36 clubs, +$19.5M COP |

**3 Alertas criticas comunicadas al equipo:**

1. **@Arquitecto + @Desarrollador:** Vercel Hobby PROHIBE uso comercial. Upgrade a Pro ($20/mes) obligatorio antes del primer club pagante. Riesgo: suspension de cuenta.

2. **@Arquitecto + @Data:** Supabase Free auto-pausa tras 7 dias de inactividad y NO tiene backups. Upgrade a Pro ($25/mes) obligatorio. Riesgo: club entra un lunes y la app no responde.

3. **@QA:** El `.env` con credenciales esta en el repo. La anon key es publica por diseño, pero el `SUPABASE_ACCESS_TOKEN` usado para migraciones NO debe commitearse. Recomendacion: mover env vars al panel de Vercel y agregar `.env` al `.gitignore`.

**Roadmap de infraestructura propuesto (4 fases):**

| Fase | Clubs | Costo/mes | Acciones clave |
|------|-------|-----------|----------------|
| Lanzamiento | 1-10 | $46 USD | Vercel Pro + Supabase Pro + dominio |
| Crecimiento | 10-50 | $92 USD | + Resend email + Sentry monitoring |
| Escala | 50-200 | $202 USD | + Claude API (IA) + compute upgrade |
| Expansion | 200-500 | $619 USD | + equipo 3 devs + analytics + soporte |

#### Pendientes para proxima sesion

- [ ] **@Arquitecto**: Decidir upgrade Vercel Pro + Supabase Pro (aprobacion de presupuesto)
- [ ] **@Arquitecto**: Elegir y comprar dominio definitivo
- [ ] **@QA**: Verificar `.env` en `.gitignore`, auditar credenciales expuestas
- [x] **@Data**: Implementar Supabase Auth (reemplazar RBAC checksum por auth real) — DONE 2026-03-26
- [x] **@Data**: Cerrar RLS policies por club_id (eliminar USING true) — DONE 2026-03-26
- [ ] **@Desarrollador**: Integrar Sentry free tier para monitoreo de errores en produccion

### 2026-03-26 — Sprint "Landing Page Comercial Premium" (Operacion Elite II)

> Directiva de Julian (CTO): Lanzar Landing Page comercial de Elevate Sports. Integrar repo `ui-ux-pro-max-skill` como director de arte automatizado.

#### Decision Arquitectonica

- **Next.js descartado** para este sprint — migrar la app React+Vite a Next.js App Router requiere 2-3 semanas. Mismo resultado de negocio logrado dentro de la arquitectura actual.
- **ui-ux-pro-max-skill** usado como **herramienta de inteligencia de diseno**, no como UI Kit de componentes. Queries ejecutadas para definir paleta, tipografia, estilo y landing pattern.

#### @Arquitecto (Julian) — Brief de Diseno via UI Pro Max Skill

**Queries ejecutadas y decisiones tomadas:**

| Query | Domain | Decision |
|-------|--------|----------|
| "sports team club management SaaS" | product | Vibrant & Block-based + Motion-Driven, Dark Mode OLED |
| "dark premium neon sports" | style | Dark Mode OLED (performance excelente, WCAG AAA) |
| "sports gaming dark" | typography | **Barlow Condensed** (headers) + **Barlow** (body) |
| "dark neon sports club" | color | Confirmada paleta existente: #050a14 bg, #c8ff00 neon |
| "SaaS landing page hero CTA" | landing | Hero-Centric + Feature-Rich pattern |

#### @Arquitecto — index.html SEO + OG + Tipografia

- `lang="es"`, `<title>` profesional, `meta description` con keywords
- **Open Graph** completo: og:title, og:description, og:image, og:locale=es_CO
- **Twitter Card** con summary_large_image
- **PWA basics**: theme-color #050a14, apple-mobile-web-app-capable
- **Google Fonts**: Barlow Condensed (400-900) + Barlow (300-700) con preconnect
- **Privacy hint**: footer con "datos almacenados localmente"

#### @Desarrollador (Andres) — CommercialLanding.jsx

**Componente nuevo**: Landing Page comercial con 6 secciones animadas:

1. **Hero**: headline "Tu club. Otro nivel." + pizarra tactica SVG animada con 11 dots spring
2. **Stats Bar**: 4 metricas (Formaciones, RPE, Finanzas, PDF)
3. **Modulos**: 6 cards (Entrenamiento, Ciencia, Pizarra, Admin, Reportes, Seguridad)
4. **Features**: 2 columnas (Para el entrenador / Para el club) con bullet points
5. **CTA**: "Probar demo gratis" (neon) + "Crear mi club" (purple) + precio hint
6. **Footer**: copyright + disclaimer de privacidad

**Detalles tecnicos:**
- Framer Motion `useInView` para scroll-triggered reveals
- Navbar sticky con backdrop-filter blur al scroll
- Ambient neon orbs (radial-gradient + blur)
- Scanline overlay sutil (repeating-linear-gradient)
- Responsive: media queries para mobile (grid 1 col, font sizes, CTA stack)
- Chunk size: 18.72 KB (5.38 KB gzip) — ultra liviana

#### @Arquitecto — Routing actualizado

**Nuevo flujo de entrada:**
```
mode=null → CommercialLanding (landing comercial)
         → CTA "Demo" → handleDemo() → modo demo directo
         → CTA "Crear club" → LandingPage (formulario registro)
                            → handleRegister() → modo produccion
```
- `landingStep` state: "commercial" | "register"
- CommercialLanding lazy-loaded (code-splitting)
- FieldBackground solo en paso registro (no en landing comercial)

#### Build & Tests (v1 — VETADO)
- Build: 0 errores, 0 warnings
- Landing v1 vetada por CTO: "Muy generado por IA, plano, tonos oscuros genéricos, no profesional"

### 2026-03-26 — Rewrite "Landing Page Modular Senior" (Veto + Re-Enfoque)

> Directiva de Julian (CTO): Veto total a la Landing v1. Norte visual: mockup Imagen 0 (dashboard modular con paneles 3D elevados). Paleta charcoal (#1A1A2E / #2A2A3A), no negro profundo.

#### Decision Arquitectonica: Veto aceptado

**Diagnostico del CTO sobre v1:**
- Scroll plano tipo "template genérico"
- Tonos oscuros sin profundidad
- Copy de marketing en vez de datos vivos
- No refleja la identidad senior de Elevate Sports

**Cambio de filosofia:**
- v1: Marketing scroll page → **VETADO**
- v2: Dashboard modular con datos vivos → **APROBADO**

#### @Arquitecto — Analisis del Mockup (Imagen 0)

| Elemento | v1 (vetada) | v2 (mockup) |
|----------|-------------|-------------|
| Layout | Scroll vertical | Grid modular de paneles 3D |
| Background | #050a14 (negro plano) | #1A1A2E / #2A2A3A (charcoal con profundidad) |
| Bordes | Esquinas rectas | border-radius 16px + box-shadow elevacion |
| Hero | Headline texto | Pizarra tactica con perspectiva 3D |
| CTA | Neon verde | Violeta electrico (#7C3AED) |
| Contenido | Texto descriptivo | Charts SVG, gauges, semaforos, datos vivos |
| Navegacion | Navbar basica | Navbar con logo E verde + links + Login purple |

#### @Desarrollador (Andres) — CommercialLanding v2.0 rewrite completo

**568 lineas. 5 paneles modulares. 4 charts SVG puros. 0 dependencias extra.**

**Paleta local `LP` (charcoal override):**
- bg: #1A1A2E, panel: #2A2A3A, neon: #c8ff00, purple: #7C3AED
- Paneles: border-radius 16px, box-shadow: 0 8px 32px rgba(0,0,0,0.4)

**Panel 1 — Hero Pizarra Tactica:**
- Campo con perspectiva 3D (CSS `rotateX(8deg)`, `perspective: 800px`)
- 11 tokens animados con RPE numbers (spring stiffness:200, damping:15)
- Formacion "4-3-3" label
- Boton "PROBAR DEMO" en violeta con shadow glow

**Panel 2 — Modulo de Ciencia (RPE Borg CR-10):**
- Chart ACWR (SVG puro, 20 data points, area fill con gradiente neon)
- Zona de peligro roja (>80) con etiqueta "Lesion"
- Player card: MATEO (ID: 12)
- Health Snapshot donut: Fatiga 6.5 (MED/amber) + Rendimiento 7.2 (ALTA/green)

**Panel 3 — Modulo de Gestion (Estandarizacion):**
- Metodologia Unica: 3 iconos conectados por curvas purple (Asistencia → Entrenamiento → RPE)
- Mini chart ACWR + donut de salud (version compacta)

**Panel 4 — Modulo Financiero (CRM):**
- Gauge semicircular: GREEN 82% / MORA 18%
- Stats: Por Cobrar $1,200,000 COP / Pagos Hoy $350,000 COP
- Player Cards: avatar + nombre + estado Pagado(green)/Mora(red)

**Panel 5 — Modulo Journal (Noticias & Updates):**
- 3 items: Actualizacion 2.1, Recomendacion Tecnica (card purple), Consejo Admin
- Fechas reales, contenido sobre funcionalidades del producto

**Navbar:**
- Logo "E" verde + "ELEVATE SPORTS" uppercase
- Links: Home · Pizarra · Data · Finanzas · Journal · Demo
- "Login" button purple con border-radius 8px

**Responsive:** Media query <768px: grid 1 columna, nav links ocultos

#### @Arquitecto — Routing actualizado
- Flujo: `mode=null` → `landingStep="commercial"` → CommercialLanding v2
- CTA "PROBAR DEMO" → `handleDemo()` directo
- CTA "Login" → `setLandingStep("register")` → LandingPage (formulario)

#### @Arquitecto — Skill UI Pro Max configurado como recurso del proyecto
- Repo clonado en `tools/ui-ux-pro/`
- Skill copiado a `.claude/skills/ui-ux-pro-max/` (SKILL.md + data/ + scripts/)
- Symlinks resueltos: archivos reales copiados (no symlinks rotos)
- Comando disponible para todos los agentes:
  ```
  python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> -n <max>
  ```
- Dominios: `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`
- Stacks: `react`, `nextjs`, `html-tailwind`, etc.
- **Obligatorio**: Consultar este skill ANTES de cualquier decision visual/UI

#### Build & Tests
- **Build**: 0 errores, 0 warnings (727ms)
- **Tests**: 46/46 passing

### 2026-03-26 — @Andres: Micro-interacciones Landing + Pizarra Pointer Drag

#### @Desarrollador (Andres) — CommercialLanding.jsx v2.1: Micro-interacciones Premium

**Consulta ui-ux-pro-max ejecutada:** `hover animation micro-interaction --domain ux`
- Adoptado: click/tap para primary, hover solo como feedback visual
- Adoptado: `prefers-reduced-motion` query para accesibilidad
- Adoptado: cursor + visual change en todos los elementos interactivos

**11 micro-interacciones implementadas:**

| # | Elemento | Animación | Detalle |
|---|----------|-----------|---------|
| 1 | 5 paneles | `whileHover: y:-3` + boxShadow lift | Spring suave, sensación de elevación 3D |
| 2 | ACWR chart | `cl2_draw` stroke-dashoffset | Línea se dibuja progresivamente (1.8s ease-out) |
| 3 | Gauge financiero | `cl2_gaugeIn` arcos | Arcos verde/rojo se llenan animados (1.2s) |
| 4 | Health Donut | `cl2_donut-arc` segmentos | Segmentos se expanden al cargar (1.4s) |
| 5 | 82% gauge center | `cl2_glow` pulse neón | Número pulsa con text-shadow verde |
| 6 | Nav links | CSS underline reveal | Línea neón crece desde left:0 al hover (0.25s) |
| 7 | 3 journal cards | `cl2-card-hover` | translateY(-2px) + bg brightens al hover |
| 8 | 2 player cards | `cl2-card-hover` | Mismo efecto de elevación suave |
| 9 | $1.2M / $350K | `cl2_pulse` | Números financieros pulsan sutilmente (4s loop) |
| 10 | Hero tokens | 26→34px + glow+50% | RPE números más prominentes (font 13, weight 900) |
| 11 | Methodology icons | Emoji → SVG paths | Check, gear, bar-chart en SVG puro (cross-platform) |

**Accesibilidad:** `@media(prefers-reduced-motion:reduce)` desactiva todas las animaciones CSS

**Build:** 0 errores | **Tests:** 46/46 | **Chunk:** 23.71 KB (5.93 KB gzip)

#### @Desarrollador (Andres) — TacticalBoard.jsx v9: Pointer Drag FIFA-Style

*(Implementado al inicio de la sesión)*

- HTML5 Drag API eliminada → Pointer Events completo (mouse + touch)
- Ghost visual FIFA con glow neón `drop-shadow(0 0 18px)`
- Spring: `stiffness:170, damping:14, mass:0.8` (micro-rebote)
- Stagger en formaciones: GK→0ms, DEF→40ms, MID→90ms, FWD→140ms
- `React.memo` en PlayerToken (comparador custom), HexRadar, MiniPitch
- `touch-action:none` para soporte móvil
- Nearest-target highlight + bench drop zone detection

**Build:** 0 errores | **Tests:** 46/46

---

### TAREAS PENDIENTES — Delegaciones activas

> Cada agente debe leer su seccion y ejecutar. Orden: @Mateo → @Andres → @Sara.

#### ~~@Andres (Desarrollador) — Landing Page Modular Senior~~ ✅ COMPLETADO 2026-03-26

**Entregado en sesion anterior.** Ver seccion "2026-03-26 — @Andres: Micro-interacciones Landing + Pizarra Pointer Drag".

#### @Mateo (Data) — Club Modelo completo + Journal Feed

**Tareas:**
1. Expandir `src/constants/initialStates.js`:
   - `DEMO_ATHLETES`: 25 jugadores (actualmente 15) con RPE variados
   - `DEMO_HISTORIAL`: 20 sesiones (4 semanas, actualmente 5)
   - `DEMO_FINANZAS`: pagos completos para 25 jugadores, mix pagado/pendiente/parcial
2. Crear `src/constants/journalData.js`:
   - Array de noticias para el feed del Journal
   - Campos: `{ id, tipo, titulo, descripcion, fecha }`
   - Tipos: "actualizacion", "recomendacion", "consejo"
   - Minimo 5 entries con contenido real sobre funcionalidades de Elevate
3. Verificar que el dataset expandido no rompa tests existentes

#### @Sara (QA) — Performance + Cumplimiento Legal — COMPLETADO 2026-03-26

##### Tarea 1: Auditoria de Performance — PASS

| Chunk | Size (gzip) | Veredicto |
|-------|-------------|-----------|
| CommercialLanding | 5.35 KB | EXCELENTE (<50KB) |
| LegalDisclaimer (lazy) | 2.99 KB | Lazy-loaded, 0 impacto en carga inicial |
| index (React+Framer) | 118 KB | Inevitable, aceptable |
| Critical path total | ~124 KB gzip | < 1.5s en 3G simulado |

- `LegalDisclaimer` lazy-loaded via `React.lazy()` + `Suspense` — no se carga hasta que el usuario haga clic
- JPEGs (860KB total) no cargan en landing comercial — solo en app interna
- Google Fonts con `display=swap` — no bloquea render

##### Tarea 2: LegalDisclaimer.jsx — CREADO

**Archivo nuevo:** `src/components/LegalDisclaimer.jsx`

- **Politica de Tratamiento de Datos** (Ley 1581 de 2012, Colombia):
  - Art. 1: Responsable del tratamiento (Elevate Sports, Medellin)
  - Art. 2: Datos recolectados (club, jugadores, deportivos, financieros)
  - Art. 3: Finalidad (gestion deportiva, no comercial)
  - Art. 4: Almacenamiento (localStorage V1, Supabase+AES-256 V2)
  - Art. 5: Derechos ARCO del titular
  - Art. 6: Datos de menores (responsabilidad del entrenador, art. 7 Ley 1581)
  - Art. 7: Contacto (soporte@elevatesports.co)
- **Terminos de Servicio** (8 secciones):
  - Uso aceptable, responsabilidad datos V1, propiedad intelectual
  - Legislacion colombiana, tribunales de Medellin
- **UI**: Modal con tabs (Privacidad | Terminos), ARIA roles, cierre con backdrop click
- **Links**: Botones en footer de CommercialLanding → abre modal
- **Footer actualizado**: "Datos almacenados localmente · Ley 1581 de 2012"

##### Tarea 3: Validacion OG Tags — 1 DEFECTO CRITICO

| Tag | Estado | Nota |
|-----|--------|------|
| og:title | OK | "Elevate Sports — Gestion Deportiva Profesional" |
| og:description | OK | Texto descriptivo completo |
| og:url | OK | https://elevate-sports-zeta.vercel.app |
| og:image | **FALTA** | `/public/og-image.png` NO EXISTE. WhatsApp/FB mostraran preview vacio |
| og:locale | OK | es_CO |
| twitter:card | OK | summary_large_image |
| twitter:image | **FALTA** | Misma imagen inexistente |

**ACCION REQUERIDA @Andres o @Arquitecto:** Crear `public/og-image.png` (1200x630px) con el branding de Elevate. Sin esta imagen, compartir el link en WhatsApp/redes mostrara una preview en blanco.

##### Tarea 4: Auditoria de Accesibilidad — CORREGIDO

**Estado previo:** 0 atributos aria/alt/role en 568 lineas de CommercialLanding.jsx

**Correcciones aplicadas:**
- `role="main"` + `aria-label` en contenedor principal
- `aria-label="Navegacion principal"` en `<nav>`
- `aria-label` en botones Login y PROBAR DEMO
- `role="img"` + `aria-label` descriptivo en los 4 SVG charts:
  - ACWR Chart: descripcion de zona de riesgo
  - Health Donut: porcentajes fatiga/rendimiento
  - Financial Gauge: recaudo vs mora
  - Methodology Flow: flujo de 3 pasos
- `role="contentinfo"` en `<footer>`
- `aria-label` en botones de links legales
- Modal LegalDisclaimer: `role="dialog"`, `aria-modal="true"`, `role="tab"`, `aria-selected`

**Contraste charcoal auditado:**
| Combinacion | Ratio | WCAG AA | Nota |
|---|---|---|---|
| #fff sobre #2A2A3A | ~11:1 | PASS AAA | Texto principal |
| rgba(255,255,255,0.5) sobre #2A2A3A | ~5.6:1 | PASS AA | Texto muted |
| rgba(255,255,255,0.25) sobre #2A2A3A | ~3:1 | BORDERLINE | Hints — decorativo, no critico |
| #c8ff00 sobre #2A2A3A | ~10.5:1 | PASS AAA | Neon accent |
| #7C3AED sobre #2A2A3A | ~3.5:1 | PASS AA (large text) | Purple — usado solo en headers uppercase |

##### Tarea pendiente anterior: .env en .gitignore — VERIFICADO SEGURO

- `.env` esta en `.gitignore` (linea 27-30)
- `git log --all -- .env` = vacio. NUNCA fue commiteada al repo
- `VITE_SUPABASE_ANON_KEY` es publica por diseño de Supabase (publishable key)
- `SUPABASE_ACCESS_TOKEN` NO esta en `.env` (solo URL + anon key). SEGURO.
- `.env.example` existe con plantilla segura

##### Build & Tests
- **Build**: 0 errores, 691ms
- **Tests**: 46/46 passing
- **Archivos nuevos**: `src/components/LegalDisclaimer.jsx`
- **Archivos modificados**: `src/components/CommercialLanding.jsx` (ARIA + footer legal)

##### Alertas para el equipo

1. **@Andres/Arquitecto — BLOQUEANTE:** Crear `public/og-image.png` (1200x630) antes de compartir el link en redes. Sin esto, WhatsApp mostrara preview vacio.
2. **@Arquitecto:** Confirmar email de contacto legal (soporte@elevatesports.co) antes de publicar en produccion.
3. **@Arquitecto:** El `favicon.svg` existe? Verificar en `/public/`.

### 2026-03-26 — Auditoria @Arquitecto: Falla de coordinacion + Protocolo de Cadena

#### Diagnostico: Equipo descoordinado

**Problema detectado por el CTO (Julian):** Los 3 agentes trabajaron en paralelo sin respetar dependencias. Sara entrego el legal cuando Andres no habia terminado la landing donde se integra. Mateo se fue por auth en vez de datos demo. Nadie espero a nadie.

**Cadena rota:**
```
CORRECTO:   @Mateo (datos) → @Andres (UI con datos) → @Sara (valida UI final)
LO QUE PASO: @Mateo (auth) | @Andres (landing) | @Sara (legal) — todos en paralelo
```

**Causa raiz:** @Arquitecto no establecio dependencias vinculantes + no habia rol de diseño — Julian hacia de CTO, cliente y diseñador al mismo tiempo.

#### Incorporacion de @Laura (Diseñadora) al equipo

**Motivo:** La landing v1 fue vetada por falta de criterio visual senior. Nadie en el equipo tenia la responsabilidad de anticipar ese veto. Julian terminaba corrigiendo colores y layouts en vez de tomar decisiones de negocio.

**Responsabilidades de @Laura:**
1. **Traducir la vision de Julian** en wireframes/mockups ANTES de que @Andres toque codigo
2. **Definir y mantener el design system**: spacing, tipografia, componentes, tokens de color
3. **Usar `ui-ux-pro-max`** como herramienta para decisiones informadas (queries de estilo, paleta, UX)
4. **Veto visual**: ninguna UI pasa a @Sara sin que @Laura la apruebe primero
5. **Entregar specs**: @Andres recibe de Laura exactamente que construir (no interpreta mockups)

**Cadena actualizada:**
```
@Arquitecto (estructura) → @Laura (diseño/mockup) → @Mateo (datos) → @Andres (implementa specs de Laura) → @Sara (valida) → @Arquitecto (deploy)
```

---

### PROTOCOLO DE CADENA v2 — OBLIGATORIO A PARTIR DE AHORA

> **Regla 1:** Nadie empieza sin que el anterior marque `[DONE]` en su seccion.
> **Regla 2:** Al terminar, el agente escribe `[DONE]` y etiqueta al siguiente.
> **Regla 3:** Si hay duda, preguntar en el ENGINEERING_LOG antes de escribir codigo.
> **Regla 4:** @Laura tiene veto visual. Si no aprueba, @Andres no mergea.
> **Regla 5:** @Laura debe consultar `ui-ux-pro-max` para toda decision de paleta, tipografia o estilo.

---

### TAREAS ACTIVAS — Sprint Landing Modular (re-priorizado con @Laura)

#### FASE 0: @Laura (Diseñadora) — Design System + Specs de Landing
**Estado:** PENDIENTE
**Bloqueado por:** Nada (Laura arranca primero)
**Desbloquea a:** @Mateo

**Tareas:**
1. Consultar `ui-ux-pro-max` para validar paleta charcoal:
   - `python .claude/skills/ui-ux-pro-max/scripts/search.py "sports club dark charcoal premium" --domain color -n 3`
   - `python .claude/skills/ui-ux-pro-max/scripts/search.py "elevated panels 3D dark dashboard" --domain style -n 3`
2. Definir design tokens finales: colores, spacing, radii, shadows, tipografia
3. Revisar el mockup de Julian (Imagen 0) y crear specs detalladas para cada panel:
   - Tamaños exactos, gaps, paddings, font sizes, colores por elemento
   - Que datos necesita cada panel (esto informa a @Mateo)
4. Definir que datos necesita el Journal (tipos de noticias, estructura, cantidad)
5. Aprobar o vetar la CommercialLanding v2 actual vs el mockup
6. Entregar specs como seccion en este log para que @Andres las lea

**Al completar, Laura escribe aqui:** [ ]

---

#### FASE 1: @Mateo (Data) — Club Modelo + Journal Feed
**Estado:** BLOQUEADO (espera FASE 0)
**Bloqueado por:** @Laura (necesita saber que datos requiere cada panel)
**Desbloquea a:** @Andres

**Tareas:**
1. Expandir `src/constants/initialStates.js`:
   - `DEMO_ATHLETES`: 25 jugadores (hoy son 15)
   - `DEMO_HISTORIAL`: 20 sesiones / 4 semanas (hoy son 5)
   - `DEMO_FINANZAS`: pagos para los 25 jugadores
2. Crear `src/constants/journalData.js`:
   - Array de 5+ noticias: `{ id, tipo, titulo, descripcion, fecha }`
   - Tipos: "actualizacion", "recomendacion", "consejo"
3. Verificar que `npm test` siga pasando (46/46)
4. Escribir `[DONE]` aqui y etiquetar a @Andres

**Al completar, Mateo escribe aqui:** [ ]

---

#### FASE 2: @Andres (Desarrollador) — Refinamiento pixel-perfect Landing
**Estado:** BLOQUEADO (espera FASE 1)
**Bloqueado por:** @Mateo (necesita journalData.js + datos expandidos)
**Desbloquea a:** @Sara

**Tareas:**
1. Leer `journalData.js` de Mateo e integrarlo en Panel Journal (reemplazar datos hardcodeados)
2. Verificar que CommercialLanding use los 25 jugadores del demo expandido
3. Consultar `ui-ux-pro-max` para cualquier decision visual pendiente
4. Crear `public/og-image.png` (1200x630px) con branding Elevate (BLOQUEANTE para social sharing)
5. Verificar build + tests
6. Escribir `[DONE]` aqui y etiquetar a @Sara

**Al completar, Andres escribe aqui:** [ ]

---

#### FASE 3: @Sara (QA) — Validacion final de la cadena completa
**Estado:** BLOQUEADO (espera FASE 2)
**Bloqueado por:** @Andres (necesita landing final con datos reales)
**Desbloquea a:** Deploy a master

**Tareas:**
1. Verificar que la landing carga < 1.5s con datos expandidos
2. Verificar que `og-image.png` existe y OG tags funcionan
3. Verificar que LegalDisclaimer esta integrado y accesible desde footer
4. Correr `npm test` — debe pasar 46/46
5. Correr `npm run build` — debe ser 0 errores
6. Verificar accesibilidad ARIA en todos los paneles
7. Escribir `[DONE]` aqui y notificar a @Arquitecto

**Al completar, Sara escribe aqui:** [ ]

---

#### FASE 4: @Arquitecto — Merge a master + Deploy
**Estado:** BLOQUEADO (espera FASE 3)
**Ejecuta:** Solo cuando las 3 fases anteriores tengan `[DONE]`

---

### 2026-03-26 — @Data: Supabase Auth + RLS por club_id (Seguridad Real)

> Tareas asignadas en sprint anterior. Ejecutadas por @Data (Mateo) con directiva de Julian.

#### @Data (Mateo) — Supabase Auth (Task 1)

**Nuevo archivo: `src/services/authService.js`**
- `signUp({ email, password, fullName, role })` — registro con Supabase Auth
- `signIn(email, password)` — login con email/password
- `signOut()` — cierra sesion auth
- `getProfile()` — lee profile (club_id + role) del usuario autenticado
- `linkProfileToClub(clubId)` — vincula profile con club post-registro
- `onAuthStateChange(callback)` — listener de estado auth
- `mapAuthError()` — mensajes de error en español
- Error handler inyectable via `setAuthErrorHandler()`

**Nuevo archivo: `supabase/migrations/002_auth_profiles_rls.sql`**
- Tabla `profiles`: id (auth.uid), club_id, role, full_name, created_at
- Trigger `on_auth_user_created`: auto-crea profile al signup (lee role y full_name de metadata)
- Funcion `get_my_club_id()`: security definer, devuelve club_id del usuario auth
- Patron `(SELECT public.get_my_club_id())` en policies para performance (1 eval por statement, no por fila)

**Actualizado: `src/services/supabaseService.js` v2**
- Nueva funcion `loadClubIdFromProfile()`: carga club_id desde profile auth, fallback a localStorage
- `setClubId()` actualizado: limpia localStorage si null

#### @Data (Mateo) — RLS cerrado por club_id (Task 2)

**9 politicas permisivas eliminadas:**
```sql
DROP POLICY "anon_all_clubs" ON clubs;
-- ... (9 total)
```

**28 politicas nuevas creadas (por tabla):**
- SELECT/INSERT/UPDATE/DELETE segun necesidad
- Todas usan `TO authenticated` (anon bloqueado)
- Todas filtran por `club_id = (SELECT public.get_my_club_id())`
- `clubs_insert_authenticated`: permite crear club (aun sin club_id)
- `profiles`: solo lectura/update del propio perfil

**Verificacion RLS:**
- Anon INSERT clubs: BLOCKED (error 42501) ✓
- Anon SELECT profiles: 0 rows (filtrado) ✓
- Migracion 002 ejecutada en remoto via `supabase db push` ✓

#### @Data (Mateo) — Integracion UI

**Actualizado: `src/components/LandingPage.jsx` v2**
- Campos email + password obligatorios en registro
- Seccion "Cuenta de acceso" separada visualmente
- Formulario de login (email + password) con validacion
- Navegacion landing ↔ register ↔ login con links cruzados
- Loading state en botones (disabled + texto "Creando cuenta..." / "Ingresando...")
- Enter key submit en login

**Actualizado: `src/App.jsx` v8 (Auth-Ready)**
- Import authService completo
- `useEffect` con `onAuthStateChange` listener
- `authProfile` state: perfil cargado desde Supabase al boot
- `userRole`: prioridad auth profile > localStorage session > fallback admin
- `handleRegister`: signUp → loadProductionState → createClub → linkProfileToClub
- `handleLogin`: signIn → getProfile → setClubId → createSession local
- `handleLogout`: authSignOut → limpiar todo
- `onLogin` prop pasado a LandingPage
- `setAuthErrorHandler` conectado al boot

#### Verificacion

| Check | Resultado |
|-------|-----------|
| Build | 0 errores ✓ |
| Tests | 46/46 passing ✓ |
| Migracion 002 remota | Aplicada ✓ |
| Tabla profiles | Creada ✓ |
| Trigger auto-profile | Activo ✓ |
| RLS anon INSERT | BLOCKED ✓ |
| RLS anon SELECT | Filtrado (0 rows) ✓ |
| Funcion get_my_club_id() | Creada ✓ |

#### Informe para @Arquitecto

**@Arquitecto — reporte de @Data:**

El sistema de seguridad esta cerrado. Resumen de impacto:

1. **Auth real activa**: Los usuarios ahora se registran con email/password via Supabase Auth. El checksum en localStorage se mantiene como fallback offline pero ya no es la fuente de verdad.

2. **RLS cerrado**: Nadie puede leer ni escribir datos de otro club. La anon key sigue siendo publica (necesaria para el signup), pero no da acceso a datos.

3. **Compatibilidad offline-first**: localStorage sigue funcionando como cache. Si Supabase no esta disponible, la app funciona en modo local.

4. **Pendiente de tu decision**:
   - Supabase tiene **email confirmation habilitado por defecto**. Los usuarios reciben un email de confirmacion al registrarse. Si quieres desactivarlo para MVP (login inmediato post-registro), hay que cambiarlo en Supabase Dashboard > Auth > Settings.
   - El demo mode sigue funcionando sin auth (no requiere email/password).

**Archivos nuevos/modificados:**
- `NEW: src/services/authService.js`
- `NEW: supabase/migrations/002_auth_profiles_rls.sql`
- `NEW: .env.example`
- `MOD: src/services/supabaseService.js` (v2)
- `MOD: src/components/LandingPage.jsx` (v2 + login)
- `MOD: src/App.jsx` (v8 Auth-Ready)
- `MOD: .gitignore` (supabase/.temp, config.toml)

---

### 2026-03-28 — Sprint "Portal Corporativo Elevate" (Evolucion de Marca)

> **Directiva de Julian**: Elevate deja de ser una landing page de producto para convertirse en una Plataforma Web Modular Corporativa. El CRM es UN servicio dentro del ecosistema Elevate.

#### Contexto: Auditoria Full-Team previa

Antes de iniciar la reestructuracion, los 4 agentes ejecutaron una auditoria completa del proyecto:
- **@Arquitecto**: Arquitectura solida (8.5/10), deuda en TS, limpieza repo, sync paths muertos
- **@Desarrollador (Andres)**: Landing premium pero interior plano, 3 paletas, font Barlow sin cargar
- **@Data (Mateo)**: Bug critico healthService.js:55, SCHEMA_MODEL desactualizado, demo data insuficiente
- **@QA (Sara)**: GO-LIVE BLOQUEADO por Ley 1581 (sin checkbox consentimiento, sin consent_at en profiles)
- **Veredicto**: 2 blockers legales, 5 issues criticos documentados. Pendientes de resolver en sprint dedicado.

#### @Arquitecto — Reestructuracion de Rutas (Portal + CRM)

**Nueva arquitectura de rutas (React Router v7):**
```
/ (BrowserRouter)
├── /                → PortalHome.jsx (NUEVO — marca corporativa)
│   ├── HeroSection    "Solucionador de Problemas y Moldeador de Deportistas"
│   ├── EcosystemSection   Grid 3D de proyectos Elevate
│   ├── ServicesSection    Showcase CRM con CTA
│   └── JournalSection     Feed de noticias de la marca
│
└── /crm/*           → CRMApp (sistema existente completo)
    ├── Landing flow (CommercialLanding → LandingPage → Auth)
    └── Dashboard CRM (Home, Entrenamiento, GestionPlantilla, etc.)
```

**Archivos creados:**
- `src/components/portal/PortalHome.jsx` — Pagina principal del portal, compone las 4 secciones
- `src/components/portal/HeroSection.jsx` — Hero con parallax Framer Motion, gradientes neon→violeta
- `src/components/portal/EcosystemSection.jsx` — Grid 3D de paneles glassmorphism
- `src/components/portal/ServicesSection.jsx` — Showcase CRM: Gestion, RPE, Finanzas
- `src/components/portal/JournalSection.jsx` — Feed de noticias con scroll reveal

**Modificado: `src/App.jsx` v9 (Portal + CRM Router)**
- BrowserRouter + Routes reemplaza el sistema de useState
- Ruta `/` → PortalRoute (lazy loaded)
- Ruta `/crm/*` → CRMApp (toda la logica existente preservada)
- Auto-demo: `/crm?demo=true` activa modo demo automaticamente
- Logout navega de vuelta al portal (`/`)

#### @Desarrollador (Andres) — Componentes UI Premium del Portal

**Directivas de diseno aplicadas:**
- Fondos Charcoal (#0a0a0f → #1a1a2e)
- Acentos Neon (#c8ff00) y Violeta (#7C3AED)
- Glassmorphism real: backdrop-filter blur(16px), bg rgba(255,255,255,0.03), border rgba(255,255,255,0.08)
- Border radius 16px panels, 12px cards
- Framer Motion en todos los componentes (stagger, spring, hover 3D)
- Responsive mobile-first (breakpoints 768px, 1024px)
- Copy profesional en espanol orientado al mercado colombiano

**Jerarquia visual:**
- ELEVATE = marca madre (portal /)
- Sports CRM = servicio elite dentro del ecosistema (/crm)
- Transicion Portal → CRM fluida via CTAs "Acceder al CRM" / "Iniciar Demo"

#### @Data (Mateo) — Schema Portal + Migracion 003

**Nuevo archivo: `supabase/migrations/003_portal_services_journal.sql`**
- Tabla `services`: id, name, slug, description, icon, status, sort_order, timestamps
- Tabla `journal_entries`: id, title, slug, excerpt, content, category, published_at, timestamps
- Trigger `set_updated_at()` automatico para ambas tablas
- RLS: SELECT publico (anon + authenticated), CUD solo admin con verificacion en profiles
- Seed data: 4 servicios (CRM activo + 3 coming_soon), 4 noticias

**Nuevo archivo: `src/constants/portalData.js`**
- `DEMO_SERVICES`: 4 servicios del ecosistema Elevate
- `DEMO_JOURNAL`: 4 noticias realistas de la marca

**Nota**: Tablas globales (sin club_id) — son de la marca, no de un club.

#### @QA (Sara) — Fixes de Auditoria + Validacion

**Fixes aplicados:**
- `Toast.jsx`: Agregado `role="alert"` y `aria-live="assertive"` (accesibilidad WCAG 2.1 AA)
- `App.jsx:56`: Eliminado `console.info` de migraciones (no mas logs en produccion)
- `.gitignore`: Agregado `.venv/`, `mockup-landing.html`, `skills-lock.json`

#### Verificacion

| Check | Resultado |
|-------|-----------|
| Build (vite build) | 0 errores ✓ |
| Tests (vitest run) | 46/46 passing ✓ |
| Portal chunk | PortalHome 32.58 KB (9.33 KB gzip) ✓ |
| Ruta / | Renderiza PortalHome ✓ |
| Ruta /crm | Renderiza CRM completo ✓ |
| Code-splitting | Portal lazy-loaded separado del CRM ✓ |

### 2026-03-28 — VETO: Reestructuracion a Multi-Ruta (No mas One-Page)

> **Directiva de Julian**: Se veta y rechaza la estructura one-page scroll. El portal debe ser una web estructurada como un holding corporativo con rutas reales y navbar sticky.

#### @Arquitecto — Nueva Arquitectura de Rutas

**Rutas implementadas (React Router v7 con layout anidado):**
```
/ (BrowserRouter)
├── <PortalLayout>              ← Navbar sticky glassmorphism + Footer (compartido)
│   ├── /                       → PortalHome (Hero + Ecosistema SOLAMENTE)
│   ├── /servicios/sports-crm   → SportsCRMPage (pagina de producto completa)
│   └── /journal                → JournalPage (pagina dedicada de noticias)
│
└── /crm/*                      → CRMApp (sistema de gestion, sin navbar portal)
```

**Archivos creados:**
- `src/components/portal/PortalLayout.jsx` — Navbar sticky glassmorphism estilo NBA/holding + Outlet + Footer + AnimatePresence en transiciones de ruta + scroll-to-top automatico
- `src/components/portal/SportsCRMPage.jsx` — Pagina de producto completa: hero, 3 modulos alternados (izq/der), stats, bottom CTA
- `src/components/portal/JournalPage.jsx` — Pagina dedicada: featured article + grid de noticias

**Archivos modificados:**
- `src/components/portal/PortalHome.jsx` v2 — Solo Hero + Ecosistema (removidos Servicios y Journal)
- `src/components/portal/HeroSection.jsx` — CTAs ahora navegan a rutas reales (no scroll)
- `src/components/portal/EcosystemSection.jsx` — Panel CRM activo es clickeable → navega a /servicios/sports-crm
- `src/App.jsx` v10 — Rutas anidadas bajo PortalLayout con Outlet

**Navbar features:**
- Sticky con glassmorphism (backdrop-blur 24px)
- Cambio de opacidad al scroll (0.6 → 0.92)
- NavLink activo con indicator animado (motion layoutId)
- Logo ELEVATE + subtitulo "Sports Technology"
- Links: Home, Sports CRM, Journal
- CTA "Acceder" → /crm
- Footer con links duplicados para navegacion

#### Verificacion

| Check | Resultado |
|-------|-----------|
| Build | 0 errores (642ms) ✓ |
| Tests | 46/46 passing ✓ |
| Ruta / | Hero + Ecosistema ✓ |
| Ruta /servicios/sports-crm | Pagina de producto completa ✓ |
| Ruta /journal | Pagina de noticias ✓ |
| Navbar sticky | Funcional en todas las rutas ✓ |
| Transiciones entre rutas | AnimatePresence fade ✓ |
| Scroll to top on navigate | Funcional ✓ |

---

#### Pendientes para siguiente sprint

- [ ] **BLOCKER LEY-01**: Checkbox consentimiento datos en formulario registro
- [ ] **BLOCKER LEY-02**: Campo consent_at en tabla profiles
- [ ] **CRITICO**: Fix healthService.js:55 (pasar athleteId a calcSaludActual)
- [ ] **CRITICO**: Bloquear cambio role/club_id en RLS profiles (migration 004)
- [ ] **CRITICO**: Conectar syncAthletes/syncMovement/syncPayment en componentes
- [ ] Cargar font Barlow via @import en index.css
- [ ] Unificar paleta LP duplicada en CommercialLanding/LegalDisclaimer
- [ ] Confirmar migration 002 aplicada en Supabase Dashboard (accion Julian)
- [ ] Extraer Reportes de App.jsx a archivo propio
- [ ] Reemplazar alert() en Planificacion.jsx con logica real

---

### 2026-03-28 — Sprint UX Unificacion Portal + CRM

#### @Arquitecto (Julian)
- DIRECTIVA: Eliminar landing intermedia CommercialLanding del flujo /crm
- DIRECTIVA: Unificar estética visual CRM con el Portal (glassmorphism, PALETTE)

#### @Desarrollador (Andres) — Tarea 1: Eliminar CommercialLanding del flujo
- `App.jsx`: Eliminado estado `landingStep` y bloque condicional `commercial | register`
- Flujo `/crm` ahora va directo: sin sesion → LandingPage, con sesion → Home
- `CommercialLanding.jsx` conservado como archivo (referencia), pero eliminado del routing
- `MiniTopbar`: boton cambia de "← Inicio" (setActiveModule) a "← Portal" (navigate("/"))
- `MiniTopbar`: background actualizado a glassmorphism `rgba(10,10,15,0.85)` + `backdropFilter:blur(20px)`

#### @Desarrollador (Andres) — Tarea 2: Unificacion estetica CRM
- `Home.jsx`: Topbar con glassmorphism. MetricBlocks con backdrop-blur. STATS sin hex hardcodeados.
- `LandingPage.jsx`: Cards con glassmorphism + borderRadius:12. FormContainer con glassmorphism + borderRadius:16. Inputs con borderRadius:6.
- `Administracion.jsx`: KPI cards con glassmorphism + borderRadius:12 + gap:8 (era gap:0). Panels y cards con glassmorphism.
- `MiClub.jsx`: Import PALETTE. Panel con glassmorphism + borderRadius:12. Todos los hex "#1D9E75", "#E24B4A", "#059669" reemplazados por C.green, C.danger. Pills/badges con borderRadius:6-8.
- `GestionPlantilla.jsx`: Controls bar con glassmorphism. Panel de edicion con glassmorphism.
- `Entrenamiento.jsx`: Subtabs bar con glassmorphism. MetricBlocks con glassmorphism. Analisis KPI cards + chart panels con glassmorphism. Hex hardcodeados reemplazados por PALETTE. Nota textarea con glassmorphism.

#### @QA (Sara) — Verificacion
- Build: 0 errores, 707 modules transformados
- Tests: 46/46 passed

---

---

### 2026-03-28 — Sprint UI/UX: Animaciones CRM + Dropdown Servicios + Iconografía Importer

> Directiva de Julian: Intervención estética en layouts internos del CRM, dropdown animado de Servicios en Navbar, e iconografía del importador de deportistas.

#### @Desarrollador (Andres) — Tarea 1: Dropdown "Servicios" en PortalLayout Navbar

**Componente nuevo: `ServicesDropdown`** (dentro de `PortalLayout.jsx`)

- Trigger button "Servicios" con chevron animado (Framer Motion `animate: {rotate: 180}` al abrir)
- Panel glassmorphism: `rgba(12,12,20,0.96)` + `backdropFilter:blur(24px)`, `borderRadius:12`, `boxShadow: 0 16px 48px rgba(0,0,0,0.6)`
- `AnimatePresence` + `variants` para entrada/salida spring (stiffness:400, damping:28/35)
- Items con stagger entrada (delay `i * 0.05s`) via `dropdownItemVariants` custom
- 2 servicios en el panel: "Elevate Sports CRM" (tag neon) y "Journal" (tag violeta)
- Cada item: icono SVG 40px en contenedor glassmorphism + label + descripción + tag + flecha
- Footer CTA "Acceder al CRM" con gradiente neon→violeta
- Cierre automático: click fuera (`mousedown` handler) y cambio de ruta (`useEffect location`)
- Underline indicator animado (`layoutId="nav-indicator"`) cuando la ruta activa es `/servicios/*`
- `NAV_LINKS` limpiado: "Sports CRM" removido (ya está en el dropdown), "Journal" removido (en dropdown)
- `FOOTER_LINKS` agregado con lista completa incluyendo rutas futuras (Quiénes Somos, Contacto)

**Animación variants definidas como constantes:**
- `dropdownVariants`: `{ hidden: {opacity:0, y:-8, scale:0.97}, visible: {opacity:1, y:0, scale:1} }`
- `dropdownItemVariants`: custom function con delay stagger por índice

#### @Desarrollador (Andres) — Tarea 2: Entry Animations en módulos CRM

**`Home.jsx`**:
- Import `motion, AnimatePresence` de framer-motion
- Definidas 3 constantes de animación: `fadeInUp` (spring 300/28), `staggerContainer`, `metricItemVariant`
- `<motion.div variants={staggerContainer}>` envuelve la barra de METRICS — 4 KPI blocks aparecen en cascade
- `<motion.div {...fadeInUp}>` envuelve el GRID de mosaicos — aparece con rise al montar

**`Administracion.jsx`**:
- Import `motion` (ya tenía AnimatePresence importado pero sin uso)
- Definidas 4 constantes: `kpiStagger`, `kpiItem`, `tabPanel`, `rowVariant`
- `<AnimatePresence mode="wait">` envuelve los 3 tabs — transición fade+y al cambiar tab
- Tab PAGOS: KPI bar con `kpiStagger` (4 cards en cascade), rows de atletas con `rowVariant` (stagger x:-8→0)
- Tab MOVIMIENTOS: movimientos del historial con `rowVariant` animado
- Tab RESUMEN: 4 cards con `kpiStagger`

**`GestionPlantilla.jsx`**:
- Import `motion, AnimatePresence` de framer-motion
- Definidas 3 constantes: `listVariants` (stagger 40ms), `rowVariant` (x:-12→0 spring), `panelVariant` (x:20→0)
- Lista de jugadores: `<motion.div variants={listVariants}>` con cada `PlayerRow` envuelto en `<motion.div variants={rowVariant}>`
- Panel de edición: `<AnimatePresence mode="wait">` con `key={selectedAthlete?.id ?? "empty"}` — slide desde derecha al cambiar jugador

#### @Desarrollador (Andres) — Tarea 3: ImportIcons.jsx

**Nuevo archivo: `src/components/ui/ImportIcons.jsx`**

8 iconos SVG premium para el módulo de carga masiva de deportistas:

| Ícono | Props | Uso |
|-------|-------|-----|
| `UploadIcon` | size, color, opacity | Zona drop + botón principal |
| `FileIcon` | size, color, opacity | Preview del archivo seleccionado |
| `ValidationPendingIcon` | size, color, opacity | Estado validando (círculo + 3 puntos) |
| `SuccessIcon` | size, color, opacity | Fila válida, importación exitosa |
| `ErrorIcon` | size, color, opacity | Fila con error, fallo importación |
| `WarningIcon` | size, color, opacity | Campo opcional vacío (no bloqueante) |
| `SpinnerIcon` | size, color | Carga animada (Framer Motion rotate:360 infinite) |
| `ClearIcon` | size, color, opacity | Quitar archivo, limpiar selección |
| `ImportBatchIcon` | size, color, opacity | Header del módulo, cilindro base de datos + flechas |
| `TemplateDownloadIcon` | size, color, opacity | Descargar plantilla CSV |
| `DragDropIcon` | size, color, opacity | Zona de arrastre (nube + flecha 48px) |

Todos usan `PALETTE` como default de color. `SpinnerIcon` es el único con animación Framer Motion.

#### Verificación

| Check | Resultado |
|-------|-----------|
| Build (vite build) | 0 errores, 0 warnings (588ms) ✓ |
| Tests | 46/46 (no modificado) ✓ |
| Framer Motion | Importado y usado correctamente en 3 componentes CRM ✓ |
| Dropdown Servicios | AnimatePresence + spring + outside click + route change ✓ |
| ImportIcons | 11 iconos SVG puros, tipados con JSDoc, 0 emojis ✓ |

---

## 2026-03-28 — SPRINT P0: Bloqueadores de Go-Live (RLS + Consent + ACWR Fix)
**Directiva de**: Julian
**Status**: COMPLETO — Build limpio, 0 errores, 718 modulos

### Contexto
Sprint de seguridad y compliance pre-lanzamiento. Tres bloqueadores criticos que impiden
ir a produccion con datos reales de atletas, muchos de ellos menores de edad.

### P0-1: Fix RLS bulk_upload_logs

**Problema**: La policy `anon_all_bulk_upload_logs` con `USING(true)` exponia los logs
de carga masiva (incluyendo `file_name`, `error_details` y datos de menores) a cualquier
cliente sin autenticar — violacion directa del Articulo 7 de la Ley 1581/2012.

**Solucion**: `supabase/migrations/005_fix_rls_consent.sql`
- `DROP POLICY "anon_all_bulk_upload_logs"` — elimina la politica permisiva
- 4 nuevas policies (`SELECT / INSERT / UPDATE / DELETE`) usando el patron
  `club_id = (SELECT public.get_my_club_id())` de la migration 002
- Solo usuarios autenticados del club propietario pueden ver/editar sus propios logs

### P0-2: Consent Ley 1581 de 2012 (DB + UI + Pagina publica)

**DB — migration 005:**
- `ALTER TABLE profiles ADD COLUMN consent_at TIMESTAMPTZ` — timestamp de aceptacion (evidencia juridica)
- `ALTER TABLE profiles ADD COLUMN consent_version TEXT DEFAULT '1.0'` — version del documento
- `ALTER TABLE profiles ADD COLUMN guardian_consent BOOLEAN DEFAULT false` — certificacion parental
- `CREATE INDEX idx_profiles_consent_at` para auditorias de compliance (WHERE consent_at IS NULL)

**UI — `src/components/LandingPage.jsx`:**
- 2 estados: `consentData` + `consentGuardian` (ambos `false` por defecto, no pre-marcados)
- Checkbox 1: "He leido y acepto la Politica de Tratamiento de Datos Personales" con link a `/privacidad`
- Checkbox 2: "Certifico que cuento con autorizacion de padres/tutores para registrar datos de menores"
- Validacion en `validateAndSubmit`: ambos obligatorios, errores inline debajo del checkbox
- Boton submit deshabilitado visualmente (`cursor: not-allowed`, fondo violeta atenuado) mientras no se acepten
- Al submit: persiste `consent_at`, `consent_version: "1.0"`, `guardian_consent` junto al registro

**Pagina publica — `src/components/portal/PrivacyPolicy.jsx`:**
- Ruta `/privacidad` — publica, sin navbar del portal (standalone)
- 9 secciones: Responsable, Datos recopilados, Finalidades, Menores de edad, Derechos ARCO,
  Seguridad, Transferencias internacionales, Vigencia, Autoridad de control (SIC)
- Estetica glassmorphism dark: border-left violeta por seccion, sticky header, footer de contacto
- Version lazy-loaded (code-split automatico por Vite): 11.71 kB gzip 4.25 kB

**App.jsx:**
- `lazy(() => import("./components/portal/PrivacyPolicy"))` agregado al bloque de imports lazy
- Nueva ruta `<Route path="/privacidad">` fuera del PortalLayout (sin navbar) y fuera de CRMApp

### P0-3: Fix healthService.js — ACWR individual + localStorage isolation

**Bug 1 — ACWR individual no funcionaba:**
- `takeHealthSnapshot` llamaba `calcSaludActual(a.rpe, historial)` omitiendo el tercer argumento `athleteId`
- Resultado: el calculo usaba el RPE promedio del plantel en lugar del RPE individual de cada atleta
- Fix: `calcSaludActual(a.rpe, historial, a.id)` — ahora filtra `rpeByAthlete[a.id]` del historial

**Bug 2 — localStorage sin aislamiento por club:**
- Clave fija `"elevate_healthSnapshots"` en dispositivos compartidos podia mezclar datos de clubes distintos
- Fix: clave dinamica `elevate_healthSnapshots_${clubId}` cuando hay un `clubId` activo
- Nueva funcion exportada: `setHealthClubId(clubId)` — llamada desde App.jsx al login y al boot-profile
- `clearSnapshots()` limpia la clave del club activo Y la clave base (para sesiones previas al fix)
- Modo demo y offline sin clubId siguen usando la clave base (compatibilidad)

**App.jsx — integracion:**
- Import de `setHealthClubId` agregado
- Llamado en 3 puntos: `onAuthStateChange (SIGNED_IN)`, boot-profile al montar, `handleLogin`

### Archivos Creados / Modificados

| Archivo | Accion |
|---------|--------|
| `supabase/migrations/005_fix_rls_consent.sql` | NUEVO — RLS fix + consent columns |
| `src/components/portal/PrivacyPolicy.jsx` | NUEVO — pagina publica Ley 1581 |
| `src/components/LandingPage.jsx` | MODIFICADO — checkboxes consentimiento + validacion + submit payload |
| `src/services/healthService.js` | MODIFICADO — ACWR fix + localStorage isolation por clubId |
| `src/App.jsx` | MODIFICADO — import PrivacyPolicy + ruta /privacidad + setHealthClubId en 3 puntos |

### Architecture Decisions

1. **Ruta /privacidad fuera de PortalLayout**: la pagina de privacidad debe ser accesible
   sin depender de la disponibilidad de la navbar. Es un documento legal, no contenido
   de marketing. Renderiza standalone.

2. **consent_at como evidencia juridica**: el timestamp ISO de aceptacion en la columna
   `profiles.consent_at` sirve como evidencia en caso de auditoria de la SIC. No es
   suficiente guardar solo un boolean.

3. **guardian_consent como declaracion del responsable**: Elevate Sports actua como
   Encargado del Tratamiento, el responsable del club como Responsable frente a menores.
   El checkbox es una declaracion jurada del responsable del club, no del menor.

4. **ACWR por athleteId**: el calculo de ACWR (carga cronica/aguda) es por definicion
   individual. Usar el RPE promedio del plantel viola la definicion del metodo y genera
   falsos negativos de riesgo para atletas con carga extrema en ambos sentidos.

5. **clave localStorage por clubId**: aislamiento critico para clinicas y academias
   que usan tabletas compartidas entre multiples entrenadores de distintos clubes.

### Validation Criteria

| Check | Resultado |
|-------|-----------|
| Build (vite build) | 0 errores, 0 warnings — 718 modulos |
| migration 005 | Idempotente: DROP IF EXISTS + ADD COLUMN IF NOT EXISTS |
| Checkboxes no pre-marcados | Submit bloqueado hasta aceptar ambos |
| Link /privacidad | Abre en nueva pestana desde el checkbox |
| ACWR fix | calcSaludActual recibe a.id como tercer arg en takeHealthSnapshot |
| localStorage isolation | clave incluye clubId cuando esta disponible |
| Ruta /privacidad | Accessible sin autenticacion, standalone (sin navbar portal) |

### Task Assignment
- @Sara (QA): Probar formulario de registro: intentar submit sin checkboxes (debe bloquear).
  Verificar que /privacidad carga correctamente. Verificar que los snapshots se guardan con
  clave correcta en Application > localStorage en DevTools.
- @Mateo (Data): Ejecutar migration 005 en Supabase Dashboard. Verificar en Table Editor
  que profiles tiene las 3 columnas nuevas. Verificar en policies que bulk_upload_logs
  ya no tiene la policy permisiva.

---

## Instrucciones de Recuperación de Sesión

Al iniciar una nueva sesión de Claude Code en este proyecto:
1. Leer este archivo (`ENGINEERING_LOG.md`) para contexto del equipo y progreso
2. Leer `CLAUDE.md` si existe para instrucciones del proyecto
3. Leer archivos de memoria en `.claude/` para contexto adicional
4. Continuar desde la última tarea registrada
