import { todayISO } from './date'
import type { AppState, StudyPlanInput } from './types'

const KEY = 'mindstudy:v2'
const VERSION = 2

export function defaultStudyPlan(): StudyPlanInput {
  return {
    examDate: '',
    dailyMinutes: 120,
    topics: [],
  }
}

function preferredTheme(): AppState['theme'] {
  if (typeof window === 'undefined') return 'dark'
  if (typeof window.matchMedia !== 'function') return 'dark'
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function defaultState(): AppState {
  return {
    version: VERSION,
    theme: preferredTheme(),
    introSeen: false,
    timer: {
      modeId: 'pomodoro',
      customFocusMin: 30,
      customBreakMin: 8,
      ambientId: null,
      volume: 0.5,
    },
    sessions: [],
    tasks: [],
    captures: [],
    decks: [],
    studyPlan: { ...defaultStudyPlan(), examDate: '' },
  }
}

export function loadState(): AppState {
  if (typeof localStorage === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed || parsed.version !== VERSION) return migrate(parsed)
    return { ...defaultState(), ...parsed }
  } catch {
    return defaultState()
  }
}

/**
 * Unknown or older shapes are discarded rather than half-trusted: a corrupt
 * localStorage entry must never be able to crash the app on boot.
 */
function migrate(_old: Partial<AppState> | undefined): AppState {
  return defaultState()
}

export function saveState(state: AppState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or private mode — the app keeps working in memory.
  }
}

/** Demo content, loaded explicitly by the user from an empty state. */
export function demoState(): Partial<AppState> {
  const today = todayISO()
  return {
    tasks: [
      {
        id: 'demo-1',
        title: 'Repasar fotosíntesis para el parcial',
        estimateMin: 50,
        done: false,
        quadrant: 'plan',
        slotKey: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-2',
        title: 'Entregar TP de estadística',
        estimateMin: 90,
        done: false,
        quadrant: 'do',
        slotKey: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-3',
        title: 'Ordenar apuntes de la semana',
        estimateMin: 20,
        done: false,
        quadrant: 'plan',
        slotKey: null,
        createdAt: new Date().toISOString(),
      },
    ],
    captures: [
      {
        id: 'demo-c1',
        text: 'Preguntarle a la profe por la fórmula del delta G',
        createdAt: new Date().toISOString(),
      },
    ],
    decks: [
      {
        id: 'demo-deck',
        name: 'Biología celular',
        cards: [
          {
            id: 'demo-card-1',
            front: '¿Qué organela produce ATP?',
            back: 'La mitocondria, mediante respiración celular.',
            ease: 2.5,
            interval: 0,
            repetitions: 0,
            due: today,
          },
          {
            id: 'demo-card-2',
            front: '¿Qué hace el ribosoma?',
            back: 'Sintetiza proteínas traduciendo el ARNm.',
            ease: 2.5,
            interval: 0,
            repetitions: 0,
            due: today,
          },
          {
            id: 'demo-card-3',
            front: '¿Dónde ocurre la fotosíntesis?',
            back: 'En los cloroplastos de las células vegetales.',
            ease: 2.5,
            interval: 0,
            repetitions: 0,
            due: today,
          },
        ],
      },
    ],
  }
}
