import clsx from 'clsx'
import type { ComponentType, ReactNode } from 'react'

/* -------------------------------------------------------------------------- */
/*  Shared primitives. Every colour here is a semantic token, never a raw hex. */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={clsx('card', padded && 'p-5', className)}>{children}</div>
}

export function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div>
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-[0.8125rem] text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function ViewHead({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-[2.1rem] leading-[1.1] text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
      </div>
      {action}
    </header>
  )
}

const TONE_TEXT = {
  primary: 'text-primary-text',
  grow: 'text-grow-text',
  spark: 'text-spark-text',
  neutral: 'text-ink',
} as const

const TONE_BG = {
  primary: 'bg-primary',
  grow: 'bg-grow',
  spark: 'bg-spark',
  neutral: 'bg-ink-3',
} as const

export type Tone = keyof typeof TONE_TEXT

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: Tone
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-ink-3">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className={clsx('num text-2xl font-semibold leading-none', TONE_TEXT[tone])}>{value}</div>
      {hint && <div className="text-xs text-ink-3">{hint}</div>}
    </div>
  )
}

export function ProgressBar({
  value,
  tone = 'primary',
  className,
  label,
}: {
  value: number
  tone?: Tone
  className?: string
  label?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={clsx('h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', TONE_BG[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string; hint?: string }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div
      className={clsx(
        'inline-flex flex-wrap items-center gap-1 rounded-md border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            title={option.hint}
            aria-pressed={active}
            className={clsx(
              'rounded-sm px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200',
              active
                ? 'bg-surface text-ink shadow-[inset_0_-2px_0_var(--ms-primary)]'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  body: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-3 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-12',
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary-text">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em]',
        tone === 'primary' && 'border-primary/25 bg-primary-soft text-primary-text',
        tone === 'grow' && 'border-grow/25 bg-grow-soft text-grow-text',
        tone === 'spark' && 'border-spark/25 bg-spark-soft text-spark-text',
        tone === 'neutral' && 'border-line bg-surface-2 text-ink-2',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A labelled form control wrapper so every field lines up. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-[0.6875rem] text-ink-3">{hint}</span>}
    </label>
  )
}
