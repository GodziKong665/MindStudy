import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import clsx from 'clsx'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Layers,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { actions, useAppState } from '../lib/store'
import type { Deck, Flashcard, Rating } from '../lib/types'
import { RATINGS, isDue } from '../lib/sm2'
import { dayMonthShort, diffDays, todayISO } from '../lib/date'
import { dueCards } from '../lib/progress'
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

/* -------------------------------------------------------------------------- */
/*  Small pure helpers — kept outside the component so render stays readable.  */
/* -------------------------------------------------------------------------- */

function intervalLabel(card: Flashcard): string {
  if (card.interval <= 0) return 'Sin intervalo'
  return `Intervalo ${card.interval} ${card.interval === 1 ? 'día' : 'días'}`
}

function dueLabel(card: Flashcard, today: string): string {
  const delta = diffDays(today, card.due)
  if (delta < 0) {
    const late = Math.abs(delta)
    return late === 1 ? '1 día de atraso' : `${late} días de atraso`
  }
  if (delta === 0) return 'Para hoy'
  if (delta === 1) return 'Vuelve mañana'
  return `Vuelve el ${dayMonthShort(card.due)}`
}

/** Earliest `due` in a deck, or null when the deck has no cards. */
function earliestDue(cards: Flashcard[]): string | null {
  let next: string | null = null
  for (const card of cards) {
    if (next === null || card.due < next) next = card.due
  }
  return next
}

/* -------------------------------------------------------------------------- */
/*  Presentational atoms                                                      */
/* -------------------------------------------------------------------------- */

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[0.625rem] font-semibold text-ink-2">
      {children}
    </kbd>
  )
}

const RATING_DOT: Record<Rating, string> = {
  again: 'bg-spark',
  hard: 'bg-ink-3',
  good: 'bg-primary',
  easy: 'bg-grow',
}

function RatingButton({
  rating,
  index,
  onPick,
}: {
  rating: { id: Rating; label: string; hint: string }
  index: number
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col items-start gap-1 rounded-xl border border-line bg-surface-3 px-3 py-2.5 text-left transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span
            className={clsx('size-1.5 rounded-full', RATING_DOT[rating.id])}
            aria-hidden="true"
          />
          {rating.label}
        </span>
        <span className="num rounded border border-line px-1 text-[0.625rem] text-ink-3 transition-colors group-hover:border-line-strong">
          {index + 1}
        </span>
      </span>
      <span className="text-[0.6875rem] leading-snug text-ink-3">{rating.hint}</span>
    </button>
  )
}

function DeckRow({
  deck,
  due,
  selected,
  armed,
  onSelect,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: {
  deck: Deck
  due: number
  selected: boolean
  armed: boolean
  onSelect: () => void
  onArmDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  return (
    <li
      className={clsx(
        'rounded-xl border p-2.5 transition-colors duration-200',
        selected
          ? 'border-primary-ring bg-primary-soft'
          : 'border-line bg-surface-3 hover:border-line-strong',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-1.5 py-1 text-left"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{deck.name}</span>
            <span className="mt-0.5 block text-[0.6875rem] text-ink-3">
              {deck.cards.length} {deck.cards.length === 1 ? 'tarjeta' : 'tarjetas'}
            </span>
          </span>
          <Chip tone={due > 0 ? 'spark' : 'grow'}>
            {due > 0 ? `${due} para hoy` : 'Al día'}
          </Chip>
        </button>

        {armed ? (
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Confirmar eliminación de ${deck.name}`}
              className="btn bg-spark-soft px-2 py-1 text-[0.6875rem] font-semibold text-spark-text"
            >
              Eliminar
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="btn btn-ghost px-2 py-1 text-[0.6875rem]"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={onArmDelete}
            aria-label={`Eliminar mazo ${deck.name}`}
            className="btn btn-ghost shrink-0 px-2 py-1.5 text-ink-3 hover:text-spark-text"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  )
}

function CardRow({
  card,
  today,
  armed,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: {
  card: Flashcard
  today: string
  armed: boolean
  onArmDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex items-start gap-2 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-ink [overflow-wrap:anywhere]">
          {card.front}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-2 [overflow-wrap:anywhere]">
          {card.back}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] text-ink-3">
          <span className="num">{dueLabel(card, today)}</span>
          <span aria-hidden="true">·</span>
          <span className="num">{intervalLabel(card)}</span>
        </div>
      </div>

      {armed ? (
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Confirmar eliminación de la tarjeta"
            className="btn bg-spark-soft px-2 py-1 text-[0.6875rem] font-semibold text-spark-text"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="btn btn-ghost px-2 py-1 text-[0.6875rem]"
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={onArmDelete}
          aria-label="Eliminar tarjeta"
          className="btn btn-ghost shrink-0 px-2 py-1.5 text-ink-3 hover:text-spark-text"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  View                                                                      */
/* -------------------------------------------------------------------------- */

export function CardsView() {
  const { decks } = useAppState()
  const today = todayISO()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deckName, setDeckName] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null)
  const [deletingCard, setDeletingCard] = useState<string | null>(null)

  const [reviewing, setReviewing] = useState(false)
  const [queue, setQueue] = useState<string[]>([])
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set<string>())
  const [revealed, setRevealed] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)

  const selectedDeck = decks.find((deck) => deck.id === selectedId) ?? null
  const currentCard =
    selectedDeck && queue.length > 0
      ? selectedDeck.cards.find((card) => card.id === queue[0]) ?? null
      : null

  const totalCards = decks.reduce((acc, deck) => acc + deck.cards.length, 0)
  const totalDue = decks.reduce((acc, deck) => acc + dueCards(deck.cards, today).length, 0)
  const decksAtDay = decks.filter((deck) => dueCards(deck.cards, today).length === 0).length

  /* ------------------------------- actions ------------------------------- */

  function submitDeck(event: FormEvent) {
    event.preventDefault()
    const clean = deckName.trim()
    if (!clean) return
    actions.addDeck(clean)
    setDeckName('')
  }

  function submitCard(event: FormEvent) {
    event.preventDefault()
    if (!selectedDeck) return
    const cleanFront = front.trim()
    const cleanBack = back.trim()
    if (!cleanFront || !cleanBack) return
    actions.addCard(selectedDeck.id, cleanFront, cleanBack)
    setFront('')
    setBack('')
  }

  function openDeck(id: string) {
    setSelectedId(id)
    setDeletingDeck(null)
    setDeletingCard(null)
    setReviewing(false)
    setQueue([])
    setReviewed(new Set<string>())
    setRevealed(false)
  }

  function removeDeck(id: string) {
    actions.removeDeck(id)
    setDeletingDeck(null)
    if (selectedId === id) {
      setSelectedId(null)
      setReviewing(false)
      setQueue([])
      setReviewed(new Set<string>())
      setRevealed(false)
    }
  }

  function removeCard(deckId: string, cardId: string) {
    actions.removeCard(deckId, cardId)
    setDeletingCard(null)
    setQueue((prev) => prev.filter((id) => id !== cardId))
  }

  function startReview(deck: Deck) {
    const ids = deck.cards.filter((card) => isDue(card, today)).map((card) => card.id)
    if (ids.length === 0) return
    setQueue(ids)
    setReviewed(new Set<string>())
    setRevealed(false)
    setReviewing(true)
  }

  function exitReview() {
    setReviewing(false)
    setQueue([])
    setReviewed(new Set<string>())
    setRevealed(false)
  }

  const rate = useCallback(
    (rating: Rating) => {
      const deck = selectedDeck
      const cardId = queue[0]
      if (!deck || !cardId) return
      if (reviewed.has(cardId)) {
        setQueue((prev) => prev.slice(1))
        return
      }

      actions.reviewCard(deck.id, cardId, rating)

      const nextReviewed = new Set(reviewed)
      nextReviewed.add(cardId)
      setReviewed(nextReviewed)

      /* Recompute from the deck itself so a card can never come back in the
         same session: it is due tomorrow at the earliest, and reviewed ids are
         filtered out explicitly as a second guard. */
      setQueue(
        deck.cards
          .filter(
            (card) => card.id !== cardId && isDue(card, today) && !nextReviewed.has(card.id),
          )
          .map((card) => card.id),
      )
      setRevealed(false)
    },
    [queue, reviewed, selectedDeck, today],
  )

  /* Keyboard: Space reveals, 1-4 grade, but never while typing in a field. */
  useEffect(() => {
    if (!reviewing) return

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (typing) return

      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        if (!revealed) setRevealed(true)
        return
      }

      if (!revealed) return

      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < RATINGS.length) {
        event.preventDefault()
        const option = RATINGS[index]
        if (option) rate(option.id)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reviewing, revealed, rate])

  /* ------------------------------- review -------------------------------- */

  if (reviewing && selectedDeck) {
    const total = reviewed.size + queue.length
    const position = total === 0 ? 0 : Math.min(reviewed.size + 1, total)
    const remainingDue = dueCards(selectedDeck.cards, today).length
    const nextDue = earliestDue(selectedDeck.cards)
    const gap = nextDue ? diffDays(today, nextDue) : 0

    return (
      <div className="animate-rise">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={exitReview} className="btn btn-ghost text-xs">
              <ArrowLeft className="size-3.5" />
              Volver al mazo
            </button>
            <Chip tone="primary" className="max-w-[55%] truncate">
              {selectedDeck.name}
            </Chip>
          </div>

          {queue.length === 0 ? (
            <Card className="p-6 text-center sm:p-8">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-grow-soft text-grow-text">
                <CheckCircle2 className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                Sesión completada
              </h2>
              <p className="mt-1 text-sm text-ink-2">
                {reviewed.size === 1 ? 'Repasaste 1 tarjeta' : `Repasaste ${reviewed.size} tarjetas`}{' '}
                de <span className="font-medium text-ink">{selectedDeck.name}</span>.
              </p>

              <div className="mt-5 rounded-xl bg-surface-3 px-4 py-3">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  Próximo repaso
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {nextDue && gap > 0
                    ? `${dayMonthShort(nextDue)} · en ${gap} ${gap === 1 ? 'día' : 'días'}`
                    : 'Todo al día'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {remainingDue > 0 && (
                  <button
                    type="button"
                    onClick={() => startReview(selectedDeck)}
                    className="btn btn-primary text-sm"
                  >
                    <Play className="size-4" />
                    Repasar {remainingDue} pendientes
                  </button>
                )}
                <button type="button" onClick={exitReview} className="btn btn-outline text-sm">
                  Volver al mazo
                </button>
              </div>
            </Card>
          ) : currentCard ? (
            <Card className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">Repaso de hoy</span>
                <span className="num text-xs font-medium text-ink-2">
                  {position} de {total}
                </span>
              </div>
              <ProgressBar
                value={(reviewed.size / total) * 100}
                tone="primary"
                className="mt-2.5"
                label="Avance del repaso"
              />

              <div className="mt-7">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  Frente
                </p>
                <p className="mt-2 text-lg font-medium leading-snug text-ink [overflow-wrap:anywhere] sm:text-xl">
                  {currentCard.front}
                </p>
              </div>

              {revealed ? (
                <div className="animate-fade mt-6 border-t border-line pt-5">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
                    Reverso
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2 [overflow-wrap:anywhere]">
                    {currentCard.back}
                  </p>
                </div>
              ) : (
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-xs text-ink-3">Pensá la respuesta antes de mirar.</p>
                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="btn btn-primary mt-3 w-full gap-2 sm:w-auto"
                  >
                    Mostrar respuesta
                    <Key>Espacio</Key>
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-ink-2">Esta tarjeta ya no está disponible.</p>
              <button
                type="button"
                onClick={() => setQueue((prev) => prev.slice(1))}
                className="btn btn-outline mt-4 text-xs"
              >
                Continuar
              </button>
            </Card>
          )}

          {revealed && queue.length > 0 && currentCard && (
            <div className="animate-fade mt-4">
              <p className="mb-2 text-center text-[0.6875rem] text-ink-3">
                ¿Cómo te salió? También podés usar las teclas 1 a 4.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map((rating, index) => (
                  <RatingButton
                    key={rating.id}
                    rating={rating}
                    index={index}
                    onPick={() => rate(rating.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* -------------------------------- library ------------------------------ */

  const selectedDue = selectedDeck ? dueCards(selectedDeck.cards, today).length : 0

  return (
    <div className="animate-rise">
      <ViewHead
        eyebrow="Repetición espaciada"
        title="Memoria que aguanta."
        body="Armá mazos por materia y repasá solo lo que está por vencerse. Menos tarjetas por sesión, más retención a largo plazo."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <Stat
            label="Para repasar hoy"
            value={totalDue}
            hint={totalDue > 0 ? 'Vencen hoy' : 'Todo al día'}
            tone="primary"
            icon={CalendarDays}
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Tarjetas"
            value={totalCards}
            hint={`En ${decks.length} ${decks.length === 1 ? 'mazo' : 'mazos'}`}
            icon={BookOpen}
          />
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <Stat
            label="Mazos al día"
            value={decksAtDay}
            hint={decks.length === 0 ? 'Sin mazos todavía' : `De ${decks.length}`}
            tone="grow"
            icon={Layers}
          />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ----------------------------- Deck list ---------------------------- */}
        <Card>
          <SectionHead title="Tus mazos" subtitle="Elegí uno para abrirlo" />

          <form onSubmit={submitDeck} className="mb-4 flex items-center gap-2">
            <input
              ref={nameInputRef}
              className="field min-w-0"
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Nombre del mazo"
              aria-label="Nombre del mazo nuevo"
              maxLength={60}
            />
            <button
              type="submit"
              disabled={!deckName.trim()}
              className="btn btn-primary shrink-0"
            >
              <Plus className="size-4" />
              Crear
            </button>
          </form>

          {decks.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Todavía no hay mazos"
              body="Un mazo agrupa las tarjetas de una misma materia. Empezá por el tema que tenés más fresco."
              action={
                <button
                  type="button"
                  onClick={() => nameInputRef.current?.focus()}
                  className="btn btn-outline text-xs"
                >
                  Crear el primer mazo
                </button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {decks.map((deck) => (
                <DeckRow
                  key={deck.id}
                  deck={deck}
                  due={dueCards(deck.cards, today).length}
                  selected={deck.id === selectedDeck?.id}
                  armed={deletingDeck === deck.id}
                  onSelect={() => openDeck(deck.id)}
                  onArmDelete={() => setDeletingDeck(deck.id)}
                  onCancelDelete={() => setDeletingDeck(null)}
                  onDelete={() => removeDeck(deck.id)}
                />
              ))}
            </ul>
          )}
        </Card>

        {/* ---------------------------- Deck detail --------------------------- */}
        <Card>
          {selectedDeck ? (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">
                    {selectedDeck.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-2">
                    {selectedDeck.cards.length}{' '}
                    {selectedDeck.cards.length === 1 ? 'tarjeta' : 'tarjetas'}
                    <span className="text-ink-3"> · </span>
                    {selectedDue > 0 ? `${selectedDue} para hoy` : 'Todo al día'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startReview(selectedDeck)}
                  disabled={selectedDue === 0}
                  className="btn btn-primary text-sm"
                >
                  <Play className="size-4" />
                  {selectedDue > 0 ? `Repasar ${selectedDue}` : 'Sin pendientes'}
                </button>
              </div>

              <form
                onSubmit={submitCard}
                className="mt-5 rounded-xl border border-dashed border-line-strong bg-surface-3 p-3 sm:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Frente" hint="La pregunta o el concepto.">
                    <input
                      className="field"
                      value={front}
                      onChange={(event) => setFront(event.target.value)}
                      placeholder="¿Qué es la mitosis?"
                      maxLength={220}
                    />
                  </Field>
                  <Field label="Reverso" hint="La respuesta, corta y clara.">
                    <input
                      className="field"
                      value={back}
                      onChange={(event) => setBack(event.target.value)}
                      placeholder="División celular que genera dos células idénticas."
                      maxLength={220}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!front.trim() || !back.trim()}
                    className="btn btn-outline text-xs"
                  >
                    <Plus className="size-3.5" />
                    Agregar tarjeta
                  </button>
                </div>
              </form>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">Tarjetas</h3>
                  <span className="text-[0.6875rem] text-ink-3">
                    {selectedDeck.cards.length} en total
                  </span>
                </div>

                {selectedDeck.cards.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      compact
                      icon={BookOpen}
                      title="Este mazo está vacío"
                      body="Agregá la primera tarjeta con una pregunta adelante y la respuesta atrás."
                    />
                  </div>
                ) : (
                  <ul className="flex flex-col">
                    {selectedDeck.cards.map((card) => (
                      <CardRow
                        key={card.id}
                        card={card}
                        today={today}
                        armed={deletingCard === card.id}
                        onArmDelete={() => setDeletingCard(card.id)}
                        onCancelDelete={() => setDeletingCard(null)}
                        onDelete={() => removeCard(selectedDeck.id, card.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center gap-4">
              <EmptyState
                icon={Layers}
                title="Elegí un mazo"
                body="Seleccioná un mazo de la lista para ver sus tarjetas, agregar nuevas y arrancar el repaso del día."
              />
              <div className="rounded-xl border border-line bg-surface-3 p-4">
                <p className="text-xs font-semibold text-ink">Atajos durante el repaso</p>
                <ul className="mt-2 flex flex-col gap-2 text-xs text-ink-2">
                  <li className="flex flex-wrap items-center gap-1.5">
                    <Key>Espacio</Key>
                    <span>muestra la respuesta</span>
                  </li>
                  <li className="flex flex-wrap items-center gap-1.5">
                    <Key>1</Key>
                    <span>Otra vez</span>
                    <span className="text-ink-3">·</span>
                    <Key>2</Key>
                    <span>Difícil</span>
                    <span className="text-ink-3">·</span>
                    <Key>3</Key>
                    <span>Bien</span>
                    <span className="text-ink-3">·</span>
                    <Key>4</Key>
                    <span>Fácil</span>
                  </li>
                  <li className="leading-relaxed text-ink-3">
                    El algoritmo calcula cuándo vuelve cada tarjeta. Una calificación baja la
                    trae antes; una alta, más adelante.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
