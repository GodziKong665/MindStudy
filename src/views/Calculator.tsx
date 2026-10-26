import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Flag,
  ListChecks,
  Plus,
  Repeat2,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  Card,
  Chip,
  EmptyState,
  Field,
  ProgressBar,
  SectionHead,
  Stat,
  ViewHead,
} from '../components/ui'
import { actions, useAppState } from '../lib/store'
import { buildStudyPlan, workloadFor } from '../lib/study-plan'
import { dayMonthShort, diffDays, formatDuration, todayISO, weekdayShort } from '../lib/date'
import type { PlanDay, StudyPlan, StudyPlanInput, StudyTopic } from '../lib/types'

/** Difficulty labels, 1..5. Aligned with the weight scale used by `workloadFor`. */
const DIFFICULTY = ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil'] as const

/** Every block in the plan is snapped to this grid. */
const BLOCK_MINUTES = 5

/** `crypto.randomUUID` is unavailable in some non-secure contexts; keep a fallback. */
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tema-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function topicLabel(name: string): string {
  const clean = name.trim()
  return clean === '' ? 'Tema sin nombre' : clean
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

function clampWeight(weight: number): number {
  return Math.min(5, Math.max(1, Math.round(weight)))
}

/* -------------------------------------------------------------------------- */
/*  Numeric input: keeps the raw text while typing, commits only sane values.  */
/* -------------------------------------------------------------------------- */

function NumericField({
  label,
  hint,
  value,
  min,
  max,
  step = BLOCK_MINUTES,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(() => String(value))
  const editing = useRef(false)

  useEffect(() => {
    if (!editing.current) setText(String(value))
  }, [value])

  const read = (raw: string): number | null => {
    const parsed = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(parsed) || parsed < min) return null
    return Math.min(max, Math.round(parsed))
  }

  return (
    <Field label={label} hint={hint}>
      <input
        className="field num"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={text}
        onFocus={() => {
          editing.current = true
        }}
        onChange={(event) => {
          const raw = event.target.value
          setText(raw)
          const next = read(raw)
          if (next !== null && next !== value) onChange(next)
        }}
        onBlur={() => {
          editing.current = false
          const next = read(text)
          if (next === null) {
            setText(String(value))
            return
          }
          setText(String(next))
          if (next !== value) onChange(next)
        }}
      />
    </Field>
  )
}

/* -------------------------------------------------------------------------- */
/*  Topic editor                                                               */
/* -------------------------------------------------------------------------- */

function WeightPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (weight: number) => void
}) {
  const current = clampWeight(value)

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Dificultad del tema, de 1 a 5"
    >
      {DIFFICULTY.map((label, index) => {
        const weight = index + 1
        const active = weight === current
        return (
          <button
            key={weight}
            type="button"
            onClick={() => onChange(weight)}
            aria-pressed={active}
            title={`${weight} · ${label}`}
            className={clsx(
              'num size-8 rounded-lg border text-xs font-semibold transition-colors duration-200',
              active
                ? 'border-primary-ring bg-primary-soft text-primary-text'
                : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink',
            )}
          >
            {weight}
          </button>
        )
      })}
    </div>
  )
}

function TopicEditor({
  topic,
  onChange,
  onRemove,
}: {
  topic: StudyTopic
  onChange: (patch: Partial<StudyTopic>) => void
  onRemove: () => void
}) {
  const weight = clampWeight(topic.weight)
  const workload = workloadFor(topic)

  return (
    <div className="rounded-xl border border-line bg-surface-3 p-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Tema">
            <input
              className="field"
              value={topic.name}
              placeholder="Ej.: Unidad 3 — Derivadas"
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="btn btn-ghost mb-px size-9 shrink-0 justify-center p-0 text-ink-3 hover:text-spark-text"
          aria-label={`Quitar ${topicLabel(topic.name)}`}
          title="Quitar tema"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Dificultad</span>
          <WeightPicker value={weight} onChange={(next) => onChange({ weight: next })} />
          <span className="text-[0.6875rem] text-ink-3">
            {DIFFICULTY[weight - 1]} · escala la carga base
          </span>
        </div>
        <NumericField
          label="Minutos base"
          hint="Antes de la dificultad."
          value={topic.baseMinutes}
          min={5}
          max={1440}
          onChange={(baseMinutes) => onChange({ baseMinutes })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border border-line bg-surface px-3 py-2">
        <span className="text-xs text-ink-2">
          Carga calculada <span className="text-ink-3">· {topic.baseMinutes} min base</span>
        </span>
        <span className="num text-sm font-semibold text-primary-text">
          {formatDuration(workload)}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Plan results                                                               */
/* -------------------------------------------------------------------------- */

function PlanSummary({ plan, dailyMinutes }: { plan: StudyPlan; dailyMinutes: number }) {
  const dayCount = plan.days.length
  const usage = plan.capacityMinutes > 0 ? (plan.totalMinutes / plan.capacityMinutes) * 100 : 0

  return (
    <Card>
      <div className="grid gap-5 sm:grid-cols-3">
        <Stat
          label="Carga total"
          value={formatDuration(plan.totalMinutes)}
          hint="Temas con dificultad aplicada"
          tone="primary"
          icon={Clock3}
        />
        <Stat
          label="Tiempo disponible"
          value={formatDuration(plan.capacityMinutes)}
          hint={`${formatDuration(dailyMinutes)} por día`}
          tone="grow"
          icon={CalendarDays}
        />
        <Stat
          label="Días de estudio"
          value={dayCount}
          hint={dayCount === 1 ? 'Un solo bloque' : 'Incluye la víspera'}
          tone="neutral"
          icon={ListChecks}
        />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-xs text-ink-2">Ocupación del tiempo disponible</span>
          <span
            className={clsx(
              'num text-xs font-semibold',
              plan.feasible ? 'text-grow-text' : 'text-spark-text',
            )}
          >
            {Math.round(usage)}%
          </span>
        </div>
        <ProgressBar
          value={usage}
          tone={plan.feasible ? 'grow' : 'spark'}
          label="Ocupación del tiempo disponible"
        />
      </div>
    </Card>
  )
}

function DeficitWarning({ plan }: { plan: StudyPlan }) {
  const dayCount = plan.days.length
  const neededPerDay =
    dayCount > 0
      ? Math.ceil(plan.totalMinutes / dayCount / BLOCK_MINUTES) * BLOCK_MINUTES
      : plan.totalMinutes

  return (
    <Card className="border-spark bg-spark-soft text-spark-text">
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-spark-text" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-spark-text">
            Faltan {formatDuration(plan.deficitMinutes)} para cubrir la carga
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-spark-text">
            Con el tiempo que marcaste no alcanza. Necesitás al menos{' '}
            <span className="num font-semibold">{formatDuration(neededPerDay)}</span> por día, o
            recortar temas y bajar la dificultad de los más pesados. Abajo repartimos la carga
            completa igual: el excedente no desaparece.
          </p>
        </div>
      </div>
    </Card>
  )
}

function PlanTimeline({ plan, dailyMinutes }: { plan: StudyPlan; dailyMinutes: number }) {
  const today = todayISO()
  const days: PlanDay[] = plan.days.filter((day) => day.items.length > 0)
  const lastDay = days.length > 0 ? days[days.length - 1] : null
  const toExam = lastDay ? diffDays(lastDay.date, plan.examDate) : 0
  const bufferDays = Math.max(0, toExam - 1)

  let marginNote = 'Todavía no hay bloques asignados.'
  if (lastDay) {
    const lastIsReview = lastDay.items.every((item) => item.review)
    if (toExam < 0) {
      marginNote = 'La fecha del examen ya pasó: el plan se calcula sobre hoy.'
    } else if (toExam === 0) {
      marginNote = 'El plan termina el mismo día del examen.'
    } else if (toExam === 1) {
      marginNote = lastIsReview
        ? 'El último bloque es el repaso de la víspera.'
        : 'El plan cierra el día anterior al examen.'
    } else {
      marginNote = `${plural(bufferDays, 'día', 'días')} de margen antes del examen.`
    }
  }

  if (days.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-ink-3">
        No hay bloques para mostrar con la carga actual.
      </p>
    )
  }

  return (
    <div>
      <div className="relative pl-6">
        <span className="absolute inset-y-2 left-[5px] w-px bg-line" aria-hidden />
        <ol className="flex flex-col gap-6">
          {days.map((day) => {
            const isReviewDay = day.items.every((item) => item.review)
            const overCapacity = day.totalMinutes > dailyMinutes
            return (
              <li key={day.date} className="relative">
                <span
                  className={clsx(
                    'absolute -left-6 top-1.5 size-2.5 rounded-full ring-2 ring-surface',
                    isReviewDay ? 'bg-grow' : 'bg-primary',
                  )}
                  aria-hidden
                />

                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-ink">
                      {weekdayShort(day.date)}
                    </span>
                    <span className="num text-xs text-ink-3">{dayMonthShort(day.date)}</span>
                    {day.date === today && <Chip tone="primary">Hoy</Chip>}
                    {isReviewDay && <Chip tone="grow">Repaso final</Chip>}
                  </div>
                  <span
                    className={clsx(
                      'num text-xs font-medium',
                      overCapacity ? 'text-spark-text' : 'text-ink-2',
                    )}
                    title={overCapacity ? 'Este día supera tus minutos disponibles' : undefined}
                  >
                    {formatDuration(day.totalMinutes)}
                  </span>
                </div>

                <ul className="mt-2 flex flex-col gap-1.5">
                  {day.items.map((item, index) => (
                    <li
                      key={`${item.topicId}-${index}`}
                      className={clsx(
                        'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2.5 py-1.5',
                        item.review ? 'bg-grow-soft' : 'bg-surface-2',
                      )}
                    >
                      <span
                        className={clsx(
                          'size-1 shrink-0 rounded-full',
                          item.review ? 'bg-grow' : 'bg-ink-3',
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 text-xs leading-snug text-ink">
                        {topicLabel(item.label)}
                      </span>
                      {item.review && (
                        <Chip tone="grow">
                          <Repeat2 className="size-3" />
                          Repaso
                        </Chip>
                      )}
                      <span
                        className={clsx(
                          'num shrink-0 text-xs font-medium',
                          item.review ? 'text-grow-text' : 'text-ink-2',
                        )}
                      >
                        {formatDuration(item.minutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}

          <li className="relative">
            <span
              className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-spark ring-2 ring-surface"
              aria-hidden
            />
            <div className="rounded-xl border border-spark bg-spark-soft px-3.5 py-3">
              <div className="flex items-center gap-2">
                <Flag className="size-4 shrink-0 text-spark-text" />
                <p className="text-sm font-semibold text-spark-text">Día del examen</p>
              </div>
              <p className="num mt-1 text-xs text-spark-text">
                {weekdayShort(plan.examDate)} {dayMonthShort(plan.examDate)}
              </p>
            </div>
          </li>
        </ol>
      </div>

      <p className="mt-5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-3">
        <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
        {marginNote}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

export function CalculatorView() {
  const { studyPlan } = useAppState()
  const today = todayISO()

  const patch = (next: Partial<StudyPlanInput>) => {
    actions.setStudyPlan({ ...studyPlan, ...next })
  }

  /**
   * Formulario activo: se completa, se agrega y se limpia solo.
   * Antes el botón creaba un tema vacío ("Tema sin nombre") y después había que
   * ir a completarlo, que es el orden inverso al que espera cualquiera.
   */
  const [draft, setDraft] = useState({ name: '', weight: 3, baseMinutes: 60 })
  const nameRef = useRef<HTMLInputElement>(null)

  const submitTopic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draft.name.trim()
    if (name.length < 2) {
      nameRef.current?.focus()
      return
    }
    patch({
      topics: [
        ...studyPlan.topics,
        { id: makeId(), name, weight: draft.weight, baseMinutes: draft.baseMinutes },
      ],
    })
    setDraft({ name: '', weight: 3, baseMinutes: 60 })
    nameRef.current?.focus()
  }

  const updateTopic = (id: string, next: Partial<StudyTopic>) => {
    patch({
      topics: studyPlan.topics.map((topic) =>
        topic.id === id ? { ...topic, ...next } : topic,
      ),
    })
  }

  const removeTopic = (id: string) => {
    patch({ topics: studyPlan.topics.filter((topic) => topic.id !== id) })
  }

  const plan = useMemo(
    () =>
      studyPlan.examDate !== '' && studyPlan.topics.length > 0
        ? buildStudyPlan(studyPlan, today)
        : null,
    [studyPlan, today],
  )

  const examHint =
    studyPlan.examDate === ''
      ? 'La cuenta corre desde hoy hasta la víspera.'
      : studyPlan.examDate < today
        ? 'Esa fecha ya pasó: el plan se calcula sobre hoy.'
        : studyPlan.examDate === today
          ? 'El examen es hoy: queda un solo bloque.'
          : 'El repaso final cae la víspera.'

  return (
    <div className="animate-rise">
      <ViewHead
        eyebrow="Calculadora de estudio"
        title="Repartí la carga a tiempo."
        body="Cargá la fecha del examen y tus temas: distribuimos los minutos entre hoy y la víspera. Si el tiempo no alcanza, el plan lo dice con claridad."
        action={
          plan ? (
            <Chip tone={plan.feasible ? 'grow' : 'spark'}>
              {plan.feasible ? 'Entra en el calendario' : 'Carga excedida'}
            </Chip>
          ) : undefined
        }
      />

      <div className="row">
        {/* ------------------------------ Inputs ----------------------------- */}
        <div className="col-12 col-xl-6 d-flex flex-column gap-5">
          <Card>
            <SectionHead
              title="Examen y ritmo"
              subtitle="Cuándo rendís y cuánto tiempo real tenés por día."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha del examen" hint={examHint}>
                <input
                  type="date"
                  className="field"
                  min={today}
                  value={studyPlan.examDate}
                  onChange={(event) => patch({ examDate: event.target.value })}
                />
              </Field>
              <NumericField
                label="Minutos por día"
                hint="Mejor un número que puedas sostener."
                value={studyPlan.dailyMinutes}
                min={5}
                max={720}
                step={15}
                onChange={(dailyMinutes) => patch({ dailyMinutes })}
              />
            </div>
          </Card>

          <Card>
            <SectionHead
              title="Temas"
              subtitle={
                studyPlan.topics.length === 0
                  ? 'Escribí el primero, elegí la dificultad y agregalo.'
                  : `${plural(studyPlan.topics.length, 'tema cargado', 'temas cargados')}.`
              }
            />

            <form
              onSubmit={submitTopic}
              className="mb-4 rounded-md border border-line bg-surface-3 p-3"
            >
              <div className="d-flex flex-wrap align-items-end gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[0.625rem] text-ink-3">Tema</span>
                  <input
                    ref={nameRef}
                    className="field"
                    placeholder="Ej: Fotosíntesis"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    aria-label="Nombre del tema"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.625rem] text-ink-3">Dificultad</span>
                  <select
                    className="field w-24"
                    value={draft.weight}
                    onChange={(event) =>
                      setDraft({ ...draft, weight: Number(event.target.value) })
                    }
                    aria-label="Dificultad del tema"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.625rem] text-ink-3">Min. base</span>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    step={5}
                    className="field num w-24"
                    value={draft.baseMinutes}
                    onChange={(event) =>
                      setDraft({ ...draft, baseMinutes: Number(event.target.value) })
                    }
                    aria-label="Minutos base del tema"
                  />
                </label>
                <button type="submit" className="btn btn-primary shrink-0 text-xs">
                  <Plus className="size-3.5" />
                  Agregar
                </button>
              </div>
            </form>

            {studyPlan.topics.length === 0 ? (
              <p className="rounded-md border border-dashed border-line-strong bg-surface-3 px-4 py-6 text-center text-xs text-ink-3">
                Todavía no cargaste ningún tema.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {studyPlan.topics.map((topic) => (
                  <TopicEditor
                    key={topic.id}
                    topic={topic}
                    onChange={(next) => updateTopic(topic.id, next)}
                    onRemove={() => removeTopic(topic.id)}
                  />
                ))}
              </div>
            )}

            <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-3">
              La dificultad escala la carga base: ×1 con 1, ×1,5 con 3 y ×2 con 5. La carga
              calculada ya incluye ese ajuste.
            </p>
          </Card>
        </div>

        {/* ------------------------------ Results ---------------------------- */}
        <div className="col-12 col-xl-6 d-flex flex-column gap-5">
          {plan ? (
            <>
              <PlanSummary plan={plan} dailyMinutes={studyPlan.dailyMinutes} />
              {!plan.feasible && <DeficitWarning plan={plan} />}
              <Card>
                <SectionHead
                  title="Plan día por día"
                  subtitle="Bloques de 5 minutos entre hoy y el examen."
                />
                <PlanTimeline plan={plan} dailyMinutes={studyPlan.dailyMinutes} />
              </Card>
            </>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Faltan dos datos"
              body="Necesitamos la fecha del examen y al menos un tema con sus minutos base. Con eso repartimos la carga entre hoy y la víspera."
            />
          )}
        </div>
      </div>
    </div>
  )
}
