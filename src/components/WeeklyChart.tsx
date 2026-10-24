import clsx from 'clsx'
import type { DayBucket } from '../lib/progress'
import { weekdayShort } from '../lib/date'

/** Seven bars, no gridlines, no legend — the shape is the message. */
export function WeeklyChart({ data, height = 96 }: { data: DayBucket[]; height?: number }) {
  const peak = Math.max(60, ...data.map((day) => day.minutes))
  const todayIndex = data.length - 1

  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {data.map((day, index) => {
        const ratio = day.minutes / peak
        const isToday = index === todayIndex
        return (
          <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="relative flex w-full flex-1 items-end"
              title={`${weekdayShort(day.date)}: ${day.minutes} min`}
            >
              <div
                className={clsx(
                  'w-full rounded-md transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  isToday ? 'bg-primary' : day.minutes > 0 ? 'bg-primary-soft-2' : 'bg-surface-2',
                )}
                style={{ height: `${Math.max(day.minutes > 0 ? 6 : 3, ratio * 100)}%` }}
              />
            </div>
            <span
              className={clsx(
                'text-[0.625rem] font-medium',
                isToday ? 'text-primary-text' : 'text-ink-3',
              )}
            >
              {weekdayShort(day.date)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
