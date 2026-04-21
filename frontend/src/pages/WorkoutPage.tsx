import { useState, useEffect, useRef } from 'react'
import { api } from '../hooks/api'
import type { WorkoutLog } from '../types'
import { ActiveWorkout } from '../components/workouts/ActiveWorkout'
import {
  buildExerciseHistory, workoutVolume, workoutMuscleGroups, prsInWorkout,
} from '../components/workouts/exerciseLibrary'
import {
  loadActiveWorkout, clearActiveWorkout,
  type Routine, type RoutineDay, type RoutineExercise, type ActiveWorkoutState,
  type ExerciseKind, type Intensity, type MuscleGroup, MUSCLE_GROUPS,
} from '../components/workouts/workoutTypes'
import { useLoadingEffect } from '../hooks/useLoading'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  run: <><circle cx="13" cy="4" r="2"/><path d="M4 22l3-8 3 2 2-3 4 4"/></>,
  hourglass: <><path d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4z"/></>,
  broom: <><path d="M19.36 2.72L20.78 4.14L15.06 9.85C15.83 11.21 16 12.93 15.33 14.42L14.62 14C13.71 15.91 11.77 17.17 9.63 17.17C8.48 17.17 7.37 16.82 6.42 16.18L1.92 20.68L.5 19.26L5 14.76C4.35 13.81 4 12.7 4 11.55C4 9.41 5.26 7.47 7.17 6.56L6.75 5.85C8.24 5.18 9.96 5.35 11.32 6.12L17.03 .4L19.36 2.72Z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

// ══════════════════════════════════
// CARD
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

function useClickOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const l = (e: MouseEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; fn() }
    document.addEventListener('mousedown', l); return () => document.removeEventListener('mousedown', l)
  }, [ref, fn])
}

// ══════════════════════════════════
// STORAGE
// ══════════════════════════════════
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
  const [activeCtx, setActiveCtx] = useState<{
    workoutId: string; dayName: string; day: RoutineDay | null; resume?: ActiveWorkoutState | null
  } | null>(null)
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
      setActiveCtx({ workoutId: result.id, dayName, day: day ?? null, resume: null })
      setView('active')
    } catch (e) { console.error(e) }
  }

  const resumeWorkout = (state: ActiveWorkoutState) => {
    setActiveCtx({ workoutId: state.workoutId, dayName: state.dayName, day: null, resume: state })
    setView('active')
  }

  const finishWorkout = () => {
    setActiveCtx(null)
    setView('home')
  }

  if (view === 'active' && activeCtx) {
    return <ActiveWorkout
      workoutId={activeCtx.workoutId}
      dayName={activeCtx.dayName}
      preloadedDay={activeCtx.day}
      resumeState={activeCtx.resume ?? null}
      onFinish={finishWorkout}
      onBack={() => setView('home')}
    />
  }

  if (view === 'builder') {
    return <RoutineBuilder onBack={() => { refreshRoutines(); setView('home') }} />
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
    onResume={resumeWorkout}
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
function WorkoutHome({
  routines, onStart, onResume, onNewRoutine, onEditRoutine, onDeleteRoutine,
}: {
  routines: Routine[]
  onStart: (dayName: string, day?: RoutineDay) => void
  onResume: (state: ActiveWorkoutState) => void
  onNewRoutine: () => void
  onEditRoutine: (id: string) => void
  onDeleteRoutine: (id: string) => void
}) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [resumeState, setResumeState] = useState<ActiveWorkoutState | null>(loadActiveWorkout())
  const [cleaningUp, setCleaningUp] = useState(false)

  useLoadingEffect(async () => {
    const data = await api.workout.getLogs(30)
    setLogs(data)
  }, [])

  // Incomplete workouts older than 24 hours
  const now = Date.now()
  const staleIncomplete = logs.filter(l => {
    if (l.completed) return false
    const logTime = new Date(l.date + 'T12:00:00').getTime()
    return (now - logTime) > 24 * 3600 * 1000
  })

  const handleCleanup = async () => {
    if (staleIncomplete.length === 0) return
    if (!confirm(`Delete ${staleIncomplete.length} stale incomplete workout${staleIncomplete.length !== 1 ? 's' : ''}?`)) return
    setCleaningUp(true)
    try {
      for (const log of staleIncomplete) {
        await api.workout.delete(log.id).catch(console.error)
      }
      setLogs(await api.workout.getLogs(30))
    } catch (e) { console.error(e) }
    finally { setCleaningUp(false) }
  }

  const handleDiscardResume = () => {
    if (!confirm('Discard the active workout? You will lose any sets logged.')) return
    clearActiveWorkout()
    setResumeState(null)
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // History for PR detection on past logs
  const history = buildExerciseHistory(logs)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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

      {/* Resume banner */}
      {resumeState && (
        <ResumeCard state={resumeState} onResume={() => onResume(resumeState)} onDiscard={handleDiscardResume} />
      )}

      {/* Calendar */}
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

      {/* Routines */}
      {routines.length > 0 && (
        <Card delay={140}>
          <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">My Routines</p>
          <div className="flex flex-col gap-2">
            {routines.map(routine => {
              const isExpanded = expandedRoutine === routine.id
              return (
                <div key={routine.id}
                  className="rounded-xl bg-forged-bg border border-forged-border overflow-hidden">
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
                          {' · '}
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

                  {isExpanded && (
                    <div className="border-t border-forged-border p-3 flex flex-col gap-2">
                      {routine.days.map((day, di) => (
                        <button key={di} onClick={() => onStart(day.dayName, day)}
                          className="flex items-center justify-between p-3 rounded-lg
                            bg-forged-surface hover:bg-forged-surface2 transition-all text-left">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-forged-text">{day.dayName}</p>
                            <p className="text-[10px] text-forged-text2 truncate">
                              {day.exercises.map(e => e.name).join(', ') || 'No exercises'}
                            </p>
                          </div>
                          <Icon d={I.play} size={14} className="text-forged-purple flex-shrink-0 ml-2" />
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

      {/* Recent — rich cards */}
      <Card delay={220}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Recent</p>
        {logs.length === 0 ? (
          <div className="py-6 text-center">
            <Icon d={I.dumbbell} size={28} className="text-forged-text2 mx-auto mb-2" />
            <p className="text-sm text-forged-text2">No workouts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 8).map(log => {
              const otherHistory = history
                .map(h => ({ ...h, sessionCount: Math.max(0, h.sessionCount - 1) }))
                .filter(h => h.sessionCount > 0)
              return (
                <RichWorkoutCard
                  key={log.id}
                  log={log}
                  otherHistory={otherHistory}
                />
              )
            })}
          </div>
        )}
      </Card>

      {/* Cleanup button */}
      {staleIncomplete.length > 0 && (
        <button onClick={handleCleanup} disabled={cleaningUp}
          className="w-full py-2.5 rounded-xl text-xs font-black
            bg-transparent border border-dashed border-forged-text2/20 text-forged-text2
            hover:border-forged-red/40 hover:text-forged-red
            active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon d={I.broom} size={12} sw={2} />
          {cleaningUp ? 'Cleaning...' : `Clean up ${staleIncomplete.length} incomplete workout${staleIncomplete.length !== 1 ? 's' : ''}`}
        </button>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════
// RESUME CARD
// ══════════════════════════════════
function ResumeCard({ state, onResume, onDiscard }: {
  state: ActiveWorkoutState
  onResume: () => void
  onDiscard: () => void
}) {
  const startedAt = new Date(state.startedAt).getTime()
  const ago = Math.round((Date.now() - startedAt) / (60 * 1000))
  const agoLabel = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`
  const setsDone = state.exercises.reduce((s, ex) => s + ex.sets.filter(st => st.done).length, 0)

  return (
    <div
      className="bg-gradient-to-br from-yellow-500/15 to-yellow-500/5
        border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
        <Icon d={I.clock} size={18} className="text-yellow-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">Workout in progress</p>
        <p className="text-sm font-black text-forged-text truncate mt-0.5">{state.dayName}</p>
        <p className="text-[11px] text-forged-text2 mt-0.5">
          Started {agoLabel} · {setsDone} set{setsDone !== 1 ? 's' : ''} done
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <button onClick={onResume}
          className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-black hover:brightness-110 active:scale-95 transition-all">
          Continue
        </button>
        <button onClick={onDiscard}
          className="px-3 py-1 rounded-lg text-forged-text2 text-[10px] font-black hover:text-forged-red transition-colors">
          Discard
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// RICH WORKOUT CARD
// ══════════════════════════════════
function RichWorkoutCard({
  log,
  otherHistory,
}: {
  log: WorkoutLog
  otherHistory: Array<{ name: string; kind: ExerciseKind; muscleGroups: MuscleGroup[]; sessionCount: number; lastDate: string; lastSets: Array<{ weight: number; reps: string }>; bestWeight: number; bestEst1RM: number; bestVolume: number }>
}) {
  const volume = workoutVolume(log)
  const muscles = workoutMuscleGroups(log)
  const prs = prsInWorkout(log, otherHistory)

  const dateLabel = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  // Figure out kind by looking at exercises
  const hasCardio = (log.exercises ?? []).some(ex => /\b(run|cycle|bike|swim|row)/i.test(ex.exerciseName))
  const isCardio = hasCardio && (log.exercises?.length ?? 0) === 1

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-forged-bg border border-forged-border">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${log.completed ? 'bg-forged-green/15 text-forged-green' : 'bg-forged-surface2 text-forged-text2'}`}>
        {log.completed
          ? <Icon d={I.check} size={14} sw={2.5} />
          : <Icon d={isCardio ? I.run : I.dumbbell} size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-forged-text truncate">
            {log.dayName || log.planType || 'Workout'}
          </p>
          {prs > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-forged-gold/15 text-forged-gold flex items-center gap-0.5 flex-shrink-0">
              <Icon d={I.flame} size={10} sw={2} /> PR × {prs}
            </span>
          )}
        </div>
        <p className="text-[11px] text-forged-text2 mt-0.5">
          {dateLabel}
          {volume > 0 && <> · <span className="text-forged-text font-black">{volume.toLocaleString()} lb</span></>}
          {log.exercises?.length ? <> · {log.exercises.length} exercises</> : null}
        </p>
        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {muscles.slice(0, 4).map(mg => (
              <span key={mg} className="text-[8px] font-black px-1.5 py-0.5 rounded bg-forged-purple/15 text-forged-purple">
                {mg}
              </span>
            ))}
            {muscles.length > 4 && (
              <span className="text-[8px] font-black text-forged-text2">+{muscles.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════
// WORKOUT CALENDAR (type-coded)
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

  // Group logs by date
  const logsByDate: Record<string, WorkoutLog[]> = {}
  logs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log)
  })

  // Color per workout type
  const colorForLog = (log: WorkoutLog): string => {
    const isCardio = (log.exercises ?? []).some(ex => /\b(run|cycle|bike|swim|row)/i.test(ex.exerciseName))
    if (isCardio) return '#22c55e'
    if ((log.exercises ?? []).some(ex => /\b(plank|hold|stretch|yoga)/i.test(ex.exerciseName))) return '#D4A853'
    return '#6D28D9'
  }

  const initialForLog = (log: WorkoutLog): string => {
    const name = log.dayName || log.planType || 'W'
    return name.substring(0, 1).toUpperCase()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-3"
      style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div ref={ref} className="bg-forged-surface border border-forged-border rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

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

        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-forged-text2 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = makeDate(day)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            const dayLogs = logsByDate[dateStr] ?? []
            const hasWorkout = dayLogs.length > 0

            return (
              <div key={day}
                className={`min-h-[56px] rounded-lg flex flex-col items-stretch pt-1 gap-0.5
                  border transition-all
                  ${isFuture ? 'opacity-25 border-transparent' : 'border-transparent'}
                  ${isToday ? 'border-forged-purple/40 bg-forged-purple/5' : ''}
                  ${hasWorkout && !isToday ? 'bg-forged-bg' : ''}
                `}>
                <span className={`text-[10px] font-bold text-center leading-none
                  ${isToday ? 'text-forged-purple' : 'text-forged-text'}`}>
                  {day}
                </span>

                {hasWorkout && (
                  <div className="flex flex-col gap-0.5 px-1 mt-0.5">
                    {dayLogs.slice(0, 3).map(log => (
                      <div key={log.id}
                        className="w-full h-3 rounded-sm flex items-center justify-center"
                        style={{
                          backgroundColor: colorForLog(log),
                          opacity: log.completed ? 0.85 : 0.35,
                        }}
                      >
                        <span className="text-[7px] font-black text-white tracking-wider">
                          {initialForLog(log)}
                        </span>
                      </div>
                    ))}
                    {dayLogs.length > 3 && (
                      <span className="text-[7px] text-forged-text2 text-center">+{dayLogs.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-forged-border flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#6D28D9' }} />
            <span className="text-[10px] text-forged-text2">Strength</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-[10px] text-forged-text2">Cardio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#D4A853' }} />
            <span className="text-[10px] text-forged-text2">Duration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm border border-forged-text2/40" />
            <span className="text-[10px] text-forged-text2">Incomplete</span>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full mt-3 py-2 text-xs font-bold text-forged-text2
            hover:text-forged-text hover:bg-forged-surface2 rounded-xl transition-all">
          Close
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// ROUTINE BUILDER
// ══════════════════════════════════
function RoutineBuilder({ existing, onBack }: {
  existing?: Routine
  onBack: () => void
}) {
  const [name, setName] = useState(existing?.name || '')
  const [days, setDays] = useState<RoutineDay[]>(existing?.days || [])
  const [addingDay, setAddingDay] = useState(false)
  const [newDayName, setNewDayName] = useState('')

  const addDay = () => {
    if (!newDayName.trim()) return
    setDays(prev => [...prev, { dayName: newDayName.trim(), exercises: [] }])
    setNewDayName('')
    setAddingDay(false)
  }

  const removeDay = (idx: number) => setDays(prev => prev.filter((_, i) => i !== idx))

  const addExToDay = (dayIdx: number, ex: RoutineExercise) => {
    setDays(prev => {
      const next = [...prev]
      next[dayIdx] = { ...next[dayIdx], exercises: [...next[dayIdx].exercises, ex] }
      return next
    })
  }

  const removeExFromDay = (dayIdx: number, exIdx: number) => {
    setDays(prev => {
      const next = [...prev]
      next[dayIdx] = { ...next[dayIdx], exercises: next[dayIdx].exercises.filter((_, i) => i !== exIdx) }
      return next
    })
  }

  const saveRoutine = () => {
    if (!name.trim() || days.length === 0) return
    const routines = loadRoutines()
    if (existing) {
      const idx = routines.findIndex(r => r.id === existing.id)
      if (idx >= 0) routines[idx] = { ...routines[idx], name, days }
    } else {
      routines.push({
        id: crypto.randomUUID(),
        name, days,
        createdAt: new Date().toISOString(),
      })
    }
    saveRoutines(routines)
    onBack()
  }

  return (
    <div className="flex flex-col gap-4">
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

      <Card delay={60}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-2">Routine Name</p>
        <input type="text" placeholder="e.g. Push/Pull/Legs, Upper/Lower..."
          value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
            text-forged-text text-sm font-semibold placeholder:text-forged-text2
            focus:border-forged-purple/50 outline-none transition-colors" />
      </Card>

      {days.map((day, dayIdx) => (
        <DayCard key={dayIdx} day={day} dayIdx={dayIdx}
          onRemoveDay={() => removeDay(dayIdx)}
          onAddExercise={(ex) => addExToDay(dayIdx, ex)}
          onRemoveExercise={(exIdx) => removeExFromDay(dayIdx, exIdx)}
        />
      ))}

      {addingDay ? (
        <Card>
          <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest mb-2">Day Name</p>
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. Push A, Leg Day..."
              value={newDayName} onChange={e => setNewDayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDay()} autoFocus
              className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                text-forged-text text-sm placeholder:text-forged-text2
                focus:border-forged-purple/50 outline-none transition-colors" />
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
          <Icon d={I.plus} size={16} sw={2.5} />Add Day
        </button>
      )}

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
// DAY CARD (builder)
// ══════════════════════════════════
function DayCard({ day, dayIdx, onRemoveDay, onAddExercise, onRemoveExercise }: {
  day: RoutineDay; dayIdx: number
  onRemoveDay: () => void
  onAddExercise: (ex: RoutineExercise) => void
  onRemoveExercise: (exIdx: number) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ExerciseKind>('strength')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [muscles, setMuscles] = useState<MuscleGroup[]>([])
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [notes, setNotes] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAddExercise({
      name: name.trim(),
      kind,
      sets: parseInt(sets) || 3,
      reps: reps || '10',
      intensity,
      muscleGroups: muscles,
      notes,
    })
    setName(''); setSets('3'); setReps('10'); setIntensity('moderate'); setMuscles([]); setNotes(''); setKind('strength')
    setAdding(false)
  }

  const toggleMuscle = (mg: MuscleGroup) => {
    setMuscles(prev => prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg])
  }

  return (
    <Card delay={80 + dayIdx * 60}>
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

      {day.exercises.length === 0 && !adding && (
        <p className="text-xs text-forged-text2 text-center py-3">No exercises yet</p>
      )}

      {day.exercises.map((ex, exIdx) => {
        const kindIcon = ex.kind === 'cardio' ? I.run : ex.kind === 'duration' ? I.hourglass : I.dumbbell
        return (
          <div key={exIdx}
            className="flex items-center justify-between py-2.5 border-b border-forged-text2/10 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon d={kindIcon} size={11} className="text-forged-purple flex-shrink-0" />
                <p className="text-sm font-semibold text-forged-text truncate">{ex.name}</p>
                <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-1.5 py-0.5 rounded">
                  {ex.intensity}
                </span>
              </div>
              <p className="text-[11px] text-forged-text2">
                {ex.sets} sets × {ex.reps} reps
                {ex.muscleGroups.length > 0 && ` · ${ex.muscleGroups.join(', ')}`}
              </p>
            </div>
            <button onClick={() => onRemoveExercise(exIdx)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all">
              <Icon d={I.x} size={12} />
            </button>
          </div>
        )
      })}

      {adding ? (
        <div className="mt-3 flex flex-col gap-2 bg-forged-bg border border-forged-border rounded-xl p-3">
          <input type="text" placeholder="Exercise name" value={name} autoFocus
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-2 bg-forged-surface border border-forged-border rounded-lg
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 outline-none transition-colors" />

          <div className="grid grid-cols-3 gap-1.5">
            {(['strength', 'cardio', 'duration'] as const).map(k => (
              <button key={k} onClick={() => setKind(k)}
                className={`py-1.5 rounded text-[10px] font-black capitalize transition-all
                  ${kind === k ? 'bg-forged-purple text-white' : 'bg-forged-surface border border-forged-border text-forged-text2'}`}>
                {k}
              </button>
            ))}
          </div>

          {kind === 'strength' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-forged-text2 font-bold">Sets</label>
                <input type="number" value={sets}
                  onChange={e => setSets(e.target.value)}
                  className="w-full px-2 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                    text-forged-text text-xs text-center focus:border-forged-purple/50 outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[9px] text-forged-text2 font-bold">Reps</label>
                <input type="text" value={reps}
                  onChange={e => setReps(e.target.value)}
                  className="w-full px-2 py-1.5 bg-forged-surface border border-forged-border rounded-lg
                    text-forged-text text-xs text-center focus:border-forged-purple/50 outline-none transition-colors" />
              </div>
            </div>
          )}

          {kind === 'strength' && (
            <div>
              <label className="text-[9px] text-forged-text2 font-bold block mb-1">Intensity</label>
              <div className="grid grid-cols-4 gap-1">
                {(['light', 'moderate', 'heavy', 'max'] as const).map(lvl => (
                  <button key={lvl} onClick={() => setIntensity(lvl)}
                    className={`py-1.5 rounded text-[10px] font-bold capitalize transition-all
                      ${intensity === lvl
                        ? 'bg-forged-purple text-white'
                        : 'bg-forged-surface border border-forged-border text-forged-text2'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[9px] text-forged-text2 font-bold block mb-1">Muscle groups</label>
            <div className="flex flex-wrap gap-1">
              {MUSCLE_GROUPS.map(mg => (
                <button key={mg} onClick={() => toggleMuscle(mg)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all
                    ${muscles.includes(mg)
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-surface border border-forged-border text-forged-text2'}`}>
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <input type="text" placeholder="Notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-forged-surface border border-forged-border rounded-lg
              text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors" />

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