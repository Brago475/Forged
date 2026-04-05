import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FastingLog } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  stop: <><rect x="3" y="3" width="18" height="18" rx="2"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  food: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

// ══════════════════════════════════
// FASTING CONFIG
// ══════════════════════════════════
const FAST_TYPES = [
  { label: '16:8', hours: 16, eat: 8, color: '#3498db', bg: 'bg-blue-500/15', text: 'text-blue-400', desc: 'Beginner friendly' },
  { label: '18:6', hours: 18, eat: 6, color: '#2ecc71', bg: 'bg-green-500/15', text: 'text-green-400', desc: 'Intermediate' },
  { label: '20:4', hours: 20, eat: 4, color: '#f39c12', bg: 'bg-yellow-500/15', text: 'text-yellow-400', desc: 'Warrior diet' },
  { label: 'OMAD', hours: 23, eat: 1, color: '#9b59b6', bg: 'bg-purple-500/15', text: 'text-purple-400', desc: 'One meal a day' },
]

function getTypeConfig(hours: number) {
  return FAST_TYPES.find(t => t.hours === hours) || { label: `${hours}h`, hours, eat: 24 - hours, color: '#e74c3c', bg: 'bg-red-500/15', text: 'text-red-400', desc: 'Custom' }
}

// ══════════════════════════════════
// LOCAL STORAGE FOR FAST HISTORY
// ══════════════════════════════════
interface FastRecord { id: string; type: string; hours: number; startTime: string; endTime: string; completed: boolean; date: string }
const FASTS_KEY = 'forged_fasts'
function loadFasts(): FastRecord[] { try { return JSON.parse(localStorage.getItem(FASTS_KEY) || '[]') } catch { return [] } }
function saveFasts(f: FastRecord[]) { localStorage.setItem(FASTS_KEY, JSON.stringify(f)) }

// ══════════════════════════════════
// MAIN FASTING PAGE
// ══════════════════════════════════
export default function FastingPage({ onBack }: { onBack: () => void }) {
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [history, setHistory] = useState<FastRecord[]>(loadFasts)
  const [calMonth, setCalMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [custom, setCustom] = useState(false)
  const [customHrs, setCustomHrs] = useState('')

  const loadActive = useCallback(async () => {
    try {
      const f = await api.fasting.getActive()
      if (f && f.startTime && !isNaN(new Date(f.startTime).getTime())) setActiveFast(f)
      else setActiveFast(null)
    } catch { setActiveFast(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  const startFast = async (hours: number) => {
    try {
      await api.fasting.start({ targetHours: hours })
      await loadActive()
    } catch (e) { console.error(e) }
  }

  const endFast = async () => {
    if (!activeFast) return
    try {
      await api.fasting.end(activeFast.id, {})
      const cfg = getTypeConfig(activeFast.targetHours)
      const record: FastRecord = {
        id: crypto.randomUUID(),
        type: cfg.label,
        hours: activeFast.targetHours,
        startTime: activeFast.startTime,
        endTime: new Date().toISOString(),
        completed: true,
        date: new Date().toISOString().split('T')[0],
      }
      const next = [record, ...history]
      setHistory(next)
      saveFasts(next)
      setActiveFast(null)
    } catch (e) { console.error(e) }
  }

  // Stats
  const totalFasts = history.length
  const currentStreak = (() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (history.some(f => f.date === key)) streak++
      else break
    }
    return streak
  })()
  const longestFast = history.length > 0 ? Math.max(...history.map(f => f.hours)) : 0
  const totalHours = history.reduce((s, f) => s + f.hours, 0)

  if (loading) return (
    <div className="flex flex-col gap-4">
      <Header onBack={onBack} />
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <Header onBack={onBack} />

      {/* ══ ACTIVE FAST — Timer ══ */}
      {activeFast ? (
        <ActiveFastCard fast={activeFast} onEnd={endFast} />
      ) : (
        <>
          {/* ══ START NEW FAST ══ */}
          <Card delay={60}>
            <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-4">Start a Fast</p>
            <div className="grid grid-cols-2 gap-3">
              {FAST_TYPES.map(type => (
                <button key={type.label} onClick={() => startFast(type.hours)}
                  className={`relative p-4 rounded-xl border border-forged-border bg-forged-bg
                    hover:border-opacity-50 active:scale-[0.98] transition-all text-left group`}
                  style={{ borderColor: type.color + '30' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-lg font-black text-forged-text">{type.label}</span>
                  </div>
                  <p className="text-[10px] text-forged-text2 font-bold">{type.hours}h fast · {type.eat}h eat</p>
                  <p className="text-[9px] text-forged-text2 mt-0.5">{type.desc}</p>
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: type.color + '20' }}>
                    <Icon d={I.play} size={12} className="text-forged-text" sw={2.5} />
                  </div>
                </button>
              ))}
            </div>
            {/* Custom */}
            <div className="mt-3">
              {custom ? (
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Hours (1-72)" value={customHrs}
                    onChange={e => setCustomHrs(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors" />
                  <button onClick={() => { const h = parseInt(customHrs); if (h > 0 && h <= 72) { startFast(h); setCustom(false); setCustomHrs('') } }}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-forged-red text-white hover:brightness-110 active:scale-95 transition-all">Start</button>
                  <button onClick={() => { setCustom(false); setCustomHrs('') }}
                    className="px-3 py-2.5 text-xs font-bold text-forged-text2 hover:text-forged-text">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setCustom(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-forged-text2 border border-dashed border-forged-border hover:border-forged-red/30 hover:text-forged-red transition-all">
                  Custom duration
                </button>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ══ STATS CHIPS ══ */}
      <div className="grid grid-cols-4 gap-2">
        <StatChip label="Total" value={`${totalFasts}`} icon={I.check} color="#9b59b6" delay={120} />
        <StatChip label="Streak" value={`${currentStreak}d`} icon={I.flame} color="#e74c3c" delay={160} />
        <StatChip label="Longest" value={`${longestFast}h`} icon={I.target} color="#f39c12" delay={200} />
        <StatChip label="Hours" value={`${totalHours}`} icon={I.clock} color="#3498db" delay={240} />
      </div>

      {/* ══ FASTING CALENDAR ══ */}
      <Card delay={280}>
        <FastingCalendar month={calMonth} onMonthChange={setCalMonth} history={history} />
      </Card>

      {/* ══ WEEKLY GRAPH ══ */}
      <Card delay={340}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Last 7 Days</p>
        <WeeklyGraph history={history} />
      </Card>

      {/* ══ RECENT FASTS ══ */}
      <Card delay={400}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Recent Fasts</p>
        {history.length === 0 ? (
          <div className="py-6 text-center">
            <Icon d={I.moon} size={28} className="text-forged-text2 mx-auto mb-2" />
            <p className="text-sm text-forged-text2">No fasts completed yet</p>
            <p className="text-xs text-forged-text2">Start your first fast above</p>
          </div>
        ) : (
          <div className="flex flex-col max-h-64 overflow-y-auto">
            {history.slice(0, 15).map(fast => {
              const cfg = getTypeConfig(fast.hours)
              const start = new Date(fast.startTime)
              const end = new Date(fast.endTime)
              const dur = ((end.getTime() - start.getTime()) / 3600000).toFixed(1)
              return (
                <div key={fast.id} className="flex items-center justify-between py-3 border-b border-forged-text2/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div>
                      <p className="text-sm font-bold text-forged-text">{cfg.label}</p>
                      <p className="text-[10px] text-forged-text2">
                        {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {dur}h completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-forged-green"><Icon d={I.check} size={12} sw={2.5} /></span>
                    <button onClick={() => {
                      const next = history.filter(f => f.id !== fast.id)
                      setHistory(next); saveFasts(next)
                    }} className="w-6 h-6 rounded flex items-center justify-center text-forged-text2 hover:text-forged-red transition-colors">
                      <Icon d={I.trash} size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="h-4" />
    </div>
  )
}

// ══════════════════════════════════
// HEADER
// ══════════════════════════════════
function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
        <Icon d={I.chevL} size={16} />
      </button>
      <div>
        <h1 className="text-2xl font-black text-forged-text">Fasting</h1>
        <p className="text-[10px] text-forged-text2 font-medium">Track your fasting windows</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// ACTIVE FAST — Big timer
// ══════════════════════════════════
function ActiveFastCard({ fast, onEnd }: { fast: FastingLog; onEnd: () => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const startMs = new Date(fast.startTime).getTime()
  if (isNaN(startMs)) return null

  const elapsed = Math.max((now - startMs) / 1000, 0) // seconds
  const totalSec = fast.targetHours * 3600
  const remaining = Math.max(totalSec - elapsed, 0)
  const pct = Math.min(elapsed / totalSec, 1)
  const cfg = getTypeConfig(fast.targetHours)

  const fmtTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return { h, m, s }
  }

  const rem = fmtTime(remaining)
  const elap = fmtTime(elapsed)

  // Meal window calculation
  const startDate = new Date(fast.startTime)
  const eatStart = new Date(startDate.getTime() + fast.targetHours * 3600000)
  const eatEnd = new Date(eatStart.getTime() + cfg.eat * 3600000)
  const inEatWindow = now >= eatStart.getTime()

  // Ring
  const sz = 180, stroke = 10, r = (sz - stroke) / 2, c = 2 * Math.PI * r

  return (
    <Card delay={60} className="!p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-forged-purple/[0.05] via-transparent to-transparent pointer-events-none" />

      {/* Type badge */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-sm font-black text-forged-text">{cfg.label}</span>
          <span className="text-[10px] text-forged-text2">· {cfg.hours}h fast</span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${inEatWindow ? 'bg-forged-green/15 text-forged-green' : 'bg-forged-purple/15 text-forged-purple'}`}>
          {inEatWindow ? 'Eat Window' : 'Fasting'}
        </span>
      </div>

      {/* Big timer ring */}
      <div className="relative flex justify-center mb-5">
        <div className="relative" style={{ width: sz, height: sz }}>
          <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity={0.3} />
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={cfg.color} strokeWidth={stroke}
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 8px ${cfg.color}50)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {remaining > 0 ? (
              <>
                <p className="text-4xl font-black text-forged-text tabular-nums tracking-tight">
                  {String(rem.h).padStart(2, '0')}:{String(rem.m).padStart(2, '0')}
                </p>
                <p className="text-lg font-bold text-forged-text2 tabular-nums">{String(rem.s).padStart(2, '0')}s</p>
                <p className="text-[10px] text-forged-text2 mt-1">remaining</p>
              </>
            ) : (
              <>
                <Icon d={I.check} size={32} className="text-forged-green mb-1" sw={2.5} />
                <p className="text-sm font-black text-forged-green">Complete!</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Elapsed */}
      <div className="flex justify-center mb-4">
        <div className="bg-forged-bg border border-forged-border rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="text-center">
            <p className="text-xs font-black text-forged-text tabular-nums">{elap.h}h {elap.m}m</p>
            <p className="text-[9px] text-forged-text2">Elapsed</p>
          </div>
          <div className="w-px h-6 bg-forged-border" />
          <div className="text-center">
            <p className="text-xs font-black text-forged-text tabular-nums">{Math.round(pct * 100)}%</p>
            <p className="text-[9px] text-forged-text2">Progress</p>
          </div>
        </div>
      </div>

      {/* Meal window info */}
      <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">Meal Window</p>
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-forged-text2">Opens</p>
            <p className="text-sm font-bold text-forged-text">{eatStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center"><div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: cfg.color + '40' }} /></div>
          <div className="text-right">
            <p className="text-xs text-forged-text2">Closes</p>
            <p className="text-sm font-bold text-forged-text">{eatEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mb-5">
        <div className="flex items-center gap-1 mb-1.5">
          <Icon d={I.moon} size={12} className="text-forged-text2" />
          <div className="flex-1 h-3 rounded-full bg-forged-bg border border-forged-border overflow-hidden relative">
            <div className="absolute h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: cfg.color + 'CC' }} />
            {/* Eat window marker */}
            <div className="absolute h-full rounded-r-full bg-forged-green/20 border-l border-forged-green/30"
              style={{ left: `${(fast.targetHours / 24) * 100}%`, width: `${(cfg.eat / 24) * 100}%` }} />
          </div>
          <Icon d={I.sun} size={12} className="text-forged-text2" />
        </div>
        <div className="flex justify-between text-[9px] text-forged-text2">
          <span>{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <span>Now</span>
          <span>{eatEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* End button */}
      <button onClick={onEnd}
        className="w-full py-3 rounded-xl text-sm font-black border transition-all active:scale-[0.98]
          bg-forged-red/10 text-forged-red border-forged-red/25 hover:bg-forged-red hover:text-white">
        End Fast
      </button>
    </Card>
  )
}

// ══════════════════════════════════
// STAT CHIP
// ══════════════════════════════════
function StatChip({ label, value, icon, color, delay = 0 }: { label: string; value: string; icon: React.ReactNode; color: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-xl p-3 text-center transition-all duration-500 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1.5" style={{ backgroundColor: color + '20' }}>
        <Icon d={icon} size={13} className="text-forged-text" style={{ color } as any} />
      </div>
      <p className="text-lg font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[8px] text-forged-text2 font-bold uppercase">{label}</p>
    </div>
  )
}

// ══════════════════════════════════
// FASTING CALENDAR
// ══════════════════════════════════
function FastingCalendar({ month, onMonthChange, history }: { month: Date; onMonthChange: (d: Date) => void; history: FastRecord[] }) {
  const year = month.getFullYear(), mo = month.getMonth()
  const firstDay = new Date(year, mo, 1).getDay()
  const daysInMonth = new Date(year, mo + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const prevMonth = () => onMonthChange(new Date(year, mo - 1, 1))
  const nextMonth = () => onMonthChange(new Date(year, mo + 1, 1))

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.chevL} size={12} />
          </button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-forged-bg border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.chevR} size={12} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-forged-text2 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={i} />
          const dateStr = `${year}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayFasts = history.filter(f => f.date === dateStr)
          const isToday = dateStr === today
          const hasFast = dayFasts.length > 0
          const fastColor = hasFast ? getTypeConfig(dayFasts[0].hours).color : undefined

          return (
            <div key={i} className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all
              ${isToday ? 'ring-1 ring-forged-purple/50' : ''}
              ${hasFast ? 'bg-forged-bg' : ''}`}>
              <span className={`text-xs font-bold ${isToday ? 'text-forged-purple' : hasFast ? 'text-forged-text' : 'text-forged-text2'}`}>{day}</span>
              {hasFast && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayFasts.slice(0, 3).map((f, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTypeConfig(f.hours).color }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-forged-text2/10">
        {FAST_TYPES.map(type => (
          <div key={type.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
            <span className="text-[9px] text-forged-text2 font-bold">{type.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-forged-red" />
          <span className="text-[9px] text-forged-text2 font-bold">Custom</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// WEEKLY GRAPH
// ══════════════════════════════════
function WeeklyGraph({ history }: { history: FastRecord[] }) {
  const days: { label: string; hours: number; color: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayFasts = history.filter(f => f.date === key)
    const total = dayFasts.reduce((s, f) => s + f.hours, 0)
    const color = dayFasts.length > 0 ? getTypeConfig(dayFasts[0].hours).color : '#333'
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      hours: total,
      color,
    })
  }

  const maxH = Math.max(...days.map(d => d.hours), 24)

  return (
    <div>
      <div className="flex items-end gap-2 h-28">
        {days.map((day, i) => {
          const h = day.hours > 0 ? Math.max((day.hours / maxH) * 100, 8) : 4
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {day.hours > 0 && <span className="text-[9px] font-bold text-forged-text tabular-nums">{day.hours}h</span>}
              <div className="w-full rounded-t-lg transition-all duration-500" style={{
                height: `${h}%`,
                backgroundColor: day.hours > 0 ? day.color : 'var(--border)',
                opacity: day.hours > 0 ? 0.8 : 0.3,
              }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-1.5">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-forged-text2 font-bold">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}