import { addDays, todayISO } from './date'
import type { AppState, Flashcard, FocusSession, GardenPlant } from './types'

/* ----------------------------- Gamification ------------------------------ */
/* Everything below is DERIVED from `sessions` and `tasks`. Nothing duplicated,
   so XP, streak and the garden can never drift out of sync.                */

const XP_PER_FOCUS_MINUTE = 2
const XP_PER_TASK = 25

export function totalFocusMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((acc, s) => acc + s.minutes, 0)
}

export function xpFor(sessions: FocusSession[], completedTasks: number): number {
  return totalFocusMinutes(sessions) * XP_PER_FOCUS_MINUTE + completedTasks * XP_PER_TASK
}

export interface LevelInfo {
  level: number
  intoLevel: number
  nextLevelXp: number
  progress: number
}

/** Level 1 costs 100 XP, every level after that costs 50 more than the last. */
export function levelInfo(xp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, Math.floor(xp))
  let need = 100

  while (remaining >= need) {
    remaining -= need
    level += 1
    need = 100 + (level - 1) * 50
  }

  return { level, intoLevel: remaining, nextLevelXp: need, progress: remaining / need }
}

/**
 * Consecutive days with at least one completed focus session. Today counts as
 * "alive" only if yesterday was studied, so the streak survives until midnight.
 */
export function currentStreak(sessions: FocusSession[], today = todayISO()): number {
  const days = new Set(sessions.map((s) => s.completedAt.slice(0, 10)))
  if (days.size === 0) return 0

  let cursor: string
  if (days.has(today)) cursor = today
  else if (days.has(addDays(today, -1))) cursor = addDays(today, -1)
  else return 0

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export interface DayBucket {
  date: string
  minutes: number
}

export function minutesByDay(sessions: FocusSession[], days: string[]): DayBucket[] {
  const map = new Map<string, number>(days.map((d) => [d, 0]))
  for (const session of sessions) {
    const key = session.completedAt.slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + session.minutes)
  }
  return days.map((date) => ({ date, minutes: map.get(date) ?? 0 }))
}

/** One plant per completed session. The garden is literally your history. */
export function plantsFromSessions(sessions: FocusSession[]): GardenPlant[] {
  return sessions.map((session, index) => ({
    id: session.id,
    species: index % 5,
    stage: stageFor(session.minutes),
    minutes: session.minutes,
    plantedAt: session.completedAt,
  }))
}

function stageFor(minutes: number): GardenPlant['stage'] {
  if (minutes < 20) return 0
  if (minutes < 45) return 1
  if (minutes < 80) return 2
  return 3
}

/* -------------------------------- Selectors ------------------------------- */

export function completedTaskCount(state: AppState): number {
  return state.tasks.filter((t) => t.done).length
}

export function dueCards(cards: Flashcard[], today = todayISO()): Flashcard[] {
  return cards.filter((card) => card.due <= today)
}
