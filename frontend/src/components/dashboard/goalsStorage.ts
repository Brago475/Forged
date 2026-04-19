const GOALS_KEY = 'forged:daily-goals'
const CHECKS_KEY = 'forged:daily-goal-checks'

export type ResetCadence = 'daily' | 'weekly' | 'manual'

/**
 * A goal the user tracks daily. "auto" goals are computed from app data
 * (e.g. "protein hit" from macros); "custom" goals are manually checked.
 */
export interface DailyGoal {
  id: string
  label: string
  /** Optional numeric target (e.g. "8 glasses", "10000 steps"). */
  target?: number
  targetUnit?: string
  /** How often the goal resets. */
  cadence: ResetCadence
  /** Built-in auto-tracked goals (meal logged, protein hit, etc.) */
  autoKind?: 'mealLogged' | 'workoutDone' | 'fastActive' | 'proteinHit' | 'underCalories'
  /** Hidden goals stay in storage but don't render — used for default goals the user dismissed. */
  hidden?: boolean
  order: number
}

export interface GoalCheck {
  goalId: string
  /** ISO date (YYYY-MM-DD) for daily, ISO week (YYYY-Wxx) for weekly, date for manual. */
  period: string
  checked: boolean
  /** For numeric targets, the current value entered (optional). */
  value?: number
}

/**
 * Auto-goals that ship with the app. User can hide / rename / change cadence,
 * but not delete outright — they reappear if re-enabled in the manage modal.
 */
export const DEFAULT_GOALS: DailyGoal[] = [
  { id: 'auto-meal',    label: 'Log at least 1 meal',     cadence: 'daily', autoKind: 'mealLogged',    order: 0 },
  { id: 'auto-workout', label: 'Complete a workout',      cadence: 'daily', autoKind: 'workoutDone',   order: 1 },
  { id: 'auto-fast',    label: 'Start a fast',            cadence: 'daily', autoKind: 'fastActive',    order: 2 },
  { id: 'auto-protein', label: 'Hit protein goal',        cadence: 'daily', autoKind: 'proteinHit',    order: 3 },
  { id: 'auto-cal',     label: 'Stay under calorie goal', cadence: 'daily', autoKind: 'underCalories', order: 4 },
]

/**
 * Load all goals. On first run, seeds with defaults.
 */
export function loadDailyGoals(): DailyGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) {
      saveDailyGoals(DEFAULT_GOALS)
      return DEFAULT_GOALS
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_GOALS
    return parsed
  } catch {
    return DEFAULT_GOALS
  }
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  } catch {
    // ignore
  }
}

/**
 * Load all check records. Each record is one goal's state in one time period.
 */
export function loadGoalChecks(): GoalCheck[] {
  try {
    const raw = localStorage.getItem(CHECKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGoalChecks(checks: GoalCheck[]): void {
  try {
    localStorage.setItem(CHECKS_KEY, JSON.stringify(checks))
  } catch {
    // ignore
  }
}

/**
 * The "period" key for a goal on a given date. Determines when the goal resets.
 */
export function getPeriodKey(cadence: ResetCadence, date: Date = new Date()): string {
  if (cadence === 'daily') {
    return date.toISOString().split('T')[0]
  }
  if (cadence === 'weekly') {
    // ISO week: YYYY-Wxx
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
  }
  // manual: one key forever until user resets
  return 'manual'
}

/**
 * Find or create the current-period check for a given goal.
 */
export function getCurrentCheck(goal: DailyGoal, checks: GoalCheck[]): GoalCheck {
  const period = getPeriodKey(goal.cadence)
  const found = checks.find(c => c.goalId === goal.id && c.period === period)
  return found ?? { goalId: goal.id, period, checked: false }
}

/**
 * Toggle a goal's check status for the current period. Returns updated checks array.
 */
export function toggleGoalCheck(goalId: string, goal: DailyGoal, checks: GoalCheck[]): GoalCheck[] {
  const period = getPeriodKey(goal.cadence)
  const idx = checks.findIndex(c => c.goalId === goalId && c.period === period)
  if (idx === -1) {
    return [...checks, { goalId, period, checked: true }]
  }
  const copy = [...checks]
  copy[idx] = { ...copy[idx], checked: !copy[idx].checked }
  return copy
}

/**
 * Compute the current streak of consecutive completed periods for a goal.
 * Returns 0 if not checked for current period, otherwise counts back.
 */
export function getStreak(goal: DailyGoal, checks: GoalCheck[]): number {
  if (goal.cadence === 'manual') {
    const c = checks.find(ch => ch.goalId === goal.id && ch.period === 'manual')
    return c?.checked ? 1 : 0
  }

  let streak = 0
  const cursor = new Date()
  // Look back up to 365 periods
  for (let i = 0; i < 365; i++) {
    const period = getPeriodKey(goal.cadence, cursor)
    const check = checks.find(c => c.goalId === goal.id && c.period === period)
    if (check?.checked) {
      streak++
    } else {
      break
    }
    // Step backwards
    if (goal.cadence === 'daily') {
      cursor.setDate(cursor.getDate() - 1)
    } else {
      cursor.setDate(cursor.getDate() - 7)
    }
  }
  return streak
}

/**
 * Generate a unique id for a new custom goal.
 */
export function makeGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}