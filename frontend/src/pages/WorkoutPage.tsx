import { useState, useEffect, useRef } from 'react'
import { api } from '../hooks/api'
import type { WorkoutLog } from '../types'

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
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
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
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// TYPES — stored in localStorage
// ══════════════════════════════════
interface RoutineExercise {
  name: string
  sets: number
  reps: string
  intensity: string  // light | moderate | heavy | max
  notes: string
}

interface RoutineDay {
  dayName: string
  exercises: RoutineExercise[]
}

interface Routine {
  id: string
  name: string
  days: RoutineDay[]
  createdAt: string
}

// ── LocalStorage helpers ──
const STORAGE_KEY = 'forged_routines'

function loadRoutines(): Routine[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function saveRoutines(routines: Routine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routines))
}

// ══════════════════════════════════
// WORKOUT PAGE (router)
// ══════════════════════════════════
type View = 'home' | 'active' | 'builder' | 'edit'

export default function WorkoutPage() {
  const [view, setView] = useState<View>('home')
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<RoutineDay | null>(null)
  const [editRoutineId, setEditRoutineId] = useState<string | null>(null)
  const [routines, setRoutines] = useState<Routine[]>(loadRoutines)

  const refreshRoutines = () => setRoutines(loadRoutines())

  const startWorkout = async (dayName: string, day?: RoutineDay) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const result = await api.workout.create({
        date: today,
        planType: 'custom',
        dayName,
      })
      setActiveWorkoutId(result.id)
      setActiveDay(day || null)
      setView('active')
    } catch (e) { console.error(e) }
  }

  const finishWorkout = async () => {
    if (activeWorkoutId) {
      try { await api.workout.complete(activeWorkoutId) } catch (e) { console.error(e) }
    }
    setActiveWorkoutId(null)
    setActiveDay(null)
    setView('home')
  }

  if (view === 'active' && activeWorkoutId) {
    return <ActiveWorkout workoutId={activeWorkoutId} preloadedDay={activeDay}
      onFinish={finishWorkout} onBack={() => setView('home')} />
  }

  if (view === 'builder') {
    return <RoutineBuilder
      onBack={() => { refreshRoutines(); setView('home') }}
    />
  }

  if (view === 'edit' && editRoutineId) {
    const routine = routines.find(r => r.id === editRoutineId)
    if (routine) {
      return <RoutineBuilder
        existing={routine}
        onBack={() => { refreshRoutines(); setEditRoutineId(null); setView('home') }}
      />
    }
  }

  return <WorkoutHome
    routines={routines}
    onStart={startWorkout}
    onNewRoutine={() => setView('builder')}
    onEditRoutine={(id) => { setEditRoutineId(id); setView('edit') }}
    onDeleteRoutine={(id) => {
      const next = routines.filter(r => r.id !== id)
      saveRoutines(next)
      setRoutines(next)
    }}
  />
}

// ══════════════════════════════════
// WORKOUT HOME
// ══════════════════════════════════
function WorkoutHome({ routines, onStart, onNewRoutine, onEditRoutine, onDeleteRoutine }: {
  routines: Routine[]
  onStart: (dayName: string, day?: RoutineDay) => void
  onNewRoutine: () => void
  onEditRoutine: (id: string) => void
  onDeleteRoutine: (id: string) => void
}) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    api.workout.getLogs(10).then(setLogs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCalendar(true)}
            className="w-9 h-9 rounded-xl bg-forged-purple/15 border border-forged-purple/30
              flex items-center justify-center text-forged-purple
              hover:bg-forged-purple/25 active:scale-95 transition-all">
            <Icon d={I.calendar} size={16} sw={2} />
          </button>
          <button onClick={onNewRoutine}
            className="px-4 py-2 rounded-xl text-xs font-black
              bg-forged-purple/10 text-forged-purple border border-forged-purple/20
              hover:bg-forged-purple hover:text-white active:scale-95 transition-all">
            + New Routine
          </button>
        </div>
      </div>

      {/* Workout Calendar */}
      {showCalendar && (
        <WorkoutCalendar logs={logs} onClose={() => setShowCalendar(false)} />
      )}

      {/* Quick start */}
      <Card delay={60} className="!p-6">
        <button onClick={() => onStart('Empty Workout')}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-purple text-white shadow-lg shadow-forged-purple/30
            hover:brightness-110 active:scale-[0.98] transition-all
            flex items-center justify-center gap-3">
          <Icon d={I.play} size={20} sw={2.5} />
          Start Empty Workout
        </button>
      </Card>

      {/* Saved routines */}
      {routines.length > 0 && (
        <Card delay={140}>
          <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">My Routines</p>
          <div className="flex flex-col gap-2">
            {routines.map(routine => {
              const isExpanded = expandedRoutine === routine.id
              return (
                <div key={routine.id}
                  className="rounded-xl bg-forged-bg border border-forged-border overflow-hidden">
                  {/* Routine header */}
                  <div className="flex items-center justify-between p-3">
                    <button onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                      className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
                        <Icon d={I.layers} size={18} className="text-forged-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-forged-text">{routine.name}</p>
                        <p className="text-[11px] text-forged-text2">
                          {routine.days.length} day{routine.days.length !== 1 ? 's' : ''}
                          {' \u00B7 '}
                          {routine.days.reduce((s, d) => s + d.exercises.length, 0)} exercises
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEditRoutine(routine.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                          text-forged-text2 hover:text-forged-purple hover:bg-forged-purple/10 transition-all">
                        <Icon d={I.edit} size={14} />
                      </button>
                      <button onClick={() => {
                        if (confirm('Delete this routine?')) onDeleteRoutine(routine.id)
                      }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                          text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all">
                        <Icon d={I.trash} size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: show days */}
                  {isExpanded && (
                    <div className="border-t border-forged-border p-3 flex flex-col gap-2"
                      style={{ animation: 'fadeIn 0.15s ease-out' }}>
                      {routine.days.map((day, di) => (
                        <button key={di} onClick={() => onStart(day.dayName, day)}
                          className="flex items-center justify-between p-3 rounded-lg
                            bg-forged-surface hover:bg-forged-surface2 transition-all text-left">
                          <div>
                            <p className="text-sm font-bold text-forged-text">{day.dayName}</p>
                            <p className="text-[10px] text-forged-text2">
                              {day.exercises.map(e => e.name).join(', ')}
                            </p>
                          </div>
                          <Icon d={I.play} size={14} className="text-forged-purple" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* No routines placeholder */}
      {routines.length === 0 && (
        <Card delay={140}>
          <div className="py-6 text-center">
            <Icon d={I.layers} size={28} className="text-forged-text2 mx-auto mb-2" />
            <p className="text-sm font-bold text-forged-text mb-1">No routines yet</p>
            <p className="text-xs text-forged-text2 mb-3">Create a routine to get started</p>
            <button onClick={onNewRoutine}
              className="px-5 py-2 rounded-xl text-xs font-black
                bg-forged-purple text-white hover:brightness-110 active:scale-95 transition-all">
              Create Routine
            </button>
          </div>
        </Card>
      )}

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
                  bg-forged-bg border border-forged-border group">
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
                      {log.exercises?.length ? ` \u00B7 ${log.exercises.length} exercises` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                    ${log.completed ? 'bg-forged-green/10 text-forged-green' : 'bg-forged-surface2 text-forged-text2'}`}>
                    {log.completed ? 'Done' : 'Incomplete'}
                  </span>
                  <button onClick={() => setLogs(prev => prev.filter(l => l.id !== log.id))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-all
                      text-forged-text2 hover:text-forged-red hover:bg-forged-red/10">
                    <Icon d={I.x} size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
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
  intensity: string
  notes: string
  sets: LiveSet[]
}

function ActiveWorkout({ workoutId, preloadedDay, onFinish, onBack }: {
  workoutId: string; preloadedDay: RoutineDay | null
  onFinish: () => void; onBack: () => void
}) {
  const [exercises, setExercises] = useState<LiveExercise[]>(() => {
    if (preloadedDay) {
      return preloadedDay.exercises.map(e => ({
        name: e.name,
        intensity: e.intensity,
        notes: e.notes,
        sets: Array.from({ length: e.sets }, () => ({ weight: '', reps: e.reps, done: false })),
      }))
    }
    return []
  })
  const [addingExercise, setAddingExercise] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '10', intensity: 'moderate', notes: '' })
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<number>(0)

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const addExercise = () => {
    if (!newEx.name.trim()) return
    setExercises(prev => [...prev, {
      name: newEx.name.trim(),
      intensity: newEx.intensity,
      notes: newEx.notes,
      sets: Array.from({ length: parseInt(newEx.sets) || 3 }, () => ({
        weight: '', reps: newEx.reps || '10', done: false,
      })),
    }])
    setNewEx({ name: '', sets: '3', reps: '10', intensity: 'moderate', notes: '' })
    setAddingExercise(false)
  }

  const addSet = (exIdx: number) => {
    setExercises(prev => {
      const next = [...prev]
      const last = next[exIdx].sets[next[exIdx].sets.length - 1]
      next[exIdx].sets.push({ weight: last?.weight || '', reps: last?.reps || '', done: false })
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

  const removeExercise = (exIdx: number) => setExercises(prev => prev.filter((_, i) => i !== exIdx))

  const handleFinish = async () => {
    setSaving(true)
    try {
      for (const ex of exercises) {
        const done = ex.sets.filter(s => s.done)
        if (done.length > 0) {
          await api.workout.logExercise(workoutId, {
            exerciseName: ex.name,
            setsCompleted: done.length,
            repsCompleted: done.map(s => s.reps).join(', '),
            weightUsed: parseFloat(done[0]?.weight) || 0,
            completed: true,
            notes: ex.notes || null,
          })
        }
      }
      onFinish()
    } catch (e) { console.error(e); setSaving(false) }
  }

  const totalSets = exercises.reduce((s, e) => s + e.sets.filter(set => set.done).length, 0)

  const intensityColors: Record<string, string> = {
    light: 'bg-forged-blue/10 text-forged-blue',
    moderate: 'bg-forged-green/10 text-forged-green',
    heavy: 'bg-forged-gold/10 text-forged-gold',
    max: 'bg-forged-red/10 text-forged-red',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-forged-text2 hover:text-forged-text transition-colors">
          <Icon d={I.chevL} size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-forged-text">Active Workout</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <button onClick={() => setTimerRunning(!timerRunning)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90
                ${timerRunning
                  ? 'bg-forged-purple/10 text-forged-purple hover:bg-forged-purple/20'
                  : 'bg-forged-green/10 text-forged-green hover:bg-forged-green/20'}`}>
              {timerRunning
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <Icon d={I.play} size={14} sw={2.5} />
              }
            </button>
            <p className="text-2xl font-black text-forged-purple tabular-nums">{fmtTimer(timer)}</p>
          </div>
        </div>
        <div className="w-5" />
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-center">
        <div><p className="text-xl font-black text-forged-text">{exercises.length}</p><p className="text-[10px] text-forged-text2 font-bold uppercase">Exercises</p></div>
        <div><p className="text-xl font-black text-forged-text">{totalSets}</p><p className="text-[10px] text-forged-text2 font-bold uppercase">Sets Done</p></div>
        <div><p className="text-xl font-black text-forged-text">{fmtTimer(timer)}</p><p className="text-[10px] text-forged-text2 font-bold uppercase">Duration</p></div>
      </div>

      {/* Exercises */}
      {exercises.map((ex, exIdx) => (
        <Card key={exIdx} delay={0}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-forged-text">{ex.name}</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${intensityColors[ex.intensity] || intensityColors.moderate}`}>
                {ex.intensity}
              </span>
            </div>
            <button onClick={() => removeExercise(exIdx)}
              className="text-forged-text2 hover:text-forged-red transition-colors">
              <Icon d={I.trash} size={14} />
            </button>
          </div>
          {ex.notes && <p className="text-[11px] text-forged-text2 mb-2">{ex.notes}</p>}

          {/* Table header */}
          <div className="grid grid-cols-[36px_1fr_1fr_40px] gap-2 mb-1.5 px-1">
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Set</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Weight</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase">Reps</span>
            <span className="text-[10px] text-forged-text2 font-bold uppercase text-center">✓</span>
          </div>

          {ex.sets.map((set, si) => (
            <div key={si} className={`grid grid-cols-[36px_1fr_1fr_40px] gap-2 items-center py-1.5 px-1
              rounded-lg transition-colors ${set.done ? 'bg-forged-green/5' : ''}`}>
              <span className="text-xs font-bold text-forged-text2 text-center">{si + 1}</span>
              <input type="number" placeholder="lbs" value={set.weight}
                onChange={e => updateSet(exIdx, si, 'weight', e.target.value)}
                className="px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                  text-forged-text text-sm text-center tabular-nums
                  focus:border-forged-purple/50 transition-colors" />
              <input type="number" placeholder="reps" value={set.reps}
                onChange={e => updateSet(exIdx, si, 'reps', e.target.value)}
                className="px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                  text-forged-text text-sm text-center tabular-nums
                  focus:border-forged-purple/50 transition-colors" />
              <button onClick={() => toggleSet(exIdx, si)}
                className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all active:scale-90
                  ${set.done
                    ? 'bg-forged-green text-white'
                    : 'border-2 border-forged-border text-forged-text2 hover:border-forged-green/40'}`}>
                <Icon d={I.check} size={16} sw={2.5} />
              </button>
            </div>
          ))}

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
          <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest mb-3">Add Exercise</p>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Exercise name" value={newEx.name}
              onChange={e => setNewEx({ ...newEx, name: e.target.value })}
              autoFocus
              className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                text-forged-text text-sm placeholder:text-forged-text2
                focus:border-forged-purple/50 transition-colors" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-forged-text2 font-bold block mb-1">Sets</label>
                <input type="number" value={newEx.sets}
                  onChange={e => setNewEx({ ...newEx, sets: e.target.value })}
                  className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                    text-forged-text text-sm text-center focus:border-forged-purple/50 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-forged-text2 font-bold block mb-1">Reps</label>
                <input type="text" value={newEx.reps}
                  onChange={e => setNewEx({ ...newEx, reps: e.target.value })}
                  className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                    text-forged-text text-sm text-center focus:border-forged-purple/50 transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-forged-text2 font-bold block mb-1">Intensity</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['light', 'moderate', 'heavy', 'max'].map(lvl => (
                  <button key={lvl} onClick={() => setNewEx({ ...newEx, intensity: lvl })}
                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-all
                      ${newEx.intensity === lvl
                        ? (intensityColors[lvl] || 'bg-forged-purple/10 text-forged-purple') + ' border border-current'
                        : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-forged-text2 font-bold block mb-1">Quick Note (optional)</label>
              <input type="text" placeholder="e.g. slow negatives, pause at bottom..."
                value={newEx.notes} onChange={e => setNewEx({ ...newEx, notes: e.target.value })}
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg
                  text-forged-text text-sm placeholder:text-forged-text2
                  focus:border-forged-purple/50 transition-colors" />
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={addExercise}
                className="flex-1 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm
                  hover:brightness-110 active:scale-95 transition-all">
                Add
              </button>
              <button onClick={() => setAddingExercise(false)}
                className="px-4 py-2.5 text-forged-text2 hover:text-forged-text transition-colors">
                Cancel
              </button>
            </div>
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

      {/* Finish */}
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
// ROUTINE BUILDER (create + edit)
// ══════════════════════════════════
function RoutineBuilder({ existing, onBack }: {
  existing?: Routine
  onBack: () => void
}) {
  const [name, setName] = useState(existing?.name || '')
  const [days, setDays] = useState<RoutineDay[]>(existing?.days || [])
  const [addingDay, setAddingDay] = useState(false)
  const [newDayName, setNewDayName] = useState('')

  // ── Day management ──
  const addDay = () => {
    if (!newDayName.trim()) return
    setDays(prev => [...prev, { dayName: newDayName.trim(), exercises: [] }])
    setNewDayName('')
    setAddingDay(false)
  }

  const removeDay = (idx: number) => setDays(prev => prev.filter((_, i) => i !== idx))

  // ── Exercise management within a day ──
  const addExToDay = (dayIdx: number, ex: RoutineExercise) => {
    setDays(prev => {
      const next = [...prev]
      next[dayIdx].exercises.push(ex)
      return next
    })
  }

  const removeExFromDay = (dayIdx: number, exIdx: number) => {
    setDays(prev => {
      const next = [...prev]
      next[dayIdx].exercises = next[dayIdx].exercises.filter((_, i) => i !== exIdx)
      return next
    })
  }

  const updateExInDay = (dayIdx: number, exIdx: number, field: keyof RoutineExercise, value: any) => {
    setDays(prev => {
      const next = [...prev]
      next[dayIdx].exercises[exIdx] = { ...next[dayIdx].exercises[exIdx], [field]: value }
      return next
    })
  }

  // ── Save ──
  const saveRoutine = () => {
    if (!name.trim() || days.length === 0) return
    const routines = loadRoutines()
    if (existing) {
      const idx = routines.findIndex(r => r.id === existing.id)
      if (idx >= 0) {
        routines[idx] = { ...routines[idx], name, days }
      }
    } else {
      routines.push({
        id: crypto.randomUUID(),
        name,
        days,
        createdAt: new Date().toISOString(),
      })
    }
    saveRoutines(routines)
    onBack()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text2
            hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <h1 className="text-2xl font-black text-forged-text">
          {existing ? 'Edit Routine' : 'Build Routine'}
        </h1>
      </div>

      {/* Routine name */}
      <Card delay={60}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-2">Routine Name</p>
        <input type="text" placeholder="e.g. Push/Pull/Legs, Upper/Lower, Full Body..."
          value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
            text-forged-text text-sm font-semibold placeholder:text-forged-text2
            focus:border-forged-purple/50 transition-colors" />
      </Card>

      {/* Days */}
      {days.map((day, dayIdx) => (
        <DayCard key={dayIdx} day={day} dayIdx={dayIdx}
          onRemoveDay={() => removeDay(dayIdx)}
          onAddExercise={(ex) => addExToDay(dayIdx, ex)}
          onRemoveExercise={(exIdx) => removeExFromDay(dayIdx, exIdx)}
          onUpdateExercise={(exIdx, field, value) => updateExInDay(dayIdx, exIdx, field, value)}
        />
      ))}

      {/* Add day */}
      {addingDay ? (
        <Card delay={0}>
          <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest mb-2">Day Name</p>
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. Push Day A, Leg Day, Upper Body..."
              value={newDayName} onChange={e => setNewDayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDay()}
              autoFocus
              className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                text-forged-text text-sm placeholder:text-forged-text2
                focus:border-forged-purple/50 transition-colors" />
            <button onClick={addDay}
              className="px-4 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm
                hover:brightness-110 active:scale-95 transition-all">
              Add
            </button>
            <button onClick={() => { setAddingDay(false); setNewDayName('') }}
              className="px-3 text-forged-text2 hover:text-forged-text">
              <Icon d={I.x} size={16} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAddingDay(true)}
          className="w-full py-3 rounded-xl text-sm font-bold
            text-forged-purple border border-dashed border-forged-purple/30
            hover:bg-forged-purple/5 active:scale-[0.99] transition-all
            flex items-center justify-center gap-2">
          <Icon d={I.plus} size={16} sw={2.5} />
          Add Day
        </button>
      )}

      {/* Save button */}
      {name.trim() && days.length > 0 && (
        <button onClick={saveRoutine}
          className="w-full py-4 rounded-xl font-black text-base
            bg-forged-purple text-white shadow-lg shadow-forged-purple/30
            hover:brightness-110 active:scale-[0.98] transition-all">
          {existing ? 'Save Changes' : 'Save Routine'}
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════
// DAY CARD (inside builder)
// ══════════════════════════════════
function DayCard({ day, dayIdx, onRemoveDay, onAddExercise, onRemoveExercise, onUpdateExercise }: {
  day: RoutineDay; dayIdx: number
  onRemoveDay: () => void
  onAddExercise: (ex: RoutineExercise) => void
  onRemoveExercise: (exIdx: number) => void
  onUpdateExercise: (exIdx: number, field: keyof RoutineExercise, value: any) => void
}) {
  const [adding, setAdding] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '10', intensity: 'moderate', notes: '' })

  const handleAdd = () => {
    if (!newEx.name.trim()) return
    onAddExercise({
      name: newEx.name.trim(),
      sets: parseInt(newEx.sets) || 3,
      reps: newEx.reps || '10',
      intensity: newEx.intensity,
      notes: newEx.notes,
    })
    setNewEx({ name: '', sets: '3', reps: '10', intensity: 'moderate', notes: '' })
    setAdding(false)
  }

  return (
    <Card delay={80 + dayIdx * 60}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-forged-purple/10 flex items-center justify-center
            text-[10px] font-black text-forged-purple">{dayIdx + 1}</span>
          <p className="text-sm font-black text-forged-text">{day.dayName}</p>
        </div>
        <button onClick={onRemoveDay}
          className="text-forged-text2 hover:text-forged-red transition-colors">
          <Icon d={I.trash} size={14} />
        </button>
      </div>

      {/* Exercises */}
      {day.exercises.length === 0 && !adding && (
        <p className="text-xs text-forged-text2 text-center py-3">No exercises yet</p>
      )}

      {day.exercises.map((ex, exIdx) => (
        <div key={exIdx}
          className="flex items-center justify-between py-2.5 border-b border-forged-text2/10 last:border-0">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-forged-text">{ex.name}</p>
              <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-1.5 py-0.5 rounded">
                {ex.intensity}
              </span>
            </div>
            <p className="text-[11px] text-forged-text2">
              {ex.sets} sets x {ex.reps} reps
              {ex.notes && ` \u00B7 ${ex.notes}`}
            </p>
          </div>
          <button onClick={() => onRemoveExercise(exIdx)}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all">
            <Icon d={I.x} size={12} />
          </button>
        </div>
      ))}

      {/* Add exercise form */}
      {adding ? (
        <div className="mt-3 flex flex-col gap-2 bg-forged-bg border border-forged-border rounded-xl p-3">
          <input type="text" placeholder="Exercise name" value={newEx.name}
            onChange={e => setNewEx({ ...newEx, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
            className="w-full px-3 py-2 bg-forged-surface border border-forged-border rounded-lg
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors" />
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] text-forged-text2 font-bold">Sets</label>
              <input type="number" value={newEx.sets}
                onChange={e => setNewEx({ ...newEx, sets: e.target.value })}
                className="w-full px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                  text-forged-text text-xs text-center focus:border-forged-purple/50 transition-colors" />
            </div>
            <div>
              <label className="text-[9px] text-forged-text2 font-bold">Reps</label>
              <input type="text" value={newEx.reps}
                onChange={e => setNewEx({ ...newEx, reps: e.target.value })}
                className="w-full px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                  text-forged-text text-xs text-center focus:border-forged-purple/50 transition-colors" />
            </div>
            <div>
              <label className="text-[9px] text-forged-text2 font-bold">Intensity</label>
              <select value={newEx.intensity}
                onChange={e => setNewEx({ ...newEx, intensity: e.target.value })}
                className="w-full px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                  text-forged-text text-xs focus:border-forged-purple/50 transition-colors">
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
                <option value="max">Max</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-forged-text2 font-bold">Note</label>
              <input type="text" placeholder="..." value={newEx.notes}
                onChange={e => setNewEx({ ...newEx, notes: e.target.value })}
                className="w-full px-1 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                  text-forged-text text-xs text-center focus:border-forged-purple/50 transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 py-2 bg-forged-purple text-white font-black rounded-lg text-xs
                hover:brightness-110 active:scale-95 transition-all">
              Add
            </button>
            <button onClick={() => setAdding(false)}
              className="px-3 text-forged-text2 hover:text-forged-text text-xs font-bold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full mt-2 py-2 text-xs font-bold text-forged-purple
            border border-dashed border-forged-purple/30 rounded-xl
            hover:bg-forged-purple/5 transition-all">
          + Add Exercise
        </button>
      )}
    </Card>
  )
}

// ══════════════════════════════════
// useClickOutside
// ══════════════════════════════════
function useClickOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const l = (e: MouseEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; fn() }
    document.addEventListener('mousedown', l); return () => document.removeEventListener('mousedown', l)
  }, [ref, fn])
}

// ══════════════════════════════════
// WORKOUT CALENDAR
// ══════════════════════════════════
function WorkoutCalendar({ logs, onClose }: { logs: WorkoutLog[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
  const firstDow = new Date(viewDate.year, viewDate.month, 1).getDay()
  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const shiftMonth = (dir: number) => {
    setViewDate(prev => {
      let m = prev.month + dir, y = prev.year
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      return { year: y, month: m }
    })
  }

  const makeDate = (day: number) => {
    const m = String(viewDate.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewDate.year}-${m}-${d}`
  }

  // Map logs by date
  const logsByDate: Record<string, WorkoutLog[]> = {}
  logs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log)
  })

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-3"
      style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div ref={ref} className="bg-forged-surface border border-forged-border rounded-2xl p-5 w-full max-w-lg shadow-2xl">

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)}
            className="w-9 h-9 rounded-xl hover:bg-forged-surface2 flex items-center justify-center
              text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.chevL} size={18} />
          </button>
          <span className="text-base font-black text-forged-text">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)}
            className="w-9 h-9 rounded-xl hover:bg-forged-surface2 flex items-center justify-center
              text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.chevR} size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-forged-text2 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = makeDate(day)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            const dayLogs = logsByDate[dateStr] || []
            const hasWorkout = dayLogs.length > 0
            const isCompleted = dayLogs.some(l => l.completed)

            return (
              <div key={day}
                className={`min-h-[52px] rounded-xl flex flex-col items-center justify-start pt-1.5 gap-0.5
                  border transition-all
                  ${isFuture ? 'opacity-25 border-transparent' : 'border-transparent'}
                  ${isToday ? 'border-forged-purple/40 bg-forged-purple/5' : ''}
                  ${hasWorkout && !isToday ? 'bg-forged-bg' : ''}
                `}>
                <span className={`text-xs font-bold leading-none
                  ${isToday ? 'text-forged-purple' : 'text-forged-text'}`}>
                  {day}
                </span>

                {hasWorkout && (
                  <>
                    <div className={`w-2 h-2 rounded-full mt-1
                      ${isCompleted ? 'bg-forged-green' : 'bg-forged-purple/40'}`} />
                    <span className="text-[7px] font-bold text-forged-text2 leading-none mt-0.5">
                      {dayLogs[0]?.dayName?.substring(0, 6) || 'Workout'}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-forged-border">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-forged-green" />
            <span className="text-[10px] text-forged-text2">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-forged-purple/40" />
            <span className="text-[10px] text-forged-text2">Incomplete</span>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="w-full mt-3 py-2 text-xs font-bold text-forged-text2
            hover:text-forged-text hover:bg-forged-surface2 rounded-xl transition-all">
          Close
        </button>
      </div>
    </div>
  )
}