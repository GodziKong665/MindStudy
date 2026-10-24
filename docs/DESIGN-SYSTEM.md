# MindStudy — Sistema de diseño y arquitectura

MindStudy es una app de foco académico en React 18 + TypeScript + Tailwind CSS v4. Este documento es la fuente de verdad del sistema visual y de las decisiones de arquitectura: si algo acá contradice al código, el código está mal.

**La idea en una línea:** una libreta de estudio, no un dashboard. El material es papel cálido y tinta, no gradientes y sombras.

## Camino rápido

1. `npm install` → `npm run dev` → `http://localhost:5173`.
2. La primera pantalla es **la historia**, en cuatro escenas. "Empezar" abre el dashboard; "Saltar" entra directo.
3. Probá el toggle de tema al pie del sidebar: es otra paleta, no un filtro invertido.
4. `npm run typecheck && npm run test && npm run build` para confirmar el estado.

---

## 1. Paletas de color

### 1.1 Modo claro — "Papel y tinta"

| Token | HEX | Rol | Uso en la interfaz |
|---|---|---|---|
| `canvas` | `#F2ECE0` | Papel de fondo | Superficie base de toda la app |
| `surface` | `#FBF7EE` | Hoja elevada | Cards, sidebar, barra móvil |
| `surface-2` | `#E7DFCE` | Papel hundido | Segmentados, tracks, marcas de agua |
| `surface-3` | `#F7F1E4` | Papel de entrada | Zonas de drop, bloques vacíos |
| `line` | `#DCD2BD` | Filete fino | Separadores, bordes de card |
| `line-strong` | `#C3B69B` | Filete marcado | Bordes de botón y de campo |
| `ink` | `#2A2419` | Tinta | Títulos, cuerpo, cifras |
| `ink-2` | `#5C5342` | Tinta corrida | Subtítulos, descripciones |
| `ink-3` | `#8A7F6B` | Tinta diluida | Metadatos, `eyebrow`, placeholders |
| `primary` | `#7B2D33` | Rojo de sello | Anillo de foco, acción principal, numerales |
| `primary-hover` | `#6A252B` | Presión | Acción principal en hover |
| `primary-active` | `#5A1E24` | Hundido | Acción principal presionada |
| `primary-soft` | `#F3E3E0` | Tinte de sello | Nav activa, halo de la intro |
| `primary-soft-2` | `#E9D0CA` | Tinte medio | Barras de chart inactivas, selección |
| `primary-fg` | `#FDF8F0` | Papel sobre sello | Etiqueta de botón principal |
| `primary-text` | `#7B2D33` | Rojo legible como texto | Links, nav activa, cifras |
| `primary-ring` | `#A8565B` | Anillo de foco | `:focus-visible` |
| `grow` | `#4C6338` | Verde oliva | Progreso, confirmación, follaje |
| `grow-hover` | `#3F5330` | Presión | Confirmación en hover |
| `grow-soft` | `#E6EBD9` | Tinte de oliva | Chip de logro, fondo de repaso |
| `grow-text` | `#3D5230` | Oliva legible como texto | Cifras de progreso |
| `spark` | `#B8862B` | Mostaza | Racha, aviso, recompensa |
| `spark-hover` | `#A2761F` | Presión | Aviso en hover |
| `spark-soft` | `#F4E9D2` | Tinte de mostaza | Fondo de aviso, chip de racha |
| `spark-fg` | `#2A2419` | Tinta sobre mostaza | Etiqueta de badge |
| `spark-text` | `#7D5A13` | Mostaza legible como texto | Cifras de racha, avisos |

### 1.2 Modo oscuro — "Estudio de noche"

No es una inversión. Un rojo saturado sobre negro puro **vibra** y produce fatiga; por eso el fondo es carbón cálido (no azul-negro), la tinta se aclara a marfil y el rojo sube de luminosidad sin subir de saturación.

| Token | HEX | Rol | Nota de diseño |
|---|---|---|---|
| `canvas` | `#17140F` | Carbón cálido | Subtono marrón, no gris |
| `surface` | `#201B14` | Hoja elevada | Cards |
| `surface-2` | `#2A2318` | Papel hundido | Tracks, badges |
| `surface-3` | `#342C1F` | Papel de entrada | Inputs, zonas de drop |
| `line` | `#3B3325` | Filete fino | — |
| `line-strong` | `#524733` | Filete marcado | — |
| `ink` | `#ECE4D5` | Marfil | Nunca blanco puro: deslumbra |
| `ink-2` | `#B6AA94` | Tinta corrida | — |
| `ink-3` | `#857965` | Tinta diluida | — |
| `primary` | `#A8444B` | Rojo levantado | Mantiene saturación baja |
| `primary-hover` | `#B8545B` | Presión | Sube luminosidad, no saturación |
| `primary-active` | `#8F373E` | Hundido | — |
| `primary-soft` | `#2D1B1A` | Tinte de sello | Nav activa |
| `primary-soft-2` | `#3F2422` | Tinte medio | Barras de chart inactivas |
| `primary-fg` | `#FDF8F0` | Papel sobre sello | — |
| `primary-text` | `#E29AA0` | Rojo legible como texto | El rojo del claro no sirve acá |
| `primary-ring` | `#C47076` | Anillo de foco | — |
| `grow` | `#5E7A45` | Oliva | — |
| `grow-hover` | `#6B8A4F` | Presión | — |
| `grow-soft` | `#1E2617` | Tinte de oliva | Verde oscurecido, no opacidad |
| `grow-text` | `#A9C48C` | Oliva legible como texto | — |
| `spark` | `#C2963C` | Mostaza | — |
| `spark-hover` | `#D4A74A` | Presión | — |
| `spark-soft` | `#2A2214` | Tinte de mostaza | — |
| `spark-fg` | `#17140F` | Carbón sobre mostaza | — |
| `spark-text` | `#E0BE72` | Mostaza legible como texto | — |

### 1.3 Contraste verificado (WCAG 2.1)

Ratios calculados sobre luminancia relativa sRGB. AA exige 4.5:1 en cuerpo y 3:1 en texto grande.

| Par | Claro | Oscuro | Veredicto |
|---|---|---|---|
| `ink` sobre `canvas` | 13.1:1 | 14.5:1 | AAA |
| `ink-2` sobre `canvas` | 6.4:1 | 8.0:1 | AA |
| `ink-3` sobre `canvas` | 3.4:1 | 3.6:1 | Solo ≥18px o metadatos no esenciales |
| `primary-fg` sobre `primary` | 8.8:1 | 5.5:1 | AAA / AA |
| `primary-text` sobre `surface` | 8.7:1 | 8.2:1 | AAA |
| `grow-fg` sobre `grow` | 6.2:1 | 4.5:1 | AA |
| `grow-text` sobre `canvas` | 7.3:1 | 9.6:1 | AAA |
| `spark-fg` sobre `spark` | 4.8:1 | 6.8:1 | AA |
| `spark-text` sobre `canvas` | 5.3:1 | 10.3:1 | AA / AAA |

**Regla dura:** `ink-3` nunca se usa para información necesaria para decidir. Es decorativo o redundante.

### 1.4 Psicología del color aplicada

| Rol | Croma | Fundamento | Dónde se aplica |
|---|---|---|---|
| Primario | Rojo de tinta | Alta pregnancia con connotación de **corrección y anotación**, no de alarma: es el rojo con el que se subraya un apunte. Dirige la mirada sin activar estrés porque se usa en trazo fino, no en relleno | Anillo del timer, acción principal, numerales, foco de teclado |
| Secundario | Verde oliva | Crecimiento vegetal y calma; mucho menos estimulante que un verde semáforo, sostiene la metáfora del jardín | Progreso, rachas cumplidas, repaso |
| Acento | Mostaza | Alta saliencia, temperatura cálida: funciona como marcapáginas | Racha, advertencias, recompensa |
| Neutro | Papel cálido | Baja diferencia de contraste entre fondo y superficie para no fatigar en sesiones largas | Todo lo demás |

**Por qué el rojo funciona acá y no en un SaaS corporativo:** el rojo puro de interfaz (`#E5484D`) se lee como error o destrucción. `#7B2D33` es tinta de sello, y el resto del sistema es papel. El contexto cambia el significado.

---

## 2. Regla 60-30-10 aplicada

| Proporción | Rol | Tokens | Dónde se ve |
|---|---|---|---|
| **60%** | Papel | `canvas`, `surface`, `surface-2`, `line` | Fondo, cards, filetes, texto corrido |
| **30%** | Rojo de tinta | `primary`, `primary-soft`, `primary-text` | Anillo, acción principal, numerales, nav activa, halo de intro |
| **10%** | Oliva + mostaza | `grow-*` (≈7%), `spark-*` (≈3%) | Progreso, rachas, jardín, avisos |

### Cómo se mide

El rojo ocupa el 30% en **peso visual**, no en área pintada. Casi nunca rellena una superficie grande: son filetes de 2px, numerales, texto y el trazo del anillo. Si rellenara el 30% del área, la interfaz sería agresiva — y eso sería un error de aplicación, no del sistema.

En el **Dashboard** el papel domina sin discusión: cuatro cards de stats, el panel "Tu día", el chart y el brain dump son todos neutros. El rojo aparece en el botón principal, el numeral del nivel, la nav activa y las barras del chart.

### Las tres reglas que evitan que esto se degrade

1. **El rojo nunca rellena una card entera.** Botones, sí. Superficies grandes, no.
2. **El oliva no decora.** Si algo es verde, es porque progresó.
3. **Si dudás, es papel.** El default de todo elemento nuevo es `surface` + `line`.

---

## 3. Lenguaje editorial

| Decisión | Regla | Por qué |
|---|---|---|
| Tipografía de titular | **Fraunces** variable, solo desde 20px | Un serif con carácter. A tamaños chicos se vuelve caprichosa y cansa |
| Tipografía de interfaz | **Inter** | Densidad y legibilidad en controles, listas y formularios |
| Contraste de familias | Serif para decir, sans para operar | El gesto editorial es el contraste, no un solo tipo en todo |
| Radios | 1–6px (escala de Tailwind intervenida) | Una libreta no tiene esquinas infladas |
| Sombras | Ninguna. Se separa con filetes | La luz no se usa como jerarquía; la línea sí |
| Textura | Grano de papel inline (`feTurbulence`), 0 kB | Da material sin descargar una imagen |
| Filete doble | `.rule-double` bajo secciones clave | Heredado de la v1: es el gesto de cuaderno |

---

## 4. Arquitectura de funcionalidades

### 4.1 Principio rector: una sola fuente de verdad

Las sesiones de foco (`sessions`) son el **único** registro de actividad. XP, nivel, racha, estadísticas semanales y el jardín **se derivan** de ellas en tiempo de lectura (`src/lib/progress.ts`). No hay contadores paralelos que puedan desincronizarse.

```
Timer completado
      │
      ▼
actions.addSession(minutes, modeId)
      │
      ▼
sessions[]  ──►  xpFor()            ──►  nivel
            ──►  currentStreak()    ──►  racha
            ──►  minutesByDay()     ──►  chart semanal
            ──►  plantsFromSessions() ──►  jardín
```

### 4.2 Módulos

| Módulo | Qué hace | Entrada | Estado | Salida |
|---|---|---|---|---|
| **Historia** | Onboarding narrativo en 4 escenas | — | `introSeen` | Entrada al app |
| **Enfoque** | Temporizador con anillo, ciclos y sonido ambiental | Modo (25/5, 50/10, custom) | `timer` + `sessions` | Sesión registrada |
| **Planificador** | Tareas por Eisenhower, arrastradas a franjas horarias | Título, estimación, cuadrante | `tasks[]` con `slotKey` | Bloque del día |
| **Calculadora** | Distribuye la carga entre hoy y el examen | Fecha, temas, peso 1-5, minutos/día | `studyPlan` | Plan por día |
| **Tarjetas** | Repetición espaciada SM-2 simplificada | Frente/reverso + calificación | `decks[].cards[]` | Próximo vencimiento |
| **Jardín** | Estadísticas y espacio virtual de foco | — (derivado) | — | Plantas + métricas |
| **Brain dump** | Captura sin fricción y promoción a tarea | Texto libre | `captures[]` | Tarea |

### 4.3 Decisiones algorítmicas

| Algoritmo | Archivo | Regla | Por qué |
|---|---|---|---|
| Cuenta regresiva | `hooks/useFocusTimer.ts` | `remaining = deadline − Date.now()`, tick 250 ms | Restar 1 por tick pierde segundos cuando el navegador throttlea pestañas en background |
| Repetición espaciada | `lib/sm2.ts` | SM-2 con escala de 4 botones; `ease` con piso 1.3 | La escala 0-5 pide una calibración que nadie hace bien |
| Reparto de carga | `lib/study-plan.ts` | 75% repartido fino + 25% en la víspera | La práctica distribuida supera a la masiva. Si no entra, lo dice: `feasible: false` |
| Jardín | `lib/progress.ts` | Una planta por sesión; etapa por duración | La recompensa es proporcional al esfuerzo real, no al conteo de clics |
| Niveles | `lib/progress.ts` | Nivel 1 = 100 XP, cada uno cuesta 50 más | Curva lineal creciente: progreso temprano visible, sin estancamiento |

---

## 5. Estructura de la interfaz

### 5.1 Sitemap

```
MindStudy
├── Historia (intro, primera visita)
│   ├── 01 El origen
│   ├── 02 Por qué existe
│   ├── 03 Cómo funciona
│   └── 04 Empezar ──► Dashboard
├── Dashboard (#/dashboard)
│   ├── Saludo + fecha
│   ├── 4 stats: racha · foco hoy · nivel · tarjetas por repasar
│   ├── Tu día (tareas por Eisenhower)
│   ├── Progreso semanal
│   ├── Brain dump
│   └── Jardín (mini)
├── Enfoque (#/focus) — dos capas
│   ├── Normal: dentro del shell, con selector de modo, anillo, sonido y «Hoy»
│   ├── Pantalla completa: capa inmersiva sobre el shell + Fullscreen API
│   └── Esc cierra SOLO la capa inmersiva y vuelve al enfoque normal
├── Música (#/music) — el rincón del gato
│   ├── Escena del gato (imagen en `public/gato.png`, con respaldo vectorial)
│   ├── 12 ambientes de ruido filtrado
│   ├── 4 generativas que sintetizan notas al azar
│   └── Spotify (opt-in, requiere Client ID propio)
├── Planificador (#/planner)
│   ├── Alta de tarea
│   ├── Matriz Eisenhower 2×2
│   ├── Backlog
│   └── Grilla horaria 07:00–23:00
├── Calculadora (#/calculator)
│   ├── Inputs: examen, minutos/día, temas
│   └── Plan por día + aviso de déficit
├── Tarjetas (#/cards)
│   ├── Mazos
│   ├── Detalle de mazo
│   └── Sesión de repaso
└── Jardín (#/garden)
    ├── Stats acumuladas
    ├── Grilla de plantas
    ├── Chart semanal
    └── Historial
```

La historia se puede volver a ver desde **"La historia"**, al pie del sidebar. No vuelve a aparecer sola: `introSeen` queda persistido.

### 5.2 Flujo principal

```
Primera visita
   │
   ▼
Historia (4 escenas) ──"Saltar"──────────────────┐
   │                                             │
   └──"Empezar"──────────────────────────────────┤
                                                 ▼
                                            Dashboard
   ┌─────────────────────────────────────────────┤
   │  ¿qué hago ahora?                            │
   ├── "Tengo material que estudiar" ──► Planificador
   │        └── ¿no sé cuánto falta? ──► Calculadora ──► Planificador
   ├── "Ya sé qué estudiar" ──► Enfoque ──► [bloque] ──► Jardín
   ├── "Tengo algo en la cabeza" ──► Brain dump ──► tarea
   └── "Quiero retener" ──► Tarjetas ──► repaso del día
```

**Regla de un clic:** desde el Dashboard se alcanza cualquier módulo en un solo toque.

### 5.3 Distribución del Dashboard

```
┌────────────────────────────────────────────────────────────┐
│ Saludo + fecha                         [Empezar un bloque]  │
├────────────────────────────────────────────────────────────┤
│ Racha │ Foco hoy │ Nivel │ Tarjetas                          │  4 × 25%
├──────────────────────────────────┬─────────────────────────┤
│ Tu día                           │ Brain dump              │
│ (tareas, Eisenhower, check)      │ (captura rápida)        │  1.35fr
│                                  ├─────────────────────────┤  vs
│                                  │ Jardín (mini)           │  1fr
├──────────────────────────────────┤                         │
│ Progreso semanal (7 barras)      │                         │
└──────────────────────────────────┴─────────────────────────┘
```

| Zona | Peso | Decisión |
|---|---|---|
| Header | full | Saludo + **una sola** acción primaria |
| Stats | 4 columnas iguales | Cifras, no gráficos: se leen en 1 segundo |
| Columna izquierda | 1.35fr | El trabajo real |
| Columna derecha | 1fr | Baja fricción: descargar la cabeza, ver crecer algo |
| Móvil | 1 columna | Stats 2×2, después "Tu día" |

### 5.4 La intro como pieza de producto

Cuatro escenas, una idea por escena, avance manual (no auto-avance: robarle el ritmo al lector es exactamente lo que la app promete no hacer).

| Escena | Qué resuelve |
|---|---|
| 01 El origen | Nombra el problema con el que el estudiante se identifica |
| 02 Por qué existe | Explica la tesis: menos decisiones, no más funciones |
| 03 Cómo funciona | Responde "no sé ni por dónde empezar" en tres gestos |
| 04 Empezar | Baja la barrera: 25 minutos, cero configuración |

Navegación: `←` `→` `Enter` para avanzar, `Esc` para saltar. Puntos clicables. Contador `01 / 04`.

---

## 6. Tech stack

| Capa | Tecnología | Por qué esta y no la alternativa |
|---|---|---|
| Build | **Vite 6** | App de un usuario, offline-first, sin SSR. Next.js sumaría un servidor para HTML que nunca cambia |
| UI | **React 18** | El brief lo pedía; StrictMode detecta efectos impuros temprano |
| Lenguaje | **TypeScript strict** | Los tipos de `Flashcard` y `StudyPlan` son el contrato entre módulos |
| Estilos | **Tailwind v4** | Tokens en CSS (`@theme inline`), no en JS config. El tema cambia con una clase |
| Estado | **Store externo + `useSyncExternalStore`** | 60 líneas, cero dependencias, sobrevive a los cambios de ruta |
| Persistencia | **LocalStorage versionado** | Sin cuenta ni latencia. `mindstudy:v2` con `version`: un shape viejo se descarta entero |
| Audio | **Web Audio API** | 4 paisajes sintetizados = 0 kB, loop sin costura, sin licencias |
| Iconos | **lucide-react** | Tree-shakeable, trazo consistente |
| Tests | **Vitest + jsdom + Testing Library** | Corre sobre el pipeline de Vite |

### Cuándo migrar

| Disparador | Migración |
|---|---|
| Cuenta, sync entre dispositivos, compartir mazos | Supabase. `lib/storage.ts` es el único archivo que cambia |
| URL compartibles e indexables | Next.js App Router. `views/` se mueve casi sin tocar |
| El estado crece de 6 a 20 módulos | Zustand o Redux Toolkit |
| Notificaciones con la pestaña cerrada | Service Worker + Notification API |

**Lo que no hay que cambiar:** los tokens, los algoritmos de `lib/` y la forma del estado. Están diseñados para sobrevivir la migración.

### Estructura de carpetas

```
src/
├── main.tsx              # bootstrap + tema antes del primer paint
├── App.tsx               # gate de la intro + router + layout
├── index.css             # tokens duales + lenguaje editorial
├── audio/ambient.ts      # motor de sonido sintetizado
├── components/           # UI reutilizable
│   ├── ui.tsx            # Card, Stat, ProgressBar, Segmented, Chip, EmptyState
│   ├── AppShell.tsx      # sidebar + nav móvil + toggle de tema
│   ├── RingTimer.tsx     # anillo SVG
│   ├── FocusOverlay.tsx  # pantalla completa anti-distracciones
│   ├── PlantArt.tsx      # 5 especies × 4 etapas en SVG
│   └── …
├── hooks/useFocusTimer.ts
├── lib/
│   ├── types.ts          # contrato de dominio
│   ├── store.ts          # estado + acciones
│   ├── storage.ts        # persistencia versionada
│   ├── sm2.ts            # repetición espaciada
│   ├── study-plan.ts     # reparto de carga
│   ├── progress.ts       # selectores derivados
│   ├── eisenhower.ts     # cuadrantes + slots
│   └── __tests__/
└── views/
    ├── Intro.tsx         # historia de 4 escenas
    └── …                 # una vista por ruta
```

---

## 7. El contrato de tokens

Los componentes **nunca** hardcodean un color. Consumen tokens semánticos y la piel hace el resto.

```css
/* src/index.css */
@theme inline {
  --color-primary: var(--ms-primary);   /* el componente escribe bg-primary */
}
:root  { --ms-primary: #7B2D33; }        /* papel y tinta   */
.dark  { --ms-primary: #A8444B; }        /* estudio de noche */
```

```tsx
<button className="bg-primary text-primary-fg">Empezar</button>
```

**Este es el motivo por el que se pudo cambiar toda la identidad visual de azul a papel y tinta editando un archivo.** Los 6 módulos, los 4 componentes compartidos y las 20 vistas heredaron la piel sin tocar una línea.

**Verificación automatizada:** `grep` de hex o de rampas (`blue-500`) en `src/**/*.tsx` debe devolver cero. Hoy devuelve cero.

---

## 8. Checklist de aceptación

- [x] Dos paletas completas con HEX y rol asignado por token
- [x] Contraste AA verificado en texto de cuerpo, en ambas paletas
- [x] 60-30-10 medible en Dashboard y Enfoque
- [x] Intro narrativa de 4 escenas con "Empezar" y "Saltar"
- [x] La historia se puede revertir desde el sidebar
- [x] Temporizador 25/5, 50/10 y a medida, sin derivar en background
- [x] Sonido ambiental con reproductor (4 paisajes, 0 kB)
- [x] Pantalla completa anti-distracciones con `Esc` y `Space`
- [x] Planificador con Eisenhower y drag & drop a franjas horarias
- [x] Calculadora que informa el déficit en vez de mentir
- [x] Racha, XP, nivel, chart y jardín derivados de una sola fuente
- [x] Tarjetas con SM-2 y cola de repaso diaria
- [x] Brain dump con promoción a tarea
- [x] Identidad visual editorial: papel, tinta, Fraunces, filetes, sin sombras
- [x] `typecheck` limpio, 20 tests en verde, build de producción OK

## Próximo paso

Recorré la historia una vez, después entrá a `#/focus` y completá un bloque de 25 minutos. La racha, el XP y la primera planta aparecen solos. Ese es el circuito completo.
