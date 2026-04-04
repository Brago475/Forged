import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FoodLog as FoodLogType, Food } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  dots: <><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  sunrise: <><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  coffee: <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></>,
  barcode: <><path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/><path d="M6 5v14"/><path d="M15 5v14"/></>,
  camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  history: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M2 12h2"/></>,
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

function useClickOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const l = (e: MouseEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; fn() }
    document.addEventListener('mousedown', l); return () => document.removeEventListener('mousedown', l)
  }, [ref, fn])
}

// ══════════════════════════════════
// CALENDAR MODAL
// ══════════════════════════════════
function CalendarModal({ selected, onSelect, onClose }: {
  selected: string; onSelect: (date: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selected + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
  const firstDow = new Date(viewDate.year, viewDate.month, 1).getDay()
  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const shiftMonth = (dir: number) => {
    setViewDate(prev => {
      let m = prev.month + dir
      let y = prev.year
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div ref={ref} className="bg-forged-surface border border-forged-border rounded-2xl p-5 w-full max-w-sm shadow-2xl">

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)}
            className="w-8 h-8 rounded-lg hover:bg-forged-surface2 flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-all">
            <Icon d={I.chevL} size={16} />
          </button>
          <span className="text-sm font-black text-forged-text">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)}
            className="w-8 h-8 rounded-lg hover:bg-forged-surface2 flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-all">
            <Icon d={I.chevR} size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-forged-text2 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = makeDate(day)
            const isSelected = dateStr === selected
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <button key={day} onClick={() => { if (!isFuture) { onSelect(dateStr); onClose() } }}
                disabled={isFuture}
                className={`h-9 rounded-lg text-sm font-semibold transition-all
                  ${isFuture ? 'text-forged-text2/30 cursor-not-allowed' : 'hover:bg-forged-surface2 active:scale-95'}
                  ${isSelected ? 'bg-forged-purple text-white hover:bg-forged-purple' : ''}
                  ${isToday && !isSelected ? 'border border-forged-purple/40 text-forged-purple' : ''}
                  ${!isSelected && !isToday && !isFuture ? 'text-forged-text' : ''}
                `}>
                {day}
              </button>
            )
          })}
        </div>

        {/* Jump to today */}
        <button onClick={() => { onSelect(todayStr); onClose() }}
          className="w-full mt-3 py-2 text-xs font-bold text-forged-purple
            hover:bg-forged-purple/5 rounded-xl transition-all">
          Jump to Today
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// MEAL 3-DOT MENU
// ══════════════════════════════════
function MealMenu({ onQuickAdd, onCopyPrevious, onClose }: {
  onQuickAdd: () => void; onCopyPrevious: () => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 w-48 bg-forged-surface border border-forged-border
      rounded-xl shadow-xl overflow-hidden z-50"
      style={{ animation: 'fadeIn 0.12s ease-out' }}>
      <button onClick={() => { onQuickAdd(); onClose() }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text
          hover:bg-forged-surface2 transition-colors text-left">
        <Icon d={I.zap} size={15} className="text-forged-purple" />
        <span className="font-semibold">Quick Add</span>
      </button>
      <button onClick={() => { onCopyPrevious(); onClose() }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text
          hover:bg-forged-surface2 transition-colors text-left border-t border-forged-border">
        <Icon d={I.copy} size={15} className="text-forged-purple" />
        <span className="font-semibold">Copy from Yesterday</span>
      </button>
    </div>
  )
}

// ══════════════════════════════════
// MEAL CONFIG
// ══════════════════════════════════
const MEALS = [
  { key: 'morning', label: 'Morning', icon: I.sunrise },
  { key: 'afternoon', label: 'Afternoon', icon: I.sun },
  { key: 'evening', label: 'Evening', icon: I.moon },
  { key: 'snack', label: 'Snacks', icon: I.coffee },
] as const

type MealKey = typeof MEALS[number]['key']

// ══════════════════════════════════
// FOOD LOG PAGE
// ══════════════════════════════════
export default function FoodLog() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState<FoodLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<MealKey | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [menuOpen, setMenuOpen] = useState<MealKey | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try { setLogs(await api.food.getLogs(date)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [date])

  useEffect(() => { loadLogs() }, [loadLogs])

  // ── Totals ──
  const totals = {
    cal: logs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0),
    protein: logs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0),
    carbs: logs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0),
    fat: logs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0),
    fiber: logs.reduce((s, l) => s + (l.food?.fiber ?? 0) * l.servings, 0),
    sugar: logs.reduce((s, l) => s + (l.food?.sugar ?? 0) * l.servings, 0),
    sodium: logs.reduce((s, l) => s + (l.food?.sodium ?? 0) * l.servings, 0),
  }
  const calGoal = 2400
  const remaining = Math.max(calGoal - totals.cal, 0)
  const calPct = Math.min((totals.cal / calGoal) * 100, 100)

  // ── Date helpers ──
  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = date === todayStr
  const shiftDate = (days: number) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + days)
    const newDate = d.toISOString().split('T')[0]
    if (newDate <= todayStr) setDate(newDate)
  }
  const fmtDate = (d: string) => {
    if (d === todayStr) return 'Today'
    const y = new Date(); y.setDate(y.getDate() - 1)
    if (d === y.toISOString().split('T')[0]) return 'Yesterday'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // ── Group by meal ──
  const grouped = (key: string) => logs.filter(l => l.mealType === key)
  const mealCals = (key: string) => grouped(key).reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)

  const onFoodAdded = () => { setAddingTo(null); loadLogs() }

  // ── Copy from yesterday ──
  const copyFromYesterday = async (mealKey: string) => {
    const y = new Date(date + 'T00:00:00')
    y.setDate(y.getDate() - 1)
    const yStr = y.toISOString().split('T')[0]
    try {
      const yLogs = await api.food.getLogs(yStr)
      const mealLogs = yLogs.filter((l: FoodLogType) => l.mealType === mealKey)
      for (const log of mealLogs) {
        if (log.food?.id) {
          await api.food.log({ foodId: log.food.id, date, mealType: mealKey, servings: log.servings })
        }
      }
      loadLogs()
    } catch (e) { console.error(e) }
  }

  // ── Skeleton ──
  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-forged-surface2 rounded-xl animate-pulse" />
        <div className="h-10 w-48 mx-auto bg-forged-surface2 rounded-xl animate-pulse" />
        <div className="h-48 bg-forged-surface2 rounded-2xl animate-pulse" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-forged-surface2 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Title ── */}
      <h1 className="text-2xl font-black text-forged-text">Food Log</h1>

      {/* ── Date selector with calendar ── */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => shiftDate(-1)}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text2
            hover:text-forged-text hover:border-forged-purple/30 active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>

        {/* Date label */}
        <span className={`px-4 py-2 rounded-xl text-sm font-bold
          ${isToday ? 'text-forged-purple' : 'text-forged-text'}`}>
          {fmtDate(date)}
        </span>

        <button onClick={() => shiftDate(1)}
          className={`w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center transition-all
            ${isToday ? 'text-forged-text2/30 cursor-not-allowed' : 'text-forged-text2 hover:text-forged-text hover:border-forged-purple/30 active:scale-95'}`}
          disabled={isToday}>
          <Icon d={I.chevR} size={16} />
        </button>

        {/* Dedicated calendar button -- clearly visible */}
        <button onClick={() => setShowCalendar(true)}
          className="w-9 h-9 rounded-xl bg-forged-purple/15 border border-forged-purple/30
            flex items-center justify-center text-forged-purple
            hover:bg-forged-purple/25 active:scale-95 transition-all">
          <Icon d={I.calendar} size={16} sw={2} />
        </button>
      </div>

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal selected={date} onSelect={setDate} onClose={() => setShowCalendar(false)} />
      )}

      {/* ── Daily Summary ── */}
      <Card delay={60} hero className="!p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-5xl font-black text-forged-text tabular-nums">{totals.cal}</span>
            <span className="text-sm text-forged-text2 ml-2">eaten</span>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-forged-text tabular-nums">{remaining}</p>
            <p className="text-xs text-forged-text2">remaining</p>
          </div>
        </div>

        <div className="h-3 rounded-full bg-forged-surface2 overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-700 ease-out
            ${totals.cal > calGoal ? 'bg-forged-red' : 'bg-forged-purple'}`}
            style={{ width: `${calPct}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs mb-4">
          <span className="text-forged-text2">Goal: <span className="font-bold text-forged-text">{calGoal} cal</span></span>
          <span className={`font-black ${totals.cal <= calGoal ? 'text-forged-green' : 'text-forged-red'}`}>
            {totals.cal <= calGoal ? 'On Track' : 'Over Goal'}
          </span>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-forged-text2/10">
          <MacroMini label="Protein" value={totals.protein} goal={180} />
          <MacroMini label="Carbs" value={totals.carbs} goal={250} />
          <MacroMini label="Fat" value={totals.fat} goal={65} />
        </div>
      </Card>

      {/* ── Nutrition Detail ── */}
      {logs.length > 0 && (
        <Card delay={100}>
          <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Nutrition</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <NutritionRow label="Calories" value={`${totals.cal}`} unit="cal" />
            <NutritionRow label="Protein" value={`${totals.protein}`} unit="g" />
            <NutritionRow label="Carbs" value={`${totals.carbs}`} unit="g" />
            <NutritionRow label="Fat" value={`${totals.fat}`} unit="g" />
            <NutritionRow label="Fiber" value={`${totals.fiber}`} unit="g" />
            <NutritionRow label="Sugar" value={`${totals.sugar}`} unit="g" />
            <NutritionRow label="Sodium" value={`${totals.sodium}`} unit="mg" />
          </div>
        </Card>
      )}

      {/* ── Meal Sections ── */}
      {MEALS.map((meal, i) => {
        const items = grouped(meal.key)
        const cals = mealCals(meal.key)
        const isAdding = addingTo === meal.key
        const isMenuOpen = menuOpen === meal.key

        return (
          <Card key={meal.key} delay={160 + i * 80}>
            {/* Meal header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
                  <Icon d={meal.icon} size={16} className="text-forged-purple" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-forged-text">{meal.label}</h3>
                  {cals > 0 && (
                    <p className="text-[11px] text-forged-text2 font-semibold tabular-nums">{cals} cal</p>
                  )}
                </div>
              </div>

              {/* + and 3-dot buttons */}
              <div className="flex items-center gap-1.5 relative">
                <button onClick={() => setAddingTo(isAdding ? null : meal.key)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95
                    ${isAdding
                      ? 'bg-forged-red/10 text-forged-red hover:bg-forged-red/20'
                      : 'bg-forged-purple/10 text-forged-purple hover:bg-forged-purple/20'
                    }`}>
                  <Icon d={isAdding ? I.x : I.plus} size={14} sw={2.5} />
                </button>

                {/* 3-dot */}
                <button onClick={() => setMenuOpen(isMenuOpen ? null : meal.key)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2
                    hover:bg-forged-surface2 hover:text-forged-text transition-all active:scale-95">
                  <Icon d={I.dots} size={14} />
                </button>

                {isMenuOpen && (
                  <MealMenu
                    onQuickAdd={() => { setAddingTo(meal.key); setMenuOpen(null) }}
                    onCopyPrevious={() => copyFromYesterday(meal.key)}
                    onClose={() => setMenuOpen(null)}
                  />
                )}
              </div>
            </div>

            {/* Search panel */}
            {isAdding && (
              <FoodSearch mealType={meal.key} date={date} onAdded={onFoodAdded} />
            )}

            {/* Logged foods or empty state */}
            {items.length === 0 && !isAdding ? (
              <button onClick={() => setAddingTo(meal.key)}
                className="w-full py-5 text-center text-sm text-forged-text2 font-medium
                  border border-dashed border-forged-text2/20 rounded-xl
                  hover:border-forged-purple/30 hover:text-forged-purple transition-all">
                Tap to add food
              </button>
            ) : (
              <div className="flex flex-col">
                {items.map(log => (
                  <FoodLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </Card>
        )
      })}

      {/* ── Daily total footer ── */}
      {logs.length > 0 && (
        <Card delay={500}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-forged-text2">Daily Total</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-forged-text2 tabular-nums">P:{totals.protein}g</span>
              <span className="text-xs text-forged-text2 tabular-nums">C:{totals.carbs}g</span>
              <span className="text-xs text-forged-text2 tabular-nums">F:{totals.fat}g</span>
              <span className="text-sm font-black text-forged-text tabular-nums">{totals.cal} cal</span>
            </div>
          </div>
        </Card>
      )}

      {/* Animations */}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════
// NUTRITION ROW
// ══════════════════════════════════
function NutritionRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text tabular-nums">{value} <span className="text-forged-text2 font-normal">{unit}</span></span>
    </div>
  )
}

// ══════════════════════════════════
// FOOD SEARCH
// ══════════════════════════════════
function FoodSearch({ mealType, date, onAdded }: {
  mealType: string; date: string; onAdded: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const debounceRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const doSearch = (q: string) => {
    setQuery(q)
    clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); return }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try { setResults(await api.food.search(q)) }
      catch (e) { console.error(e) }
      finally { setSearching(false) }
    }, 300)
  }

  const addFood = async (foodId: string) => {
    setAdding(foodId)
    try {
      await api.food.log({ foodId, date, mealType, servings: 1 })
      onAdded()
    } catch (e) { console.error(e) }
    finally { setAdding(null) }
  }

  return (
    <div className="mb-3">
      <div className="relative">
        <Icon d={I.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forged-text2" />
        <input ref={inputRef} type="text" placeholder="Search foods..." value={query}
          onChange={e => doSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-forged-bg border border-forged-border rounded-xl
            text-forged-text text-sm placeholder:text-forged-text2
            focus:border-forged-purple/50 transition-colors" />
      </div>

      {/* Quick options -- show when not typing */}
      {query.length === 0 && !showCreate && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          <SearchOption icon={I.barcode} label="Barcode" onClick={() => { /* TODO: barcode scanner */ }} />
          <SearchOption icon={I.book} label="Recipes" onClick={() => { /* TODO: recipes */ }} />
          <SearchOption icon={I.camera} label="Meal Scan" onClick={() => { /* TODO: photo scan */ }} />
          <SearchOption icon={I.history} label="Previous" onClick={() => doSearch('*')} />
        </div>
      )}

      {searching && (
        <div className="flex items-center gap-2 py-3 px-1">
          <div className="w-4 h-4 border-2 border-forged-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-forged-text2">Searching...</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col mt-2 max-h-52 overflow-y-auto rounded-xl border border-forged-border bg-forged-bg">
          {results.map(food => (
            <button key={food.id} onClick={() => addFood(food.id)}
              disabled={adding === food.id}
              className="flex items-center justify-between px-3 py-3
                hover:bg-forged-surface2 transition-colors text-left
                border-b border-forged-text2/10 last:border-0 disabled:opacity-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forged-text truncate">{food.name}</p>
                {food.brand && <p className="text-[10px] text-forged-text2">{food.brand}</p>}
                <p className="text-[10px] text-forged-text2 mt-0.5">
                  P:{food.protein ?? 0}g &middot; C:{food.carbs ?? 0}g &middot; F:{food.fat ?? 0}g
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-black text-forged-purple tabular-nums">{food.calories ?? 0}</span>
                <div className="w-7 h-7 rounded-lg bg-forged-purple/10 flex items-center justify-center
                  hover:bg-forged-purple/20 transition-colors">
                  {adding === food.id
                    ? <div className="w-3.5 h-3.5 border-2 border-forged-purple border-t-transparent rounded-full animate-spin" />
                    : <Icon d={I.plus} size={14} sw={2.5} className="text-forged-purple" />
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-xs text-forged-text2 py-3 px-1">No results for "{query}"</p>
      )}

      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}
          className="w-full mt-2 py-2.5 text-xs font-bold text-forged-purple
            border border-dashed border-forged-purple/30 rounded-xl
            hover:bg-forged-purple/5 transition-all">
          + Create custom food
        </button>
      ) : (
        <QuickCreateFood mealType={mealType} date={date}
          onCreated={onAdded} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// ══════════════════════════════════
// QUICK CREATE FOOD
// ══════════════════════════════════
function QuickCreateFood({ mealType, date, onCreated, onCancel }: {
  mealType: string; date: string; onCreated: () => void; onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name || !cal) return
    setSaving(true)
    try {
      const food = await api.food.create({
        name,
        calories: parseInt(cal) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
      })
      await api.food.log({ foodId: food.id, date, mealType, servings: 1 })
      onCreated()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="mt-2 bg-forged-bg border border-forged-border rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest">Create Food</p>
      <input type="text" placeholder="Food name" value={name} onChange={e => setName(e.target.value)}
        className="w-full px-3 py-2.5 bg-forged-surface border border-forged-border rounded-lg
          text-forged-text text-sm placeholder:text-forged-text2
          focus:border-forged-purple/50 transition-colors" />
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', val: cal, set: setCal, ph: '0' },
          { label: 'Protein', val: protein, set: setProtein, ph: '0g' },
          { label: 'Carbs', val: carbs, set: setCarbs, ph: '0g' },
          { label: 'Fat', val: fat, set: setFat, ph: '0g' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-[10px] text-forged-text2 font-bold block mb-1">{f.label}</label>
            <input type="number" placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
              className="w-full px-2 py-2 bg-forged-surface border border-forged-border rounded-lg
                text-forged-text text-sm text-center placeholder:text-forged-text2
                focus:border-forged-purple/50 transition-colors" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={saving || !name || !cal}
          className="flex-1 py-2.5 bg-forged-purple text-white font-black rounded-lg text-sm
            hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
          {saving ? 'Adding...' : 'Create & Add'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 text-sm font-bold text-forged-text2 hover:text-forged-text transition-colors rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// FOOD LOG ROW
// ══════════════════════════════════
function FoodLogRow({ log }: { log: FoodLogType }) {
  const cals = (log.food?.calories ?? 0) * log.servings
  const p = (log.food?.protein ?? 0) * log.servings
  const c = (log.food?.carbs ?? 0) * log.servings
  const f = (log.food?.fat ?? 0) * log.servings

  return (
    <div className="flex items-center justify-between py-3 border-b border-forged-text2/10 last:border-0
      hover:bg-forged-surface2/50 transition-colors rounded-lg px-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-forged-text">{log.food?.name || 'Food'}</p>
        <p className="text-[11px] text-forged-text2">
          P:{p}g &middot; C:{c}g &middot; F:{f}g
          {log.servings !== 1 && <span className="text-forged-purple font-bold"> &middot; {log.servings}x</span>}
        </p>
      </div>
      <span className="text-sm font-black text-forged-text tabular-nums">{cals} cal</span>
    </div>
  )
}

// ══════════════════════════════════
// SEARCH OPTION (quick action tile)
// ══════════════════════════════════
function SearchOption({ icon, label, onClick }: {
  icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl
        bg-forged-bg border border-forged-border
        hover:border-forged-purple/30 hover:bg-forged-surface2
        active:scale-95 transition-all">
      <div className="w-9 h-9 rounded-lg bg-forged-purple/10 flex items-center justify-center">
        <Icon d={icon} size={16} className="text-forged-purple" />
      </div>
      <span className="text-[10px] text-forged-text font-semibold">{label}</span>
    </button>
  )
}

// ══════════════════════════════════
// MACRO MINI
// ══════════════════════════════════
function MacroMini({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal
  return (
    <div className="text-center">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-base font-black text-forged-text tabular-nums mt-0.5">
        {value}<span className="text-forged-text2 text-[11px] font-semibold">/{goal}g</span>
      </p>
      <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden mt-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-forged-red' : 'bg-forged-purple'}`}
          style={{ width: `${pct}%` }} />
      </div>
      {over && <p className="text-[9px] text-forged-red font-bold mt-1">+{value - goal}g over</p>}
    </div>
  )
}