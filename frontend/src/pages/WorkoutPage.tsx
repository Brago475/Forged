import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import type { WorkoutLog, ExerciseLog } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/><path d="M7 7L5 5"/><path d="M17 17l2 2"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin="round" className={className}>{d}</svg>
  )
}

// ══════════════════════════════════
// SHARED UI
// ══════════════════════════════════
function Card({ children, className = '', delay = 0, hero = false }: {
  children: React.ReactNode; className?: string; delay?: number; hero?: boolean
}) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${hero ? 'shadow-lg shadow-forged-purple/5' : ''}
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// WORKOUT PAGE (3 views)
// ══════════════════════════════════
type View = 'home' | 'active' | 'builder'

export default function WorkoutPage() {
  const [view, setView] = useState<View>('home')
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)

  const startWorkout = async (planType?: string, dayName?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const result = await api.workout.create({
        date: today,
        planType: planType || 'custom',
        dayName: dayName || 'Workout',
      })
      setActiveWorkoutId(result.id)
      setView('active')
    } catch (e) { console.error(e) }
  }

  const finishWorkout = async () => {
    if (activeWorkoutId) {
      try { await api.workout.complete(activeWorkoutId) } catch (e) { console.error(e) }
    }
    setActiveWorkoutId(null)
    setView('home')
  }

  if (view === 'active' && activeWorkoutId) {
    return <ActiveWorkout workoutId={activeWorkoutId} onFinish={finishWorkout} onBack={() => setView('home')} />
  }

  if (view === 'builder') {
    return <WorkoutBuilder onBack={() => setView('home')} onStart={startWorkout} />
  }

  return <WorkoutHome onStart={startWorkout} onBuilder={() => setView('builder')} />
}

// ══════════════════════════════════
// WORKOUT HOME
// ══════════════════════════════════
function WorkoutHome({ onStart, onBuilder }: {
  onStart: (planType?: string, dayName?: string) => void
  onBuilder: () => void
}) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.workout.getLogs(10).then(setLogs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // PPL presets
  const presets = [
    { name: 'Push Day', muscles: 'Chest, Shoulders, Triceps', type: 'ppl' },
    { name: 'Pull Day', muscles: 'Back, Biceps, Rear Delts', type: 'ppl' },
    { name: 'Leg Day', muscles: 'Quads, Hamstrings, Glutes', type: 'ppl' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-forged-surface2 rounded-xl animate-pulse" />
        <div className="h-44 bg-forged-surface2 rounded-2xl animate-pulse" />
        <div className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-forged-text">Workouts</h1>
          <p className="text-xs text-forged-text2 font-medium mt-0.5">{todayStr}</p>
        </div>
        <button onClick={onBuilder}
          className="px-4 py-2 rounded-xl text-xs font-black
            bg-forged-purple/10 text-forged-purple border border-forged-purple/20
            hover:bg-forged-purple hover:text-white active:scale-95 transition-all">
          + New Routine
        </button>
      </div>

      {/* Quick start */}
      <Card delay={60} hero className="!p-6">
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-4">Quick Start</p>
        <button onClick={() => onStart('custom', 'Workout')}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-purple text-white shadow-lg shadow-forged-purple/30
            hover:brightness-110 active:scale-[0.98] transition-all
            flex items-center justify-center gap-3">
          <Icon d={I.play} size={20} sw={2.5} />
          Start Empty Workout
        </button>
      </Card>

      {/* PPL presets */}
      <Card delay={140}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Routines</p>
        <div className="flex flex-col gap-2">
          {presets.map(p => (
            <button key={p.name} onClick={() => onStart(p.type, p.name)}
              className="flex items-center justify-between p-3 rounded-xl
                bg-forged-bg border border-forged-border
                hover:border-forged-purple/25 hover:bg-forged-surface2
                active:scale-[0.99] transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
                  <Icon d={I.dumbbell} size={18} className="text-forged-purple" />
                </div>
                <div>
                  <p className="text-sm font-bold text-forged-text">{p.name}</p>
                  <p className="text-[11px] text-forged-text2">{p.muscles}</p>
                </div>
              </div>
              <Icon d={I.play} size={16} className="text-forged-purple" />
            </button>
          ))}
        </div>
      </Card>

      {/* Recent workouts */}
      <Card delay={220}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Recent</p>
        {logs.length === 0 ? (
          <div className="py-6 text-center">
            <Icon d={I.dumbbell} size={28} className="text-forged-text2 mx-auto mb-2" />
            <p className="text-sm text-forged-text2">No workouts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 5).map(log => (
              <div key={log.id}
                className="flex items-center justify-between p-3 rounded-xl
                  bg-forged-bg border border-forged-border transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${log.completed ? 'bg-forged-green/10' : 'bg-forged-surface2'}`}>
                    {log.completed
                      ? <Icon d={I.check} size={14} sw={2.5} className="text-forged-green" />
                      : <Icon d={I.dumbbell} size={14} className="text-forged-text2" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-forged-text">
                      {log.dayName || log.planType || 'Workout'}
                    </p>
                    <p className="text-[11px] text-forged-text2">
                      {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {log.durationMinutes ? ` \u00B7 ${log.durationMinutes}min` : ''}
                      {log.exercises?.length ? ` \u00B7 ${log.exercises.length} exercises` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${log.completed ? 'bg-forged-green/10 text-forged-green' : 'bg-forged-surface2 text-forged-text2'}`}>
                  {log.completed ? 'Done' : 'Incomplete'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ══════════════════════════════════
// ACTIVE WORKOUT (live logging)
// ══════════════════════════════════
interface LiveSet {
  weight: string
  reps: string
  done: boolean
}

interface LiveExercise {
  name: string
  sets: LiveSet[]
}

function ActiveWorkout({ workoutId, onFinish, onBack }: {
  workoutId: string; onFinish: () => void; onBack: () => void
}) {
  const [exercises, setExercises] = useState<LiveExercise[]>([])
  const [addingExercise, setAddingExercise] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [timer, setTimer] = useState(0)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<number>(0)

  // Timer
  useEffect(() => {
    timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const addExercise = () => {
    if (!newExName.trim()) return
    setExercises(prev => [...prev, {
      name: newExName.trim(),
      sets: [{ weight: '', reps: '', done: false }],
    }])
    setNewExName('')
    setAddingExercise(false)
  }

  const addSet = (exIdx: number) => {
    setExercises(prev => {
      const next = [...prev]
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1]
      next[exIdx].sets.push({ weight: lastSet?.weight || '', reps: lastSet?.reps || '', done: false })
      return next
    })
  }

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => {
      const next = [...prev]
      next[exIdx].sets[setIdx][field] = value
      return next
    })
  }

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const next = [...prev]
      next[exIdx].sets[setIdx].done = !next[exIdx].sets[setIdx].done
      return next
    })
  }

  const removeExercise = (exIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      // Save each exercise to the backend
      for (const ex of exercises) {
        const completedSets = ex.sets.filter(s => s.done)
        if (completedSets.length > 0) {
          await api.workout.logExercise(workoutId, {
            exerciseName: ex.name,
            setsCompleted: completedSets.length,
            repsCompleted: completedSets.map(s => s.reps).join(', '),
            weightUsed: parseFloat(completedSets[0]?.weight) || 0,
            completed: true,
            notes: null,
          })
        }
      }
      onFinish()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const totalSets = exercises.reduce((s, e) => s + e.sets.filter(set => set.done).length, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-forged-text2 hover:text-forged-text transition-colors">
          <Icon d={I.chevL} size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-forged-text">Active Workout</p>
          <p className="text-2xl font-black text-forged-purple tabular-nums">{fmtTimer(timer)}</p>
        </div>
        <div className="w-5" />
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-6 text-center">
        <div>
          <p className="text-xl font-black text-forged-text">{exercises.length}</p>
          <p className="text-[10px] text-forged-text2 font-bold uppercase">Exercises</p>
        </div>
        <div>
          <p className="text-xl font-black text-forged-text">{totalSets}</p>
          <p className="text-[10px] text-forged-text2 font-bold uppercase">Sets Done</p>
        </div>
        <div>
          <p className="text-xl font-black text-forged-text">{fmtTimer(timer)}</p>
          <p className="text-[10px] text-forged-text2 font-bold uppercase">Duration</p>
        </div>
      </div>

      {/* Exercise cards */}
      {exercises.map((ex, exIdx) => (
        <Card key={exIdx} delay={0}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-forged-text">{ex.name}</p>
            <button onClick={() => removeExercise(exIdx)}
              className="text-forged-text2 hover:text-forged-red transition-colors">
              <Icon d={I.trash} size={14} />
            </button>
          </div>

          {/* Set table header */}
          <div className="grid grid-cols-[40px_1fr_1fr_44px] gap-2 mb-2 px-1">
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Set</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Weight</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Reps</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase text-center">Done</span>
          </div>

          {/* Sets */}
          {ex.sets.map((set, setIdx) => (
            <div key={setIdx}
              className={`grid grid-cols-[40px_1fr_1fr_44px] gap-2 items-center py-1.5 px-1
                rounded-lg transition-colors ${set.done ? 'bg-forged-green/5' : ''}`}>
              <span className="text-xs font-bold text-forged-text2 text-center">{setIdx + 1}</span>
              <input type="number" placeholder="lbs" value={set.weight}
                onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                className="px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                  text-forged-text text-sm text-center tabular-nums
                  focus:border-forged-purple/50 transition-colors" />
              <input type="number" placeholder="reps" value={set.reps}
                onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                className="px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                  text-forged-text text-sm text-center tabular-nums
                  focus:border-forged-purple/50 transition-colors" />
              <button onClick={() => toggleSet(exIdx, setIdx)}
                className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all active:scale-90
                  ${set.done
                    ? 'bg-forged-green text-white'
                    : 'border-2 border-forged-border text-forged-text2 hover:border-forged-green/40'
                  }`}>
                <Icon d={I.check} size={16} sw={2.5} />
              </button>
            </div>
          ))}

          {/* Add set */}
          <button onClick={() => addSet(exIdx)}
            className="w-full mt-2 py-2 text-xs font-bold text-forged-purple
              border border-dashed border-forged-purple/30 rounded-xl
              hover:bg-forged-purple/5 transition-all">
            + Add Set
          </button>
        </Card>
      ))}

      {/* Add exercise */}
      {addingExercise ? (
        <Card delay={0}>
          <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest mb-2">Add Exercise</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Exercise name..." value={newExName}
              onChange={e => setNewExName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExercise()}
              autoFocus
              className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                text-forged-text text-sm placeholder:text-forged-text2
                focus:border-forged-purple/50 transition-colors" />
            <button onClick={addExercise}
              className="px-4 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm
                hover:brightness-110 active:scale-95 transition-all">
              Add
            </button>
            <button onClick={() => { setAddingExercise(false); setNewExName('') }}
              className="px-3 py-2.5 text-forged-text2 hover:text-forged-text transition-colors">
              <Icon d={I.x} size={16} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAddingExercise(true)}
          className="w-full py-3 rounded-xl text-sm font-bold
            text-forged-purple border border-dashed border-forged-purple/30
            hover:bg-forged-purple/5 active:scale-[0.99] transition-all
            flex items-center justify-center gap-2">
          <Icon d={I.plus} size={16} sw={2.5} />
          Add Exercise
        </button>
      )}

      {/* Finish button */}
      {exercises.length > 0 && (
        <button onClick={handleFinish} disabled={saving}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-green text-white shadow-lg shadow-forged-green/30
            hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50
            flex items-center justify-center gap-2">
          <Icon d={I.flag} size={20} sw={2.5} />
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════
// WORKOUT BUILDER
// ══════════════════════════════════
interface BuilderExercise {
  name: string
  sets: number
  reps: string
}

function WorkoutBuilder({ onBack, onStart }: {
  onBack: () => void
  onStart: (planType?: string, dayName?: string) => void
}) {
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<BuilderExercise[]>([])
  const [newEx, setNewEx] = useState('')

  const addExercise = () => {
    if (!newEx.trim()) return
    setExercises(prev => [...prev, { name: newEx.trim(), sets: 3, reps: '10' }])
    setNewEx('')
  }

  const updateExercise = (idx: number, field: keyof BuilderExercise, value: any) => {
    setExercises(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text2
            hover:text-forged-text hover:border-forged-purple/30 active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <h1 className="text-2xl font-black text-forged-text">Build Routine</h1>
      </div>

      {/* Routine name */}
      <Card delay={60}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-2">Routine Name</p>
        <input type="text" placeholder="e.g. Push Day, Upper Body..." value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
            text-forged-text text-sm font-semibold placeholder:text-forged-text2
            focus:border-forged-purple/50 transition-colors" />
      </Card>

      {/* Exercises */}
      <Card delay={140}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Exercises</p>

        {exercises.length === 0 ? (
          <p className="text-sm text-forged-text2 text-center py-4">Add exercises to your routine</p>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {exercises.map((ex, i) => (
              <div key={i}
                className="flex items-center gap-2 p-3 rounded-xl bg-forged-bg border border-forged-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-forged-text">{ex.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input type="number" value={ex.sets}
                      onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 0)}
                      className="w-12 px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                        text-forged-text text-xs text-center focus:border-forged-purple/50 transition-colors" />
                    <span className="text-[10px] text-forged-text2">x</span>
                    <input type="text" value={ex.reps}
                      onChange={e => updateExercise(i, 'reps', e.target.value)}
                      className="w-12 px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                        text-forged-text text-xs text-center focus:border-forged-purple/50 transition-colors" />
                  </div>
                  <button onClick={() => removeExercise(i)}
                    className="text-forged-text2 hover:text-forged-red transition-colors">
                    <Icon d={I.x} size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add exercise input */}
        <div className="flex gap-2">
          <input type="text" placeholder="Exercise name..." value={newEx}
            onChange={e => setNewEx(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExercise()}
            className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors" />
          <button onClick={addExercise}
            className="px-4 py-2.5 bg-forged-purple/10 text-forged-purple font-black rounded-xl text-sm
              hover:bg-forged-purple/20 active:scale-95 transition-all">
            Add
          </button>
        </div>
      </Card>

      {/* Start workout with this routine */}
      {exercises.length > 0 && name.trim() && (
        <button onClick={() => onStart('custom', name)}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-purple text-white shadow-lg shadow-forged-purple/30
            hover:brightness-110 active:scale-[0.98] transition-all
            flex items-center justify-center gap-2">
          <Icon d={I.play} size={20} sw={2.5} />
          Start {name}
        </button>
      )}
    </div>
  )
}