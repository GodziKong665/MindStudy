import type { TimerModeId } from './types'

export interface TimerMode {
  id: TimerModeId
  label: string
  focusMin: number
  breakMin: number
  blurb: string
}

export const TIMER_MODES: TimerMode[] = [
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    focusMin: 25,
    breakMin: 5,
    blurb: '25 min de foco, 5 de pausa. El clásico para arrancar.',
  },
  {
    id: 'deep',
    label: 'Deep Work',
    focusMin: 50,
    breakMin: 10,
    blurb: '50 min seguidos, 10 de pausa. Para material que pide inmersión.',
  },
  {
    id: 'custom',
    label: 'A medida',
    focusMin: 30,
    breakMin: 8,
    blurb: 'Definí tus propios bloques según tu energía de hoy.',
  },
]

export function modeById(id: TimerModeId): TimerMode {
  return TIMER_MODES.find((mode) => mode.id === id) ?? TIMER_MODES[0]
}

export function durationsFor(
  modeId: TimerModeId,
  customFocus: number,
  customBreak: number,
): { focusMin: number; breakMin: number } {
  if (modeId === 'custom') {
    return {
      focusMin: Math.min(180, Math.max(5, customFocus)),
      breakMin: Math.min(60, Math.max(1, customBreak)),
    }
  }
  const mode = modeById(modeId)
  return { focusMin: mode.focusMin, breakMin: mode.breakMin }
}
