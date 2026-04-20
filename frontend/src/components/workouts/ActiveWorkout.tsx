import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../hooks/api'
import type { WorkoutLog } from '../../types'
import {
  buildExerciseHistory, searchLibrary, detectPR, estimate1RM, saveExerciseMeta, guessKind, guessMuscleGroups,
  type ExerciseHistory,
} from './exerciseLibrary'
import { RestTimer } from './RestTimer'
import {
  type LiveExercise, type LiveSet, type Intensity, type ExerciseKind, type MuscleGroup,
  type RoutineDay, type ActiveWorkoutState,
  loadActiveWorkout, saveActiveWorkout, clearActiveWorkout, loadWorkoutPrefs,
  MUSCLE_GROUPS,
} from './workoutTypes'

const I = {
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  run: <><circle cx="13" cy="4" r="2"/><path d="M4 22l3-8 3 2 2-3 4 4"/><path d="M11 15l-2 6"/><path d="M13 11l4-2 4 4"/></>,
  hourglass: <><path d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-300 hover:border-forged-purple/20 ${className}`}>
      {children}
    </div>
  )
}

const INTENSITY_COLORS: Record<Intensity, string> = {
  light: 'bg-blue-500/10 text-blue-400',
  moderate: 'bg-forged-green/10 text-forged-green',
  heavy: 'bg-forged-gold/10 text-forged-gold',
  max: 'bg-forged-red/10 text-forged-red',
}

const KIND_ICON: Record<ExerciseKind, React.ReactNode> = {
  strength: I.dumbbell,
  cardio: I.run,
  duration: I.hourglass,
}

// ══════════════════════════════════
// ACTIVE WORKOUT
// ══════════════════════════════════
interface ActiveWorkoutProps {
  workoutId: string
  dayName: string
  preloadedDay: RoutineDay | null
  onFinish: () => void
  onBack: () => void
  /** If resuming, this is the saved state */
  resumeState?: ActiveWorkoutState | null
}

export function ActiveWorkout({
  workoutId, dayName, preloadedDay, onFinish, onBack, resumeState,
}: ActiveWorkoutProps) {
  const prefs = loadWorkoutPrefs()

  // Initialize from resume state OR preloadedDay OR empty
  const [exercises, setExercises] = useState<LiveExercise[]>(() => {
    if (resumeState) return resumeState.exercises
    if (preloadedDay) {
      return preloadedDay.exercises.map(e => ({
        name: e.name,
        kind: e.kind,
        intensity: e.intensity,
        muscleGroups: e.muscleGroups ?? [],
        notes: e.notes,
        sets: Array.from({ length: e.sets }, () => ({
          weight: '', reps: e.reps, done: false,
          distance: e.kind === 'cardio' ? (e.targetDistance ? String(e.targetDistance) : '') : undefined,
          minutes: (e.kind === 'cardio' || e.kind === 'duration') ? (e.targetMinutes ? String(e.targetMinutes) : '') : undefined,
        })),
        distanceUnit: e.distanceUnit ?? prefs.defaultDistanceUnit,
      }))
    }
    return []
  })

  const [timer, setTimer] = useState<number>(resumeState?.timerSeconds ?? 0)
  const [timerRunning, setTimerRunning] = useState<boolean>(resumeState?.timerRunning ?? true)
  const [addSheetOpen, setAddSheetOpen] = useState<boolean>(false)
  const [history, setHistory] = useState<ExerciseHistory[]>([])
  const [saving, setSaving] = useState<boolean>(false)
  const [restTimerKey, setRestTimerKey] = useState<number | null>(null) // null = hidden; number = key so it remounts
  const [flashPR, setFlashPR] = useState<{ exerciseName: string; kind: 'weight' | 'est1rm'; value: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  // ── Load history (for prev column + PR detection + autocomplete) ──
  useEffect(() => {
    api.workout.getLogs(90).then((logs: WorkoutLog[]) => {
      setHistory(buildExerciseHistory(logs))
    }).catch(console.error)
  }, [])

  // ── Timer ──
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000)
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [timerRunning])

  // ── Persist state so resume works ──
  useEffect(() => {
    const state: ActiveWorkoutState = {
      workoutId, dayName,
      startedAt: resumeState?.startedAt ?? new Date().toISOString(),
      timerSeconds: timer,
      timerRunning,
      exercises,
    }
    saveActiveWorkout(state)
  }, [workoutId, dayName, timer, timerRunning, exercises, resumeState])

  // ── Totals ──
  const totalSets = exercises.reduce((s, e) => s + e.sets.filter(st => st.done).length, 0)
  const plannedSets = exercises.reduce((s, e) => s + e.sets.length, 0)
  const liveVolume = exercises.reduce((sum, ex) => {
    if (ex.kind !== 'strength') return sum
    return sum + ex.sets.reduce((acc, s) => {
      if (!s.done) return acc
      const w = parseFloat(s.weight) || 0
      const r = parseInt(s.reps) || 0
      return acc + w * r
    }, 0)
  }, 0)

  // ── Handlers ──
  const addExerciseFromLibrary = (ex: ExerciseHistory) => {
    setExercises(prev => [...prev, {
      name: ex.name,
      kind: ex.kind,
      intensity: 'moderate',
      muscleGroups: ex.muscleGroups,
      notes: '',
      sets: Array.from({ length: ex.kind === 'strength' ? 3 : 1 }, () => ({
        weight: '', reps: ex.kind === 'strength' ? '10' : '',
        done: false,
        distance: ex.kind === 'cardio' ? '' : undefined,
        minutes: (ex.kind === 'cardio' || ex.kind === 'duration') ? '' : undefined,
      })),
      distanceUnit: ex.kind === 'cardio' ? prefs.defaultDistanceUnit : undefined,
    }])
    setAddSheetOpen(false)
  }

  const addCustomExercise = (config: {
    name: string; kind: ExerciseKind; intensity: Intensity
    muscleGroups: MuscleGroup[]; notes: string
    sets: number; reps: string
  }) => {
    // Save metadata for future autocomplete
    saveExerciseMeta(config.name, { kind: config.kind, muscleGroups: config.muscleGroups })
    setExercises(prev => [...prev, {
      name: config.name,
      kind: config.kind,
      intensity: config.intensity,
      muscleGroups: config.muscleGroups,
      notes: config.notes,
      sets: Array.from({ length: config.sets || 1 }, () => ({
        weight: '', reps: config.reps || '10',
        done: false,
        distance: config.kind === 'cardio' ? '' : undefined,
        minutes: (config.kind === 'cardio' || config.kind === 'duration') ? '' : undefined,
      })),
      distanceUnit: config.kind === 'cardio' ? prefs.defaultDistanceUnit : undefined,
    }])
    setAddSheetOpen(false)
  }

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<LiveSet>) => {
    setExercises(prev => {
      const next = [...prev]
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.map((s, i) => i === setIdx ? { ...s, ...patch } : s) }
      return next
    })
  }

  const toggleSet = useCallback((exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const ex = prev[exIdx]
      const set = ex.sets[setIdx]
      const becomingDone = !set.done

      const next = [...prev]
      next[exIdx] = {
        ...ex,
        sets: ex.sets.map((s, i) => i === setIdx ? { ...s, done: becomingDone } : s),
      }

      // When marking a strength set done, check for PR
      if (becomingDone && ex.kind === 'strength') {
        const weight = parseFloat(set.weight) || 0
        const reps = parseInt(set.reps) || 0
        const pr = detectPR(ex.name, weight, reps, history)
        if (pr.kind === 'weight' || pr.kind === 'est1rm') {
          setFlashPR({ exerciseName: ex.name, kind: pr.kind, value: pr.newValue })
          setTimeout(() => setFlashPR(f => (f && f.exerciseName === ex.name ? null : f)), 3500)
        }
        // Auto-start rest timer if enabled
        if (prefs.autoStartRestTimer) {
          setRestTimerKey(Date.now())
        }
      }

      return next
    })
  }, [history, prefs.autoStartRestTimer])

  const addSet = (exIdx: number) => {
    setExercises(prev => {
      const next = [...prev]
      const last = next[exIdx].sets[next[exIdx].sets.length - 1]
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets, {
          weight: last?.weight || '',
          reps: last?.reps || '',
          done: false,
          distance: last?.distance,
          minutes: last?.minutes,
        }],
      }
      return next
    })
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const next = [...prev]
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.filter((_, i) => i !== setIdx) }
      return next
    })
  }

  const removeExercise = (exIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  // ── Finish ──
  const handleFinish = async () => {
    setSaving(true)
    try {
      for (const ex of exercises) {
        const done = ex.sets.filter(s => s.done)
        if (done.length === 0) continue

        if (ex.kind === 'strength') {
          await api.workout.logExercise(workoutId, {
            exerciseName: ex.name,
            setsCompleted: done.length,
            repsCompleted: done.map(s => s.reps).join(', '),
            weightUsed: parseFloat(done[0]?.weight) || 0,
            completed: true,
            notes: ex.notes || null,
          })
        } else if (ex.kind === 'cardio') {
          const s = done[0]
          const dist = parseFloat(s.distance ?? '') || 0
          const mins = parseFloat(s.minutes ?? '') || 0
          await api.workout.logExercise(workoutId, {
            exerciseName: ex.name,
            setsCompleted: 1,
            repsCompleted: `${dist} ${ex.distanceUnit ?? 'mi'} in ${mins} min`,
            weightUsed: 0,
            completed: true,
            notes: ex.notes || null,
          })
        } else {
          const s = done[0]
          const mins = parseFloat(s.minutes ?? '') || 0
          await api.workout.logExercise(workoutId, {
            exerciseName: ex.name,
            setsCompleted: done.length,
            repsCompleted: `${mins} min hold`,
            weightUsed: 0,
            completed: true,
            notes: ex.notes || null,
          })
        }
      }
      await api.workout.complete(workoutId)
      clearActiveWorkout()
      onFinish()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <div className="text-center">
          <p className="text-xs text-forged-text2 font-black uppercase tracking-widest">{dayName}</p>
          <p className="text-2xl font-black text-forged-purple tabular-nums leading-none mt-1">{fmtTimer(timer)}</p>
        </div>
        <button
          onClick={() => setTimerRunning(!timerRunning)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95
            ${timerRunning
              ? 'bg-forged-purple/10 text-forged-purple hover:bg-forged-purple/20'
              : 'bg-forged-green/10 text-forged-green hover:bg-forged-green/20'}`}
        >
          <Icon d={timerRunning ? I.pause : I.play} size={14} sw={2.5} />
        </button>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile value={exercises.length} label="Exercises" />
        <StatTile value={`${totalSets} / ${plannedSets || totalSets}`} label="Sets" />
        <StatTile value={liveVolume.toLocaleString()} label="Volume" accent />
      </div>

      {/* Rest timer (shows briefly after marking a set done) */}
      {restTimerKey !== null && (
        <RestTimer
          key={restTimerKey}
          defaultSeconds={prefs.restDefaultSeconds}
          onDismiss={() => setRestTimerKey(null)}
        />
      )}

      {/* PR flash */}
      {flashPR && (
        <div className="bg-gradient-to-r from-forged-gold/20 to-forged-gold/5 border border-forged-gold/50 rounded-xl p-3 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-forged-gold/25 flex items-center justify-center">
            <Icon d={I.flame} size={20} className="text-forged-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-forged-gold uppercase tracking-wider">
              New {flashPR.kind === 'weight' ? 'weight' : 'est. 1RM'} PR
            </p>
            <p className="text-sm font-black text-forged-text truncate">
              {flashPR.exerciseName} · {flashPR.value} lbs
            </p>
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((ex, exIdx) => (
        <ExerciseCard
          key={exIdx}
          exercise={ex}
          exIdx={exIdx}
          history={history.find(h => h.name.toLowerCase() === ex.name.toLowerCase())}
          onUpdateSet={updateSet}
          onToggleSet={toggleSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onRemove={() => removeExercise(exIdx)}
        />
      ))}

      {/* Add exercise button */}
      {!addSheetOpen && (
        <button onClick={() => setAddSheetOpen(true)}
          className="w-full py-3 rounded-xl text-sm font-bold text-forged-purple
            border border-dashed border-forged-purple/30 hover:bg-forged-purple/5
            active:scale-[0.99] transition-all flex items-center justify-center gap-2">
          <Icon d={I.plus} size={16} sw={2.5} />Add exercise
        </button>
      )}

      {/* Add sheet */}
      {addSheetOpen && (
        <AddExerciseSheet
          history={history}
          onPickFromLibrary={addExerciseFromLibrary}
          onCustom={addCustomExercise}
          onClose={() => setAddSheetOpen(false)}
        />
      )}

      {/* Finish */}
      {exercises.length > 0 && (
        <button onClick={handleFinish} disabled={saving}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-green text-white shadow-lg shadow-forged-green/30
            hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50
            flex items-center justify-center gap-2 sticky bottom-20">
          <Icon d={I.flag} size={20} sw={2.5} />
          {saving ? 'Saving...' : 'Finish workout'}
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════
// STAT TILE
// ══════════════════════════════════
function StatTile({ value, label, accent }: {
  value: string | number; label: string; accent?: boolean
}) {
  return (
    <div className="bg-forged-surface border border-forged-border rounded-xl p-3 text-center">
      <p className={`text-xl font-black tabular-nums ${accent ? 'text-forged-gold' : 'text-forged-text'}`}>
        {value}
      </p>
      <p className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

// ══════════════════════════════════
// EXERCISE CARD
// ══════════════════════════════════
function ExerciseCard({
  exercise, exIdx, history,
  onUpdateSet, onToggleSet, onAddSet, onRemoveSet, onRemove,
}: {
  exercise: LiveExercise
  exIdx: number
  history?: ExerciseHistory
  onUpdateSet: (exIdx: number, setIdx: number, patch: Partial<LiveSet>) => void
  onToggleSet: (exIdx: number, setIdx: number) => void
  onAddSet: (exIdx: number) => void
  onRemoveSet: (exIdx: number, setIdx: number) => void
  onRemove: () => void
}) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-forged-purple/10 flex items-center justify-center">
              <Icon d={KIND_ICON[exercise.kind]} size={12} className="text-forged-purple" />
            </div>
            <p className="text-sm font-black text-forged-text truncate">{exercise.name}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${INTENSITY_COLORS[exercise.intensity]}`}>
              {exercise.intensity}
            </span>
          </div>
          {exercise.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {exercise.muscleGroups.map(mg => (
                <span key={mg} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-forged-purple/15 text-forged-purple">
                  {mg}
                </span>
              ))}
            </div>
          )}
          {exercise.notes && <p className="text-[10px] text-forged-text2 mt-1">{exercise.notes}</p>}
        </div>
        <button onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all">
          <Icon d={I.trash} size={12} />
        </button>
      </div>

      {/* Previous session hint (strength only) */}
      {exercise.kind === 'strength' && history && (
        <div className="bg-forged-purple/8 border-l-2 border-forged-purple/40 rounded-r-lg px-2.5 py-1.5 mb-2">
          <p className="text-[9px] text-forged-purple font-black uppercase tracking-wider">
            Last session · {formatDate(history.lastDate)}
          </p>
          <p className="text-[10px] text-forged-text mt-0.5">
            Best weight: {history.bestWeight} lbs · Est 1RM: {history.bestEst1RM}
          </p>
        </div>
      )}

      {/* Set rows */}
      {exercise.kind === 'strength' && (
        <StrengthSets
          sets={exercise.sets}
          historyLast={history?.lastSets[0]}
          onUpdateSet={(i, p) => onUpdateSet(exIdx, i, p)}
          onToggleSet={(i) => onToggleSet(exIdx, i)}
          onRemoveSet={(i) => onRemoveSet(exIdx, i)}
        />
      )}

      {exercise.kind === 'cardio' && (
        <CardioRows
          sets={exercise.sets}
          unit={exercise.distanceUnit ?? 'mi'}
          onUpdateSet={(i, p) => onUpdateSet(exIdx, i, p)}
          onToggleSet={(i) => onToggleSet(exIdx, i)}
        />
      )}

      {exercise.kind === 'duration' && (
        <DurationRows
          sets={exercise.sets}
          onUpdateSet={(i, p) => onUpdateSet(exIdx, i, p)}
          onToggleSet={(i) => onToggleSet(exIdx, i)}
        />
      )}

      <button onClick={() => onAddSet(exIdx)}
        className="w-full mt-2 py-1.5 text-xs font-bold text-forged-purple border border-dashed border-forged-purple/30 rounded-lg hover:bg-forged-purple/5 transition-all">
        + Add set
      </button>
    </Card>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - d.getTime()) / (86400 * 1000))
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ══════════════════════════════════
// STRENGTH SETS
// ══════════════════════════════════
function StrengthSets({ sets, historyLast, onUpdateSet, onToggleSet, onRemoveSet }: {
  sets: LiveSet[]
  historyLast?: { weight: number; reps: string }
  onUpdateSet: (i: number, patch: Partial<LiveSet>) => void
  onToggleSet: (i: number) => void
  onRemoveSet: (i: number) => void
}) {
  return (
    <>
      <div className="grid grid-cols-[28px_1fr_1fr_1fr_36px] gap-2 mb-1 px-1">
        <span className="text-[9px] text-forged-text2 font-black uppercase text-center">Set</span>
        <span className="text-[9px] text-forged-text2 font-black uppercase">Prev</span>
        <span className="text-[9px] text-forged-text2 font-black uppercase">Lbs</span>
        <span className="text-[9px] text-forged-text2 font-black uppercase">Reps</span>
        <span className="text-[9px] text-forged-text2 font-black uppercase text-center">✓</span>
      </div>
      {sets.map((set, i) => {
        const prev = historyLast
          ? `${historyLast.weight}×${historyLast.reps.split(',')[0] ?? '?'}`
          : '—'
        return (
          <div key={i}
            className={`grid grid-cols-[28px_1fr_1fr_1fr_36px] gap-2 items-center py-1 rounded-lg transition-colors
              ${set.done ? 'bg-forged-green/5' : ''}`}>
            <button
              onClick={() => sets.length > 1 && onRemoveSet(i)}
              title={sets.length > 1 ? 'Remove set' : ''}
              className="text-xs font-black text-forged-text2 text-center hover:text-forged-red transition-colors"
            >
              {i + 1}
            </button>
            <span className="text-[10px] text-forged-text2 tabular-nums">{prev}</span>
            <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
              onChange={e => onUpdateSet(i, { weight: e.target.value })}
              className="px-2 py-1.5 bg-forged-bg border border-forged-border rounded-md text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
            />
            <input type="text" inputMode="numeric" placeholder="—" value={set.reps}
              onChange={e => onUpdateSet(i, { reps: e.target.value })}
              className="px-2 py-1.5 bg-forged-bg border border-forged-border rounded-md text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
            />
            <button onClick={() => onToggleSet(i)}
              className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center transition-all active:scale-90
                ${set.done
                  ? 'bg-forged-green text-white'
                  : 'border-2 border-forged-border text-forged-text2 hover:border-forged-green/40'}`}>
              <Icon d={I.check} size={14} sw={2.5} />
            </button>
          </div>
        )
      })}
      {/* Est 1RM strip (first set only) */}
      {sets[0] && sets[0].weight && sets[0].reps && (
        <p className="text-[10px] text-forged-text2 font-bold mt-1 text-right">
          Est 1RM: <span className="text-forged-purple tabular-nums">
            {estimate1RM(parseFloat(sets[0].weight) || 0, parseInt(sets[0].reps) || 0)}
          </span>
        </p>
      )}
    </>
  )
}

// ══════════════════════════════════
// CARDIO ROWS
// ══════════════════════════════════
function CardioRows({ sets, unit, onUpdateSet, onToggleSet }: {
  sets: LiveSet[]
  unit: 'km' | 'mi'
  onUpdateSet: (i: number, patch: Partial<LiveSet>) => void
  onToggleSet: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {sets.map((set, i) => {
        const d = parseFloat(set.distance ?? '') || 0
        const m = parseFloat(set.minutes ?? '') || 0
        const pace = d > 0 && m > 0 ? `${(m / d).toFixed(2)} min/${unit}` : ''
        return (
          <div key={i} className={`p-2.5 rounded-lg border transition-colors
            ${set.done
              ? 'bg-forged-green/5 border-forged-green/30'
              : 'bg-forged-bg border-forged-border'}`}>
            <div className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
              <div>
                <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider">Distance ({unit})</label>
                <input type="number" inputMode="decimal" placeholder="0" step="0.1" value={set.distance ?? ''}
                  onChange={e => onUpdateSet(i, { distance: e.target.value })}
                  className="w-full mt-1 px-2 py-1.5 bg-forged-surface border border-forged-border rounded-md text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider">Minutes</label>
                <input type="number" inputMode="decimal" placeholder="0" step="0.1" value={set.minutes ?? ''}
                  onChange={e => onUpdateSet(i, { minutes: e.target.value })}
                  className="w-full mt-1 px-2 py-1.5 bg-forged-surface border border-forged-border rounded-md text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
              <button onClick={() => onToggleSet(i)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all active:scale-90 mt-3
                  ${set.done
                    ? 'bg-forged-green text-white'
                    : 'border-2 border-forged-border text-forged-text2 hover:border-forged-green/40'}`}>
                <Icon d={I.check} size={14} sw={2.5} />
              </button>
            </div>
            {pace && (
              <p className="text-[10px] text-forged-green font-black mt-1.5">
                Pace: {pace}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════
// DURATION ROWS
// ══════════════════════════════════
function DurationRows({ sets, onUpdateSet, onToggleSet }: {
  sets: LiveSet[]
  onUpdateSet: (i: number, patch: Partial<LiveSet>) => void
  onToggleSet: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {sets.map((set, i) => (
        <div key={i} className={`p-2.5 rounded-lg border transition-colors
          ${set.done
            ? 'bg-forged-green/5 border-forged-green/30'
            : 'bg-forged-bg border-forged-border'}`}>
          <div className="grid grid-cols-[40px_1fr_36px] gap-2 items-center">
            <span className="text-xs font-black text-forged-text2 text-center">Set {i + 1}</span>
            <div>
              <input type="number" inputMode="decimal" placeholder="Minutes" step="0.1" value={set.minutes ?? ''}
                onChange={e => onUpdateSet(i, { minutes: e.target.value })}
                className="w-full px-2 py-1.5 bg-forged-surface border border-forged-border rounded-md text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
            <button onClick={() => onToggleSet(i)}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-all active:scale-90
                ${set.done
                  ? 'bg-forged-green text-white'
                  : 'border-2 border-forged-border text-forged-text2 hover:border-forged-green/40'}`}>
              <Icon d={I.check} size={14} sw={2.5} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════
// ADD EXERCISE SHEET (library search + custom)
// ══════════════════════════════════
function AddExerciseSheet({ history, onPickFromLibrary, onCustom, onClose }: {
  history: ExerciseHistory[]
  onPickFromLibrary: (ex: ExerciseHistory) => void
  onCustom: (config: {
    name: string; kind: ExerciseKind; intensity: Intensity
    muscleGroups: MuscleGroup[]; notes: string; sets: number; reps: string
  }) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'search' | 'custom'>('search')

  // Custom form state
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ExerciseKind>('strength')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [muscles, setMuscles] = useState<MuscleGroup[]>([])
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [notes, setNotes] = useState('')

  // Auto-guess on name change
  useEffect(() => {
    if (!name) return
    setKind(guessKind(name))
    const guessed = guessMuscleGroups(name)
    if (guessed.length > 0) setMuscles(guessed)
  }, [name])

  const results = searchLibrary(history, query)

  const toggleMuscle = (mg: MuscleGroup) => {
    setMuscles(prev => prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg])
  }

  const handleCustomSubmit = () => {
    if (!name.trim()) return
    onCustom({
      name: name.trim(),
      kind, intensity, muscleGroups: muscles, notes,
      sets: parseInt(sets) || 3,
      reps,
    })
  }

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-forged-text uppercase tracking-wider">
          {mode === 'search' ? 'Add from library' : 'Custom exercise'}
        </p>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.x} size={14} sw={2} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-forged-bg rounded-lg p-0.5 gap-0.5 mb-3">
        <button onClick={() => setMode('search')}
          className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all
            ${mode === 'search' ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}>
          Library
        </button>
        <button onClick={() => setMode('custom')}
          className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all
            ${mode === 'custom' ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}>
          Custom
        </button>
      </div>

      {mode === 'search' && (
        <>
          <div className="relative mb-2">
            <Icon d={I.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forged-text2" />
            <input type="text" placeholder="Search your exercises..." value={query} autoFocus
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
            />
          </div>
          {results.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-forged-text2">No matches. Try Custom.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {results.map(ex => (
                <button key={ex.name} onClick={() => onPickFromLibrary(ex)}
                  className="flex items-center justify-between p-2.5 bg-forged-bg rounded-lg border border-forged-border hover:border-forged-purple/40 active:scale-[0.98] transition-all text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forged-text truncate">{ex.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {ex.muscleGroups.slice(0, 3).map(mg => (
                        <span key={mg} className="text-[8px] font-black px-1.5 py-0.5 rounded bg-forged-purple/15 text-forged-purple">
                          {mg}
                        </span>
                      ))}
                      <span className="text-[9px] text-forged-text2">{ex.sessionCount} sessions</span>
                    </div>
                  </div>
                  {ex.lastSets[0] && (
                    <span className="text-[10px] text-forged-text2 ml-2">Last: {ex.lastSets[0].weight}×{(ex.lastSets[0].reps ?? '').split(',')[0]}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'custom' && (
        <div className="flex flex-col gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
            placeholder="Exercise name"
            className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
          />

          {/* Kind */}
          <div>
            <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider block mb-1">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['strength', 'cardio', 'duration'] as const).map(k => (
                <button key={k} onClick={() => setKind(k)}
                  className={`py-2 rounded-lg text-xs font-black capitalize transition-all flex items-center justify-center gap-1
                    ${kind === k ? 'bg-forged-purple text-white' : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>
                  <Icon d={KIND_ICON[k]} size={12} sw={2} />{k}
                </button>
              ))}
            </div>
          </div>

          {/* Sets / reps (strength) */}
          {kind === 'strength' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider block mb-1">Sets</label>
                <input type="number" value={sets} onChange={e => setSets(e.target.value)} min={1}
                  className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider block mb-1">Reps</label>
                <input type="text" value={reps} onChange={e => setReps(e.target.value)}
                  className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm text-center tabular-nums focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Intensity */}
          {kind === 'strength' && (
            <div>
              <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider block mb-1">Intensity</label>
              <div className="grid grid-cols-4 gap-1">
                {(['light', 'moderate', 'heavy', 'max'] as const).map(i => (
                  <button key={i} onClick={() => setIntensity(i)}
                    className={`py-1.5 rounded text-[10px] font-black capitalize transition-all
                      ${intensity === i
                        ? INTENSITY_COLORS[i] + ' border border-current'
                        : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Muscle groups */}
          <div>
            <label className="text-[9px] text-forged-text2 font-black uppercase tracking-wider block mb-1">Muscle groups</label>
            <div className="flex flex-wrap gap-1">
              {MUSCLE_GROUPS.map(mg => (
                <button key={mg} onClick={() => toggleMuscle(mg)}
                  className={`px-2 py-1 rounded text-[10px] font-black transition-all
                    ${muscles.includes(mg)
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors"
          />

          <button onClick={handleCustomSubmit} disabled={!name.trim()}
            className="w-full py-2.5 rounded-lg bg-forged-purple text-white font-black text-xs
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
            Add exercise
          </button>
        </div>
      )}
    </Card>
  )
}