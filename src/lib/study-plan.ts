import { addDays, dateRange } from './date'
import type { PlanDay, PlanItem, StudyPlan, StudyPlanInput, StudyTopic } from './types'

/** Difficulty 1..5 scales the base workload: 1 = neutral, 5 = double. */
export function workloadFor(topic: StudyTopic): number {
  const scaled = topic.baseMinutes * (1 + (topic.weight - 1) * 0.25)
  return Math.max(5, Math.round(scaled / 5) * 5)
}

/** Split `total` into `slots` 5-minute-aligned parts, remainder first. */
function distribute(total: number, slots: number): number[] {
  if (slots <= 0) return []
  const step = 5
  const units = Math.round(total / step)
  const base = Math.floor(units / slots)
  const rest = units - base * slots
  return Array.from({ length: slots }, (_, i) => (base + (i < rest ? 1 : 0)) * step)
}

/**
 * Spreads the workload between today and the exam, reserving the day before the
 * exam for a spaced final-review pass. Work is deliberately spread thin across
 * every available day: distributed practice beats massed practice.
 */
export function buildStudyPlan(input: StudyPlanInput, today: string): StudyPlan {
  const examDate = input.examDate
  const dailyMinutes = Math.max(5, input.dailyMinutes)

  const days: string[] =
    examDate <= today ? [today] : dateRange(today, addDays(examDate, -1))

  const reviewDay = days.length >= 2 ? days[days.length - 1] : null
  const primaryDays = reviewDay ? days.slice(0, -1) : days

  const weights = input.topics.map((topic) => ({
    topic,
    total: workloadFor(topic),
  }))

  const totalMinutes = weights.reduce((acc, w) => acc + w.total, 0)
  const capacityMinutes = days.length * dailyMinutes

  const byDay = new Map<string, PlanItem[]>()
  for (const day of days) byDay.set(day, [])

  for (const { topic, total } of weights) {
    const reviewMinutes = reviewDay ? Math.round((total * 0.25) / 5) * 5 : 0
    const primaryMinutes = total - reviewMinutes

    const parts = distribute(primaryMinutes, Math.max(1, primaryDays.length))
    primaryDays.forEach((day, i) => {
      const minutes = parts[i] ?? 0
      if (minutes > 0) {
        byDay.get(day)!.push({
          topicId: topic.id,
          label: topic.name,
          minutes,
          review: false,
        })
      }
    })

    if (reviewDay && reviewMinutes > 0) {
      byDay.get(reviewDay)!.push({
        topicId: topic.id,
        label: topic.name,
        minutes: reviewMinutes,
        review: true,
      })
    }
  }

  const planDays: PlanDay[] = days.map((date) => {
    const items = (byDay.get(date) ?? []).sort((a, b) =>
      a.review === b.review ? b.minutes - a.minutes : a.review ? 1 : -1,
    )
    return {
      date,
      items,
      totalMinutes: items.reduce((acc, item) => acc + item.minutes, 0),
    }
  })

  return {
    days: planDays,
    totalMinutes,
    capacityMinutes,
    feasible: totalMinutes <= capacityMinutes,
    deficitMinutes: Math.max(0, totalMinutes - capacityMinutes),
    examDate,
  }
}

export function planMinutes(plan: StudyPlan): number {
  return plan.days.reduce((acc, day) => acc + day.totalMinutes, 0)
}
