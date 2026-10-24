import { useMemo } from 'react'
import {
  ArrowUpRight,
  Check,
  Flame,
  Layers,
  Sparkles,
  Sprout,
  Timer,
  Zap,
} from 'lucide-react'
import { actions, useAppState } from '../lib/store'
import {
  currentStreak,
  levelInfo,
  minutesByDay,
  plantsFromSessions,
  xpFor,
} from '../lib/progress'
import { dueCards } from '../lib/progress'
import { formatDuration, lastNDays, todayISO } from '../lib/date'
import { Card, ProgressBar, SectionHead, Stat } from '../components/ui'
import { WeeklyChart } from '../components/WeeklyChart'
import { BrainDump } from '../components/BrainDump'
import { quadrantById } from '../lib/eisenhower'
import type { Route } from '../lib/router'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Madrugada productiva'
  if (hour < 13) return 'Buen día'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function DashboardView({ navigate }: { navigate: (route: Route) => void }) {
  const state = useAppState()
  const today = todayISO()

  const streak = currentStreak(state.sessions, today)
  const xp = xpFor(state.sessions, state.tasks.filter((t) => t.done).length)
  const level = levelInfo(xp)
  const week = useMemo(() => minutesByDay(state.sessions, lastNDays(7, today)), [state.sessions, today])
  const todayMinutes = week[week.length - 1]?.minutes ?? 0
  const plants = plantsFromSessions(state.sessions)
  const pending = state.tasks.filter((task) => !task.done)
  const due = state.decks.reduce((acc, deck) => acc + dueCards(deck.cards, today).length, 0)
  const isEmpty = state.tasks.length === 0 && state.sessions.length === 0 && state.decks.length === 0

  const focusQueue = pending
    .slice()
    .sort((a, b) => {
      const order = { do: 0, plan: 1, delegate: 2, drop: 3 }
      return order[a.quadrant] - order[b.quadrant]
    })
    .slice(0, 5)

  const weekTotal = week.reduce((acc, day) => acc + day.minutes, 0)

  return (
    <div className="animate-rise">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="display mt-2 text-[2.2rem] leading-[1.1] text-ink sm:text-[2.8rem]">
            {greeting()}
            <span className="text-ink-3">.</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-2">
            {streak > 1
              ? `Llevás ${streak} días seguidos. La constancia es el método.`
              : 'Un bloque de foco hoy mueve la aguja más que un plan perfecto.'}
          </p>
        </div>
        <button type="button" onClick={() => navigate('focus')} className="btn btn-primary">
          <Timer className="size-4" />
          Empezar un bloque
        </button>
      </header>

      {isEmpty && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-dashed bg-surface-3">
          <div>
            <p className="text-sm font-semibold text-ink">Tu espacio está listo y vacío</p>
            <p className="mt-1 text-xs text-ink-2">
              Cargá un ejemplo con tareas, tarjetas y capturas para ver cómo respira la app.
            </p>
          </div>
          <button type="button" onClick={() => actions.loadDemo()} className="btn btn-outline">
            <Sparkles className="size-4" />
            Cargar ejemplo
          </button>
        </Card>
      )}

      {/* ------------------------------- Stats ------------------------------ */}
      <div className="row row-gap-3 mb-6">
        <Card className="col-6 col-lg-3 p-4">
          <Stat
            label="Racha"
            value={`${streak} ${streak === 1 ? 'día' : 'días'}`}
            hint={streak > 0 ? 'Sostenida' : 'Arrancá hoy'}
            tone="spark"
            icon={Flame}
          />
        </Card>
        <Card className="col-6 col-lg-3 p-4">
          <Stat
            label="Foco hoy"
            value={formatDuration(todayMinutes)}
            hint={`Meta ${formatDuration(120)}`}
            tone="primary"
            icon={Timer}
          />
        </Card>
        <Card className="col-6 col-lg-3 p-4">
          <Stat label="Nivel" value={level.level} hint={`${xp} XP totales`} tone="grow" icon={Zap} />
          <ProgressBar value={level.progress * 100} tone="grow" className="mt-3" />
        </Card>
        <Card className="col-6 col-lg-3 p-4">
          <Stat
            label="Para repasar"
            value={due}
            hint={due > 0 ? 'Tarjetas de hoy' : 'Todo al día'}
            tone="primary"
            icon={Layers}
          />
        </Card>
      </div>

      <div className="row">
        <div className="col-12 col-lg-7 d-flex flex-column gap-5">
          <Card>
            <SectionHead
              title="Tu día"
              subtitle="Ordenado por la matriz de Eisenhower"
              action={
                <button
                  type="button"
                  onClick={() => navigate('planner')}
                  className="btn btn-ghost text-xs"
                >
                  Abrir plan
                  <ArrowUpRight className="size-3.5" />
                </button>
              }
            />
            {focusQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface-3 px-5 py-8 text-center">
                <p className="text-sm font-medium text-ink">Sin tareas pendientes</p>
                <p className="mt-1 text-xs text-ink-2">
                  Descargá el ruido mental en el brain dump o abrí el planificador.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('planner')}
                  className="btn btn-outline mt-4 text-xs"
                >
                  Crear la primera tarea
                </button>
              </div>
            ) : (
              <ul className="flex flex-col">
                {focusQueue.map((task) => {
                  const quadrant = quadrantById(task.quadrant)
                  return (
                    <li
                      key={task.id}
                      className="group flex items-center gap-3 border-b border-line py-2.5 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => actions.toggleTask(task.id)}
                        className="grid size-5 shrink-0 place-items-center rounded-md border border-line-strong text-transparent transition-colors hover:border-grow hover:bg-grow-soft hover:text-grow-text"
                        aria-label={`Completar ${task.title}`}
                      >
                        <Check className="size-3" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.title}</span>
                      <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[0.625rem] font-medium text-ink-2">
                        {quadrant.label}
                      </span>
                      <span className="num shrink-0 text-xs text-ink-3">{task.estimateMin}′</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHead
              title="Progreso semanal"
              subtitle={`${formatDuration(weekTotal)} de foco en 7 días`}
            />
            <WeeklyChart data={week} />
          </Card>
        </div>

        {/* ---------------------------- Right rail --------------------------- */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-5">
          <BrainDump />

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="size-4 text-grow-text" />
                <h3 className="text-sm font-semibold text-ink">Tu jardín</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('garden')}
                className="text-xs text-primary-text hover:underline"
              >
                Ver todo
              </button>
            </div>
            {plants.length === 0 ? (
              <p className="text-xs leading-relaxed text-ink-3">
                Cada bloque completado planta algo. Todavía no hay nada creciendo.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {plants.slice(-18).map((plant) => (
                  <span
                    key={plant.id}
                    className="grid size-7 place-items-center rounded-lg bg-grow-soft"
                    title={`${plant.minutes} min · ${plant.plantedAt.slice(0, 10)}`}
                  >
                    <Sprout
                      className={
                        plant.stage === 0
                          ? 'size-3 text-grow-text opacity-50'
                          : plant.stage === 1
                            ? 'size-3.5 text-grow-text opacity-70'
                            : plant.stage === 2
                              ? 'size-4 text-grow-text'
                              : 'size-4.5 text-grow-text'
                      }
                    />
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
