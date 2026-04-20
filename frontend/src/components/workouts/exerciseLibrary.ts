import type { WorkoutLog, ExerciseLog } from '../../types'
import type { MuscleGroup, ExerciseKind } from './workoutTypes'

export interface ExerciseHistory {
  name: string
  kind: ExerciseKind
  muscleGroups: MuscleGroup[]
  sessionCount: number
  lastDate: string
  lastSets: Array<{ weight: number; reps: string }>
  bestWeight: number
  bestEst1RM: number
  bestVolume: number  // single-session total volume
}

const LIBRARY_KEY = 'forged:exercise-library'

/**
 * User-edited metadata about exercises (kind + muscle groups).
 * Keyed by canonical exercise name (lowercased).
 */
interface ExerciseMeta {
  kind?: ExerciseKind
  muscleGroups?: MuscleGroup[]
}

export function loadExerciseMeta(): Record<string, ExerciseMeta> {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveExerciseMeta(name: string, meta: ExerciseMeta): void {
  try {
    const all = loadExerciseMeta()
    all[name.toLowerCase()] = { ...all[name.toLowerCase()], ...meta }
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// ──────────────────────────────
// Guess muscle groups from name (heuristic fallback)
// ──────────────────────────────

const MUSCLE_KEYWORDS: Array<[MuscleGroup, RegExp]> = [
  ['chest', /\b(bench|chest|fly|pec|push[- ]?up|dip)\b/i],
  ['back', /\b(row|pull[- ]?up|chin[- ]?up|lat|deadlift|pulldown|shrug)\b/i],
  ['shoulders', /\b(ohp|overhead press|shoulder|lateral|front raise|rear delt|arnold)\b/i],
  ['biceps', /\b(curl|biceps|chin[- ]?up|preacher)\b/i],
  ['triceps', /\b(tricep|skull|pushdown|close grip|dip|extension)\b/i],
  ['legs', /\b(squat|leg|lunge|split|calf|hamstring|quad|press|rdl)\b/i],
  ['glutes', /\b(hip thrust|glute|bridge|kickback)\b/i],
  ['core', /\b(crunch|plank|ab|core|leg raise|sit[- ]?up|hanging)\b/i],
  ['forearms', /\b(forearm|wrist curl)\b/i],
  ['calves', /\b(calf)\b/i],
]

export function guessMuscleGroups(name: string): MuscleGroup[] {
  const hits: MuscleGroup[] = []
  for (const [mg, re] of MUSCLE_KEYWORDS) {
    if (re.test(name)) hits.push(mg)
  }
  return Array.from(new Set(hits))
}

/**
 * Guess exercise kind from name. Defaults to strength.
 */
export function guessKind(name: string): ExerciseKind {
  const cardio = /\b(run|running|walk|walking|cycle|cycling|bike|biking|row(ing)?|swim|jog|treadmill|elliptical)\b/i
  const duration = /\b(plank|hold|iso|stretch|yoga|meditation)\b/i
  if (cardio.test(name)) return 'cardio'
  if (duration.test(name)) return 'duration'
  return 'strength'
}

// ──────────────────────────────
// Estimated 1RM (Epley formula)
// ──────────────────────────────

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 0 || weight === 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// ──────────────────────────────
// Build full exercise history from backend workout logs
// ──────────────────────────────

export function buildExerciseHistory(logs: WorkoutLog[]): ExerciseHistory[] {
  const byName = new Map<string, ExerciseHistory>()
  const meta = loadExerciseMeta()

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  for (const log of sortedLogs) {
    if (!log.exercises) continue
    for (const ex of log.exercises) {
      const key = ex.exerciseName.toLowerCase()
      const m = meta[key] ?? {}
      const kind = m.kind ?? guessKind(ex.exerciseName)
      const muscleGroups = m.muscleGroups ?? guessMuscleGroups(ex.exerciseName)

      const existing = byName.get(key)
      const weight = ex.weightUsed ?? 0
      const repsStr = ex.repsCompleted ?? ''
      const firstReps = parseInt(repsStr.split(',')[0]) || 0
      const est1rm = estimate1RM(weight, firstReps)
      const volume = weight * firstReps * (ex.setsCompleted ?? 1)

      if (!existing) {
        byName.set(key, {
          name: ex.exerciseName,
          kind,
          muscleGroups,
          sessionCount: 1,
          lastDate: log.date,
          lastSets: [{ weight, reps: repsStr }],
          bestWeight: weight,
          bestEst1RM: est1rm,
          bestVolume: volume,
        })
      } else {
        existing.sessionCount++
        if (log.date > existing.lastDate) {
          existing.lastDate = log.date
          existing.lastSets = [{ weight, reps: repsStr }]
        }
        existing.bestWeight = Math.max(existing.bestWeight, weight)
        existing.bestEst1RM = Math.max(existing.bestEst1RM, est1rm)
        existing.bestVolume = Math.max(existing.bestVolume, volume)
      }
    }
  }

  return Array.from(byName.values())
    .sort((a, b) => b.sessionCount - a.sessionCount)
}

export function searchLibrary(history: ExerciseHistory[], query: string, limit: number = 8): ExerciseHistory[] {
  if (!query || query.trim().length < 1) return history.slice(0, limit)
  const q = query.toLowerCase().trim()
  return history
    .filter(h => h.name.toLowerCase().includes(q))
    .slice(0, limit)
}

// ──────────────────────────────
// PR detection (live during workout)
// ──────────────────────────────

export interface PRResult {
  kind: 'weight' | 'est1rm' | 'volume' | 'none'
  previousBest: number
  newValue: number
}

export function detectPR(
  exerciseName: string,
  weight: number,
  reps: number,
  history: ExerciseHistory[],
): PRResult {
  if (weight === 0 || reps === 0) return { kind: 'none', previousBest: 0, newValue: 0 }
  const existing = history.find(h => h.name.toLowerCase() === exerciseName.toLowerCase())
  if (!existing) return { kind: 'none', previousBest: 0, newValue: 0 }

  if (weight > existing.bestWeight) {
    return { kind: 'weight', previousBest: existing.bestWeight, newValue: weight }
  }
  const est1rm = estimate1RM(weight, reps)
  if (est1rm > existing.bestEst1RM) {
    return { kind: 'est1rm', previousBest: existing.bestEst1RM, newValue: est1rm }
  }
  return { kind: 'none', previousBest: 0, newValue: 0 }
}

// ──────────────────────────────
// Session-level helpers (volume, duration summary)
// ──────────────────────────────

/** Total volume (weight × reps × sets) across all completed exercises in a WorkoutLog. */
export function workoutVolume(log: WorkoutLog): number {
  if (!log.exercises) return 0
  return log.exercises.reduce((sum, ex) => {
    const weight = ex.weightUsed ?? 0
    const reps = parseInt((ex.repsCompleted ?? '').split(',')[0]) || 0
    const sets = ex.setsCompleted ?? 0
    return sum + weight * reps * sets
  }, 0)
}

/** Collect unique muscle groups touched by a workout. */
export function workoutMuscleGroups(log: WorkoutLog): MuscleGroup[] {
  if (!log.exercises) return []
  const meta = loadExerciseMeta()
  const mgs = new Set<MuscleGroup>()
  for (const ex of log.exercises) {
    const key = ex.exerciseName.toLowerCase()
    const saved = meta[key]?.muscleGroups ?? guessMuscleGroups(ex.exerciseName)
    for (const m of saved) mgs.add(m)
  }
  return Array.from(mgs)
}

/** Count PRs set in this specific workout (by comparing to history excluding this log). */
export function prsInWorkout(log: WorkoutLog, historyExcludingThis: ExerciseHistory[]): number {
  if (!log.exercises) return 0
  let count = 0
  for (const ex of log.exercises) {
    const weight = ex.weightUsed ?? 0
    const reps = parseInt((ex.repsCompleted ?? '').split(',')[0]) || 0
    const pr = detectPR(ex.exerciseName, weight, reps, historyExcludingThis)
    if (pr.kind !== 'none') count++
  }
  return count
}

export type { ExerciseLog }