import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FastingLog } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  food: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

function Label({ children }: { children: string }) {
  return <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">{children}</p>
}

// ══════════════════════════════════
// FASTING PRESETS
// ══════════════════════════════════
const PRESETS = [
  { id: '16:8', name: 'Lean Gains', hours: 16, eat: 8, meals: 3, color: '#3498db', emoji: '🔵', desc: 'Most popular. Skip breakfast, eat lunch to dinner.' },
  { id: '18:6', name: 'Steady Burn', hours: 18, eat: 6, meals: 2, color: '#2ecc71', emoji: '🟢', desc: 'Tighter window. Lunch and early dinner.' },
  { id: '20:4', name: 'Warrior', hours: 20, eat: 4, meals: 1, color: '#f39c12', emoji: '🟡', desc: 'One big meal with a small snack window.' },
  { id: 'OMAD', name: 'One Meal', hours: 23, eat: 1, meals: 1, color: '#9b59b6', emoji: '🟣', desc: 'All daily calories in a single sitting.' },
]

function getPreset(hours: number) {
  return PRESETS.find(p => p.hours === hours) || { id: `${hours}h`, name: 'Custom', hours, eat: 24 - hours, meals: 0, color: '#e74c3c', emoji: '🔴', desc: 'Custom fast' }
}

// ══════════════════════════════════
// LOCAL STORAGE — FAST HISTORY
// ══════════════════════════════════
interface FastRecord {
  id: string; name: string; hours: number; meals: number
  mealTimes: string[]; notes: string
  startTime: string; endTime: string; date: string
}

const FASTS_KEY = 'forged_fasts'
const CUSTOM_KEY = 'forged_custom_fasts'

function loadFasts(): FastRecord[] { try { return JSON.parse(localStorage.getItem(FASTS_KEY) || '[]') } catch { return [] } }
function saveFasts(f: FastRecord[]) { localStorage.setItem(FASTS_KEY, JSON.stringify(f)) }

interface CustomFast { id: string; name: string; hours: number; eat: number; meals: number; mealTimes: string[]; notes: string; color: string }
function loadCustom(): CustomFast[] { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]') } catch { return [] } }
function saveCustom(f: CustomFast[]) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(f)) }

// ══════════════════════════════════
// PAGE VIEWS
// ══════════════════════════════════
type View = 'home' | 'confirm' | 'custom' | 'active'

export default function FastingPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>('home')
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [history, setHistory] = useState<FastRecord[]>(loadFasts)
  const [customFasts, setCustomFasts] = useState<CustomFast[]>(loadCustom)
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESETS[0] | null>(null)
  const [calMonth, setCalMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const loadActive = useCallback(async () => {
    try {
      const f = await api.fasting.getActive()
      if (f?.startTime && !isNaN(new Date(f.startTime).getTime())) {
        setActiveFast(f)
        setView('active')
      }
    } catch { /* no active fast */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  const startFast = async (hours: number) => {
    try {
      await api.fasting.start({ targetHours: hours })
      await loadActive()
      setView('active')
      setSelectedPreset(null)
    } catch (e) { console.error(e) }
  }

  const endFast = async () => {
    if (!activeFast) return
    try {
      await api.fasting.end(activeFast.id, {})
      const preset = getPreset(activeFast.targetHours)
      const record: FastRecord = {
        id: crypto.randomUUID(),
        name: preset.name,
        hours: activeFast.targetHours,
        meals: preset.meals,
        mealTimes: [],
        notes: '',
        startTime: activeFast.startTime,
        endTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      }
      const next = [record, ...history]
      setHistory(next); saveFasts(next)
      setActiveFast(null)
      setView('home')
    } catch (e) { console.error(e) }
  }

  // Stats
  const streak = (() => {
    let s = 0; const t = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(t); d.setDate(d.getDate() - i)
      if (history.some(f => f.date === d.toISOString().split('T')[0])) s++; else break
    }
    return s
  })()
  const totalH = history.reduce((s, f) => s + f.hours, 0)

  if (loading) return (
    <div className="flex flex-col gap-4">
      <PageHeader onBack={onBack} />
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader onBack={onBack} />

      {/* ════════ ACTIVE FAST ════════ */}
      {view === 'active' && activeFast && (
        <TimerCard fast={activeFast} onEnd={endFast} />
      )}

      {/* ════════ CONFIRM SCREEN ════════ */}
      {view === 'confirm' && selectedPreset && (
        <ConfirmCard preset={selectedPreset} onStart={() => startFast(selectedPreset.hours)} onCancel={() => { setView('home'); setSelectedPreset(null) }} />
      )}

      {/* ════════ CUSTOM FAST FORM ════════ */}
      {view === 'custom' && (
        <CustomFastForm
          onSave={(cf) => {
            const next = [cf, ...customFasts]; setCustomFasts(next); saveCustom(next)
            setView('home')
          }}
          onStart={(hours) => startFast(hours)}
          onCancel={() => setView('home')}
        />
      )}

      {/* ════════ HOME ════════ */}
      {(view === 'home' || view === 'active') && (
        <>
          {/* Presets */}
          {view === 'home' && (
            <Card delay={60}>
              <Label>Choose a Fast</Label>
              <div className="flex flex-col gap-2.5">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPreset(p); setView('confirm') }}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-forged-border bg-forged-bg
                      hover:border-opacity-60 active:scale-[0.99] transition-all text-left group"
                    style={{ borderColor: p.color + '25' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: p.color + '18' }}>
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-forged-text">{p.id}</span>
                        <span className="text-[10px] text-forged-text2 font-medium">· {p.name}</span>
                      </div>
                      <p className="text-[11px] text-forged-text2 mt-0.5">{p.desc}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">{p.hours}h fasting</span>
                        <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">{p.eat}h eating</span>
                        <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">{p.meals} meal{p.meals > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Icon d={I.chevR} size={16} className="text-forged-text2 group-hover:text-forged-text transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Saved custom fasts */}
              {customFasts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-forged-text2/10">
                  <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-2.5">Your Custom Fasts</p>
                  {customFasts.map(cf => (
                    <div key={cf.id} className="flex items-center gap-3 p-3 rounded-xl border border-forged-border bg-forged-bg mb-2 last:mb-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: cf.color + '18' }}>🔴</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-forged-text">{cf.name}</p>
                        <p className="text-[10px] text-forged-text2">{cf.hours}h fast · {cf.eat}h eat · {cf.meals} meal{cf.meals > 1 ? 's' : ''}</p>
                      </div>
                      <button onClick={() => startFast(cf.hours)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-forged-purple/10 text-forged-purple border border-forged-purple/20 hover:bg-forged-purple hover:text-white active:scale-95 transition-all">
                        Start
                      </button>
                      <button onClick={() => { const next = customFasts.filter(c => c.id !== cf.id); setCustomFasts(next); saveCustom(next) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red transition-colors">
                        <Icon d={I.trash} size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Create custom button */}
              <button onClick={() => setView('custom')}
                className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-forged-text2
                  border border-dashed border-forged-border
                  hover:border-forged-purple/30 hover:text-forged-purple transition-all
                  flex items-center justify-center gap-2">
                <Icon d={I.plus} size={14} sw={2.5} />
                Create Custom Fast
              </button>
            </Card>
          )}

          {/* Stats */}
          <Card delay={view === 'active' ? 60 : 140}>
            <Label>Your Progress</Label>
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="Fasts" value={`${history.length}`} />
              <MiniStat label="Streak" value={`${streak}d`} />
              <MiniStat label="Longest" value={`${history.length > 0 ? Math.max(...history.map(f => f.hours)) : 0}h`} />
              <MiniStat label="Total" value={`${totalH}h`} />
            </div>
          </Card>

          {/* Calendar */}
          <Card delay={view === 'active' ? 120 : 200}>
            <FastCalendar month={calMonth} onMonthChange={setCalMonth} history={history} />
          </Card>

          {/* Weekly chart */}
          <Card delay={view === 'active' ? 180 : 260}>
            <Label>Last 7 Days</Label>
            <WeekChart history={history} />
          </Card>

          {/* Recent */}
          <Card delay={view === 'active' ? 240 : 320}>
            <Label>Recent Fasts</Label>
            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Icon d={I.moon} size={28} className="text-forged-text2 mx-auto mb-2" />
                <p className="text-sm font-bold text-forged-text">No fasts yet</p>
                <p className="text-xs text-forged-text2 mt-1">Complete your first fast to see it here</p>
              </div>
            ) : (
              <div className="flex flex-col max-h-60 overflow-y-auto">
                {history.slice(0, 20).map(fast => {
                  const p = getPreset(fast.hours)
                  const start = new Date(fast.startTime)
                  const end = new Date(fast.endTime)
                  const dur = ((end.getTime() - start.getTime()) / 3600000).toFixed(1)
                  return (
                    <div key={fast.id} className="flex items-center justify-between py-3 border-b border-forged-text2/10 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-forged-text">{fast.name || p.name}</p>
                            <span className="text-[9px] text-forged-text2">· {p.id}</span>
                          </div>
                          <p className="text-[10px] text-forged-text2">
                            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {dur}h · {fast.meals} meal{fast.meals !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => { const next = history.filter(f => f.id !== fast.id); setHistory(next); saveFasts(next) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red transition-colors">
                        <Icon d={I.trash} size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}

// ══════════════════════════════════
// PAGE HEADER
// ══════════════════════════════════
function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <button onClick={onBack}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
        <Icon d={I.chevL} size={16} />
      </button>
      <div>
        <h1 className="text-2xl font-black text-forged-text">Fasting</h1>
        <p className="text-[10px] text-forged-text2 font-medium">Intermittent fasting tracker</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// CONFIRM CARD — preview before starting
// ══════════════════════════════════
function ConfirmCard({ preset, onStart, onCancel }: {
  preset: typeof PRESETS[0]; onStart: () => void; onCancel: () => void
}) {
  const now = new Date()
  const eatOpen = new Date(now.getTime() + preset.hours * 3600000)
  const eatClose = new Date(eatOpen.getTime() + preset.eat * 3600000)

  return (
    <Card delay={0} className="!p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: preset.color + '18' }}>{preset.emoji}</div>
          <div>
            <p className="text-xl font-black text-forged-text">{preset.id}</p>
            <p className="text-xs text-forged-text2 font-medium">{preset.name}</p>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text transition-colors">
          <Icon d={I.x} size={16} />
        </button>
      </div>

      <p className="text-sm text-forged-text2 mb-5">{preset.desc}</p>

      {/* Schedule preview */}
      <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon d={I.moon} size={14} className="text-forged-text2" />
            <span className="text-xs font-bold text-forged-text">Fasting Window</span>
          </div>
          <span className="text-xs font-bold text-forged-text2">{preset.hours} hours</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] text-forged-text2">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-forged-surface2">
            <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: preset.color + '80' }} />
          </div>
          <span className="text-[10px] text-forged-text2">{eatOpen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon d={I.sun} size={14} className="text-forged-text2" />
            <span className="text-xs font-bold text-forged-text">Eating Window</span>
          </div>
          <span className="text-xs font-bold text-forged-text2">{preset.eat} hours</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-forged-text2">{eatOpen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-forged-surface2">
            <div className="h-full rounded-full bg-forged-green/60" style={{ width: '100%' }} />
          </div>
          <span className="text-[10px] text-forged-text2">{eatClose.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-2">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <span className="text-xs text-forged-text2">{preset.meals} meal{preset.meals > 1 ? 's' : ''} during eating window</span>
        </div>
      </div>

      <button onClick={onStart}
        className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] hover:brightness-110 shadow-lg"
        style={{ backgroundColor: preset.color, boxShadow: `0 8px 24px ${preset.color}30` }}>
        Start {preset.id} Fast
      </button>
    </Card>
  )
}

// ══════════════════════════════════
// CUSTOM FAST FORM
// ══════════════════════════════════
function CustomFastForm({ onSave, onStart, onCancel }: {
  onSave: (cf: CustomFast) => void; onStart: (hours: number) => void; onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [hours, setHours] = useState('')
  const [meals, setMeals] = useState('2')
  const [mealTimes, setMealTimes] = useState<string[]>(['12:00', '18:00'])
  const [notes, setNotes] = useState('')
  const [saveTemplate, setSaveTemplate] = useState(false)

  const eat = Math.max(24 - (parseInt(hours) || 0), 0)
  const mealCount = parseInt(meals) || 0

  const updateMealCount = (n: string) => {
    setMeals(n)
    const count = parseInt(n) || 0
    const times: string[] = []
    for (let i = 0; i < count; i++) {
      times.push(mealTimes[i] || `${12 + i * 3}:00`)
    }
    setMealTimes(times)
  }

  const handleStart = () => {
    const h = parseInt(hours)
    if (!h || h < 1 || h > 72) return
    if (saveTemplate && name) {
      const cf: CustomFast = {
        id: crypto.randomUUID(), name, hours: h, eat,
        meals: mealCount, mealTimes, notes, color: '#e74c3c',
      }
      onSave(cf)
    }
    onStart(h)
  }

  return (
    <Card delay={0} className="!p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-lg font-black text-forged-text">Create Custom Fast</p>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text transition-colors">
          <Icon d={I.x} size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Fast Name</label>
          <input type="text" placeholder="e.g. My Evening Fast" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors" />
        </div>

        {/* Hours + Eating window */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Fasting Hours</label>
            <input type="number" placeholder="16" min={1} max={72} value={hours} onChange={e => setHours(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Eating Window</label>
            <div className="px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl">
              <span className="text-sm font-bold text-forged-text">{eat > 0 ? `${eat} hours` : '--'}</span>
            </div>
          </div>
        </div>

        {/* Number of meals */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Meals in Eating Window</label>
          <div className="flex gap-2">
            {['1', '2', '3', '4'].map(n => (
              <button key={n} onClick={() => updateMealCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${meals === n ? 'bg-forged-purple text-white' : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Meal times */}
        {mealCount > 0 && (
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Meal Times</label>
            <div className="flex flex-col gap-2">
              {mealTimes.map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-forged-text2 w-16">Meal {i + 1}</span>
                  <input type="time" value={time}
                    onChange={e => { const t = [...mealTimes]; t[i] = e.target.value; setMealTimes(t) }}
                    className="flex-1 px-3 py-2 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm focus:border-forged-purple/50 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">Notes (optional)</label>
          <textarea placeholder="Any notes about this fast..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors resize-none" />
        </div>

        {/* Save as template toggle */}
        <button onClick={() => setSaveTemplate(!saveTemplate)}
          className="flex items-center justify-between py-2">
          <span className="text-sm text-forged-text font-medium">Save as template</span>
          <div className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5
            ${saveTemplate ? 'bg-forged-purple' : 'bg-forged-surface2 border border-forged-border'}`}>
            <div className={`w-5 h-5 rounded-full transition-all duration-200 shadow-sm
              ${saveTemplate ? 'translate-x-5 bg-white' : 'translate-x-0 bg-forged-text2/40'}`} />
          </div>
        </button>

        {/* Summary */}
        {parseInt(hours) > 0 && (
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
            <p className="text-[10px] font-bold text-forged-text2 uppercase mb-2">Summary</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">{hours}h fasting</span>
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">{eat}h eating</span>
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">{mealCount} meal{mealCount !== 1 ? 's' : ''}</span>
              {name && <span className="text-[10px] font-bold text-forged-purple bg-forged-purple/10 px-2.5 py-1 rounded-full">{name}</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleStart} disabled={!parseInt(hours)}
            className="flex-1 py-3 rounded-xl text-sm font-black bg-forged-purple text-white
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
            Start Fast
          </button>
          <button onClick={onCancel}
            className="px-5 py-3 rounded-xl text-sm font-bold text-forged-text2 hover:text-forged-text transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Card>
  )
}

// ══════════════════════════════════
// TIMER CARD — active fast
// ══════════════════════════════════
function TimerCard({ fast, onEnd }: { fast: FastingLog; onEnd: () => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const startMs = new Date(fast.startTime).getTime()
  if (isNaN(startMs)) return null

  const elapsed = Math.max((now - startMs) / 1000, 0)
  const totalSec = fast.targetHours * 3600
  const remaining = Math.max(totalSec - elapsed, 0)
  const pct = Math.min(elapsed / totalSec, 1)
  const preset = getPreset(fast.targetHours)
  const done = remaining <= 0

  const fmt = (sec: number) => ({
    h: Math.floor(sec / 3600),
    m: Math.floor((sec % 3600) / 60),
    s: Math.floor(sec % 60),
  })
  const rem = fmt(remaining)
  const elap = fmt(elapsed)

  const startDate = new Date(fast.startTime)
  const eatOpen = new Date(startDate.getTime() + fast.targetHours * 3600000)
  const eatClose = new Date(eatOpen.getTime() + preset.eat * 3600000)
  const inEat = now >= eatOpen.getTime()

  const sz = 200, stroke = 12, r = (sz - stroke) / 2, c = 2 * Math.PI * r

  return (
    <Card delay={0} className="!p-6 relative overflow-hidden">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }} />
          <span className="text-base font-black text-forged-text">{preset.id}</span>
          <span className="text-xs text-forged-text2">{preset.name}</span>
        </div>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${inEat ? 'bg-forged-green/15 text-forged-green' : 'bg-forged-purple/15 text-forged-purple'}`}>
          {done ? 'Complete' : inEat ? 'Eating Window' : 'Fasting'}
        </span>
      </div>

      {/* Ring timer */}
      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: sz, height: sz }}>
          <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity={0.2} />
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={done ? '#2ecc71' : preset.color} strokeWidth={stroke}
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 10px ${preset.color}40)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <>
                <Icon d={I.check} size={36} className="text-forged-green mb-1" sw={2.5} />
                <p className="text-lg font-black text-forged-green">Fast Complete!</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-forged-text2 font-bold uppercase mb-1">Remaining</p>
                <p className="text-4xl font-black text-forged-text tabular-nums tracking-tight">
                  {String(rem.h).padStart(2, '0')}:{String(rem.m).padStart(2, '0')}
                </p>
                <p className="text-xl font-bold text-forged-text2 tabular-nums -mt-1">{String(rem.s).padStart(2, '0')}<span className="text-xs">s</span></p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">{elap.h}h {elap.m}m</p>
          <p className="text-[9px] text-forged-text2 font-medium">Elapsed</p>
        </div>
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">{Math.round(pct * 100)}%</p>
          <p className="text-[9px] text-forged-text2 font-medium">Progress</p>
        </div>
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">{fast.targetHours}h</p>
          <p className="text-[9px] text-forged-text2 font-medium">Goal</p>
        </div>
      </div>

      {/* Meal window */}
      <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">Meal Window</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] text-forged-text2 uppercase font-bold">Opens</p>
            <p className="text-sm font-black text-forged-text">{eatOpen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
          <div className="flex-1 mx-4 h-1 rounded-full bg-forged-surface2 relative overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(pct / (fast.targetHours / 24), 1) * 100}%`, backgroundColor: preset.color }} />
          </div>
          <div className="text-right">
            <p className="text-[9px] text-forged-text2 uppercase font-bold">Closes</p>
            <p className="text-sm font-black text-forged-text">{eatClose.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        </div>
        <p className="text-[10px] text-forged-text2 mt-2 text-center">{preset.meals} meal{preset.meals > 1 ? 's' : ''} recommended</p>
      </div>

      {/* End button */}
      <button onClick={onEnd}
        className="w-full py-3.5 rounded-xl text-sm font-black border transition-all active:scale-[0.98]
          bg-forged-red/10 text-forged-red border-forged-red/25 hover:bg-forged-red hover:text-white">
        End Fast
      </button>
    </Card>
  )
}

// ══════════════════════════════════
// MINI STAT
// ══════════════════════════════════
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
      <p className="text-lg font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[8px] text-forged-text2 font-bold uppercase">{label}</p>
    </div>
  )
}

// ══════════════════════════════════
// CALENDAR
// ══════════════════════════════════
function FastCalendar({ month, onMonthChange, history }: { month: Date; onMonthChange: (d: Date) => void; history: FastRecord[] }) {
  const y = month.getFullYear(), m = month.getMonth()
  const first = new Date(y, m, 1).getDay()
  const dim = new Date(y, m + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Label>
        <div className="flex gap-1">
          <button onClick={() => onMonthChange(new Date(y, m - 1, 1))} className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevL} size={12} /></button>
          <button onClick={() => onMonthChange(new Date(y, m + 1, 1))} className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevR} size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-center text-[9px] font-bold text-forged-text2 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const fasts = history.filter(f => f.date === ds)
          const isT = ds === today
          return (
            <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${isT ? 'ring-1 ring-forged-purple/50' : ''} ${fasts.length ? 'bg-forged-bg' : ''}`}>
              <span className={`text-xs font-bold ${isT ? 'text-forged-purple' : fasts.length ? 'text-forged-text' : 'text-forged-text2'}`}>{day}</span>
              {fasts.length > 0 && <div className="flex gap-0.5 mt-0.5">{fasts.slice(0,3).map((f,j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPreset(f.hours).color }} />)}</div>}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-forged-text2/10">
        {PRESETS.map(p => <div key={p.id} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-[9px] text-forged-text2 font-bold">{p.id}</span></div>)}
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-forged-red" /><span className="text-[9px] text-forged-text2 font-bold">Custom</span></div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// WEEKLY CHART
// ══════════════════════════════════
function WeekChart({ history }: { history: FastRecord[] }) {
  const days: { label: string; hours: number; color: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const k = d.toISOString().split('T')[0]
    const f = history.filter(r => r.date === k)
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), hours: f.reduce((s, r) => s + r.hours, 0), color: f.length ? getPreset(f[0].hours).color : '#333' })
  }
  const max = Math.max(...days.map(d => d.hours), 24)
  return (
    <div>
      <div className="flex items-end gap-2 h-28">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {d.hours > 0 && <span className="text-[9px] font-bold text-forged-text tabular-nums">{d.hours}h</span>}
            <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${d.hours > 0 ? Math.max((d.hours / max) * 100, 8) : 4}%`, backgroundColor: d.hours > 0 ? d.color : 'var(--border)', opacity: d.hours > 0 ? 0.8 : 0.3 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">{days.map((d, i) => <div key={i} className="flex-1 text-center"><span className="text-[9px] text-forged-text2 font-bold">{d.label}</span></div>)}</div>
    </div>
  )
}