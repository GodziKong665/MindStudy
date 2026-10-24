import { useMemo } from 'react'
import { CalendarDays, Flame, Sprout, Timer, TrendingUp, Zap } from 'lucide-react'
import { useAppState } from '../lib/store'
import {
  currentStreak,
  levelInfo,
  minutesByDay,
  plantsFromSessions,
  totalFocusMinutes,
  xpFor,
} from '../lib/progress'
import { dayMonthShort, formatDuration, lastNDays, todayISO, weekdayShort } from '../lib/date'
import {
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  SectionHead,
  Stat,
  ViewHead,
} from '../components/ui'
import { WeeklyChart } from '../components/WeeklyChart'
import { PlantArt } from '../components/PlantArt'
import type { FocusSession, GardenPlant, TimerModeId } from '../lib/types'

const MAX_PLANTS = 60
const RECENT_SESSIONS = 12

const MODE_LABEL: Record<TimerModeId, string> = {
  pomodoro: 'Pomodoro',
  deep: 'Deep Work',
  custom: 'A medida',
}

function PlotCell({ plant }: { plant: GardenPlant }) {
  const day = plant.plantedAt.slice(0, 10)
  const label = `${formatDuration(plant.minutes)} de foco · ${weekdayShort(day)} ${dayMonthShort(day)} ${day.slice(0, 4)}`

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className="group flex aspect-[4/5] min-w-0 flex-col justify-end overflow-hidden rounded-xl border border-line bg-grow-soft p-1 transition-colors duration-200 hover:border-line-strong"
    >
      <PlantArt
        species={plant.species}
        stage={plant.stage}
        className="min-h-0 flex-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
    </div>
  )
}

function SessionRow({ session }: { session: FocusSession }) {
  const day = session.completedAt.slice(0, 10)

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-surface-2">
      <div className="min-w-0">
        <p className="truncate text-[0.8125rem] font-medium text-ink">{MODE_LABEL[session.modeId]}</p>
        <p className="text-[0.6875rem] text-ink-3">
          {weekdayShort(day)} {dayMonthShort(day)}
        </p>
      </div>
      <span className="num shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-text">
        {formatDuration(session.minutes)}
      </span>
    </li>
  )
}

export function GardenView() {
  const state = useAppState()
  const today = todayISO()

  /* Chronological order keeps "newest last" true even if storage arrives unordered. */
  const sessions = useMemo(
    () => [...state.sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
    [state.sessions],
  )
  const week = useMemo(() => minutesByDay(sessions, lastNDays(7, today)), [sessions, today])

  const plants = plantsFromSessions(sessions)
  const visiblePlants = plants.slice(-MAX_PLANTS)
  const archivedCount = plants.length - visiblePlants.length

  const focusMinutes = totalFocusMinutes(sessions)
  const streak = currentStreak(sessions, today)
  const completedTasks = state.tasks.filter((task) => task.done).length
  const level = levelInfo(xpFor(sessions, completedTasks))
  const weekTotal = week.reduce((acc, day) => acc + day.minutes, 0)
  const bestDay = week.reduce((best, day) => (day.minutes > best.minutes ? day : best))
  const recentSessions = sessions.slice(-RECENT_SESSIONS).reverse()

  const head = (
    <ViewHead
      eyebrow="Jardín de enfoque"
      title="Lo que crece cuando te concentrás."
      body="Cada bloque de foco completado planta una especie nueva. Cuanto más largo el bloque, más alto llega: el jardín es el registro visual de tus horas de concentración."
      action={
        <Chip tone="grow">
          <Sprout className="size-3" />
          {plants.length} {plants.length === 1 ? 'planta' : 'plantas'}
        </Chip>
      }
    />
  )

  if (sessions.length === 0) {
    return (
      <div className="animate-rise">
        {head}
        <Card>
          <EmptyState
            icon={Sprout}
            title="Todavía no hay nada plantado"
            body="Cada bloque de foco completado deja una planta en este jardín. Empezá con 25 minutos y volvé a verlo crecer."
            action={
              <a href="#/focus" className="btn btn-primary">
                <Timer className="size-4" />
                Empezar un bloque
              </a>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      {head}

      {/* -------------------------------- Stats ------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Card className="p-4">
          <Stat
            label="Foco total"
            value={formatDuration(focusMinutes)}
            hint="Acumulado histórico"
            tone="primary"
            icon={Timer}
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Sesiones"
            value={sessions.length}
            hint="Bloques completados"
            tone="neutral"
            icon={CalendarDays}
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Racha"
            value={`${streak} ${streak === 1 ? 'día' : 'días'}`}
            hint={streak > 0 ? 'Sostenida' : 'Arrancá hoy'}
            tone="spark"
            icon={Flame}
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Nivel"
            value={level.level}
            hint={`${level.intoLevel} / ${level.nextLevelXp} XP para subir`}
            tone="grow"
            icon={Zap}
          />
          <ProgressBar
            value={level.progress * 100}
            tone="grow"
            className="mt-3"
            label="Progreso hacia el siguiente nivel"
          />
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <Stat
            label="Mejor día · 7 d"
            value={bestDay.minutes > 0 ? formatDuration(bestDay.minutes) : '—'}
            hint={
              bestDay.minutes > 0
                ? `${weekdayShort(bestDay.date)} ${dayMonthShort(bestDay.date)}`
                : 'Sin foco esta semana'
            }
            tone="primary"
            icon={TrendingUp}
          />
        </Card>
      </div>

      {/* -------------------------------- Garden ------------------------------ */}
      <Card className="mt-5">
        <SectionHead
          title="El jardín"
          subtitle="Una planta por bloque completado. Cuanto más largo el bloque, más crece."
        />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {visiblePlants.map((plant) => (
            <PlotCell key={plant.id} plant={plant} />
          ))}
        </div>
        {archivedCount > 0 && (
          <p className="mt-4 text-xs leading-relaxed text-ink-3">
            Se muestran las últimas {MAX_PLANTS} plantas. Las {archivedCount} más antiguas
            quedan guardadas en tu historial.
          </p>
        )}
      </Card>

      {/* ---------------------------- Week & history -------------------------- */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <SectionHead
            title="Últimos 7 días"
            subtitle={`${formatDuration(weekTotal)} de foco acumulado`}
          />
          <WeeklyChart data={week} height={150} />
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-ink-3">Promedio diario</span>
            <span className="num text-xs font-semibold text-ink-2">
              {formatDuration(Math.round(weekTotal / 7))}
            </span>
          </div>
        </Card>

        <Card>
          <SectionHead title="Historial reciente" subtitle="Tus últimos bloques de foco" />
          <ul className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
            {recentSessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
