import clsx from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  progress: number
  size?: number
  stroke?: number
  tone?: 'primary' | 'grow'
  children: ReactNode
  dimmed?: boolean
}

/**
 * The ring is the one loud element in the whole product, so it carries all the
 * emphasis the time display needs. Track colour stays a low-contrast neutral.
 */
export function RingTimer({
  progress,
  size = 288,
  stroke = 10,
  tone = 'primary',
  children,
  dimmed = false,
}: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      aria-hidden={false}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ms-surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone === 'primary' ? 'var(--ms-primary)' : 'var(--ms-grow)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={clsx(
            'transition-[stroke-dashoffset] duration-500 ease-linear',
            dimmed && 'opacity-40',
          )}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </div>
  )
}
