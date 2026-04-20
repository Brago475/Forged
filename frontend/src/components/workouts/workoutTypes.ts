export type ExerciseKind = 'strength' | 'cardio' | 'duration'

export type Intensity = 'light' | 'moderate' | 'heavy' | 'max'

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'forearms', 'calves',
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

export interface RoutineExercise {
  name: string
  kind: ExerciseKind
  sets: number
  reps: string
  intensity: Intensity
  muscleGroups: MuscleGroup[]
  notes: string
  // Cardio / duration defaults:
  targetDistance?: number
  distanceUnit?: 'km' | 'mi'
  targetMinutes?: number
}

export interface RoutineDay {
  dayName: string
  exercises: RoutineExercise[]
}

export interface Routine {
  id: string
  name: string
  days: RoutineDay[]
  createdAt: string
}

// ── Live exercise in an active workout ──

export interface LiveSet {
  weight: string
  reps: string
  done: boolean
  // cardio / duration only:
  distance?: string
  minutes?: string
}

export interface LiveExercise {
  name: string
  kind: ExerciseKind
  intensity: Intensity
  muscleGroups: MuscleGroup[]
  notes: string
  sets: LiveSet[]
  distanceUnit?: 'km' | 'mi'
}

// ── Persistent "current workout" state for resume ──

export interface ActiveWorkoutState {
  workoutId: string
  dayName: string
  startedAt: string          // ISO
  timerSeconds: number
  timerRunning: boolean
  exercises: LiveExercise[]
}

const ACTIVE_KEY = 'forged:active-workout'

export function loadActiveWorkout(): ActiveWorkoutState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveActiveWorkout(state: ActiveWorkoutState): void {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export function clearActiveWorkout(): void {
  try { localStorage.removeItem(ACTIVE_KEY) } catch { /* ignore */ }
}

// ── User preferences for workouts ──

export interface WorkoutPrefs {
  restDefaultSeconds: number
  autoStartRestTimer: boolean
  defaultDistanceUnit: 'km' | 'mi'
}

const WORKOUT_PREFS_KEY = 'forged:workout-prefs'

export const DEFAULT_WORKOUT_PREFS: WorkoutPrefs = {
  restDefaultSeconds: 90,
  autoStartRestTimer: true,
  defaultDistanceUnit: 'mi',
}

export function loadWorkoutPrefs(): WorkoutPrefs {
  try {
    const raw = localStorage.getItem(WORKOUT_PREFS_KEY)
    if (!raw) return DEFAULT_WORKOUT_PREFS
    return { ...DEFAULT_WORKOUT_PREFS, ...JSON.parse(raw) }
  } catch { return DEFAULT_WORKOUT_PREFS }
}

export function saveWorkoutPrefs(prefs: WorkoutPrefs): void {
  try { localStorage.setItem(WORKOUT_PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
}