const GOALS_KEY = 'forged:foodgoals'

export interface FoodGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const DEFAULT_GOALS: FoodGoals = {
  calories: 2400,
  protein: 180,
  carbs: 250,
  fat: 65,
}

/**
 * Load persisted daily nutrition goals, or defaults.
 */
export function loadGoals(): FoodGoals {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) return DEFAULT_GOALS
    const parsed = JSON.parse(raw)
    return {
      calories: parsed.calories ?? DEFAULT_GOALS.calories,
      protein: parsed.protein ?? DEFAULT_GOALS.protein,
      carbs: parsed.carbs ?? DEFAULT_GOALS.carbs,
      fat: parsed.fat ?? DEFAULT_GOALS.fat,
    }
  } catch {
    return DEFAULT_GOALS
  }
}

/**
 * Persist daily nutrition goals.
 */
export function saveGoals(goals: FoodGoals): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  } catch {
    // ignore
  }
}

/**
 * Warning status for a nutrient value vs its goal.
 * - ok: under 80%
 * - close: 80-99%
 * - over: 100%+
 */
export type WarnLevel = 'ok' | 'close' | 'over'

export function getWarnLevel(value: number, goal: number): WarnLevel {
  if (goal <= 0) return 'ok'
  const pct = value / goal
  if (pct >= 1) return 'over'
  if (pct >= 0.8) return 'close'
  return 'ok'
}