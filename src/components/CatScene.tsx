import { useState } from 'react'
import clsx from 'clsx'

/**
 * Guardá tu imagen como `public/gato.png` y aparece sola, sin tocar código.
 * Si el archivo no existe todavía, cae a esta ilustración vectorial.
 */
const CAT_IMAGE = '/gato.png'

function CatFallback() {
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" role="img" aria-label="Gato con auriculares">
      {/* Orejas */}
      <path d="M52 78 L46 34 L88 58 Z" fill="var(--ms-primary-soft-2)" stroke="var(--ms-ink)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M148 78 L154 34 L112 58 Z" fill="var(--ms-primary-soft-2)" stroke="var(--ms-ink)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M57 68 L54 47 L76 60 Z" fill="var(--ms-spark-soft)" />
      <path d="M143 68 L146 47 L124 60 Z" fill="var(--ms-spark-soft)" />

      {/* Cabeza */}
      <ellipse cx="100" cy="112" rx="58" ry="52" fill="var(--ms-spark-soft)" stroke="var(--ms-ink)" strokeWidth="3" />

      {/* Rayas */}
      <path d="M100 62 v14" stroke="var(--ms-spark)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M86 64 l-4 13" stroke="var(--ms-spark)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M114 64 l4 13" stroke="var(--ms-spark)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

      {/* Ojos */}
      <ellipse cx="78" cy="108" rx="12" ry="14" fill="var(--ms-ink)" />
      <ellipse cx="122" cy="108" rx="12" ry="14" fill="var(--ms-ink)" />
      <circle cx="81" cy="103" r="4" fill="var(--ms-surface)" />
      <circle cx="125" cy="103" r="4" fill="var(--ms-surface)" />

      {/* Hocico */}
      <path d="M96 128 h8 l-4 6 z" fill="var(--ms-primary)" />
      <path d="M100 134 q-8 10 -18 4" fill="none" stroke="var(--ms-ink)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M100 134 q8 10 18 4" fill="none" stroke="var(--ms-ink)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Bigotes */}
      <g stroke="var(--ms-ink-3)" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <path d="M62 122 h-26" />
        <path d="M62 130 l-24 8" />
        <path d="M138 122 h26" />
        <path d="M138 130 l24 8" />
      </g>

      {/* Vincha de los auriculares */}
      <path
        d="M44 96 a58 54 0 0 1 112 0"
        fill="none"
        stroke="var(--ms-ink)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Almohadillas */}
      <rect x="26" y="94" width="24" height="40" rx="11" fill="var(--ms-ink)" />
      <rect x="150" y="94" width="24" height="40" rx="11" fill="var(--ms-ink)" />
      <rect x="31" y="100" width="14" height="28" rx="7" fill="var(--ms-primary-soft-2)" opacity="0.5" />
      <rect x="155" y="100" width="14" height="28" rx="7" fill="var(--ms-primary-soft-2)" opacity="0.5" />
    </svg>
  )
}

export function CatScene({ playing }: { playing: boolean }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-[6px] border border-line bg-surface-3">
      {/* Halo de tinta: respira solo cuando hay algo sonando. */}
      <div
        aria-hidden
        className={clsx(
          'pointer-events-none absolute inset-0 transition-opacity duration-700',
          playing ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'radial-gradient(70% 60% at 50% 35%, var(--ms-primary-soft) 0%, transparent 75%)',
        }}
      />

      <div className="relative aspect-[4/5] w-full">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center p-6">
            <CatFallback />
          </div>
        ) : (
          <img
            src={CAT_IMAGE}
            alt="El gato de MindStudy con auriculares, en la consola"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {playing && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 backdrop-blur-sm">
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              className="w-[3px] rounded-full bg-primary"
              style={{
                height: 6 + (bar % 2) * 6,
                animation: `breathe ${900 + bar * 220}ms ease-in-out infinite`,
              }}
            />
          ))}
          <span className="ml-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ink-2">
            sonando
          </span>
        </div>
      )}
    </div>
  )
}
