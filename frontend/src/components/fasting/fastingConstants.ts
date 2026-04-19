export interface FastingPreset {
  id: string
  name: string
  hours: number
  eat: number
  meals: number
  color: string
  /** Key from the shared I icon library. */
  iconKey: 'clock' | 'flame' | 'zap' | 'moon'
  desc: string
}

export const PRESETS: readonly FastingPreset[] = [
  {
    id: '16:8',
    name: 'Lean Gains',
    hours: 16,
    eat: 8,
    meals: 3,
    color: '#3498db',
    iconKey: 'clock',
    desc: 'Most popular. Skip breakfast, eat lunch to dinner.',
  },
  {
    id: '18:6',
    name: 'Steady Burn',
    hours: 18,
    eat: 6,
    meals: 2,
    color: '#2ecc71',
    iconKey: 'flame',
    desc: 'Tighter window. Lunch and early dinner.',
  },
  {
    id: '20:4',
    name: 'Warrior',
    hours: 20,
    eat: 4,
    meals: 1,
    color: '#f39c12',
    iconKey: 'zap',
    desc: 'One big meal with a small snack window.',
  },
  {
    id: 'OMAD',
    name: 'One Meal',
    hours: 23,
    eat: 1,
    meals: 1,
    color: '#9b59b6',
    iconKey: 'moon',
    desc: 'All daily calories in a single sitting.',
  },
] as const

/**
 * Find a preset by target hours. Returns a generic "Custom" entry
 * if no built-in preset matches.
 */
export function getPreset(hours: number): FastingPreset {
  return (
    PRESETS.find(p => p.hours === hours) ?? {
      id: `${hours}h`,
      name: 'Custom',
      hours,
      eat: 24 - hours,
      meals: 0,
      color: '#e74c3c',
      iconKey: 'flame' as const,
      desc: 'Custom fast',
    }
  )
}

// ── Calendar legend (derived from presets) ───────────────────────

export const FASTING_LEGEND = [
  ...PRESETS.map(p => ({ color: p.color, label: p.id })),
  { color: '#e74c3c', label: 'Custom' },
]

// ── Local storage types and helpers ─────────────────────────────

export interface FastRecord {
  id: string
  name: string
  hours: number
  meals: number
  mealTimes: string[]
  notes: string
  startTime: string
  endTime: string
  /** YYYY-MM-DD */
  date: string
}

export interface CustomFast {
  id: string
  name: string
  hours: number
  eat: number
  meals: number
  mealTimes: string[]
  notes: string
  color: string
}

const FASTS_KEY = 'forged_fasts'
const CUSTOM_KEY = 'forged_custom_fasts'

export function loadFasts(): FastRecord[] {
  try {
    return JSON.parse(localStorage.getItem(FASTS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveFasts(fasts: FastRecord[]): void {
  localStorage.setItem(FASTS_KEY, JSON.stringify(fasts))
}

export function loadCustomFasts(): CustomFast[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCustomFasts(fasts: CustomFast[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(fasts))
}

/**
 * Format seconds into hours, minutes, seconds object.
 */
export function formatTime(totalSeconds: number): {
  h: number
  m: number
  s: number
} {
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: Math.floor(totalSeconds % 60),
  }
}

/**
 * Calculate streak: consecutive days with at least one fast,
 * counting backwards from today.
 */
export function calculateStreak(history: FastRecord[]): number {
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    if (history.some(f => f.date === dateStr)) {
      streak++
    } else {
      break
    }
  }

  return streak
}

const EAT_WINDOW_KEY = 'forged:eatwindow'

/**
 * Load the custom eating window hours saved for a given fast (or null if none).
 */
export function loadCustomEatHours(fastId: string): number | null {
  try {
    const raw = localStorage.getItem(`${EAT_WINDOW_KEY}:${fastId}`)
    if (!raw) return null
    const n = parseFloat(raw)
    return isNaN(n) ? null : n
  } catch {
    return null
  }
}

/**
 * Persist a custom eating window duration (hours) for a given fast.
 */
export function saveCustomEatHours(fastId: string, hours: number): void {
  try {
    localStorage.setItem(`${EAT_WINDOW_KEY}:${fastId}`, String(hours))
  } catch {
    // Storage unavailable, silent fail
  }
}

/**
 * Clear a fast's custom eating window override (call when the fast ends).
 */
export function clearCustomEatHours(fastId: string): void {
  try {
    localStorage.removeItem(`${EAT_WINDOW_KEY}:${fastId}`)
  } catch {
    // ignore
  }
}

const START_TIME_KEY = 'forged:starttime'
const TARGET_HOURS_KEY = 'forged:targethours'

/**
 * Load a saved start-time override for a fast (ISO string, or null).
 */
export function loadCustomStartTime(fastId: string): string | null {
  try {
    return localStorage.getItem(`${START_TIME_KEY}:${fastId}`)
  } catch {
    return null
  }
}

export function saveCustomStartTime(fastId: string, isoTime: string): void {
  try {
    localStorage.setItem(`${START_TIME_KEY}:${fastId}`, isoTime)
  } catch {
    // ignore
  }
}

export function clearCustomStartTime(fastId: string): void {
  try {
    localStorage.removeItem(`${START_TIME_KEY}:${fastId}`)
  } catch {
    // ignore
  }
}

/**
 * Load a saved target-hours override for a fast (or null).
 */
export function loadCustomTargetHours(fastId: string): number | null {
  try {
    const raw = localStorage.getItem(`${TARGET_HOURS_KEY}:${fastId}`)
    if (!raw) return null
    const n = parseFloat(raw)
    return isNaN(n) ? null : n
  } catch {
    return null
  }
}

export function saveCustomTargetHours(fastId: string, hours: number): void {
  try {
    localStorage.setItem(`${TARGET_HOURS_KEY}:${fastId}`, String(hours))
  } catch {
    // ignore
  }
}

export function clearCustomTargetHours(fastId: string): void {
  try {
    localStorage.removeItem(`${TARGET_HOURS_KEY}:${fastId}`)
  } catch {
    // ignore
  }
}