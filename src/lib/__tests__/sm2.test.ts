import { describe, expect, it } from 'vitest'
import { scheduleNext } from '../sm2'
import type { Flashcard } from '../types'

const fresh = (): Flashcard => ({
  id: 'c1',
  front: '¿Qué es el hipocampo?',
  back: 'Estructura clave en la consolidación de la memoria.',
  ease: 2.5,
  interval: 0,
  repetitions: 0,
  due: '2026-10-24',
})

describe('scheduleNext (SM-2 simplified)', () => {
  it('schedules the first successful review one day out', () => {
    const next = scheduleNext(fresh(), 'good', '2026-10-24')
    expect(next.repetitions).toBe(1)
    expect(next.interval).toBe(1)
    expect(next.due).toBe('2026-10-25')
  })

  it('pushes "easy" strictly further out than "again"', () => {
    const again = scheduleNext(fresh(), 'again', '2026-10-24')
    const easy = scheduleNext(fresh(), 'easy', '2026-10-24')
    expect(easy.interval).toBeGreaterThan(again.interval)
    expect(easy.due > again.due).toBe(true)
  })

  it('resets the repetition chain on "again" and never leaves it due in the past', () => {
    const mature: Flashcard = { ...fresh(), ease: 2.6, interval: 12, repetitions: 4, due: '2026-10-24' }
    const next = scheduleNext(mature, 'again', '2026-10-26')
    expect(next.repetitions).toBe(0)
    expect(next.interval).toBeLessThanOrEqual(1)
    expect(next.due >= '2026-10-26').toBe(true)
  })

  it('grows the ease factor on "easy" and shrinks it on "hard"', () => {
    const base = fresh()
    expect(scheduleNext(base, 'easy', '2026-10-24').ease).toBeGreaterThan(base.ease)
    expect(scheduleNext(base, 'hard', '2026-10-24').ease).toBeLessThan(base.ease)
  })

  it('never lets the ease factor fall below the 1.3 floor', () => {
    let card: Flashcard = fresh()
    for (let i = 0; i < 40; i++) card = scheduleNext(card, 'again', '2026-10-24')
    expect(card.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('keeps a mature card stable across repeated "good" ratings', () => {
    let card = scheduleNext(fresh(), 'good', '2026-10-24')
    card = scheduleNext(card, 'good', card.due)
    const third = scheduleNext(card, 'good', card.due)
    expect(third.interval).toBeGreaterThan(card.interval)
  })
})
