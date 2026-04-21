import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FoodLog as FoodLogType, Food, FoodDaySummary } from '../types'
import { loadFasts, getPreset } from '../components/fasting/fastingConstants'
import type { FastingLog } from '../types'
import { MacroBar } from '../components/food/MacroBar'
import { GoalEditorModal } from '../components/food/GoalEditorModal'
import { NutritionDetailModal } from '../components/food/NutritionDetailModal'
import { loadGoals, saveGoals, getWarnLevel, type FoodGoals } from '../components/food/goalStorage'
import { describeMacros } from '../components/food/macroDescription'
import { BarcodeScanModal } from '../components/food/BarcodeScanModal'
import { PhotoFoodModal } from '../components/food/PhotoFoodModal'
import type { CustomFood } from '../components/food/customFoodsStorage'
import { InlineSpinner } from '../components/loading/InlineSpinner'
import { useLoadingEffect } from '../hooks/useLoading'
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
// CALENDAR MODAL — bigger, meal breakdown popup
// ══════════════════════════════════
const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

const MEAL_ICONS: Record<string, React.ReactNode> = {
  morning: <><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><polyline points="8 6 12 2 16 6"/></>,
  afternoon: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></>,
  evening: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  snack: <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></>,
}

function CalendarModal({ selected, onSelect, onClose }: {
  selected: string; onSelect: (date: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selected + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [summary, setSummary] = useState<FoodDaySummary[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [detailDay, setDetailDay] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoadingSummary(true)
      try {
        const data = await api.food.summary(viewDate.year, viewDate.month + 1)
        setSummary(data ?? [])
      } catch (e) { console.error(e); setSummary([]) }
      finally { setLoadingSummary(false) }
    }
    fetch()
  }, [viewDate.year, viewDate.month])

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
    setDetailDay(null)
  }

  const makeDate = (day: number) => {
    const m = String(viewDate.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewDate.year}-${m}-${d}`
  }

  const getDaySummary = (dateStr: string) => summary.find(s => s.date === dateStr)

  const handleDayClick = (dateStr: string) => {
    const daySummary = getDaySummary(dateStr)
    if (daySummary && daySummary.meals.length > 0) {
      setDetailDay(detailDay === dateStr ? null : dateStr)
    } else {
      onSelect(dateStr)
      onClose()
    }
  }

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
          <div className="text-center">
            <span className="text-base font-black text-forged-text">{monthLabel}</span>
            {loadingSummary && (
              <div className="mx-auto mt-1 flex justify-center"><InlineSpinner size="sm" /></div>
            )}
          </div>
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
            const isSelected = dateStr === selected
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            const daySummary = getDaySummary(dateStr)
            const hasData = !!daySummary
            const cals = Math.round(daySummary?.totalCalories ?? 0)
            const meals = daySummary?.meals ?? []

            return (
              <button key={day}
                onClick={() => { if (!isFuture) handleDayClick(dateStr) }}
                disabled={isFuture}
                className={`min-h-[58px] rounded-xl flex flex-col items-center justify-start pt-1.5 gap-0.5
                  transition-all border
                  ${isFuture ? 'opacity-25 cursor-not-allowed border-transparent' : 'hover:bg-forged-surface2 active:scale-95 border-transparent hover:border-forged-purple/20'}
                  ${isSelected ? 'bg-forged-purple border-forged-purple text-white hover:bg-forged-purple' : ''}
                  ${isToday && !isSelected ? 'border-forged-purple/40 bg-forged-purple/5' : ''}
                  ${hasData && !isSelected ? 'bg-forged-bg' : ''}
                `}>
                <span className={`text-xs font-bold leading-none
                  ${isSelected ? 'text-white' : isToday ? 'text-forged-purple' : 'text-forged-text'}`}>
                  {day}
                </span>

                {hasData && meals.length > 0 && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    {meals.slice(0, 3).map((meal, mi) => (
                      <svg key={mi} width="9" height="9" viewBox="0 0 24 24" fill="none"
                        stroke={isSelected ? 'white' : '#9b59b6'}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="opacity-80">
                        {MEAL_ICONS[meal] || MEAL_ICONS.snack}
                      </svg>
                    ))}
                  </div>
                )}

                {hasData && cals > 0 && (
                  <span className={`text-[8px] font-bold leading-none tabular-nums mt-0.5
                    ${isSelected ? 'text-white/80' : 'text-forged-purple'}`}>
                    {cals}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Day detail popup */}
        {detailDay && (() => {
          const ds = getDaySummary(detailDay)
          if (!ds) return null
          const dayLabel = new Date(detailDay + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          })
          return (
            <div className="mt-4 bg-forged-bg border border-forged-border rounded-xl p-4"
              style={{ animation: 'fadeIn 0.12s ease-out' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-forged-text">{dayLabel}</span>
                <button onClick={() => setDetailDay(null)}
                  className="text-forged-text2 hover:text-forged-text transition-colors">
                  <Icon d={I.x} size={14} />
                </button>
              </div>
              {ds.meals.map(meal => {
                const mealLabel = MEAL_LABELS[meal] || meal
                return (
                  <div key={meal} className="flex items-center justify-between py-2 border-b border-forged-text2/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#9b59b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {MEAL_ICONS[meal] || MEAL_ICONS.snack}
                      </svg>
                      <span className="text-sm text-forged-text font-medium">{mealLabel}</span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-forged-text2/20">
                <span className="text-sm font-black text-forged-text">Total</span>
                <span className="text-sm font-black text-forged-purple tabular-nums">{Math.round(ds.totalCalories)} cal</span>
              </div>
              <button onClick={() => { onSelect(detailDay); onClose() }}
                className="w-full mt-3 py-2 rounded-xl text-xs font-black
                  bg-forged-purple text-white hover:brightness-110 active:scale-[0.98] transition-all">
                View Full Log
              </button>
            </div>
          )
        })()}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-forged-border">
          {Object.entries(MEAL_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#9b59b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {MEAL_ICONS[key]}
              </svg>
              <span className="text-[9px] text-forged-text2">{label}</span>
            </div>
          ))}
        </div>

        {/* Jump to today */}
        <button onClick={() => { onSelect(todayStr); onClose() }}
          className="w-full mt-2 py-2 text-xs font-bold text-forged-purple
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
interface FoodLogProps {
  onNavigate?: (tab: string) => void
}
  export default function FoodLog({ onNavigate }: FoodLogProps = {}) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState<FoodLogType[]>([])
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [addingTo, setAddingTo] = useState<MealKey | null>(null)
  const [scanOpen, setScanOpen] = useState<{ meal: string } | null>(null)
  const [photoOpen, setPhotoOpen] = useState<{ meal: string } | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [menuOpen, setMenuOpen] = useState<MealKey | null>(null)
  const [goals, setGoals] = useState<FoodGoals>(loadGoals)
  const [showGoalEditor, setShowGoalEditor] = useState<boolean>(false)
  const [showNutritionDetail, setShowNutritionDetail] = useState<boolean>(false)

  const handleSaveGoals = (next: FoodGoals): void => {
    setGoals(next)
    saveGoals(next)
  }

  useLoadingEffect(async () => {
    const data = await api.food.getLogs(date)
    setLogs(data)
  }, [date, reloadKey])

  const refreshLogs = useCallback(() => {
    setReloadKey(k => k + 1)
  }, [])

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

  const onFoodAdded = () => { setAddingTo(null); refreshLogs() }
  const handleCustomFoodCapture = (food: CustomFood, mealType: string): void => {
    // Backend doesn't support custom foods yet — store locally
    const localKey = `forged:custom-logs:${date}`
    const existing = JSON.parse(localStorage.getItem(localKey) ?? '[]')
    existing.push({
      id: `cl_${crypto.randomUUID()}`,
      date, mealType, servings: 1,
      food,
    })
    localStorage.setItem(localKey, JSON.stringify(existing))
    setScanOpen(null)
    setPhotoOpen(null)
    refreshLogs()
  }

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
      refreshLogs()
    } catch (e) { console.error(e) }
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

      {/* ── Fasting section ── */}
      <FastingSection date={date} onNavigate={onNavigate} />

      {/* ── Daily Summary (clickable to edit goals) ── */}
      <button
        onClick={() => setShowGoalEditor(true)}
        className="text-left w-full"
      >
        <Card delay={60} hero className="!p-5 hover:border-forged-purple/40 transition-all">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-5xl font-black text-forged-text tabular-nums">{totals.cal}</span>
              <span className="text-sm text-forged-text2 ml-2">eaten</span>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black tabular-nums
                ${totals.cal > goals.calories ? 'text-forged-red' : 'text-forged-text'}`}>
                {totals.cal > goals.calories ? `+${totals.cal - goals.calories}` : Math.max(goals.calories - totals.cal, 0)}
              </p>
              <p className="text-xs text-forged-text2">
                {totals.cal > goals.calories ? 'over goal' : 'remaining'}
              </p>
            </div>
          </div>

          <div className="h-3 rounded-full bg-forged-surface2 overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-all duration-700 ease-out
              ${totals.cal > goals.calories
                ? 'bg-forged-red'
                : getWarnLevel(totals.cal, goals.calories) === 'close'
                  ? 'bg-yellow-500'
                  : 'bg-forged-purple'}`}
              style={{ width: `${Math.min((totals.cal / goals.calories) * 100, 100)}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs mb-4">
            <span className="text-forged-text2">
              Goal: <span className="font-bold text-forged-text">{goals.calories} cal</span>
            </span>
            <StatusPill level={getWarnLevel(totals.cal, goals.calories)} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-forged-text2/10">
            <MacroMini label="Protein" value={totals.protein} goal={goals.protein} />
            <MacroMini label="Carbs" value={totals.carbs} goal={goals.carbs} />
            <MacroMini label="Fat" value={totals.fat} goal={goals.fat} />
          </div>

          <p className="text-[10px] text-forged-text2 text-center mt-3 font-bold uppercase tracking-wider">
            Tap to edit goals
          </p>
        </Card>
      </button>

      {/* ── Nutrition Graph (click for detail modal) ── */}
      {logs.length > 0 && (
        <button
          onClick={() => setShowNutritionDetail(true)}
          className="text-left w-full"
        >
          <Card delay={100} className="hover:border-forged-purple/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest">
                Nutrition Breakdown
              </p>
              <span className="text-[10px] text-forged-purple font-bold">View all →</span>
            </div>

            <div className="mb-3">
              <MacroBar
                protein={totals.protein}
                carbs={totals.carbs}
                fat={totals.fat}
              />
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-forged-text2/10">
              <NutrientChip label="Fiber" value={totals.fiber} unit="g" />
              <NutrientChip label="Sugar" value={totals.sugar} unit="g" />
              <NutrientChip label="Sodium" value={totals.sodium} unit="mg" />
              <NutrientChip label="Calories" value={totals.cal} unit="cal" />
            </div>
          </Card>
        </button>
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
              <FoodSearch
                mealType={meal.key} date={date} onAdded={onFoodAdded}
                onBarcode={() => setScanOpen({ meal: meal.key })}
                onPhoto={() => setPhotoOpen({ meal: meal.key })}
                onRecipes={() => onNavigate?.('recipes')}
              />
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
                  <FoodLogRow key={log.id} log={log} onDelete={refreshLogs} />
                ))}
              </div>
            )}
          </Card>
        )
      })}

      {/* ── Daily total footer ── */}
      {logs.length > 0 && (
        <Card delay={500}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-forged-text2">Daily Total</span>
            <span className="text-sm font-black text-forged-text tabular-nums">{totals.cal} cal</span>
          </div>
          <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
        </Card>
      )}
{showGoalEditor && (
        <GoalEditorModal
          initial={goals}
          onSave={handleSaveGoals}
          onClose={() => setShowGoalEditor(false)}
        />
      )}

      {showNutritionDetail && (
        <NutritionDetailModal
          logs={logs}
          goals={goals}
          onClose={() => setShowNutritionDetail(false)}
        />
      )}
{scanOpen && (
        <BarcodeScanModal
          onCapture={food => handleCustomFoodCapture(food, scanOpen.meal)}
          onClose={() => setScanOpen(null)}
        />
      )}
      {photoOpen && (
        <PhotoFoodModal
          onCapture={food => handleCustomFoodCapture(food, photoOpen.meal)}
          onClose={() => setPhotoOpen(null)}
        />
      )}
      {/* Animations */}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════
// NUTRIENT CHIP
// ══════════════════════════════════
function NutrientChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-2 text-center
      hover:border-forged-purple/25 transition-all">
      <p className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-forged-text tabular-nums mt-0.5">{Math.round(value)}</p>
      <p className="text-[8px] text-forged-text2">{unit}</p>
    </div>
  )
}

// ══════════════════════════════════
// FOOD SEARCH
// ══════════════════════════════════
function FoodSearch({ mealType, date, onAdded, onBarcode, onPhoto, onRecipes }: {
  mealType: string; date: string
  onAdded: () => void
  onBarcode: () => void
  onPhoto: () => void
  onRecipes: () => void
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
          <SearchOption icon={I.barcode} label="Barcode" onClick={onBarcode} />
          <SearchOption icon={I.book} label="Recipes" onClick={onRecipes} />
          <SearchOption icon={I.camera} label="Photo" onClick={onPhoto} />
          <SearchOption icon={I.history} label="Previous" onClick={() => doSearch('*')} />
        </div>
      )}

      {searching && (
        <div className="flex items-center gap-2 py-3 px-1">
          <InlineSpinner size="md" />
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
                <p className="text-[10px] text-forged-text2 mt-0.5 italic truncate">
                  {describeMacros({
                    protein: food.protein ?? 0,
                    carbs: food.carbs ?? 0,
                    fat: food.fat ?? 0,
                    fiber: food.fiber ?? 0,
                    sugar: food.sugar ?? 0,
                    calories: food.calories ?? 0,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-black text-forged-purple tabular-nums">{food.calories ?? 0}</span>
                <div className="w-7 h-7 rounded-lg bg-forged-purple/10 flex items-center justify-center
                  hover:bg-forged-purple/20 transition-colors">
                  {adding === food.id
                    ? <InlineSpinner size="md" />
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
function FoodLogRow({ log, onDelete }: { log: FoodLogType; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const cals = (log.food?.calories ?? 0) * log.servings
  const p = (log.food?.protein ?? 0) * log.servings
  const c = (log.food?.carbs ?? 0) * log.servings
  const f = (log.food?.fat ?? 0) * log.servings
  const fiber = (log.food?.fiber ?? 0) * log.servings
  const sugar = (log.food?.sugar ?? 0) * log.servings
  const description = describeMacros({ protein: p, carbs: c, fat: f, fiber, sugar, calories: cals })

  const handleDelete = async () => {
    setDeleting(true)
    try { await api.food.deleteFoodLog(log.id); onDelete() }
    catch (e) { console.error(e); setDeleting(false) }
  }

  return (
    <div className="py-3 border-b border-forged-text2/10 last:border-0
      hover:bg-forged-surface2/50 transition-colors rounded-lg px-2 group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-forged-text truncate">
            {log.food?.name || 'Food'}
            {log.servings !== 1 && (
              <span className="ml-1.5 text-[10px] text-forged-purple font-bold">
                {log.servings}x
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm font-black text-forged-text tabular-nums">{cals} cal</span>
          <button onClick={handleDelete} disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-all
              text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 active:scale-95">
            {deleting
              ? <InlineSpinner size="sm" color="red" />
              : <Icon d={I.x} size={14} sw={2} />
            }
          </button>
        </div>
      </div>
      <p className="text-[10px] text-forged-text2 mb-1.5 italic">{description}</p>
      <MacroBar protein={p} carbs={c} fat={f} compact />
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
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const level = getWarnLevel(value, goal)
  const barColor = level === 'over' ? 'bg-forged-red' : level === 'close' ? 'bg-yellow-500' : 'bg-forged-purple'
  return (
    <div className="text-center">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-base font-black text-forged-text tabular-nums mt-0.5">
        {value}<span className="text-forged-text2 text-[11px] font-semibold">/{goal}g</span>
      </p>
      <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden mt-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }} />
      </div>
      {level === 'over' && <p className="text-[9px] text-forged-red font-bold mt-1">+{value - goal}g over</p>}
      {level === 'close' && <p className="text-[9px] text-yellow-600 font-bold mt-1">Almost there</p>}
    </div>
  )
}
// ══════════════════════════════════
// STATUS PILL
// ══════════════════════════════════
function StatusPill({ level }: { level: 'ok' | 'close' | 'over' }) {
  if (level === 'over') {
    return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-forged-red/15 text-forged-red">Over Goal</span>
  }
  if (level === 'close') {
    return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600">Almost</span>
  }
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-forged-green/15 text-forged-green">On Track</span>
}

// ══════════════════════════════════
// FASTING SECTION
// ══════════════════════════════════
function FastingSection({ date, onNavigate }: {
  date: string
  onNavigate?: (tab: string) => void
}) {
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    api.fasting.getActive()
      .then(setActiveFast)
      .catch(() => setActiveFast(null))
  }, [date])

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(i)
  }, [])

  const history = loadFasts()
  const pastFast = history.find(f => f.date === date)

  const activeFastDate = activeFast
    ? new Date(activeFast.startTime).toISOString().split('T')[0]
    : null
  const showActive = activeFast && activeFastDate === date

  if (!showActive && !pastFast) {
    return (
      <Card delay={50} className="!p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forged-surface2 flex items-center justify-center">
              <Icon d={I.moon} size={14} className="text-forged-text2" />
            </div>
            <div>
              <p className="text-sm font-bold text-forged-text">No fast on this day</p>
              <p className="text-[10px] text-forged-text2">Tap to start one</p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('fasting')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black
                bg-forged-purple/10 text-forged-purple border border-forged-purple/20
                hover:bg-forged-purple hover:text-white active:scale-95 transition-all"
            >
              Fasting
            </button>
          )}
        </div>
      </Card>
    )
  }

  if (showActive && activeFast) {
    const startMs = new Date(activeFast.startTime).getTime()
    const elapsedSec = Math.max((now - startMs) / 1000, 0)
    const totalSec = activeFast.targetHours * 3600
    const remainingSec = Math.max(totalSec - elapsedSec, 0)
    const pct = Math.min(elapsedSec / totalSec, 1)
    const preset = getPreset(activeFast.targetHours)
    const hRem = Math.floor(remainingSec / 3600)
    const mRem = Math.floor((remainingSec % 3600) / 60)

    return (
      <Card delay={50} className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: preset.color + '20', color: preset.color }}>
              <Icon d={I.moon} size={14} />
            </div>
            <div>
              <p className="text-sm font-black text-forged-text">
                {preset.id} Fast Active
              </p>
              <p className="text-[10px] text-forged-text2">
                {preset.name} &middot; {hRem}h {mRem}m remaining
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('fasting')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black text-white
                active:scale-95 transition-all"
              style={{ backgroundColor: preset.color }}
            >
              View Fast
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct * 100}%`, backgroundColor: preset.color }} />
        </div>
      </Card>
    )
  }

  if (pastFast) {
    const preset = getPreset(pastFast.hours)
    const dur = ((new Date(pastFast.endTime).getTime() - new Date(pastFast.startTime).getTime()) / 3600000).toFixed(1)
    return (
      <Card delay={50} className="!p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: preset.color + '20', color: preset.color }}>
              <Icon d={I.moon} size={14} />
            </div>
            <div>
              <p className="text-sm font-black text-forged-text">
                {pastFast.name || preset.name}
              </p>
              <p className="text-[10px] text-forged-text2">
                Completed &middot; {dur}h &middot; {pastFast.meals} meal{pastFast.meals !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('fasting')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-black
                bg-forged-purple/10 text-forged-purple border border-forged-purple/20
                hover:bg-forged-purple hover:text-white active:scale-95 transition-all"
            >
              Fasting
            </button>
          )}
        </div>
      </Card>
    )
  }

  return null
}