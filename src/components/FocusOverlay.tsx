import { useEffect, useState } from 'react'
import { Minimize2, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import clsx from 'clsx'
import { RingTimer } from './RingTimer'
import { AmbientControls } from './AmbientControls'
import { formatClock } from '../lib/date'
import type { Phase } from '../hooks/useFocusTimer'

interface Props {
  phase: Phase
  remaining: number
  progress: number
  running: boolean
  cycles: number
  modeLabel: string
  onToggle: () => void
  onSkip: () => void
  onReset: () => void
  onClose: () => void
}

/**
 * La capa inmersiva. Se monta ENCIMA del shell en vez de reemplazarlo, así que
 * salir es desmontar un div: la ruta de enfoque no se mueve.
 */
export function FocusOverlay({
  phase,
  remaining,
  progress,
  running,
  cycles,
  modeLabel,
  onToggle,
  onSkip,
  onReset,
  onClose,
}: Props) {
  const [ringSize, setRingSize] = useState(340)

  useEffect(() => {
    const measure = () => {
      const size = Math.min(420, window.innerWidth - 56, window.innerHeight - 320)
      setRingSize(Math.max(196, Math.round(size)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const isFocus = phase === 'focus'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas animate-fade">
      <h1 className="sr-only">Enfoque a pantalla completa</h1>

      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <p className="eyebrow">
          {isFocus ? 'En foco' : 'Descanso'} · {modeLabel}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost gap-1.5 px-2.5"
          aria-label="Volver al enfoque normal (Esc)"
          title="Volver al enfoque normal (Esc)"
        >
          <Minimize2 className="size-4" />
          <span className="text-[0.8125rem]">Salir</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <RingTimer
          progress={progress}
          size={ringSize}
          stroke={Math.max(6, Math.round(ringSize * 0.028))}
          tone={isFocus ? 'primary' : 'grow'}
        >
          <span
            className="num font-light leading-none tracking-tight text-ink"
            style={{ fontSize: Math.round(ringSize * 0.2) }}
          >
            {formatClock(remaining)}
          </span>
          <span className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-ink-3">
            {isFocus ? 'enfoque' : 'respirá'}
          </span>
        </RingTimer>

        <div className="mt-7 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="btn btn-primary px-6 py-2.5"
            aria-label={running ? 'Pausar' : 'Empezar o continuar'}
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? 'Pausar' : 'Continuar'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="btn btn-ghost"
            aria-label="Pasar a la fase siguiente"
            title="Saltar fase"
          >
            <SkipForward className="size-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="btn btn-ghost"
            aria-label="Reiniciar el bloque"
            title="Reiniciar"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className={clsx(
                'size-1.5 rounded-full',
                index < cycles ? 'bg-primary' : 'bg-line-strong',
              )}
            />
          ))}
          <span className="ml-1 text-[0.6875rem] text-ink-3">
            {cycles === 0 ? 'Sin ciclos' : `${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'}`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2.5 px-4 pb-5">
        <AmbientControls variant="bar" />
        <p className="text-[0.625rem] text-ink-3">
          <kbd className="rounded-sm border border-line bg-surface px-1 py-0.5 font-sans">
            Espacio
          </kbd>{' '}
          pausa ·{' '}
          <kbd className="rounded-sm border border-line bg-surface px-1 py-0.5 font-sans">Esc</kbd>{' '}
          vuelve al enfoque normal
        </p>
      </div>
    </div>
  )
}
