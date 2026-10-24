import { describe, expect, it } from 'vitest'
import { buildStudyPlan, workloadFor } from '../study-plan'
import type { StudyPlanInput } from '../types'

const input = (over: Partial<StudyPlanInput> = {}): StudyPlanInput => ({
  examDate: '2026-10-31',
  dailyMinutes: 120,
  topics: [
    { id: 't1', name: 'Fotosíntesis', weight: 4, baseMinutes: 60 },
    { id: 't2', name: 'Respiración celular', weight: 2, baseMinutes: 40 },
  ],
  ...over,
})

describe('workloadFor', () => {
  it('scales the base minutes by difficulty, with weight 1 as neutral', () => {
    expect(workloadFor({ id: 'a', name: 'a', weight: 1, baseMinutes: 100 })).toBe(100)
    expect(workloadFor({ id: 'a', name: 'a', weight: 5, baseMinutes: 100 })).toBe(200)
    expect(workloadFor({ id: 'a', name: 'a', weight: 3, baseMinutes: 100 })).toBe(150)
  })
})

describe('buildStudyPlan', () => {
  it('schedules exactly 100% of the requested workload', () => {
    const plan = buildStudyPlan(input(), '2026-10-24')
    const planned = plan.days.reduce(
      (acc, day) => acc + day.items.reduce((s, i) => s + i.minutes, 0),
      0,
    )
    expect(planned).toBe(plan.totalMinutes)
  })

  it('never plans more than the daily capacity when the load fits', () => {
    const plan = buildStudyPlan(input(), '2026-10-24')
    expect(plan.feasible).toBe(true)
    for (const day of plan.days) {
      expect(day.totalMinutes).toBeLessThanOrEqual(120)
    }
  })

  it('stops the study window before the exam day', () => {
    const plan = buildStudyPlan(input(), '2026-10-24')
    for (const day of plan.days) {
      expect(day.date < plan.examDate).toBe(true)
    }
  })

  it('reports infeasibility instead of silently dropping workload', () => {
    const plan = buildStudyPlan(
      input({ examDate: '2026-10-25', dailyMinutes: 30, topics: [{ id: 't', name: 'Todo el libro', weight: 5, baseMinutes: 600 }] }),
      '2026-10-24',
    )
    expect(plan.feasible).toBe(false)
    expect(plan.deficitMinutes).toBeGreaterThan(0)
    // Still accounts for every requested minute.
    const planned = plan.days.reduce(
      (acc, day) => acc + day.items.reduce((s, i) => s + i.minutes, 0),
      0,
    )
    expect(planned).toBe(plan.totalMinutes)
  })

  it('reserves the day before the exam for a final review pass', () => {
    const plan = buildStudyPlan(input(), '2026-10-24')
    const lastDay = plan.days[plan.days.length - 1]
    expect(lastDay.date).toBe('2026-10-30')
    expect(lastDay.items.some((i) => i.review)).toBe(true)
  })

  it('degrades gracefully when the exam is today', () => {
    const plan = buildStudyPlan(input({ examDate: '2026-10-24' }), '2026-10-24')
    expect(plan.days.length).toBe(1)
    expect(plan.days[0].date).toBe('2026-10-24')
  })
})
