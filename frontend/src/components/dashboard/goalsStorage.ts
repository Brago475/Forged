const GOALS_KEY = 'forged:daily-goals'
const CHECKS_KEY = 'forged:daily-goal-checks'
const VALUES_KEY = 'forged:daily-goal-values'

export type ResetCadence = 'daily' | 'weekly' | 'manual'

/**
 * All possible app-connected behaviors a goal can auto-track.
 * Extend this union when adding new trackable metrics.
 */
export type AutoKind =
  // Existing defaults
  | 'mealLogged'
  | 'workoutDone'
  | 'fastActive'
  | 'proteinHit'
  | 'underCalories'
  // App-connected custom options
  | 'waterGlasses'
  | 'stepsWalked'
  | 'workoutsThisWeek'
  | 'weightLoggedToday'
  | 'caloriesLogged'
  | 'macroHit'
  | 'sleepHours'
  | 'gymDaysPerWeek'
  | 'fastTargetHit'
  | 'bodyweightChange'

/**
 * Metadata for each app-connected goal type — used by the picker.
 */
export interface AutoKindInfo {
  kind: AutoKind
  label: string
  defaultTarget?: number
  defaultUnit?: string
  defaultCadence: ResetCadence
  description: string
  /** Supports a numeric input field (vs pure boolean check). */
  numeric: boolean
  /** If the progress value is a user-entered running tally (e.g. water glasses). */
  userEntered?: boolean
  /** Which macro key when kind === 'macroHit'. Set via config. */
  macroKey?: 'protein' | 'carbs' | 'fat' | 'fiber'
}

/**
 * Catalog of auto-connected goal options. The first five are the defaults
 * every user starts with. The rest are opt-in via the "Add Goal" flow.
 */
export const AUTO_KIND_CATALOG: AutoKindInfo[] = [
  // ─── Fully automatic (we can actually detect these) ───
  { kind: 'mealLogged',       label: 'Log at least 1 meal',       defaultCadence: 'daily', numeric: false, description: 'Auto-checks when any food is logged today.' },
  { kind: 'caloriesLogged',   label: 'Log any calories',          defaultCadence: 'daily', numeric: false, description: 'Auto-checks when food is logged.' },
  { kind: 'fastActive',       label: 'Start a fast',              defaultCadence: 'daily', numeric: false, description: 'Auto-checks when a fasting timer is running.' },
  { kind: 'fastTargetHit',    label: 'Complete fast target',      defaultCadence: 'daily', numeric: false, description: 'Auto-checks when a fast reaches its target hours.' },
  { kind: 'proteinHit',       label: 'Hit protein goal',          defaultCadence: 'daily', numeric: false, description: 'Auto-checks using your protein goal from Food settings.' },
  { kind: 'underCalories',    label: 'Stay under calorie goal',   defaultCadence: 'daily', numeric: false, description: 'Auto-checks using your calorie goal from Food settings.' },
  { kind: 'macroHit',         label: 'Hit fiber goal',            defaultTarget: 30, defaultUnit: 'g', defaultCadence: 'daily', numeric: true, macroKey: 'fiber', description: 'Auto-tracks from food log. Target 30g fiber.' },

  // ─── Tap to check / enter (we can\'t auto-detect these without extra logs) ───
  { kind: 'workoutDone',      label: 'Complete a workout',        defaultCadence: 'daily',  numeric: false, description: 'Tap to check off when you finish a workout.' },
  { kind: 'workoutsThisWeek', label: 'Workouts this week',        defaultTarget: 4,  defaultUnit: 'workouts', defaultCadence: 'weekly', numeric: true, userEntered: true, description: 'Tap + each time you complete a workout.' },
  { kind: 'gymDaysPerWeek',   label: 'Gym days per week',         defaultTarget: 5,  defaultUnit: 'days',     defaultCadence: 'weekly', numeric: true, userEntered: true, description: 'Tap + each gym day. Resets weekly.' },
  { kind: 'weightLoggedToday',label: 'Log weight today',          defaultCadence: 'daily', numeric: false, description: 'Tap to check off after logging weight.' },
  { kind: 'waterGlasses',     label: 'Drink water',               defaultTarget: 8,  defaultUnit: 'glasses',  defaultCadence: 'daily',  numeric: true, userEntered: true, description: 'Tap + each glass. Resets daily.' },
  { kind: 'stepsWalked',      label: 'Walk steps',                defaultTarget: 10000, defaultUnit: 'steps', defaultCadence: 'daily', numeric: true, userEntered: true, description: 'Enter today\'s step count manually.' },
  { kind: 'sleepHours',       label: 'Sleep hours',               defaultTarget: 8,  defaultUnit: 'hours',    defaultCadence: 'daily',  numeric: true, userEntered: true, description: 'Log how many hours you slept last night.' },
  { kind: 'bodyweightChange', label: 'Bodyweight vs goal',        defaultCadence: 'manual', numeric: false, description: 'Manually check when you hit your target weight.' },
]

/**
 * A goal the user tracks daily. Auto goals are computed from app data;
 * manual goals require user to tap the checkbox.
 */
export interface DailyGoal {
  id: string
  label: string
  /** Optional numeric target (e.g. "8 glasses", "10000 steps"). */
  target?: number
  targetUnit?: string
  /** How often the goal resets. */
  cadence: ResetCadence
  /** Auto-connected kind. Omit for pure manual goals. */
  autoKind?: AutoKind
  /** Which macro this tracks, when autoKind = 'macroHit'. */
  macroKey?: 'protein' | 'carbs' | 'fat' | 'fiber'
  /** Hidden goals stay in storage but don't render — used for default goals the user dismissed. */
  hidden?: boolean
  order: number
}

export interface GoalCheck {
  goalId: string
  /** ISO date (YYYY-MM-DD) for daily, ISO week (YYYY-Wxx) for weekly, 'manual' for manual cadence. */
  period: string
  checked: boolean
}

/**
 * A running numeric value a user enters manually (water glasses, steps, sleep).
 * Stored per (goal, period).
 */
export interface GoalValue {
  goalId: string
  period: string
  value: number
}

/**
 * Default goals shipped with the app.
 */
export const DEFAULT_GOALS: DailyGoal[] = [
  { id: 'auto-meal',    label: 'Log at least 1 meal',     cadence: 'daily', autoKind: 'mealLogged',    order: 0 },
  { id: 'auto-workout', label: 'Complete a workout',      cadence: 'daily', autoKind: 'workoutDone',   order: 1 },
  { id: 'auto-fast',    label: 'Start a fast',            cadence: 'daily', autoKind: 'fastActive',    order: 2 },
  { id: 'auto-protein', label: 'Hit protein goal',        cadence: 'daily', autoKind: 'proteinHit',    order: 3 },
  { id: 'auto-cal',     label: 'Stay under calorie goal', cadence: 'daily', autoKind: 'underCalories', order: 4 },
]

// ───── Goals CRUD ─────

export function loadDailyGoals(): DailyGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) {
      saveDailyGoals(DEFAULT_GOALS)
      return DEFAULT_GOALS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_GOALS
  } catch {
    return DEFAULT_GOALS
  }
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)) } catch { /* ignore */ }
}

// ───── Check records ─────

export function loadGoalChecks(): GoalCheck[] {
  try {
    const raw = localStorage.getItem(CHECKS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGoalChecks(checks: GoalCheck[]): void {
  try { localStorage.setItem(CHECKS_KEY, JSON.stringify(checks)) } catch { /* ignore */ }
}

// ───── Numeric values (for user-entered goals) ─────

export function loadGoalValues(): GoalValue[] {
  try {
    const raw = localStorage.getItem(VALUES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGoalValues(vals: GoalValue[]): void {
  try { localStorage.setItem(VALUES_KEY, JSON.stringify(vals)) } catch { /* ignore */ }
}

export function getCurrentValue(goal: DailyGoal, values: GoalValue[]): number {
  const period = getPeriodKey(goal.cadence)
  return values.find(v => v.goalId === goal.id && v.period === period)?.value ?? 0
}

export function setCurrentValue(goal: DailyGoal, value: number, values: GoalValue[]): GoalValue[] {
  const period = getPeriodKey(goal.cadence)
  const idx = values.findIndex(v => v.goalId === goal.id && v.period === period)
  const clean = Math.max(0, value)
  if (idx === -1) return [...values, { goalId: goal.id, period, value: clean }]
  const copy = [...values]
  copy[idx] = { ...copy[idx], value: clean }
  return copy
}

// ───── Period helpers ─────

export function getPeriodKey(cadence: ResetCadence, date: Date = new Date()): string {
  if (cadence === 'daily') return date.toISOString().split('T')[0]
  if (cadence === 'weekly') {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
  }
  return 'manual'
}

export function getCurrentCheck(goal: DailyGoal, checks: GoalCheck[]): GoalCheck {
  const period = getPeriodKey(goal.cadence)
  const found = checks.find(c => c.goalId === goal.id && c.period === period)
  return found ?? { goalId: goal.id, period, checked: false }
}

export function toggleGoalCheck(goalId: string, goal: DailyGoal, checks: GoalCheck[]): GoalCheck[] {
  const period = getPeriodKey(goal.cadence)
  const idx = checks.findIndex(c => c.goalId === goalId && c.period === period)
  if (idx === -1) return [...checks, { goalId, period, checked: true }]
  const copy = [...checks]
  copy[idx] = { ...copy[idx], checked: !copy[idx].checked }
  return copy
}

/**
 * Compute streak: consecutive periods where goal was completed.
 */
export function getStreak(goal: DailyGoal, checks: GoalCheck[]): number {
  if (goal.cadence === 'manual') {
    const c = checks.find(ch => ch.goalId === goal.id && ch.period === 'manual')
    return c?.checked ? 1 : 0
  }

  let streak = 0
  const cursor = new Date()
  for (let i = 0; i < 365; i++) {
    const period = getPeriodKey(goal.cadence, cursor)
    const check = checks.find(c => c.goalId === goal.id && c.period === period)
    if (check?.checked) {
      streak++
    } else {
      break
    }
    if (goal.cadence === 'daily') {
      cursor.setDate(cursor.getDate() - 1)
    } else {
      cursor.setDate(cursor.getDate() - 7)
    }
  }
  return streak
}

export function makeGoalId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Get the AutoKindInfo for a given kind. Useful for defaults lookup.
 */
export function getAutoKindInfo(kind: AutoKind): AutoKindInfo | undefined {
  return AUTO_KIND_CATALOG.find(k => k.kind === kind)
}