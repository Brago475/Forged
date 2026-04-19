const EXTRAS_KEY = 'forged:profile-extras'
const PREFS_KEY = 'forged:profile-prefs'

export type Sex = 'male' | 'female' | 'other' | 'prefer_not'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type GoalType = 'lose_fat' | 'maintain' | 'build_muscle' | 'recomp'
export type WorkoutStyle = 'ppl' | 'upper_lower' | 'full_body' | 'bro_split' | 'crossfit' | 'calisthenics' | 'home' | 'mixed'

/**
 * Profile data not yet persisted server-side. Kept in localStorage until the
 * backend schema catches up — see FORGED-backend-todo.md.
 */
export interface ProfileExtras {
  avatarDataUrl?: string
  bio?: string
  age?: number
  sex?: Sex
  activityLevel?: ActivityLevel
  goalType?: GoalType
  workoutStyle?: WorkoutStyle
  workoutsPerWeekTarget?: number
  dietaryRestrictions?: string[]
  allergens?: string[]
  medicalNotes?: string
}

export interface Preferences {
  weightUnit: 'lbs' | 'kg'
  heightUnit: 'in' | 'cm'
  distanceUnit: 'mi' | 'km'
  energyUnit: 'cal' | 'kj'
}

const DEFAULT_PREFS: Preferences = {
  weightUnit: 'lbs',
  heightUnit: 'in',
  distanceUnit: 'mi',
  energyUnit: 'cal',
}

export function loadProfileExtras(): ProfileExtras {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveProfileExtras(extras: ProfileExtras): void {
  try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras)) } catch { /* ignore */ }
}

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch { return DEFAULT_PREFS }
}

export function savePreferences(prefs: Preferences): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
}

// ───── Display labels ─────

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  lose_fat: 'Lose fat',
  maintain: 'Maintain',
  build_muscle: 'Build muscle',
  recomp: 'Recomposition',
}

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly active',
  moderate: 'Moderately active',
  active: 'Very active',
  very_active: 'Extremely active',
}

export const ACTIVITY_LEVEL_DESC: Record<ActivityLevel, string> = {
  sedentary: 'Desk job, little to no exercise',
  light: 'Light exercise 1-3 days per week',
  moderate: 'Moderate exercise 3-5 days per week',
  active: 'Hard exercise 6-7 days per week',
  very_active: 'Hard daily exercise plus physical job',
}

export const WORKOUT_STYLE_LABEL: Record<WorkoutStyle, string> = {
  ppl: 'Push / Pull / Legs',
  upper_lower: 'Upper / Lower',
  full_body: 'Full body',
  bro_split: 'Bro split',
  crossfit: 'CrossFit',
  calisthenics: 'Calisthenics',
  home: 'Home workouts',
  mixed: 'Mixed or varied',
}

export const COMMON_DIETARY: string[] = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Low carb',
  'Low fat', 'Paleo', 'Gluten-free', 'Dairy-free', 'Halal',
  'Kosher', 'Mediterranean',
]

export const COMMON_ALLERGENS: string[] = [
  'Peanuts', 'Tree nuts', 'Dairy', 'Eggs', 'Shellfish',
  'Fish', 'Soy', 'Wheat', 'Sesame',
]

// ───── Achievements ─────

export interface AchievementsContext {
  workouts: number
  currentStreak: number
  bestStreak: number
  weightLost: number
  longestFastHours: number
  mealsLogged: number
  daysActive: number
}

export interface AchievementBadge {
  id: string
  label: string
  description: string
  iconPath: React.ReactNode
  unlocked: boolean
  progress?: string
}

/**
 * Simple SVG path primitives used in achievement icons. Inline children of <svg>.
 */
const ICON = {
  utensils: <><path d="M3 2v7a3 3 0 003 3v10"/><path d="M9 2v7a3 3 0 01-3 3"/><path d="M15 2v20"/><path d="M20 8v14"/><path d="M20 2a3 3 0 00-3 3v6h3"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  flame: <><path d="M13 2s1 4 4 6.5c2.5 2.1 3.5 5 3.5 7.5a7.5 7.5 0 01-15 0c0-2.5 1-4.5 3-6 0 2 1 3 2 3 0-5 2.5-8 2.5-11z"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
}

interface AchievementDef {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  check: (ctx: AchievementsContext) => { unlocked: boolean; progress?: string }
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_meal', label: 'First meal', description: 'Log your first meal.',
    icon: ICON.utensils,
    check: c => ({ unlocked: c.mealsLogged >= 1 }),
  },
  {
    id: 'first_workout', label: 'First workout', description: 'Complete your first workout.',
    icon: ICON.dumbbell,
    check: c => ({ unlocked: c.workouts >= 1 }),
  },
  {
    id: 'streak_7', label: '7 day streak', description: 'Log for seven days in a row.',
    icon: ICON.flame,
    check: c => ({ unlocked: c.currentStreak >= 7 || c.bestStreak >= 7, progress: `${Math.min(c.currentStreak, 7)} / 7` }),
  },
  {
    id: 'streak_30', label: '30 day streak', description: 'A full month of consistency.',
    icon: ICON.flame,
    check: c => ({ unlocked: c.currentStreak >= 30 || c.bestStreak >= 30, progress: `${Math.min(c.currentStreak, 30)} / 30` }),
  },
  {
    id: 'streak_100', label: '100 day streak', description: 'Triple digits of showing up.',
    icon: ICON.trophy,
    check: c => ({ unlocked: c.bestStreak >= 100, progress: `${Math.min(c.bestStreak, 100)} / 100` }),
  },
  {
    id: 'workouts_10', label: '10 workouts', description: 'Ten sessions in the books.',
    icon: ICON.dumbbell,
    check: c => ({ unlocked: c.workouts >= 10, progress: `${Math.min(c.workouts, 10)} / 10` }),
  },
  {
    id: 'workouts_50', label: '50 workouts', description: 'Half a century of sessions.',
    icon: ICON.dumbbell,
    check: c => ({ unlocked: c.workouts >= 50, progress: `${Math.min(c.workouts, 50)} / 50` }),
  },
  {
    id: 'workouts_100', label: '100 workouts', description: 'Elite consistency.',
    icon: ICON.trophy,
    check: c => ({ unlocked: c.workouts >= 100, progress: `${Math.min(c.workouts, 100)} / 100` }),
  },
  {
    id: 'meals_100', label: '100 meals', description: 'A hundred logged meals.',
    icon: ICON.utensils,
    check: c => ({ unlocked: c.mealsLogged >= 100, progress: `${Math.min(c.mealsLogged, 100)} / 100` }),
  },
  {
    id: 'meals_500', label: '500 meals', description: 'Serious nutrition tracking.',
    icon: ICON.star,
    check: c => ({ unlocked: c.mealsLogged >= 500, progress: `${Math.min(c.mealsLogged, 500)} / 500` }),
  },
  {
    id: 'lost_5', label: 'First 5 lbs', description: 'First five pounds lost.',
    icon: ICON.scale,
    check: c => ({ unlocked: c.weightLost >= 5, progress: `${Math.min(c.weightLost, 5).toFixed(1)} / 5 lbs` }),
  },
  {
    id: 'lost_10', label: 'First 10 lbs', description: 'Double digits in the rearview.',
    icon: ICON.scale,
    check: c => ({ unlocked: c.weightLost >= 10, progress: `${Math.min(c.weightLost, 10).toFixed(1)} / 10 lbs` }),
  },
  {
    id: 'lost_20', label: 'First 20 lbs', description: 'A real transformation.',
    icon: ICON.trophy,
    check: c => ({ unlocked: c.weightLost >= 20, progress: `${Math.min(c.weightLost, 20).toFixed(1)} / 20 lbs` }),
  },
  {
    id: 'lost_50', label: '50 lbs club', description: 'Fifty pounds lost. Rare air.',
    icon: ICON.star,
    check: c => ({ unlocked: c.weightLost >= 50, progress: `${Math.min(c.weightLost, 50).toFixed(1)} / 50 lbs` }),
  },
  {
    id: 'fast_18', label: 'Fast 18 hours', description: 'Completed an 18 hour fast.',
    icon: ICON.clock,
    check: c => ({ unlocked: c.longestFastHours >= 18 }),
  },
  {
    id: 'fast_24', label: 'Fast 24 hours', description: 'A full day without eating.',
    icon: ICON.clock,
    check: c => ({ unlocked: c.longestFastHours >= 24 }),
  },
  {
    id: 'active_30', label: '30 active days', description: 'Thirty days of activity logged.',
    icon: ICON.zap,
    check: c => ({ unlocked: c.daysActive >= 30, progress: `${Math.min(c.daysActive, 30)} / 30` }),
  },
  {
    id: 'active_100', label: '100 active days', description: 'Hundred days of showing up.',
    icon: ICON.zap,
    check: c => ({ unlocked: c.daysActive >= 100, progress: `${Math.min(c.daysActive, 100)} / 100` }),
  },
]

export function computeAchievements(ctx: AchievementsContext): AchievementBadge[] {
  return ACHIEVEMENTS.map(def => {
    const state = def.check(ctx)
    return {
      id: def.id,
      label: def.label,
      description: def.description,
      iconPath: def.icon,
      unlocked: state.unlocked,
      progress: state.progress,
    }
  })
}

// ───── Data export / import ─────

/**
 * All known FORGED localStorage keys. Used for export, import, and clear.
 */
export const FORGED_STORAGE_KEYS: string[] = [
  'forged:food-goals',
  'forged:daily-goals',
  'forged:daily-goal-checks',
  'forged:daily-goal-values',
  'forged:body-goals',
  'forged:profile-extras',
  'forged:profile-prefs',
  'forged_goals',
]

export interface ExportBundle {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

export function exportAllData(): ExportBundle {
  const data: Record<string, unknown> = {}
  for (const key of FORGED_STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try { data[key] = JSON.parse(raw) }
      catch { data[key] = raw }
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function importAllData(bundle: ExportBundle): { imported: number; failed: string[] } {
  let imported = 0
  const failed: string[] = []
  if (!bundle?.data) return { imported, failed: ['Invalid bundle'] }

  for (const key of Object.keys(bundle.data)) {
    if (!FORGED_STORAGE_KEYS.includes(key)) continue
    try {
      localStorage.setItem(key, JSON.stringify(bundle.data[key]))
      imported++
    } catch {
      failed.push(key)
    }
  }
  return { imported, failed }
}

export function clearAllForgedData(): void {
  for (const key of FORGED_STORAGE_KEYS) {
    localStorage.removeItem(key)
  }
}