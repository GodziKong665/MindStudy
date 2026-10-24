import { useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import clsx from 'clsx'
import {
  CalendarClock,
  Check,
  Clock,
  GripVertical,
  Inbox,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react'
import { Card, Chip, EmptyState, Field, SectionHead, Stat, ViewHead } from '../components/ui'
import { actions, useAppState } from '../lib/store'
import { QUADRANTS, parseSlot, quadrantById, slotKey } from '../lib/eisenhower'
import type { Quadrant } from '../lib/eisenhower'
import { dayMonthShort, formatDuration, todayISO, weekdayShort } from '../lib/date'
import type { QuadrantId, Task } from '../lib/types'

const DAY_START = 7
const DAY_END = 23
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, index) => DAY_START + index)

const BACKLOG_TARGET = 'backlog'
const quadrantTarget = (quadrant: QuadrantId): string => `quadrant:${quadrant}`

/** Quadrant tone only tints a stripe and a chip — never a large filled block. */
const TONE_STRIPE: Record<Quadrant['tone'], string> = {
  primary: 'bg-primary',
  grow: 'bg-grow',
  spark: 'bg-spark',
  neutral: 'bg-ink-3',
}

const QUADRANT_ORDER: Record<QuadrantId, number> = {
  do: 0,
  plan: 1,
  delegate: 2,
  drop: 3,
}

const padHour = (hour: number): string => `${String(hour).padStart(2, '0')}:00`

function TaskTile({
  task,
  variant,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task
  variant: 'backlog' | 'slot'
  dragging: boolean
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}) {
  const quadrant = quadrantById(task.quadrant)
  const compact = variant === 'slot'

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={clsx(
        'group flex cursor-grab items-start gap-2 rounded-xl border bg-surface transition-colors duration-150 active:cursor-grabbing',
        compact ? 'px-2 py-1.5' : 'px-3 py-2.5',
        dragging ? 'border-primary-ring opacity-45' : 'border-line hover:border-line-strong',
      )}
    >
      <GripVertical
        className={clsx('mt-0.5 shrink-0 text-ink-3', compact ? 'size-3.5' : 'size-4')}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            'break-words text-ink',
            compact ? 'text-xs leading-snug' : 'text-sm leading-snug',
            task.done && 'line-through decoration-ink-3 opacity-70',
          )}
        >
          {task.title}
        </p>
        <div className={clsx('flex flex-wrap items-center gap-1.5', compact ? 'mt-1' : 'mt-1.5')}>
          <Chip tone={quadrant.tone}>{quadrant.label}</Chip>
          <span className="num text-[0.6875rem] text-ink-3">{formatDuration(task.estimateMin)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => actions.toggleTask(task.id)}
          aria-label={task.done ? `Reabrir ${task.title}` : `Completar ${task.title}`}
          aria-pressed={task.done}
          className={clsx(
            'grid size-6 place-items-center rounded-md transition-colors',
            task.done
              ? 'bg-grow-soft text-grow-text'
              : 'text-ink-3 hover:bg-grow-soft hover:text-grow-text',
          )}
        >
          <Check className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => actions.removeTask(task.id)}
          aria-label={`Eliminar ${task.title}`}
          className="grid size-6 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  )
}

export function PlannerView() {
  const state = useAppState()
  const today = todayISO()

  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState(25)
  const [quadrant, setQuadrant] = useState<QuadrantId>('plan')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)

  const tasks = state.tasks
  const pending = tasks.filter((task) => !task.done)
  const backlog = pending
    .filter((task) => task.slotKey === null)
    .sort((a, b) => QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant])

  const scheduledToday = tasks.filter((task) => {
    if (task.slotKey === null) return false
    return parseSlot(task.slotKey).day === today
  })
  const plannedMinutes = scheduledToday.reduce((total, task) => total + task.estimateMin, 0)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    const minutes = Number.isFinite(estimate)
      ? Math.min(480, Math.max(5, Math.round(estimate)))
      : 25
    actions.addTask(clean, quadrant, minutes)
    setTitle('')
    setEstimate(25)
  }

  function handleDragStart(event: DragEvent<HTMLElement>, task: Task) {
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  function endDrag() {
    setDraggingId(null)
    setHoverTarget(null)
  }

  function handleDragOver(target: string) {
    return (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (hoverTarget !== target) setHoverTarget(target)
    }
  }

  function handleDragLeave(target: string) {
    return (event: DragEvent<HTMLElement>) => {
      const next = event.relatedTarget
      if (next instanceof Node && event.currentTarget.contains(next)) return
      setHoverTarget((current) => (current === target ? null : current))
    }
  }

  function handleDrop(_target: string, apply: (taskId: string) => void) {
    return (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      const taskId = event.dataTransfer.getData('text/plain')
      setHoverTarget(null)
      setDraggingId(null)
      if (!taskId) return
      apply(taskId)
    }
  }

  const isOver = (target: string): boolean => hoverTarget === target

  return (
    <div className="animate-rise">
      <ViewHead
        eyebrow="Planificador"
        title="Tu día, en bloques"
        body="Clasificá por urgencia e importancia y después reservá horas reales. Lo que no tiene un bloque, no ocupa tu atención."
        action={
          <Card padded={false} className="flex items-center gap-4 px-4 py-3">
            <Stat
              label="Planificado hoy"
              value={formatDuration(plannedMinutes)}
              tone="primary"
              icon={Clock}
            />
            <span aria-hidden className="h-9 w-px bg-line" />
            <Stat
              label="Pendientes"
              value={pending.length}
              tone="grow"
              icon={ListChecks}
            />
          </Card>
        }
      />

      <div className="row">
        {/* ------------------------- Left: capture + matrix ------------------------ */}
        <div className="col-12 col-lg-6 d-flex flex-column min-w-0 gap-5">
          <Card>
            <SectionHead
              title="Nueva tarea"
              subtitle="Una tarea por vez. Corta, concreta y con un tiempo realista."
            />
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Título" hint="Va a aparecer en el backlog y en los bloques.">
                <input
                  type="text"
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej. Repasar fotosíntesis para el parcial"
                  maxLength={120}
                  autoComplete="off"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <Field label="Estimación">
                  <div className="relative">
                    <input
                      type="number"
                      className="field pr-10"
                      value={Number.isNaN(estimate) ? '' : estimate}
                      onChange={(event) => setEstimate(event.target.valueAsNumber)}
                      min={5}
                      max={480}
                      step={5}
                      inputMode="numeric"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">
                      min
                    </span>
                  </div>
                </Field>
                <Field label="Cuadrante">
                  <select
                    className="field"
                    value={quadrant}
                    onChange={(event) => setQuadrant(event.target.value as QuadrantId)}
                  >
                    {QUADRANTS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} · {option.subtitle}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <button
                type="submit"
                className="btn btn-primary mt-1 w-full sm:w-auto sm:self-start"
                disabled={title.trim().length === 0}
              >
                <Plus className="size-4" />
                Agregar tarea
              </button>
            </form>
          </Card>

          <Card>
            <SectionHead
              title="Matriz de Eisenhower"
              subtitle="Arrastrá una tarea a un cuadrante para reclasificarla."
            />
            <div className="grid grid-cols-2 gap-2.5">
              {QUADRANTS.map((option) => {
                const target = quadrantTarget(option.id)
                const items = pending.filter((task) => task.quadrant === option.id)
                const minutes = items.reduce((total, task) => total + task.estimateMin, 0)
                return (
                  <div
                    key={option.id}
                    onDragOver={handleDragOver(target)}
                    onDragEnter={handleDragOver(target)}
                    onDragLeave={handleDragLeave(target)}
                    onDrop={handleDrop(target, (taskId) =>
                      actions.setTaskQuadrant(taskId, option.id),
                    )}
                    className={clsx(
                      'relative min-w-0 overflow-hidden rounded-xl border p-3 transition-colors duration-150',
                      isOver(target)
                        ? 'border-primary-ring bg-primary-soft'
                        : 'border-line bg-surface-3',
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx('absolute inset-y-0 left-0 w-1', TONE_STRIPE[option.tone])}
                    />
                    <div className="pl-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight text-ink">
                          {option.label}
                        </p>
                        <span className="num shrink-0 text-lg font-semibold leading-none text-ink">
                          {items.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.6875rem] leading-snug text-ink-3">
                        {option.subtitle}
                      </p>
                      <p className="mt-2 text-[0.6875rem] font-medium text-ink-2">
                        {items.length === 0 ? 'Sin tareas' : `${formatDuration(minutes)} estimados`}
                      </p>
                      <p className="mt-1.5 break-words text-[0.6875rem] leading-relaxed text-ink-3">
                        {option.action}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionHead
              title="Backlog"
              subtitle="Sin horario asignado. Arrastrá una tarjeta a un bloque del día."
              action={<Chip tone="neutral">{backlog.length}</Chip>}
            />
            {tasks.length === 0 ? (
              <EmptyState
                compact
                icon={Inbox}
                title="El backlog está vacío"
                body="Escribí tu primera tarea arriba: título, minutos y cuadrante. Después la ubicás en el día."
              />
            ) : backlog.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface-3 px-4 py-6 text-center">
                <p className="text-xs font-semibold text-ink">Nada suelto</p>
                <p className="mx-auto mt-1 max-w-xs text-[0.6875rem] leading-relaxed text-ink-3">
                  Todo lo pendiente ya tiene un bloque. Arrastrá una tarea hasta “Sin asignar”
                  para devolverla al backlog.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {backlog.map((task) => (
                  <li key={task.id}>
                    <TaskTile
                      task={task}
                      variant="backlog"
                      dragging={draggingId === task.id}
                      onDragStart={(event) => handleDragStart(event, task)}
                      onDragEnd={endDrag}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ---------------------------- Right: time grid --------------------------- */}
        <div className="col-12 col-lg-6 min-w-0">
          <Card className="flex flex-col lg:sticky lg:top-6">
            <SectionHead
              title="Bloques de hoy"
              subtitle={`${weekdayShort(today)} ${dayMonthShort(today)} · 07:00 a 23:00`}
              action={<Chip tone="primary">{formatDuration(plannedMinutes)}</Chip>}
            />

            {tasks.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarClock}
                title="Sin bloques todavía"
                body="Cuando tengas tareas, arrastralas a una franja horaria para proteger ese rato de estudio."
              />
            ) : (
              <>
                <div
                  onDragOver={handleDragOver(BACKLOG_TARGET)}
                  onDragEnter={handleDragOver(BACKLOG_TARGET)}
                  onDragLeave={handleDragLeave(BACKLOG_TARGET)}
                  onDrop={handleDrop(BACKLOG_TARGET, (taskId) =>
                    actions.setTaskSlot(taskId, null),
                  )}
                  className={clsx(
                    'mb-3 flex items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5 transition-colors duration-150',
                    isOver(BACKLOG_TARGET)
                      ? 'border-primary-ring bg-primary-soft'
                      : 'border-line-strong bg-surface-3',
                  )}
                >
                  <Inbox className="size-4 shrink-0 text-ink-3" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">Sin asignar</p>
                    <p className="mt-0.5 text-[0.6875rem] leading-snug text-ink-3">
                      Soltá una tarea acá para devolverla al backlog.
                    </p>
                  </div>
                  <span className="num shrink-0 text-xs font-medium text-ink-2">
                    {backlog.length}
                  </span>
                </div>

                <div className="max-h-[28rem] overflow-y-auto overscroll-contain pr-1 sm:max-h-[36rem]">
                  <div className="flex flex-col gap-1.5">
                    {HOURS.map((hour) => {
                      const key = slotKey(today, hour)
                      const label = padHour(hour)
                      const items = tasks.filter((task) => task.slotKey === key)
                      return (
                        <div key={key} className="flex gap-2">
                          <div className="flex w-11 shrink-0 items-start justify-end pt-2">
                            <span className="num text-[0.6875rem] text-ink-3">{label}</span>
                          </div>
                          <div
                            role="group"
                            aria-label={`Bloque de ${label}`}
                            onDragOver={handleDragOver(key)}
                            onDragEnter={handleDragOver(key)}
                            onDragLeave={handleDragLeave(key)}
                            onDrop={handleDrop(key, (taskId) =>
                              actions.setTaskSlot(taskId, key),
                            )}
                            className={clsx(
                              'min-h-[3.25rem] min-w-0 flex-1 rounded-xl border px-2 py-1.5 transition-colors duration-150',
                              isOver(key)
                                ? 'border-primary-ring bg-primary-soft'
                                : 'border-line bg-surface-3',
                            )}
                          >
                            {items.length === 0 ? (
                              <div className="flex min-h-[2.5rem] items-center justify-center">
                                {draggingId !== null && (
                                  <span className="text-[0.625rem] text-ink-3">Soltá acá</span>
                                )}
                              </div>
                            ) : (
                              <ul className="flex flex-col gap-1.5">
                                {items.map((task) => (
                                  <li key={task.id}>
                                    <TaskTile
                                      task={task}
                                      variant="slot"
                                      dragging={draggingId === task.id}
                                      onDragStart={(event) => handleDragStart(event, task)}
                                      onDragEnd={endDrag}
                                    />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
