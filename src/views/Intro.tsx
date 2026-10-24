import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import clsx from 'clsx'

interface Scene {
  eyebrow: string
  lines: string[]
  paragraphs: string[]
  steps?: { title: string; body: string }[]
}

const SCENES: Scene[] = [
  {
    eyebrow: '01 — El origen',
    lines: ['Seis horas sentado.', 'Cuarenta minutos', 'de estudio real.'],
    paragraphs: [
      'Eso nos pasó a todos. Abrís los apuntes, respondés tres mensajes, ordenás la biblioteca de turno y cuando te querés acordar el día se fue sin que nada entre a la cabeza.',
      'No era falta de voluntad. Era falta de estructura.',
    ],
  },
  {
    eyebrow: '02 — Por qué existe',
    lines: ['No necesitabas', 'otra app.', 'Necesitabas menos', 'decisiones.'],
    paragraphs: [
      'Cada pestaña abierta y cada «¿por dónde arranco?» consumen la misma energía que necesitás para entender.',
      'MindStudy existe para sacar esa fricción del medio: una pantalla, una decisión, un bloque a la vez.',
    ],
  },
  {
    eyebrow: '03 — Cómo funciona',
    lines: ['Tres gestos.', 'Nada más.'],
    paragraphs: [],
    steps: [
      {
        title: 'Elegís un bloque',
        body: 'Pomodoro de 25/5 o Deep Work de 50/10. El anillo no decora: es lo único que mirás.',
      },
      {
        title: 'Volcás lo que te da vueltas',
        body: 'La matriz de Eisenhower lo ordena por urgencia e importancia, y lo arrastrás a una hora real del día.',
      },
      {
        title: 'Al cerrar, algo crece',
        body: 'Jardín, racha y experiencia salen de la misma sesión. No hay números que puedan mentir.',
      },
    ],
  },
  {
    eyebrow: '04 — Empezar',
    lines: ['Tu primer bloque', 'son 25 minutos.'],
    paragraphs: [
      'No hace falta configurar nada. Ordená el resto después.',
      'Y si algo se te escapa, esta historia queda siempre a un clic: está al pie del menú.',
    ],
  },
]

export function Intro({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const scene = SCENES[step]
  const isLast = step === SCENES.length - 1

  const next = useCallback(() => {
    if (isLast) onFinish()
    else setStep((current) => Math.min(SCENES.length - 1, current + 1))
  }, [isLast, onFinish])

  const back = useCallback(() => {
    setStep((current) => Math.max(0, current - 1))
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        next()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        onFinish()
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [next, back, onFinish])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      {/* Halo de tinta detrás del titular: reemplaza al gradiente de producto. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] opacity-70"
        style={{
          background:
            'radial-gradient(60% 55% at 22% 18%, var(--ms-primary-soft) 0%, transparent 72%)',
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-7 sm:px-10 sm:py-9">
        {/* ------------------------------ Barra ----------------------------- */}
        <header className="flex items-center justify-between">
          <span className="display text-[1.05rem] leading-none text-ink">
            MindStudy
            <span className="ml-1.5 inline-block size-1.5 translate-y-[-3px] rounded-full bg-primary" />
          </span>
          <div className="flex items-center gap-4">
            <span className="num text-[0.6875rem] tracking-[0.16em] text-ink-3">
              {String(step + 1).padStart(2, '0')} / {String(SCENES.length).padStart(2, '0')}
            </span>
            <button type="button" onClick={onFinish} className="btn btn-ghost px-2 text-xs">
              Saltar
            </button>
          </div>
        </header>

        {/* ------------------------------ Escena ---------------------------- */}
        <main className="flex flex-1 items-center py-10 sm:py-14">
          <div key={step} className="w-full">
            <p className="eyebrow animate-fade">{scene.eyebrow}</p>

            <h1 className="display mt-5 text-[2.6rem] text-ink sm:text-[3.6rem]">
              {scene.lines.map((line, index) => (
                <span
                  key={line}
                  className="animate-line block"
                  style={{ animationDelay: `${90 + index * 110}ms` }}
                >
                  {line}
                </span>
              ))}
            </h1>

            {scene.paragraphs.length > 0 && (
              <div className="mt-7 max-w-xl border-l-2 border-primary pl-5">
                {scene.paragraphs.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className="animate-line text-[0.9375rem] leading-[1.75] text-ink-2 [&+&]:mt-3.5"
                    style={{ animationDelay: `${260 + index * 120}ms` }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {scene.steps && (
              <ol className="mt-8 max-w-xl">
                {scene.steps.map((item, index) => (
                  <li
                    key={item.title}
                    className="animate-line flex gap-4 border-t border-line py-4 first:border-t-0 first:pt-0"
                    style={{ animationDelay: `${240 + index * 130}ms` }}
                  >
                    <span className="display num mt-0.5 w-6 shrink-0 text-[1.35rem] leading-none text-primary">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-[0.9375rem] font-semibold text-ink">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[0.875rem] leading-relaxed text-ink-2">
                        {item.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </main>

        {/* ------------------------------ Pie ------------------------------- */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Paso de la historia">
            {SCENES.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                role="tab"
                aria-selected={index === step}
                aria-label={`Ir a ${item.eyebrow}`}
                onClick={() => setStep(index)}
                className={clsx(
                  'h-1 rounded-full transition-all duration-300',
                  index === step ? 'w-8 bg-primary' : 'w-4 bg-line-strong hover:bg-ink-3',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="btn btn-ghost"
            >
              <ArrowLeft className="size-4" />
              Atrás
            </button>

            {isLast ? (
              <button type="button" onClick={onFinish} className="btn btn-primary px-5 py-2.5">
                <Check className="size-4" />
                Empezar
              </button>
            ) : (
              <button type="button" onClick={next} className="btn btn-primary px-5 py-2.5">
                Siguiente
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
