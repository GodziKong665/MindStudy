/** Domain types for MindStudy. Persisted shape is versioned in `storage.ts`. */

export type ThemeMode = 'light' | 'dark'

export type TimerModeId = 'pomodoro' | 'deep' | 'custom'

export interface TimerSettings {
  modeId: TimerModeId
  customFocusMin: number
  customBreakMin: number
  ambientId: string | null
  volume: number
}

/** The single source of truth for every gamification metric. */
export interface FocusSession {
  id: string
  modeId: TimerModeId
  completedAt: string
  minutes: number
}

/** Eisenhower quadrants. `do` = urgent+important, `plan` = important, `delegate` = urgent, `drop` = neither. */
export type QuadrantId = 'do' | 'plan' | 'delegate' | 'drop'

export interface Task {
  id: string
  title: string
  estimateMin: number
  done: boolean
  quadrant: QuadrantId
  /** `YYYY-MM-DDTHH` time-block key, or null when the task sits in the backlog. */
  slotKey: string | null
  createdAt: string
}

export interface Capture {
  id: string
  text: string
  createdAt: string
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: string
  front: string
  back: string
  ease: number
  interval: number
  repetitions: number
  due: string
}

export interface Deck {
  id: string
  name: string
  cards: Flashcard[]
}

export interface StudyTopic {
  id: string
  name: string
  /** Difficulty 1..5 — scales the base workload. */
  weight: number
  baseMinutes: number
}

export interface StudyPlanInput {
  examDate: string
  topics: StudyTopic[]
  dailyMinutes: number
}

export interface PlanItem {
  topicId: string
  label: string
  minutes: number
  review: boolean
}

export interface PlanDay {
  date: string
  items: PlanItem[]
  totalMinutes: number
}

export interface StudyPlan {
  days: PlanDay[]
  totalMinutes: number
  capacityMinutes: number
  feasible: boolean
  deficitMinutes: number
  examDate: string
}

export type PlantStage = 0 | 1 | 2 | 3

export interface GardenPlant {
  id: string
  species: number
  stage: PlantStage
  minutes: number
  plantedAt: string
}

export interface AppState {
  version: number
  theme: ThemeMode
  introSeen: boolean
  timer: TimerSettings
  sessions: FocusSession[]
  tasks: Task[]
  captures: Capture[]
  decks: Deck[]
  studyPlan: StudyPlanInput
}
