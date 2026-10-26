import { useSyncExternalStore } from 'react'
import { loadState, saveState, demoState } from './storage'
import type {
  AppState,
  Capture,
  QuadrantId,
  Rating,
  StudyPlanInput,
  ThemeMode,
  TimerModeId,
  TimerSettings,
} from './types'
import { scheduleNext } from './sm2'
import { todayISO } from './date'

let state: AppState = loadState()
const listeners = new Set<() => void>()

function commit(next: AppState): void {
  state = next
  saveState(state)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getState = (): AppState => state

/** No selector: the app is small enough that whole-state reads stay cheap and, more
 *  importantly, `useSyncExternalStore` never has to cache derived snapshots. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

export const actions = {
  /* ----- theme ----- */
  setTheme(theme: ThemeMode) {
    commit({ ...state, theme })
  },
  toggleTheme() {
    commit({ ...state, theme: state.theme === 'dark' ? 'light' : 'dark' })
  },

  /* ----- intro ----- */
  completeIntro() {
    commit({ ...state, introSeen: true })
  },
  replayIntro() {
    commit({ ...state, introSeen: false })
  },

  /* ----- timer settings ----- */
  setTimer(patch: Partial<TimerSettings>) {
    commit({ ...state, timer: { ...state.timer, ...patch } })
  },

  /* ----- focus sessions ----- */
  addSession(minutes: number, modeId: TimerModeId) {
    if (minutes <= 0) return
    commit({
      ...state,
      sessions: [
        ...state.sessions,
        {
          id: uid(),
          modeId,
          minutes: Math.round(minutes),
          completedAt: new Date().toISOString(),
        },
      ],
    })
  },

  /**
   * Registra un bloque que ocurrió fuera de la app (estudiaste sin el timer).
   * Es la misma fuente de verdad: alimenta XP, racha y jardín igual que una
   * sesión medida.
   */
  addSessionAt(minutes: number, dateISO: string) {
    if (minutes <= 0 || !dateISO) return
    commit({
      ...state,
      sessions: [
        ...state.sessions,
        {
          id: uid(),
          modeId: 'custom',
          minutes: Math.round(minutes),
          // Mediodía local: evita que el uso horario corra la fecha un día.
          completedAt: `${dateISO}T12:00:00.000`,
        },
      ],
    })
  },
  removeSession(id: string) {
    commit({ ...state, sessions: state.sessions.filter((session) => session.id !== id) })
  },
  addTask(title: string, quadrant: QuadrantId = 'plan', estimateMin = 25) {
    const clean = title.trim()
    if (!clean) return
    commit({
      ...state,
      tasks: [
        ...state.tasks,
        {
          id: uid(),
          title: clean,
          estimateMin,
          done: false,
          quadrant,
          slotKey: null,
          createdAt: new Date().toISOString(),
        },
      ],
    })
  },
  toggleTask(id: string) {
    commit({
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })
  },
  setTaskQuadrant(id: string, quadrant: QuadrantId) {
    commit({
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, quadrant } : t)),
    })
  },
  setTaskSlot(id: string, slotKey: string | null) {
    commit({
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, slotKey } : t)),
    })
  },
  removeTask(id: string) {
    commit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) })
  },

  /* ----- brain dump ----- */
  addCapture(text: string) {
    const clean = text.trim()
    if (!clean) return
    const capture: Capture = {
      id: uid(),
      text: clean,
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, captures: [capture, ...state.captures] })
  },
  removeCapture(id: string) {
    commit({ ...state, captures: state.captures.filter((c) => c.id !== id) })
  },
  /** Promote a loose thought into a real, schedulable task. */
  promoteCapture(id: string) {
    const capture = state.captures.find((c) => c.id === id)
    if (!capture) return
    commit({
      ...state,
      captures: state.captures.filter((c) => c.id !== id),
      tasks: [
        ...state.tasks,
        {
          id: uid(),
          title: capture.text,
          estimateMin: 25,
          done: false,
          quadrant: 'plan',
          slotKey: null,
          createdAt: new Date().toISOString(),
        },
      ],
    })
  },

  /* ----- decks & cards ----- */
  addDeck(name: string) {
    const clean = name.trim()
    if (!clean) return
    commit({
      ...state,
      decks: [...state.decks, { id: uid(), name: clean, cards: [] }],
    })
  },
  removeDeck(id: string) {
    commit({ ...state, decks: state.decks.filter((d) => d.id !== id) })
  },
  addCard(deckId: string, front: string, back: string) {
    if (!front.trim() || !back.trim()) return
    const today = todayISO()
    commit({
      ...state,
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: [
                ...deck.cards,
                {
                  id: uid(),
                  front: front.trim(),
                  back: back.trim(),
                  ease: 2.5,
                  interval: 0,
                  repetitions: 0,
                  due: today,
                },
              ],
            }
          : deck,
      ),
    })
  },
  removeCard(deckId: string, cardId: string) {
    commit({
      ...state,
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }
          : deck,
      ),
    })
  },
  reviewCard(deckId: string, cardId: string, rating: Rating) {
    const today = todayISO()
    commit({
      ...state,
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.map((card) =>
                card.id === cardId ? scheduleNext(card, rating, today) : card,
              ),
            }
          : deck,
      ),
    })
  },

  /* ----- study plan ----- */
  setStudyPlan(plan: StudyPlanInput) {
    commit({ ...state, studyPlan: plan })
  },

  /* ----- demo data ----- */
  loadDemo() {
    commit({ ...state, ...demoState() })
  },

  reset() {
    commit(loadState())
  },
}
