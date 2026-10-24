import { addDays } from './date'
import type { Flashcard, Rating } from './types'

/** SM-2 simplified: a 4-button rating instead of a 0-5 scale. */
export const EASE_FLOOR = 1.3

const round2 = (n: number) => Math.round(n * 100) / 100

export function scheduleNext(card: Flashcard, rating: Rating, today: string): Flashcard {
  let ease = card.ease
  let interval = card.interval
  let repetitions = card.repetitions

  switch (rating) {
    case 'again':
      // Lapse: the chain resets, the card comes back tomorrow.
      ease = Math.max(EASE_FLOOR, ease - 0.2)
      interval = 1
      repetitions = 0
      break

    case 'hard':
      ease = Math.max(EASE_FLOOR, ease - 0.15)
      interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2))
      repetitions += 1
      break

    case 'good':
      interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(interval * ease)
      repetitions += 1
      break

    case 'easy':
      ease = ease + 0.15
      interval = repetitions === 0 ? 3 : Math.round(interval * ease * 1.3)
      repetitions += 1
      break
  }

  return {
    ...card,
    ease: round2(ease),
    interval: Math.max(1, interval),
    repetitions,
    due: addDays(today, Math.max(1, interval)),
  }
}

export function isDue(card: Flashcard, today: string): boolean {
  return card.due <= today
}

export const RATINGS: { id: Rating; label: string; hint: string }[] = [
  { id: 'again', label: 'Otra vez', hint: 'No me salió' },
  { id: 'hard', label: 'Difícil', hint: 'Me costó' },
  { id: 'good', label: 'Bien', hint: 'Lo tenía' },
  { id: 'easy', label: 'Fácil', hint: 'Al toque' },
]
