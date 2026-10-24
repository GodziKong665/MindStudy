import clsx from 'clsx'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { QUICK_IDS, SOUNDSCAPES, ambientEngine } from '../audio/ambient'
import { actions, useAppState } from '../lib/store'

const QUICK = SOUNDSCAPES.filter((sound) => QUICK_IDS.includes(sound.id))

/**
 * One control, two densities: the quiet strip for the immersive view and the
 * full panel for the normal one. Same behaviour, same engine.
 */
export function AmbientControls({ variant = 'panel' }: { variant?: 'panel' | 'bar' }) {
  const { timer } = useAppState()
  const playing = ambientEngine.preset

  const toggle = (id: string) => {
    ambientEngine.setVolume(timer.volume)
    ambientEngine.toggle(id)
    // El motor no vive en React: se fuerza el re-render vía el store.
    actions.setTimer({ ambientId: ambientEngine.preset })
  }

  const volume = (
    <div className={clsx('flex items-center gap-2', variant === 'panel' && 'mt-3')}>
      {timer.volume === 0 ? (
        <VolumeX className="size-3.5 shrink-0 text-ink-3" />
      ) : (
        <Volume2 className="size-3.5 shrink-0 text-ink-3" />
      )}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(timer.volume * 100)}
        onChange={(event) => {
          const next = Number(event.target.value) / 100
          actions.setTimer({ volume: next })
          ambientEngine.setVolume(next)
        }}
        aria-label="Volumen del sonido ambiental"
        className={clsx(
          'cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--ms-primary)]',
          variant === 'panel' ? 'h-1 w-full' : 'h-1 w-24',
        )}
      />
      {variant === 'panel' && (
        <span className="num w-7 shrink-0 text-right text-[0.6875rem] text-ink-3">
          {Math.round(timer.volume * 100)}
        </span>
      )}
    </div>
  )

  if (variant === 'bar') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 opacity-55 transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
        {QUICK.map((preset) => {
          const active = playing === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => toggle(preset.id)}
              aria-pressed={active}
              title={preset.hint}
              className={clsx(
                'flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[0.6875rem] font-medium transition-colors',
                active
                  ? 'border-primary-ring bg-primary-soft text-primary-text'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong',
              )}
            >
              {active ? <Pause className="size-2.5" /> : <Play className="size-2.5" />}
              {preset.name}
            </button>
          )
        })}
        <span className="mx-1 h-4 w-px bg-line" />
        {volume}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK.map((preset) => {
          const active = playing === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => toggle(preset.id)}
              aria-pressed={active}
              className={clsx(
                'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors duration-200',
                active
                  ? 'border-primary-ring bg-primary-soft'
                  : 'border-line bg-surface-3 hover:border-line-strong hover:bg-surface-2',
              )}
            >
              <span
                className={clsx(
                  'grid size-6 shrink-0 place-items-center rounded-sm',
                  active ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-ink-2',
                )}
              >
                {active ? <Pause className="size-3" /> : <Play className="size-3" />}
              </span>
              <span className="min-w-0">
                <span
                  className={clsx(
                    'block truncate text-[0.8125rem] font-medium',
                    active ? 'text-primary-text' : 'text-ink',
                  )}
                >
                  {preset.name}
                </span>
                <span className="block truncate text-[0.625rem] text-ink-3">{preset.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
      {volume}
    </div>
  )
}
