/** Date helpers. Everything is local-time based and ISO `YYYY-MM-DD` keyed. */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Whole days from `a` to `b`. Positive when `b` is in the future. */
export function diffDays(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function isBefore(a: string, b: string): boolean {
  return a < b
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export function weekdayShort(iso: string): string {
  return WEEKDAYS[fromISODate(iso).getDay()]
}

export function dayMonthShort(iso: string): string {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** Inclusive list of ISO dates from `start` to `end`. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = []
  const span = diffDays(start, end)
  if (span < 0) return out
  for (let i = 0; i <= span; i++) out.push(addDays(start, i))
  return out
}

/** Last `n` days ending today, oldest first. */
export function lastNDays(n: number, today = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)))
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function formatDuration(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`
}
