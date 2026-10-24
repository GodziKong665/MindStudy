import { useCallback, useEffect, useRef, useState } from 'react'

export type Phase = 'focus' | 'break'

interface Options {
  focusMinutes: number
  breakMinutes: number
  onFocusComplete: (minutes: number) => void
  onChime: () => void
}

/**
 * Countdown driven by an absolute deadline instead of a decrementing counter.
 * Background tabs throttle timers aggressively, so `remaining - 1` per tick
 * silently loses seconds. Recomputing from `deadline - Date.now()` cannot drift.
 */
export function useFocusTimer({ focusMinutes, breakMinutes, onFocusComplete, onChime }: Options) {
  const [phase, setPhase] = useState<Phase>('focus')
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(() => focusMinutes * 60)
  const [cycles, setCycles] = useState(0)

  const deadlineRef = useRef<number | null>(null)
  const phaseRef = useRef<Phase>('focus')
  const focusCallback = useRef(onFocusComplete)
  const chimeCallback = useRef(onChime)

  useEffect(() => {
    focusCallback.current = onFocusComplete
  }, [onFocusComplete])

  useEffect(() => {
    chimeCallback.current = onChime
  }, [onChime])

  const phaseSeconds = useCallback(
    (target: Phase) => (target === 'focus' ? focusMinutes : breakMinutes) * 60,
    [focusMinutes, breakMinutes],
  )

  const reset = useCallback(() => {
    setRunning(false)
    setPhase('focus')
    phaseRef.current = 'focus'
    setRemaining(focusMinutes * 60)
    deadlineRef.current = null
  }, [focusMinutes])

  // Switching mode restarts the clock at the new mode's duration.
  useEffect(() => {
    reset()
  }, [reset])

  const start = useCallback(() => {
    if (running) return
    deadlineRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }, [running, remaining])

  const pause = useCallback(() => {
    if (deadlineRef.current) {
      setRemaining(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)))
      deadlineRef.current = null
    }
    setRunning(false)
  }, [])

  const toggle = useCallback(() => {
    if (running) pause()
    else start()
  }, [running, pause, start])

  /** Move to the next phase without crediting a session (an early bail-out). */
  const skip = useCallback(() => {
    const next: Phase = phaseRef.current === 'focus' ? 'break' : 'focus'
    phaseRef.current = next
    setPhase(next)
    setRemaining(phaseSeconds(next))
    deadlineRef.current = null
    setRunning(false)
  }, [phaseSeconds])

  useEffect(() => {
    if (!running) return

    const id = window.setInterval(() => {
      const deadline = deadlineRef.current
      if (!deadline) return

      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left > 0) return

      chimeCallback.current()

      if (phaseRef.current === 'focus') {
        focusCallback.current(focusMinutes)
        setCycles((c) => c + 1)
        const breakSeconds = breakMinutes * 60
        phaseRef.current = 'break'
        setPhase('break')
        setRemaining(breakSeconds)
        // The break starts on its own — resting should never need a click.
        deadlineRef.current = Date.now() + breakSeconds * 1000
      } else {
        const focusSeconds = focusMinutes * 60
        phaseRef.current = 'focus'
        setPhase('focus')
        setRemaining(focusSeconds)
        deadlineRef.current = null
        setRunning(false)
      }
    }, 250)

    return () => window.clearInterval(id)
  }, [running, focusMinutes, breakMinutes])

  const total = phaseSeconds(phase)
  const progress = total === 0 ? 0 : 1 - remaining / total

  return { phase, running, remaining, total, progress, cycles, start, pause, toggle, skip, reset }
}
