import { useState } from 'react'
import { ArrowRight, Inbox, Trash2 } from 'lucide-react'
import { actions, useAppState } from '../lib/store'
import { Card } from './ui'

/**
 * Brain dump: the lowest-friction input in the app. One field, Enter to save,
 * no categorising at capture time. Sorting is a later concern, not this one.
 */
export function BrainDump() {
  const { captures } = useAppState()
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim()) return
    actions.addCapture(draft)
    setDraft('')
  }

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="size-4 text-ink-3" />
          <h3 className="text-sm font-semibold text-ink">Brain dump</h3>
        </div>
        {captures.length > 0 && (
          <span className="num rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] text-ink-2">
            {captures.length}
          </span>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <input
          className="field"
          placeholder="Soltá lo que te está dando vueltas…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Nueva captura rápida"
        />
      </form>

      <div className="mt-3 flex flex-col gap-1.5">
        {captures.length === 0 ? (
          <p className="py-2 text-xs leading-relaxed text-ink-3">
            Tu memoria de trabajo tiene límite. Descargá la idea acá y volvé al foco: la
            procesás después.
          </p>
        ) : (
          captures.slice(0, 5).map((capture) => (
            <div
              key={capture.id}
              className="group flex items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-surface-2"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-spark" />
              <span className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">
                {capture.text}
              </span>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => actions.promoteCapture(capture.id)}
                  className="rounded p-1 text-ink-3 hover:bg-grow-soft hover:text-grow-text"
                  title="Convertir en tarea"
                  aria-label={`Convertir "${capture.text}" en tarea`}
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => actions.removeCapture(capture.id)}
                  className="rounded p-1 text-ink-3 hover:bg-surface-3 hover:text-ink"
                  title="Descartar"
                  aria-label={`Descartar "${capture.text}"`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
