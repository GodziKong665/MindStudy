# MindStudy

**En vivo:** https://godzikong665.github.io/MindStudy/

App de concentración y productividad académica: temporizador de enfoque, planificador con time-blocking, calculadora de carga de estudio, tarjetas con repetición espaciada y un jardín que crece con tus bloques de foco.

Sin backend. Todo el estado vive en tu navegador (`localStorage`), así que abre sin cuenta y sin latencia.

## Arrancar

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | `tsc --noEmit` + build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run typecheck` | Solo el chequeo de tipos |
| `npm run test` | Suite de Vitest (50 tests) |

## Atajos

| Tecla | Dónde | Acción |
|---|---|---|
| `Space` | Enfoque / repaso | Pausar o revelar respuesta |
| `Esc` | Enfoque en pantalla completa | Volver al enfoque normal |
| `1`–`4` | Repaso de tarjetas | Calificar la tarjeta |
| `←` `→` `Enter` | Historia | Navegar escenas |
| `Esc` | Historia | Saltar al dashboard |

## Música

La sección **Música** (`#/music`) tiene 16 paisajes sintetizados en tiempo real con Web Audio API:

- **12 de ambiente**: lluvia, lluvia fuerte, ruido marrón, ruido rosa, olas, viento, chimenea, grillos, café, ventilador, cascada, noche.
- **4 generativas**: piano nocturno, cuencos, deriva y cueva. Estas no reproducen una pista guardada — sintetizan notas al azar sobre una escala, así que nunca suenan igual dos veces.

### La imagen del gato

Guardá tu imagen como **`public/gato.jpg`**. Aparece sola. Si el archivo no existe, la app usa una ilustración vectorial de respaldo, así que no se rompe nada.

### Conectar Spotify (opcional)

MindStudy funciona completo sin Spotify. Para habilitar el login:

1. Creá una app en [developer.spotify.com](https://developer.spotify.com/dashboard) y copiá el **Client ID**.
2. Registrá `http://127.0.0.1:5173/` como **Redirect URI** (tiene que coincidir exacto).
3. Creá un archivo `.env.local` en la raíz:

```bash
VITE_SPOTIFY_CLIENT_ID=tu_client_id_aqui
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
```

4. Reiniciá `npm run dev`.

Sin Client ID la sección muestra **sólo** los cuatro accesos directos: no hay advertencias ni instrucciones dentro de la app, porque ese espacio está pensado para descansar la vista. Los pasos de arriba son la única documentación.

**Límites que impone Spotify y no se pueden sortear:**

| Restricción | Valor |
|---|---|
| Usuarios en modo desarrollo | **5**, agregados a mano por email |
| Premium del dueño de la app | **Obligatorio** |
| Acceso público | Sólo organizaciones con **≥250k MAU** |
| Reproducir dentro de la app | Requiere **Premium** en cada usuario |
| `GET /me` desde feb-2026 | Ya no devuelve `email` ni `product` |

Por eso la app nunca depende de Spotify: el botón de silencio, los 15 paisajes y el camino de "abrir en tu Spotify" funcionan para cualquier cuenta, gratis o Premium.

## Documentación

- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — paletas con HEX, contraste WCAG, regla 60-30-10, arquitectura, sitemap y decisiones técnicas.
- [`SECURITY.md`](SECURITY.md) — modelo de amenazas de una SPA sin backend, cabeceras, cadena de suministro y riesgos aceptados.
- [`odd/tasks/mindstudy-app.md`](odd/tasks/mindstudy-app.md) — especificaciones y registro de ejecución.

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 · Vitest

## Notas de implementación

- **La primera visita abre la historia.** Cuatro escenas (origen, por qué existe, cómo funciona, empezar) con "Empezar" y "Saltar". Queda persistida en `introSeen` y se puede volver a ver desde "La historia", al pie del sidebar.
- **La identidad visual es un archivo.** Papel, tinta, rojo de sello, oliva y mostaza viven en `src/index.css` como tokens semánticos. Ningún componente conoce un color: por eso cambiar toda la piel no tocó ni una línea de los 6 módulos.
- **Sin archivos de audio.** Los cuatro paisajes ambientales (lluvia, ruido marrón, café, olas) se sintetizan con Web Audio API: cero peso de red y loops sin costura.
- **El timer no deriva.** La cuenta regresiva se calcula contra un deadline absoluto, no decrementando un contador. Cambiar de pestaña no le roba segundos.
- **Una sola fuente de verdad.** XP, nivel, racha, estadísticas y jardín se derivan de `sessions`. No hay contadores paralelos que se puedan desincronizar.
- **`legacy/`** contiene la v1 estática original (HTML/CSS/JS con el flip clock), conservada intacta como referencia.

## Riesgo

`Risk: item 1 (persistencia local versionada: un cambio de shape en el estado descarta datos previos en vez de migrarlos)` — hoy es aceptable porque no hay datos de producción. Antes de un release público, escribir migraciones reales en `src/lib/storage.ts`.
