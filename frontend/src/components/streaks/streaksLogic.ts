import type { FoodLog, WorkoutLog } from '../../types'

export type StreakType = 'logging' | 'workout' | 'protein' | 'calories'

export interface StreakData {
  type: StreakType
  label: string
  sublabel: string
  currentStreak: number
  bestStreak: number
  activeDays: Set<string> // YYYY-MM-DD strings
}

export interface StreakFreeze {
  monthKey: string  // YYYY-MM
  usedDate: string  // YYYY-MM-DD where the freeze was applied
}

const FREEZE_KEY = 'forged:streak-freezes'

export function loadFreezes(): StreakFreeze[] {
  try {
    const raw = localStorage.getItem(FREEZE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveFreezes(freezes: StreakFreeze[]): void {
  try { localStorage.setItem(FREEZE_KEY, JSON.stringify(freezes)) } catch { /* ignore */ }
}

export function hasFreezeBeenUsedThisMonth(): boolean {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return loadFreezes().some(f => f.monthKey === monthKey)
}

export function useFreeze(date: string): void {
  const monthKey = date.slice(0, 7)
  const freezes = loadFreezes()
  if (freezes.some(f => f.monthKey === monthKey)) return
  freezes.push({ monthKey, usedDate: date })
  saveFreezes(freezes)
}

// ──────────────────────────────
// Streak calc
// ──────────────────────────────

/**
 * Walk backward from today. Count consecutive days with activity.
 * Stop when we hit a day with no activity (but allow 1 freeze per month).
 */
export function computeCurrentStreak(activeDays: Set<string>): number {
  const freezes = loadFreezes()
  let count = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // If today isn't active yet, start from yesterday (streak continues if yesterday was good)
  const today = cursor.toISOString().split('T')[0]
  if (!activeDays.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  const usedFreezeThisMonth = new Set<string>()

  for (let i = 0; i < 365; i++) {
    const iso = cursor.toISOString().split('T')[0]
    const monthKey = iso.slice(0, 7)

    if (activeDays.has(iso)) {
      count++
    } else {
      // Was a freeze used on or before this day in the same month?
      const freezeAvailable = freezes.some(f => f.monthKey === monthKey && f.usedDate === iso)
        && !usedFreezeThisMonth.has(monthKey)
      if (freezeAvailable) {
        usedFreezeThisMonth.add(monthKey)
        count++
      } else {
        break
      }
    }

    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

/**
 * Scan all active days to find the longest consecutive run ever.
 * Freezes also apply here.
 */
export function computeBestStreak(activeDays: Set<string>): number {
  if (activeDays.size === 0) return 0

  const sorted = Array.from(activeDays).sort()
  const freezes = loadFreezes()
  let best = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 1) {
      current++
    } else if (diff === 2) {
      // One missing day - check if a freeze covers it
      const missedIso = new Date(prev.getTime() + 86400000).toISOString().split('T')[0]
      const monthKey = missedIso.slice(0, 7)
      if (freezes.some(f => f.monthKey === monthKey && f.usedDate === missedIso)) {
        current++
      } else {
        current = 1
      }
    } else {
      current = 1
    }
    if (current > best) best = current
  }
  return best
}

// ──────────────────────────────
// Build streak data from raw logs
// ──────────────────────────────

export function buildLoggingStreak(foodByDay: Map<string, FoodLog[]>): StreakData {
  const activeDays = new Set<string>()
  foodByDay.forEach((logs, date) => {
    if (logs.length > 0) activeDays.add(date)
  })
  return {
    type: 'logging',
    label: 'Logging streak',
    sublabel: 'Days with at least one meal logged',
    currentStreak: computeCurrentStreak(activeDays),
    bestStreak: computeBestStreak(activeDays),
    activeDays,
  }
}

export function buildWorkoutStreak(workouts: WorkoutLog[]): StreakData {
  const activeDays = new Set<string>()
  for (const w of workouts) {
    if (w.completed) activeDays.add(w.date)
  }
  return {
    type: 'workout',
    label: 'Workout streak',
    sublabel: 'Days with a completed workout',
    currentStreak: computeCurrentStreak(activeDays),
    bestStreak: computeBestStreak(activeDays),
    activeDays,
  }
}

export function buildProteinStreak(foodByDay: Map<string, FoodLog[]>, proteinGoal: number): StreakData {
  const activeDays = new Set<string>()
  foodByDay.forEach((logs, date) => {
    const total = logs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
    if (total >= proteinGoal) activeDays.add(date)
  })
  return {
    type: 'protein',
    label: 'Protein streak',
    sublabel: `Days hitting ${proteinGoal}g+`,
    currentStreak: computeCurrentStreak(activeDays),
    bestStreak: computeBestStreak(activeDays),
    activeDays,
  }
}

export function buildCaloriesStreak(foodByDay: Map<string, FoodLog[]>, calGoal: number): StreakData {
  const activeDays = new Set<string>()
  foodByDay.forEach((logs, date) => {
    const total = logs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
    if (total > 0 && total <= calGoal) activeDays.add(date)
  })
  return {
    type: 'calories',
    label: 'Calorie streak',
    sublabel: `Days at or under ${calGoal} cal`,
    currentStreak: computeCurrentStreak(activeDays),
    bestStreak: computeBestStreak(activeDays),
    activeDays,
  }
}

// ──────────────────────────────
// Heatmap grid
// ──────────────────────────────

export interface HeatmapCell {
  date: string
  active: boolean
  dayOfWeek: number // 0 = Mon, 6 = Sun
}

/**
 * Last 12 weeks (84 days) laid out as 12 columns x 7 rows.
 * Index 0 = 12 weeks ago Monday, last cell = today.
 */
export function buildHeatmap(activeDays: Set<string>, weeks: number = 12): HeatmapCell[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDow = (today.getDay() + 6) % 7 // Mon = 0

  // Start = (weeks-1) weeks ago on Monday
  const start = new Date(today)
  start.setDate(start.getDate() - ((weeks - 1) * 7) - todayDow)

  const columns: HeatmapCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start)
      cell.setDate(cell.getDate() + (w * 7) + d)
      const iso = cell.toISOString().split('T')[0]
      if (cell <= today) {
        col.push({
          date: iso,
          active: activeDays.has(iso),
          dayOfWeek: d,
        })
      }
    }
    columns.push(col)
  }
  return columns
}

// ──────────────────────────────
// Milestones
// ──────────────────────────────

export interface StreakMilestone {
  days: number
  label: string
  description: string
}

export const MILESTONES: StreakMilestone[] = [
  { days: 3,   label: '3 days',   description: 'Getting started' },
  { days: 7,   label: '1 week',   description: 'Habit forming' },
  { days: 14,  label: '2 weeks',  description: 'Locked in' },
  { days: 30,  label: '30 days',  description: 'A full month' },
  { days: 60,  label: '60 days',  description: 'Rewiring the brain' },
  { days: 100, label: '100 days', description: 'Identity level' },
  { days: 180, label: '6 months', description: 'Legendary' },
  { days: 365, label: '1 year',   description: 'Forged' },
]

export function findNextMilestone(current: number): StreakMilestone | null {
  return MILESTONES.find(m => m.days > current) ?? null
}

// ──────────────────────────────
// Comparison
// ──────────────────────────────

export function countActiveDaysInMonth(activeDays: Set<string>, year: number, month: number): number {
  let count = 0
  activeDays.forEach(iso => {
    const [y, m] = iso.split('-').map(Number)
    if (y === year && m === month + 1) count++
  })
  return count
}

export interface MonthComparison {
  thisMonth: { year: number; month: number; count: number; total: number; label: string }
  lastMonth: { year: number; month: number; count: number; total: number; label: string }
  delta: number
}

export function buildMonthComparison(activeDays: Set<string>): MonthComparison {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const lastDate = new Date(thisYear, thisMonth - 1, 1)
  const lastYear = lastDate.getFullYear()
  const lastMonth = lastDate.getMonth()

  const thisCount = countActiveDaysInMonth(activeDays, thisYear, thisMonth)
  const lastCount = countActiveDaysInMonth(activeDays, lastYear, lastMonth)
  const daysInThisMonth = new Date(thisYear, thisMonth + 1, 0).getDate()
  const daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate()
  const daysElapsedThisMonth = Math.min(now.getDate(), daysInThisMonth)

  const monthLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })

  return {
    thisMonth: {
      year: thisYear, month: thisMonth, count: thisCount,
      total: daysElapsedThisMonth,
      label: monthLabel(now),
    },
    lastMonth: {
      year: lastYear, month: lastMonth, count: lastCount,
      total: daysInLastMonth,
      label: monthLabel(lastDate),
    },
    delta: thisCount - lastCount,
  }
}

// ──────────────────────────────
// Recovery copy
// ──────────────────────────────

export function getRecoveryMessage(currentStreak: number, bestStreak: number): string | null {
  if (currentStreak >= 1) return null
  if (bestStreak === 0) return 'Log today to start your first streak.'
  if (bestStreak < 7) return 'Your last streak reset. Every pro misses — just start again.'
  if (bestStreak < 30) return `Your best was ${bestStreak} days. That wasn't luck — you can rebuild it.`
  return `You've had a ${bestStreak}-day run before. Reset today, the next one will be longer.`
}