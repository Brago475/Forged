const BODY_GOALS_KEY = 'forged:body-goals'

/**
 * User's body composition goals. Lives separately from food macros so
 * Progress can track long-term targets without polluting the Food Log editor.
 */
export interface BodyGoals {
  /** Starting weight when they began tracking. Used as the journey anchor. */
  startWeight?: number
  startDate?: string
  /** Target weight they're working toward. */
  goalWeight?: number
  /** Optional target date for hitting goal weight. */
  goalDate?: string
  /** Unit — for now just 'lbs', but the structure allows future kg support. */
  unit: 'lbs' | 'kg'
}

const DEFAULT_GOALS: BodyGoals = {
  unit: 'lbs',
}

export function loadBodyGoals(): BodyGoals {
  try {
    const raw = localStorage.getItem(BODY_GOALS_KEY)
    if (!raw) return DEFAULT_GOALS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_GOALS, ...parsed }
  } catch {
    return DEFAULT_GOALS
  }
}

export function saveBodyGoals(goals: BodyGoals): void {
  try { localStorage.setItem(BODY_GOALS_KEY, JSON.stringify(goals)) } catch { /* ignore */ }
}