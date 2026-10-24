import clsx from 'clsx'
import {
  BookOpen,
  Calculator,
  CalendarClock,
  Flame,
  Layers,
  LayoutDashboard,
  Moon,
  Music4,
  Sprout,
  Sun,
  Timer,
  Zap,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { actions, useAppState } from '../lib/store'
import { currentStreak, levelInfo, xpFor } from '../lib/progress'
import type { Route } from '../lib/router'

const NAV: { id: Route; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'focus', label: 'Enfoque', icon: Timer },
  { id: 'music', label: 'Música', icon: Music4 },
  { id: 'planner', label: 'Planificador', icon: CalendarClock },
  { id: 'calculator', label: 'Calculadora', icon: Calculator },
  { id: 'cards', label: 'Tarjetas', icon: Layers },
  { id: 'garden', label: 'Jardín', icon: Sprout },
]

function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="grid size-7 place-items-center rounded-[4px] bg-primary text-primary-fg">
        <Sprout className="size-[0.9rem]" />
      </span>
      <span className="display text-[1.02rem] leading-none text-ink">MindStudy</span>
    </div>
  )
}

export function AppShell({
  route,
  navigate,
  children,
}: {
  route: Route
  navigate: (route: Route) => void
  children: ReactNode
}) {
  const state = useAppState()
  const streak = currentStreak(state.sessions)
  const xp = xpFor(state.sessions, state.tasks.filter((t) => t.done).length)
  const level = levelInfo(xp)

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ============================ Header ============================ */}
      <header className="sticky top-0 z-40 border-b-[3px] border-double border-line-strong bg-surface/90 backdrop-blur-md">
        <div className="container mx-auto d-flex align-items-center h-14 w-full max-w-6xl gap-2 px-5 sm:px-7 lg:h-16 lg:gap-5">
          <Logo />

          {/* --- Navegación horizontal (escritorio) --- */}
          <nav
            className="hidden h-full flex-1 items-stretch gap-0.5 lg:flex"
            aria-label="Navegación principal"
          >
            {NAV.map((item) => {
              const active = item.id === route
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'relative flex h-full items-center gap-1.5 border-b-2 px-2.5 text-[0.8125rem] font-medium transition-colors duration-150',
                    active
                      ? 'border-primary text-primary-text'
                      : 'border-transparent text-ink-2 hover:text-ink',
                  )}
                >
                  <item.icon className="size-[0.95rem] shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* --- Utilidades --- */}
          <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-1.5">
            <span
              className="flex items-center gap-1 rounded-sm border border-line bg-surface-2 px-1.5 py-1 text-[0.6875rem] font-semibold text-ink-2"
              title={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`}
            >
              <Flame className="size-3 text-spark-text" />
              <span className="num">{streak}</span>
            </span>

            <span
              className="hidden items-center gap-1 rounded-sm border border-line bg-surface-2 px-1.5 py-1 text-[0.6875rem] font-semibold text-ink-2 xl:flex"
              title={`Nivel ${level.level} · ${xp} XP`}
            >
              <Zap className="size-3 text-primary-text" />
              <span className="num">Nv {level.level}</span>
            </span>

            <button
              type="button"
              onClick={() => actions.replayIntro()}
              className="btn btn-ghost gap-1.5 px-1.5 xl:px-2.5"
              aria-label="Ver la historia"
              title="Ver la historia"
            >
              <BookOpen className="size-4" />
              <span className="hidden text-[0.8125rem] xl:inline">La historia</span>
            </button>

            <button
              type="button"
              onClick={() => actions.toggleTheme()}
              className="btn btn-ghost size-9 justify-center p-0"
              aria-label={state.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={state.theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {state.theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>

        {/* --- Navegación horizontal (móvil, con scroll) --- */}
        <nav
          className="flex overflow-x-auto border-t border-line lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navegación principal"
        >
          {NAV.map((item) => {
            const active = item.id === route
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary-soft text-primary-text shadow-[inset_0_-2px_0_var(--ms-primary)]'
                    : 'text-ink-3',
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ============================= Contenido ========================= */}
      <main className="container mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-7 lg:py-10">
        {children}
      </main>

      <footer className="container mx-auto w-full max-w-6xl px-5 pb-8 pt-2 sm:px-7">
        <p className="border-t border-line pt-4 text-[0.6875rem] tracking-wide text-ink-3">
          MindStudy · un bloque a la vez
        </p>
      </footer>
    </div>
  )
}
