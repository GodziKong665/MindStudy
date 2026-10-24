import { useState } from 'react'
import { Pause, Play, Shuffle, Sparkles, Square, Volume2, VolumeX } from 'lucide-react'
import clsx from 'clsx'
import { actions, useAppState } from '../lib/store'
import { SOUNDSCAPES, ambientEngine, byFamily, soundscapeById } from '../audio/ambient'
import { CatScene } from '../components/CatScene'
import { SpotifyPanel } from '../components/SpotifyPanel'
import { Card, SectionHead, ViewHead } from '../components/ui'

function SoundButton({
  id,
  name,
  hint,
  active,
  onToggle,
}: {
  id: string
  name: string
  hint: string
  active: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-pressed={active}
      className={clsx(
        'group flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors duration-200',
        active
          ? 'border-primary-ring bg-primary-soft'
          : 'border-line bg-surface-3 hover:border-line-strong hover:bg-surface-2',
      )}
    >
      <span
        className={clsx(
          'grid size-7 shrink-0 place-items-center rounded-sm',
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
          {name}
        </span>
        <span className="block truncate text-[0.625rem] text-ink-3">{hint}</span>
      </span>
    </button>
  )
}

export function MusicView() {
  const { timer } = useAppState()
  const [showAll, setShowAll] = useState(false)

  // El motor no vive en React: el store es el que dispara el re-render.
  const playing = ambientEngine.preset
  const current = playing ? soundscapeById(playing) : null

  const toggle = (id: string) => {
    ambientEngine.setVolume(timer.volume)
    ambientEngine.toggle(id)
    actions.setTimer({ ambientId: ambientEngine.preset })
  }

  const stop = () => {
    ambientEngine.stop()
    actions.setTimer({ ambientId: null })
  }

  const surprise = () => {
    const pool = SOUNDSCAPES.filter((sound) => sound.id !== playing)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    ambientEngine.setVolume(timer.volume)
    ambientEngine.play(pick.id)
    actions.setTimer({ ambientId: pick.id })
  }

  const ambient = byFamily('ambiente')
  const generative = byFamily('generativa')
  const visibleAmbient = showAll ? ambient : ambient.slice(0, 8)

  return (
    <div className="animate-rise">
      <ViewHead
        eyebrow="Música"
        title="El rincón del gato."
        body="Quince paisajes sonoros sintetizados en tiempo real. Los de la derecha abajo son generativos: no hay pista guardada, cada nota se crea al momento y nunca vuelve a sonar igual."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={surprise} className="btn btn-outline">
              <Shuffle className="size-4" />
              Sorpréndeme
            </button>
            <button type="button" onClick={stop} disabled={!playing} className="btn btn-ghost">
              <Square className="size-3.5" />
              Silencio
            </button>
          </div>
        }
      />

      <div className="row">
        {/* ---------------------------- El gato ----------------------------- */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          <CatScene playing={Boolean(playing)} />

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{playing ? 'Sonando ahora' : 'En silencio'}</p>
                <p className="mt-1 truncate text-[0.9375rem] font-semibold text-ink">
                  {current ? current.name : 'Elegí un paisaje'}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-3">
                  {current ? current.hint : 'El gato espera con los auriculares puestos'}
                </p>
              </div>
              {current && (
                <span className="mt-1 flex shrink-0 items-end gap-0.5" aria-hidden>
                  {[0, 1, 2, 3].map((bar) => (
                    <span
                      key={bar}
                      className="w-[3px] rounded-full bg-primary"
                      style={{
                        height: 5 + (bar % 3) * 5,
                        animation: `breathe ${760 + bar * 180}ms ease-in-out infinite`,
                      }}
                    />
                  ))}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              {timer.volume === 0 ? (
                <VolumeX className="size-4 shrink-0 text-ink-3" />
              ) : (
                <Volume2 className="size-4 shrink-0 text-ink-3" />
              )}
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(timer.volume * 100)}
                onChange={(event) => {
                  const volume = Number(event.target.value) / 100
                  actions.setTimer({ volume })
                  ambientEngine.setVolume(volume)
                }}
                aria-label="Volumen de la música"
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--ms-primary)]"
              />
              <span className="num w-7 shrink-0 text-right text-[0.6875rem] text-ink-3">
                {Math.round(timer.volume * 100)}
              </span>
            </div>
          </Card>
        </div>

        {/* --------------------------- Biblioteca --------------------------- */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-5">
          <Card>
            <SectionHead
              title="Ambiente"
              subtitle="Ruido filtrado. Constante, predecible, sin melodía que te distraiga."
              action={
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="btn btn-ghost text-xs"
                >
                  {showAll ? 'Ver menos' : `Ver todo (${ambient.length})`}
                </button>
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleAmbient.map((sound) => (
                <SoundButton
                  key={sound.id}
                  id={sound.id}
                  name={sound.name}
                  hint={sound.hint}
                  active={playing === sound.id}
                  onToggle={toggle}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionHead
              title="Generativa"
              subtitle="Notas creadas al momento sobre una escala. Nunca repiten."
              action={
                <span className="flex items-center gap-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-spark-text">
                  <Sparkles className="size-3" />
                  infinita
                </span>
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {generative.map((sound) => (
                <SoundButton
                  key={sound.id}
                  id={sound.id}
                  name={sound.name}
                  hint={sound.hint}
                  active={playing === sound.id}
                  onToggle={toggle}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <SpotifyPanel />
      </div>
    </div>
  )
}
