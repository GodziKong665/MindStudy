# Seguridad de MindStudy

MindStudy es una **SPA sin backend**: se compila a archivos estáticos (`dist/`) y todo el estado del usuario vive en `localStorage`. Eso reduce la superficie de ataque de forma real, pero no la elimina — la mueve de lugar.

Este documento describe qué se está protegiendo, qué se delega al hosting y qué queda como riesgo aceptado.

## Modelo de amenazas

| Activo | Dónde vive | Quién podría robarlo |
|---|---|---|
| Tareas, tarjetas, sesiones, capturas | `localStorage` del navegador | Cualquier script que corra en el origen (XSS o dependencia comprometida) |
| Tokens de Spotify (si se configura) | `localStorage` | Lo mismo, y además habilita controlar la reproducción del usuario |
| Nada del lado servidor | — | No hay servidor, no hay base de datos, no hay secretos |

**La consecuencia importante:** en una SPA el perímetro no es la red, es **el bundle**. Todo lo que se ejecuta en la página tiene acceso completo a esos datos. Por eso la cadena de dependencias es el vector principal, por encima del DDoS.

## Lo que resuelve el hosting

Deployar en Cloudflare Pages, Netlify o Vercel da, sin configurar nada:

- CDN global y absorción de DDoS volumétrico
- TLS automático y renovación de certificados
- Rollback a un deploy anterior
- Assets servidos desde el borde

**El DDoS deja de ser un problema que resuelvas vos.** No hay nada que "configurar" ahí.

## Lo que sí es responsabilidad tuya

### 1. Cabeceras HTTP

Están en [`public/_headers`](../public/_headers). Vite las copia a `dist/`.

Activas: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `HSTS`, `COOP`, `CORP`.

La **CSP va en `Report-Only` a propósito**. Una CSP mal calibrada rompe la aplicación entera, y eso no se puede verificar desde el repositorio: hay que mirar la consola del navegador en el sitio desplegado. Cuando confirmes que no hay violaciones, renombrá la cabecera quitándole el sufijo `-Report-Only`.

> GitHub Pages **ignora** `_headers`. Ahí no se pueden fijar cabeceras de respuesta; si ese es el destino, hay que poner un proxy delante.

### 2. Cadena de suministro

El riesgo más subestimado de un sitio "estático":

```bash
npm audit
npm ls --depth=0     # ¿reconocés todas las dependencias?
```

Reglas:

- **Commiteá `package-lock.json`.** Sin lockfile, cada build puede traer versiones distintas.
- Cuidado con el `^` en las versiones: permite actualizaciones menores automáticas, que es exactamente donde se cuelan los compromisos de paquetes.
- Antes de agregar una dependencia, preguntate si podés escribirlo en 50 líneas. El motor de audio son ~400 líneas propias y reemplaza a cualquier librería de sonido.
- Dependabot o Renovate para revisar actualizaciones, no para aplicarlas a ciegas.

### 3. Nunca metas secretos en el bundle

Todo lo que empieza con `VITE_` **se incrusta en el JavaScript público**. Es legible por cualquiera con F12.

Por eso la integración con Spotify usa **PKCE y no client secret**: en una SPA no existe forma de guardar un secreto. Si algún día escribís `VITE_SPOTIFY_CLIENT_SECRET`, lo estás publicando.

### 4. Dominio y DNS

| Medida | Dónde |
|---|---|
| 2FA en el registrador | Casi nadie la activa, y es el ataque más rentable |
| Registrar lock / transfer lock | Panel del registrador |
| DNSSEC | Panel del registrador o del proveedor de DNS |
| Alertas de vencimiento | El dominio vence y alguien lo compra el mismo día |

El secuestro de DNS no se defiende con código: se defiende en el panel del registrador.

## Riesgos aceptados (documentados, no olvidados)

| Riesgo | Por qué se acepta | Cuándo revisarlo |
|---|---|---|
| Datos en `localStorage` sin cifrar | No hay backend que custodie una clave; cifrar en el cliente con una clave también en el cliente no aporta seguridad real | Si se agrega sincronización |
| `style-src 'unsafe-inline'` | React emite atributos `style` en varios componentes; sin esto el layout se rompe | Si se migra a CSS Modules en todo |
| Fuentes desde Google Fonts | Un tercero en la carga; puede inferir tráfico | Autoalojar las fuentes elimina el problema |
| Sin rate limiting | No hay API propia que abusar | Si aparece cualquier endpoint |
| Contenido de usuario renderizado | React escapa por defecto; **no usar `dangerouslySetInnerHTML`** | Siempre |

## El disparador que cambia todo

Este documento deja de aplicar el día que se agregue **cualquiera** de estos:

- Supabase, Firebase o cualquier base de datos
- Sincronización entre dispositivos
- Login propio
- Cualquier endpoint de servidor

En ese momento aparecen autenticación, autorización por fila (RLS), validación de entrada del lado servidor y rate limiting. Y el riesgo deja de ser "el bundle" para pasar a ser "la base de datos".
