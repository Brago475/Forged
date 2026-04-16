import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { WeightEntry, FoodLog } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/><path d="M7 7L5 5"/><path d="M17 17l2 2"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
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
// PROGRESS PAGE
// ══════════════════════════════════
export default function ProgressPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [weekFood, setWeekFood] = useState<FoodLog[][]>([])
  const [dashStats, setDashStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Weight form
  const [weight, setWeight] = useState('')
  const [wNotes, setWNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [w, d] = await Promise.all([
        api.weight.getAll(365),
        api.workout.dashboard(),
      ])
      setEntries(w)
      setDashStats(d)

      // Load last 7 days of food for weekly averages
      const days: FoodLog[][] = []
      for (let i = 0; i < 7; i++) {
        const dt = new Date()
        dt.setDate(dt.getDate() - i)
        const dateStr = dt.toISOString().split('T')[0]
        try {
          const logs = await api.food.getLogs(dateStr)
          days.push(logs)
        } catch { days.push([]) }
      }
      setWeekFood(days)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleLogWeight = async () => {
    const w = parseFloat(weight)
    if (!w || w < 50 || w > 500) return
    setSaving(true)
    try {
      await api.weight.add({ weight: w, date: new Date().toISOString().split('T')[0], notes: wNotes || undefined })
      setWeight(''); setWNotes('')
      await loadData()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Computed stats ──
  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weight : 0
  const weekEntries = entries.filter(e => {
    const d = new Date(e.date + 'T00:00:00')
    const ago = new Date(); ago.setDate(ago.getDate() - 7)
    return d >= ago
  })
  const weekChange = weekEntries.length >= 2
    ? weekEntries[weekEntries.length - 1].weight - weekEntries[0].weight
    : 0

  // Weekly food averages
  const daysWithFood = weekFood.filter(d => d.length > 0).length || 1
  const weekAvg = {
    cal: Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0) / daysWithFood),
    protein: Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0) / daysWithFood),
    carbs: Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0) / daysWithFood),
    fat: Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0) / daysWithFood),
  }

  // Habit stats
  const calGoal = 2400, proteinGoal = 180
  const daysOnCalTarget = weekFood.filter(d => {
    const cals = d.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
    return cals > 0 && cals <= calGoal
  }).length
  const daysProteinHit = weekFood.filter(d => {
    const p = d.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
    return p >= proteinGoal
  }).length

  // Filtered weight data for chart
  const filtered = (() => {
    if (range === 'all') return entries
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cut = new Date(); cut.setDate(cut.getDate() - days)
    return entries.filter(w => new Date(w.date) >= cut)
  })()

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-forged-surface2 rounded-xl animate-pulse" />
        <div className="h-28 bg-forged-surface2 rounded-2xl animate-pulse" />
        <div className="h-52 bg-forged-surface2 rounded-2xl animate-pulse" />
        <div className="h-36 bg-forged-surface2 rounded-2xl animate-pulse" />
        <div className="h-28 bg-forged-surface2 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black text-forged-text">Progress</h1>

      {/* ── Top Summary ── */}
      <Card delay={60} className="!p-5">
        <div className="grid grid-cols-4 gap-3">
          <SummaryChip label="Current" value={currentWeight ? `${currentWeight}` : '--'} unit="lbs"
            icon={I.scale} />
          <SummaryChip label="This Week" value={weekChange !== 0 ? `${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)}` : '--'} unit="lbs"
            icon={weekChange <= 0 ? I.trendDown : I.trendUp}
            accent={weekChange < 0 ? 'green' : weekChange > 0 ? 'red' : undefined} />
          <SummaryChip label="Streak" value={dashStats?.currentStreak ?? 0} unit="days"
            icon={I.flame} accent="purple" />
          <SummaryChip label="Avg Cal" value={weekAvg.cal > 0 ? `${weekAvg.cal}` : '--'} unit="/day"
            icon={I.zap} />
        </div>
      </Card>

      {/* ── Log Weight ── */}
      <Card delay={100}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-2">Log Weight</p>
        <div className="flex gap-2">
          <input type="number" step="0.1" placeholder="e.g. 181.5" value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors" />
          <input type="text" placeholder="Note (optional)" value={wNotes}
            onChange={e => setWNotes(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors" />
          <button onClick={handleLogWeight} disabled={saving}
            className="px-5 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
            {saving ? '...' : 'Log'}
          </button>
        </div>
      </Card>

      {/* ── Weight Chart ── */}
      <Card delay={160}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest">Weight Trend</p>
        </div>
        <div className="flex bg-forged-bg rounded-xl p-1 gap-0.5 mb-4">
          {(['7d', '30d', '90d', 'all'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${range === r ? 'bg-forged-surface text-forged-text shadow-sm' : 'text-forged-text2 hover:text-forged-text'}`}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <WeightChart data={filtered} />
      </Card>

      {/* ── Weekly Nutrition ── */}
      <Card delay={240}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-4">Weekly Averages</p>
        <div className="grid grid-cols-2 gap-4">
          <MacroBar label="Calories" value={weekAvg.cal} goal={calGoal} color="#9b59b6" unit="cal" />
          <MacroBar label="Protein" value={weekAvg.protein} goal={proteinGoal} color="#3498db" unit="g" />
          <MacroBar label="Carbs" value={weekAvg.carbs} goal={250} color="#2ecc71" unit="g" />
          <MacroBar label="Fat" value={weekAvg.fat} goal={65} color="#e74c3c" unit="g" />
        </div>

        {/* Daily breakdown mini bars */}
        <div className="mt-4 pt-4 border-t border-forged-text2/10">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-2">Daily Calories (Last 7 Days)</p>
          <div className="flex items-end gap-1.5 h-16">
            {weekFood.slice().reverse().map((day, i) => {
              const cals = day.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
              const pct = Math.min((cals / calGoal) * 100, 100)
              const label = new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'narrow' })
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md relative" style={{ height: `${Math.max(pct * 0.64, 2)}px` }}>
                    <div className={`absolute inset-0 rounded-t-md transition-all duration-500
                      ${cals > calGoal ? 'bg-forged-red' : cals > 0 ? 'bg-forged-purple' : 'bg-forged-surface2'}`} />
                  </div>
                  <span className="text-[8px] text-forged-text2 font-bold">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ── Habits ── */}
      <Card delay={320}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Habits This Week</p>
        <div className="grid grid-cols-2 gap-3">
          <HabitCard label="Within Calorie Goal" count={daysOnCalTarget} total={7} icon={I.target} />
          <HabitCard label="Protein Target Hit" count={daysProteinHit} total={7} icon={I.zap} />
          <HabitCard label="Workouts Completed" count={dashStats?.totalWorkouts ?? 0} total={0} icon={I.dumbbell} showTotal={false} />
          <HabitCard label="Current Streak" count={dashStats?.currentStreak ?? 0} total={0} icon={I.flame} showTotal={false} unit="days" />
        </div>
      </Card>

      {/* ── Weight History ── */}
      <Card delay={400}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Weight History</p>
        {entries.length === 0 ? (
          <p className="text-sm text-forged-text2 text-center py-4">No entries yet. Log your first weight above.</p>
        ) : (
          <div className="flex flex-col max-h-64 overflow-y-auto">
            {entries.slice().reverse().slice(0, 20).map(e => (
              <div key={e.id} className="flex justify-between items-center py-3
                border-b border-forged-text2/10 last:border-0">
                <span className="text-sm text-forged-text2">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-forged-text tabular-nums">{e.weight} lbs</span>
                  {e.notes && (
                    <span className="text-[10px] text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">{e.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ══════════════════════════════════
// SUMMARY CHIP
// ══════════════════════════════════
function SummaryChip({ label, value, unit, icon, accent }: {
  label: string; value: string | number; unit: string; icon: React.ReactNode
  accent?: 'green' | 'red' | 'purple'
}) {
  const colors = {
    green: 'text-forged-green',
    red: 'text-forged-red',
    purple: 'text-forged-purple',
  }
  return (
    <div className="text-center">
      <div className="w-8 h-8 mx-auto rounded-lg bg-forged-purple/10 flex items-center justify-center mb-1.5">
        <Icon d={icon} size={14} className="text-forged-purple" />
      </div>
      <p className={`text-base font-black tabular-nums ${accent ? colors[accent] : 'text-forged-text'}`}>{value}</p>
      <p className="text-[9px] text-forged-text2 font-bold uppercase">{unit}</p>
      <p className="text-[8px] text-forged-text2 mt-0.5">{label}</p>
    </div>
  )
}

// ══════════════════════════════════
// WEIGHT CHART (SVG)
// ══════════════════════════════════
function WeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { setDrawn(false); const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t) }, [data])

  if (data.length < 2) return <p className="text-sm text-forged-text2 text-center py-6">Need 2+ entries for chart</p>

  const w = 600, h = 160, px = 44, py = 16
  const vals = data.map(d => d.weight)
  const mn = Math.min(...vals) - 1, mx = Math.max(...vals) + 1
  const pts = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * (w - 2 * px),
    y: py + ((mx - d.weight) / (mx - mn)) * (h - 2 * py),
  }))

  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1], cpx = (prev.x + p.x) / 2
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }).join(' ')

  const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="pwg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = py + f * (h - 2 * py)
        return <line key={i} x1={px} y1={y} x2={w - px} y2={y} stroke="var(--border)" strokeWidth="0.5" />
      })}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map((d) => {
        const idx = data.indexOf(d)
        return <text key={idx} x={pts[idx].x} y={h - 2} fill="var(--text2)" fontSize="9" textAnchor="middle"
          fontFamily="-apple-system,system-ui,sans-serif">{fmtDate(d.date)}</text>
      })}
      <path d={pathD + ` L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`}
        fill="url(#pwg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.8s ease 0.2s' }} />
      <path d={pathD} fill="none" stroke="#9b59b6" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: drawn ? 'none' : '1200', strokeDashoffset: drawn ? 0 : 1200,
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)" stroke="#9b59b6" strokeWidth="1.5"
          opacity={drawn ? 1 : 0} style={{ transition: `opacity 0.3s ease ${0.2 + i * 0.05}s` }} />
      ))}
      {drawn && (
        <g>
          <rect x={pts[pts.length - 1].x - 24} y={pts[pts.length - 1].y - 24} width="48" height="18" rx="5" fill="#9b59b6" />
          <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 12} fill="#fff" fontSize="10" fontWeight="600"
            textAnchor="middle" fontFamily="-apple-system,system-ui,sans-serif">{data[data.length - 1].weight}</text>
        </g>
      )}
    </svg>
  )
}

// ══════════════════════════════════
// MACRO BAR
// ══════════════════════════════════
function MacroBar({ label, value, goal, color, unit }: {
  label: string; value: number; goal: number; color: string; unit: string
}) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-forged-text font-semibold">{label}</span>
        </div>
        <span className="text-xs tabular-nums">
          <span className={`font-bold ${over ? 'text-forged-red' : 'text-forged-text'}`}>{value}</span>
          <span className="text-forged-text2">/{goal}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-forged-surface2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════
// HABIT CARD
// ══════════════════════════════════
function HabitCard({ label, count, total, icon, showTotal = true, unit }: {
  label: string; count: number; total: number; icon: React.ReactNode
  showTotal?: boolean; unit?: string
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3
      hover:border-forged-purple/25 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-forged-purple/10 flex items-center justify-center">
          <Icon d={icon} size={13} className="text-forged-purple" />
        </div>
        <p className="text-[10px] text-forged-text2 font-bold uppercase leading-tight flex-1">{label}</p>
      </div>
      <p className="text-xl font-black text-forged-text tabular-nums">
        {count}
        {showTotal && <span className="text-forged-text2 text-sm font-semibold">/{total}</span>}
        {unit && <span className="text-forged-text2 text-[10px] font-medium ml-1">{unit}</span>}
      </p>
      {showTotal && total > 0 && (
        <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden mt-2">
          <div className="h-full rounded-full bg-forged-purple transition-all duration-700"
            style={{ width: `${Math.min((count / total) * 100, 100)}%` }} />
        </div>
      )}
    </div>
  )
}