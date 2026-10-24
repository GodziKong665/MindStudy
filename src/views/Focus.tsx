import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
} from 'lucide-react'
import { actions, useAppState } from '../lib/store'
import { durationsFor, modeById, TIMER_MODES } from '../lib/timer-modes'
import { useFocusTimer } from '../hooks/useFocusTimer'
import { RingTimer } from '../components/RingTimer'
import { FocusOverlay } from '../components/FocusOverlay'
import { AmbientControls } from '../components/AmbientControls'
import { Card, Field, ProgressBar, Segmented, ViewHead } from '../components/ui'
import { formatClock, formatDuration, todayISO } from '../lib/date'
import { ambientEngine } from '../audio/ambient'

export function FocusView() {
  const { timer, sessions } = useAppState()
  const [immersive, setImmersive] = useState(false)
  const [justLogged, setJustLogged] = useState<number | null>(null)

  const { focusMin, breakMin } = durationsFor(
    timer.modeId,
    timer.customFocusMin,
    timer.customBreakMin,
  )
  const mode = modeById(timer.modeId)

  const timerState = useFocusTimer({
    focusMinutes: focusMin,
    breakMinutes: breakMin,
    onFocusComplete: (minutes) => {
      actions.addSession(minutes, timer.modeId)
      setJustLogged(minutes)
    },
    onChime: () => ambientEngine.chime(),
  })

  const { toggle } = timerState

  /* ------------------------- Capa inmersiva ------------------------- */

  const enterImmersive = useCallback(async () => {
    setImmersive(true)
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.()
      }
    } catch {
      // Sin permiso o sin soporte: la capa igual cubre el viewport entero.
    }
  }, [])

  const leaveImmersive = useCallback(() => {
    setImmersive(false)
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {
        /* el navegador ya salió */
      })
    }
  }, [])

  /**
   * Si el navegador sale de pantalla completa por su cuenta (su propio Esc),
   * sincronizamos: la capa se cierra y quedamos en el enfoque normal.
   */
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setImmersive(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  /**
   * Esc cierra SOLO la capa inmersiva. En el enfoque normal no hace nada: para
   * salir de la sección está el menú. Nadie queda expulsado por accidente.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (immersive) {
          event.preventDefault()
          leaveImmersive()
        }
        return
      }
      if (event.code === 'Space') {
        const target = event.target as HTMLElement | null
        const typing =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        if (typing) return
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [immersive, leaveImmersive, toggle])

  useEffect(() => {
    if (justLogged === null) return
    const id = window.setTimeout(() => setJustLogged(null), 4500)
    return () => window.clearTimeout(id)
  }, [justLogged])

  /* --------------------------- Datos de hoy --------------------------- */

  const today = todayISO()
  const todaySessions = useMemo(
    () => sessions.filter((session) => session.completedAt.slice(0, 10) === today),
    [sessions, today],
  )
  const todayMinutes = todaySessions.reduce((acc, session) => acc + session.minutes, 0)
  const goalMinutes = 120
  const goalPct = Math.min(100, (todayMinutes / goalMinutes) * 100)

  const isFocus = timerState.phase === 'focus'

  return (
    <>
      <ViewHead
        eyebrow="Temporizador de enfoque"
        title="Un bloque a la vez."
        body="Elegí un modo y poné play. Cuando quieras que el resto del mundo desaparezca, entrá a pantalla completa: Esc te devuelve acá, sin salir de la sección."
        action={
          <button type="button" onClick={() => void enterImmersive()} className="btn btn-outline">
            <Maximize2 className="size-4" />
            Pantalla completa
          </button>
        }
      />

      <div className="row">
        {/* ------------------------------ Timer ----------------------------- */}
        <Card className="col-12 col-lg-7 flex flex-col items-center justify-center gap-6 px-6 py-8">
          <Segmented
            options={TIMER_MODES.map((m) => ({ id: m.id, label: m.label, hint: m.blurb }))}
            value={timer.modeId}
            onChange={(id) => actions.setTimer({ modeId: id })}
          />

          <RingTimer progress={timerState.progress} size={252} stroke={9} tone={isFocus ? 'primary' : 'grow'}>
            <span className="num text-[3.1rem] font-light leading-none tracking-tight text-ink">
              {formatClock(timerState.remaining)}
            </span>
            <span className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ink-3">
              {isFocus ? 'enfoque' : 'pausa'}
            </span>
          </RingTimer>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={timerState.toggle} className="btn btn-primary px-5 py-2.5">
              {timerState.running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {timerState.running
                ? 'Pausar'
                : timerState.remaining === timerState.total
                  ? 'Empezar'
                  : 'Continuar'}
            </button>
            <button
              type="button"
              onClick={timerState.skip}
              className="btn btn-ghost"
              aria-label="Pasar a la fase siguiente"
              title="Saltar fase"
            >
              <SkipForward className="size-4" />
            </button>
            <button
              type="button"
              onClick={timerState.reset}
              className="btn btn-ghost"
              aria-label="Reiniciar el bloque"
              title="Reiniciar"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                className={
                  index < timerState.cycles ? 'size-1.5 rounded-full bg-primary' : 'size-1.5 rounded-full bg-line-strong'
                }
              />
            ))}
            <span className="ml-1 text-[0.6875rem] text-ink-3">
              {timerState.cycles === 0
                ? `${focusMin} / ${breakMin} min`
                : `${timerState.cycles} ${timerState.cycles === 1 ? 'ciclo' : 'ciclos'}`}
            </span>
          </div>

          {justLogged !== null && (
            <div className="flex items-center gap-2 rounded-sm bg-grow-soft px-3 py-1.5 text-xs font-medium text-grow-text animate-rise">
              <CheckCircle2 className="size-3.5" />
              Bloque de {justLogged} min registrado
            </div>
          )}

          {timer.modeId === 'custom' && (
            <div className="grid w-full max-w-xs grid-cols-2 gap-3">
              <Field label="Foco (min)">
                <input
                  className="field num"
                  type="number"
                  min={5}
                  max={180}
                  value={timer.customFocusMin}
                  onChange={(event) =>
                    actions.setTimer({ customFocusMin: Number(event.target.value) || 5 })
                  }
                />
              </Field>
              <Field label="Pausa (min)">
                <input
                  className="field num"
                  type="number"
                  min={1}
                  max={60}
                  value={timer.customBreakMin}
                  onChange={(event) =>
                    actions.setTimer({ customBreakMin: Number(event.target.value) || 1 })
                  }
                />
              </Field>
            </div>
          )}
        </Card>

        {/* ----------------------------- Sidebar ---------------------------- */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-5">
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-[0.9375rem] font-semibold text-ink">Sonido ambiental</h3>
              <span className="text-[0.625rem] text-ink-3">sintetizado, sin archivos</span>
            </div>
            <AmbientControls variant="panel" />
          </Card>

          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[0.9375rem] font-semibold text-ink">Hoy</h3>
              <span className="num text-xs text-ink-2">
                {formatDuration(todayMinutes)} / {formatDuration(goalMinutes)}
              </span>
            </div>
            <ProgressBar value={goalPct} tone="grow" label="Progreso de foco de hoy" />
            <div className="mt-4 flex flex-col gap-2">
              {todaySessions.length === 0 ? (
                <p className="text-xs leading-relaxed text-ink-3">
                  Todavía sin sesiones. El primer bloque es el que cuesta: arrancá con 25 minutos.
                </p>
              ) : (
                todaySessions
                  .slice(-4)
                  .reverse()
                  .map((session) => (
                    <div key={session.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-ink-2">
                        <Sparkles className="size-3 text-grow-text" />
                        {modeById(session.modeId).label}
                      </span>
                      <span className="num text-ink-3">
                        {new Date(session.completedAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {session.minutes} min
                      </span>
                    </div>
                  ))
              )}
            </div>
          </Card>

          <Card className="bg-surface-3">
            <p className="text-xs leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">{mode.label}:</span> {mode.blurb}
            </p>
          </Card>
        </div>
      </div>

      {immersive && (
        <FocusOverlay
          phase={timerState.phase}
          remaining={timerState.remaining}
          progress={timerState.progress}
          running={timerState.running}
          cycles={timerState.cycles}
          modeLabel={mode.label}
          onToggle={timerState.toggle}
          onSkip={timerState.skip}
          onReset={timerState.reset}
          onClose={leaveImmersive}
        />
      )}
    </>
  )
}
