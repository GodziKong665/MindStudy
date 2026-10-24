import { ViewHead } from '../components/ui'

/**
 * La vista sólo aporta el marco: el formulario lo construye y lo controla
 * `src/forms/contact-form.ts` con JavaScript nativo, fuera de React.
 */
export function ContactView() {
  return (
    <div className="animate-rise">
      <ViewHead
        eyebrow="Contacto"
        title="Decinos qué falta."
        body="MindStudy se construye escuchando a quien lo usa. Contanos qué te sirvió, qué te frustró o qué te gustaría ver."
      />

      <div className="row">
        <div className="col-12 col-lg-8">
          <div id="contacto-form" />
        </div>

        <div className="col-12 col-lg-4">
          <div className="card bg-surface-3 p-5">
            <p className="eyebrow">Cómo funciona</p>
            <ul className="mt-3 d-flex flex-column gap-2 text-xs leading-relaxed text-ink-2">
              <li>El formulario se valida en el navegador antes de enviarse.</li>
              <li>Los campos obligatorios se marcan en cuanto salís de ellos.</li>
              <li>El mensaje se guarda localmente: no viaja a ningún servidor.</li>
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-ink-3">
              Implementado en JavaScript nativo: selección de elementos, escucha
              de eventos, intercepción del envío y validación dinámica del DOM.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
