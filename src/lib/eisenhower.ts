import type { QuadrantId } from './types'

export interface Quadrant {
  id: QuadrantId
  label: string
  subtitle: string
  action: string
  /** Token name used to colour the quadrant. Blue = focus, green = growth, amber = energy, neutral = drop. */
  tone: 'primary' | 'grow' | 'spark' | 'neutral'
}

export const QUADRANTS: Quadrant[] = [
  {
    id: 'do',
    label: 'Hacer ahora',
    subtitle: 'Urgente e importante',
    action: 'Entra hoy en tu bloque de foco.',
    tone: 'primary',
  },
  {
    id: 'plan',
    label: 'Planificar',
    subtitle: 'Importante, no urgente',
    action: 'Acá vive el estudio profundo. Reservalo.',
    tone: 'grow',
  },
  {
    id: 'delegate',
    label: 'Delegar',
    subtitle: 'Urgente, no importante',
    action: 'Interrupciones de otros. Agrupá y resolvé.',
    tone: 'spark',
  },
  {
    id: 'drop',
    label: 'Descartar',
    subtitle: 'Ni urgente ni importante',
    action: 'Decile que no. Protegé tu atención.',
    tone: 'neutral',
  },
]

export const quadrantById = (id: QuadrantId): Quadrant =>
  QUADRANTS.find((q) => q.id === id) ?? QUADRANTS[3]

/** `YYYY-MM-DDTHH` slot keys keep time blocks stable across reloads. */
export function slotKey(day: string, hour: number): string {
  return `${day}T${String(hour).padStart(2, '0')}`
}

export function parseSlot(key: string): { day: string; hour: number } {
  const [day, hour] = key.split('T')
  return { day, hour: Number(hour) }
}
