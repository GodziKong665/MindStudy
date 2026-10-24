/**
 * Formulario de contacto en JavaScript nativo.
 *
 * Deliberadamente FUERA de React: la rúbrica pide selección con querySelector,
 * escucha de eventos con addEventListener, intercepción del envío con
 * preventDefault, conmutación de clases con classList y retroalimentación
 * generada dinámicamente en el DOM. Todo eso es exactamente lo que React hace
 * por vos y por eso no puede demostrarse con React.
 *
 * Los envíos se guardan en localStorage: el sitio no tiene backend.
 */

const STORAGE_KEY = 'mindstudy:mensajes:v1'

interface Mensaje {
  nombre: string
  email: string
  motivo: string
  institucion: string
  mensaje: string
  fecha: string
}

const PLANTILLA = `
<form novalidate class="card p-5 sm:p-6">
  <div class="row row-gap-4">
    <div class="col-12 col-md-6">
      <label class="d-flex flex-column gap-1.5" for="cf-nombre">
        <span class="text-xs font-medium text-ink-2">Nombre</span>
        <input id="cf-nombre" name="nombre" type="text" required minlength="2"
          data-field="nombre" class="field" placeholder="Cómo te llamás" autocomplete="name" />
      </label>
      <p class="field-error" data-error="nombre"></p>
    </div>

    <div class="col-12 col-md-6">
      <label class="d-flex flex-column gap-1.5" for="cf-email">
        <span class="text-xs font-medium text-ink-2">Correo</span>
        <input id="cf-email" name="email" type="email" required
          data-field="email" class="field" placeholder="vos@ejemplo.com" autocomplete="email" />
      </label>
      <p class="field-error" data-error="email"></p>
    </div>

    <div class="col-12 col-md-6">
      <label class="d-flex flex-column gap-1.5" for="cf-motivo">
        <span class="text-xs font-medium text-ink-2">Motivo</span>
        <select id="cf-motivo" name="motivo" required data-field="motivo" class="field">
          <option value="">Elegí una opción</option>
          <option value="sugerencia">Sugerencia</option>
          <option value="error">Reportar un error</option>
          <option value="contenido">Pedir contenido</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <p class="field-error" data-error="motivo"></p>
    </div>

    <div class="col-12 col-md-6">
      <label class="d-flex flex-column gap-1.5" for="cf-institucion">
        <span class="text-xs font-medium text-ink-2">Institución <span class="text-ink-3">(opcional)</span></span>
        <input id="cf-institucion" name="institucion" type="text"
          data-field="institucion" class="field" placeholder="Colegio, facultad, curso" />
      </label>
      <p class="field-error" data-error="institucion"></p>
    </div>

    <div class="col-12">
      <label class="d-flex flex-column gap-1.5" for="cf-mensaje">
        <span class="text-xs font-medium text-ink-2">Mensaje</span>
        <textarea id="cf-mensaje" name="mensaje" rows="5" required minlength="20"
          data-field="mensaje" class="field" placeholder="Contame qué te gustaría ver o qué no funcionó"></textarea>
      </label>
      <div class="d-flex justify-content-between">
        <p class="field-error" data-error="mensaje"></p>
        <p class="mt-1.5 text-[0.625rem] text-ink-3"><span data-counter>0</span> / 20 caracteres mínimos</p>
      </div>
    </div>

    <div class="col-12">
      <label class="d-flex align-items-center gap-2 text-xs text-ink-2" for="cf-acepto">
        <input id="cf-acepto" name="acepto" type="checkbox" required data-field="acepto" />
        Acepto que este mensaje se guarde localmente en mi navegador.
      </label>
      <p class="field-error" data-error="acepto"></p>
    </div>
  </div>

  <div class="mt-5 d-flex flex-wrap align-items-center gap-3">
    <button type="submit" class="btn btn-primary">Enviar mensaje</button>
    <button type="reset" class="btn btn-ghost">Limpiar</button>
    <p id="cf-status" class="text-xs text-ink-3" role="status" aria-live="polite"></p>
  </div>
</form>

<div id="cf-exito" class="card mt-4 p-5" hidden>
  <p class="text-sm font-semibold text-grow-text">Mensaje guardado</p>
  <p class="mt-1 text-xs leading-relaxed text-ink-2" data-resumen></p>
  <button type="button" class="btn btn-outline mt-4" data-reiniciar>Escribir otro</button>
</div>
`

type Campo = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function leerMensajes(): Mensaje[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as Mensaje[]) : []
  } catch {
    return []
  }
}

function guardarMensaje(mensaje: Mensaje): void {
  const todos = leerMensajes()
  todos.push(mensaje)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {
    /* modo privado o cuota llena: el mensaje no se persiste, pero no rompe */
  }
}

/** Devuelve el mensaje de error, o null si el campo es válido. */
function validar(campo: Campo): string | null {
  const nombre = campo.dataset.field ?? ''
  const valor = campo instanceof HTMLInputElement && campo.type === 'checkbox'
    ? (campo.checked ? 'si' : '')
    : campo.value.trim()

  if (campo.hasAttribute('required') && !valor) {
    return nombre === 'acepto'
      ? 'Necesitamos tu confirmación para guardar el mensaje.'
      : 'Este campo es obligatorio.'
  }
  if (nombre === 'nombre' && valor.length > 0 && valor.length < 2) {
    return 'Usá al menos 2 caracteres.'
  }
  if (nombre === 'email' && valor && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor)) {
    return 'Ese correo no parece válido.'
  }
  if (nombre === 'mensaje' && valor.length > 0 && valor.length < 20) {
    return `Faltan ${20 - valor.length} caracteres para el mínimo.`
  }
  return null
}

export function mountContactForm(): void {
  const host = document.getElementById('contacto-form')
  if (host) {
    inicializar(host)
    return
  }

  // La vista la monta React: esperamos a que el contenedor exista.
  const observador = new MutationObserver(() => {
    const contenedor = document.getElementById('contacto-form')
    if (!contenedor) return
    observador.disconnect()
    inicializar(contenedor)
  })
  observador.observe(document.body, { childList: true, subtree: true })
}

function inicializar(host: HTMLElement): void {
  if (host.dataset.montado === 'true') return
  host.dataset.montado = 'true'
  host.innerHTML = PLANTILLA

  const form = host.querySelector('form')
  const exito = host.querySelector<HTMLElement>('#cf-exito')
  const estado = host.querySelector<HTMLElement>('#cf-status')
  const contador = host.querySelector<HTMLElement>('[data-counter]')
  const resumen = host.querySelector<HTMLElement>('[data-resumen]')
  if (!form || !exito || !estado || !contador || !resumen) return

  const campos = Array.from(
    host.querySelectorAll<Campo>('[data-field]'),
  )
  const errores = Array.from(host.querySelectorAll<HTMLElement>('[data-error]'))
  const textarea = host.querySelector<HTMLTextAreaElement>('#cf-mensaje')

  const mostrarError = (campo: Campo, texto: string | null): void => {
    const nombre = campo.dataset.field ?? ''
    const parrafo = errores.find((p) => p.dataset.error === nombre)
    campo.classList.toggle('has-error', Boolean(texto))
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false')
    if (!parrafo) return
    parrafo.textContent = texto ?? ''
    parrafo.classList.toggle('is-visible', Boolean(texto))
  }

  const limpiarTodo = (): void => {
    campos.forEach((campo) => mostrarError(campo, null))
    estado.textContent = ''
    exito.hidden = true
    if (contador) contador.textContent = '0'
  }

  // Validación en vivo al salir del campo: solo molesta cuando ya escribiste.
  campos.forEach((campo) => {
    campo.addEventListener('blur', () => mostrarError(campo, validar(campo)))
    campo.addEventListener('input', () => {
      if (campo.classList.contains('has-error')) mostrarError(campo, validar(campo))
    })
  })

  // Contador de caracteres en tiempo real.
  textarea?.addEventListener('input', () => {
    contador.textContent = String(textarea.value.trim().length)
  })

  form.addEventListener('submit', (evento) => {
    evento.preventDefault()

    const invalidos: Campo[] = []
    campos.forEach((campo) => {
      const error = validar(campo)
      mostrarError(campo, error)
      if (error) invalidos.push(campo)
    })

    if (invalidos.length > 0) {
      estado.textContent = 'Revisá los campos marcados.'
      estado.classList.add('text-primary-text')
      invalidos[0].focus()
      return
    }

    const datos = new FormData(form)
    const mensaje: Mensaje = {
      nombre: String(datos.get('nombre') ?? ''),
      email: String(datos.get('email') ?? ''),
      motivo: String(datos.get('motivo') ?? ''),
      institucion: String(datos.get('institucion') ?? ''),
      mensaje: String(datos.get('mensaje') ?? ''),
      fecha: new Date().toISOString(),
    }

    guardarMensaje(mensaje)

    estado.textContent = ''
    estado.classList.remove('text-primary-text')
    form.classList.add('opacity-60')
    exito.hidden = false
    resumen.textContent = `Gracias ${mensaje.nombre}. Registramos tu ${mensaje.motivo} con fecha ${new Date(mensaje.fecha).toLocaleDateString('es-AR')}.`
    exito.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  })

  form.addEventListener('reset', () => {
    window.setTimeout(limpiarTodo, 0)
  })

  host.querySelector<HTMLButtonElement>('[data-reiniciar]')?.addEventListener('click', () => {
    exito.hidden = true
    form.classList.remove('opacity-60')
    form.reset()
    limpiarTodo()
    campos[0]?.focus()
  })
}
