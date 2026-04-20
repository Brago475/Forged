import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FoodLog } from '../types'
import { loadGoals } from '../components/food/goalStorage'
import {
  generateWeekRanges,
  computeWeeklyRecap,
  type WeekRange,
  type WeeklyRecap,
  type WeekData,
} from '../components/weekly/weeklyRecapLogic'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  chevR: <><path d="M9 18l6-6-6-6"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
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

function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState<boolean>(false)
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// WEEKLY SUMMARY PAGE
// ══════════════════════════════════
export default function WeeklySummaryPage({ onBack }: { onBack: () => void }) {
  const [weeks] = useState<WeekRange[]>(() => generateWeekRanges(12))
  const [activeOffset, setActiveOffset] = useState<number>(0)
  const [recap, setRecap] = useState<WeeklyRecap | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const activeWeek = weeks.find(w => w.offset === activeOffset) ?? weeks[0]

  const loadWeek = useCallback(async (week: WeekRange): Promise<void> => {
    setLoading(true)
    try {
      const [weights, workouts] = await Promise.all([
        api.weight.getAll(120),
        api.workout.getLogs(60),
      ])

      const foodByDay: FoodLog[][] = []
      for (let i = 0; i < 7; i++) {
        const dt = new Date(week.start)
        dt.setDate(dt.getDate() + i)
        const iso = dt.toISOString().split('T')[0]
        try {
          foodByDay.push(await api.food.getLogs(iso))
        } catch {
          foodByDay.push([])
        }
      }

      const foodGoals = loadGoals()
      const data: WeekData = { foodByDay, weights, workouts }
      setRecap(computeWeeklyRecap(week, data, foodGoals.calories, foodGoals.protein))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWeek(activeWeek) }, [activeWeek, loadWeek])

  const goPrev = (): void => {
    if (activeOffset < weeks.length - 1) setActiveOffset(activeOffset + 1)
  }
  const goNext = (): void => {
    if (activeOffset > 0) setActiveOffset(activeOffset - 1)
  }

  const handleShare = async (): Promise<void> => {
    if (!recap) return
    const text = `My week on FORGED
${recap.range.label}
${recap.headline.title}

${recap.avgCal} cal/day · ${recap.avgProtein}g protein · ${recap.workoutsCompleted} workouts
${recap.weightChange !== 0 ? `Weight change: ${recap.weightChange > 0 ? '+' : ''}${recap.weightChange.toFixed(1)} lbs` : ''}
forgedgyms.com`

    if (navigator.share) {
      try { await navigator.share({ text, title: 'My weekly recap' }) } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Recap copied to clipboard')
      } catch {
        alert('Share not supported on this browser')
      }
    }
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
        <h1 className="text-2xl font-black text-forged-text">Weekly Recap</h1>
      </div>

      {/* 1. Week picker */}
      <Card delay={60}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Pick a week</p>
        <div className="flex items-center justify-between bg-forged-bg rounded-xl p-3 border border-forged-border">
          <button
            onClick={goPrev}
            disabled={activeOffset >= weeks.length - 1}
            className="w-8 h-8 rounded-lg bg-forged-surface border border-forged-border
              flex items-center justify-center text-forged-text2
              hover:text-forged-text active:scale-95 transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon d={I.chevL} size={14} sw={2.5} />
          </button>
          <div className="text-center flex-1 px-2">
            <p className="text-sm font-black text-forged-text">{activeWeek.label}</p>
            <p className="text-[10px] text-forged-text2 mt-0.5">{activeWeek.shortLabel}</p>
          </div>
          <button
            onClick={goNext}
            disabled={activeOffset <= 0}
            className="w-8 h-8 rounded-lg bg-forged-surface border border-forged-border
              flex items-center justify-center text-forged-text2
              hover:text-forged-text active:scale-95 transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon d={I.chevR} size={14} sw={2.5} />
          </button>
        </div>
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {weeks.map(w => (
            <button
              key={w.offset}
              onClick={() => setActiveOffset(w.offset)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider
                transition-all whitespace-nowrap
                ${w.offset === activeOffset
                  ? 'bg-forged-purple text-white'
                  : 'bg-forged-bg text-forged-text2 border border-forged-border hover:text-forged-text'}`}
            >
              {w.shortLabel}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <>
          <div className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />
          <div className="h-48 bg-forged-surface2 rounded-2xl animate-pulse" />
          <div className="h-28 bg-forged-surface2 rounded-2xl animate-pulse" />
        </>
      ) : !recap ? (
        <Card delay={120}>
          <p className="text-sm text-forged-text2 text-center py-4">No data for this week.</p>
        </Card>
      ) : (
        <>
          {/* 2. Headline */}
          <Card delay={120} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-forged-purple/[0.12] via-forged-purple/[0.04] to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-2">The story</p>
              <p className="text-xl font-black text-forged-text leading-tight">
                {recap.headline.title.split(' ').map((word, i, arr) => {
                  const coloredWords = ['great', 'strong', 'slow', 'no']
                  const isHighlight = coloredWords.some(c => word.toLowerCase().includes(c))
                  return (
                    <span key={i} className={isHighlight ? 'text-forged-purple' : ''}>
                      {word}{i < arr.length - 1 ? ' ' : ''}
                    </span>
                  )
                })}
              </p>
              <p className="text-xs text-forged-text2 mt-2 leading-relaxed">
                {recap.headline.subtitle}
              </p>
            </div>
          </Card>

          {/* 3. Wins */}
          {recap.wins.length > 0 && (
            <Card delay={180}>
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Wins</p>
              <div className="flex flex-col gap-2">
                {recap.wins.map((win, i) => (
                  <div key={i} className="flex items-center gap-3 bg-forged-bg rounded-xl p-2.5">
                    <div className="w-7 h-7 rounded-lg bg-forged-green/15 flex items-center justify-center flex-shrink-0">
                      <Icon d={I.check} size={14} sw={2.5} className="text-forged-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forged-text">{win.title}</p>
                      <p className="text-[10px] text-forged-text2 mt-0.5">{win.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 4. Best + slowest */}
          {(recap.bestDay || recap.slowestDay) && (
            <Card delay={240}>
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Best + slowest</p>
              <div className="grid grid-cols-2 gap-2">
                {recap.bestDay ? (
                  <DayHighlight day={recap.bestDay} label="Best" color="green"
                    detail={dayDetail(recap.bestDay)} />
                ) : (
                  <div className="bg-forged-bg rounded-xl p-3 border-l-[3px] border-forged-border">
                    <p className="text-[9px] text-forged-text2 font-black uppercase tracking-wider">Best</p>
                    <p className="text-xs text-forged-text2 mt-1">No standout day</p>
                  </div>
                )}
                {recap.slowestDay ? (
                  <DayHighlight day={recap.slowestDay} label="Slowest" color="amber"
                    detail={dayDetail(recap.slowestDay)} />
                ) : (
                  <div className="bg-forged-bg rounded-xl p-3 border-l-[3px] border-forged-border">
                    <p className="text-[9px] text-forged-text2 font-black uppercase tracking-wider">Slowest</p>
                    <p className="text-xs text-forged-text2 mt-1">All solid</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 5. Numbers */}
          <Card delay={300}>
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Numbers</p>
            <div className="grid grid-cols-2 gap-2">
              <NumberTile
                value={recap.weightChange !== 0
                  ? `${recap.weightChange > 0 ? '+' : ''}${recap.weightChange.toFixed(1)}`
                  : '—'}
                label="lbs change"
              />
              <NumberTile
                value={recap.avgCal > 0 ? `${recap.avgCal}` : '—'}
                label="avg cal/day"
              />
              <NumberTile
                value={recap.avgProtein > 0 ? `${recap.avgProtein}g` : '—'}
                label="avg protein"
              />
              <NumberTile
                value={`${recap.workoutsCompleted}`}
                label="workouts"
              />
              <NumberTile value={`${recap.daysLogged} / 7`} label="days logged" />
              <NumberTile value={`${recap.totalMeals}`} label="total meals" />
            </div>
          </Card>

          {/* 6. Focus next week */}
          {recap.focus && (
            <Card delay={360}>
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Focus next week</p>
              <div className="bg-forged-bg border-l-[3px] border-forged-purple rounded-r-xl p-3">
                <p className="text-xs font-bold text-forged-text">{recap.focus.title}</p>
                <p className="text-[11px] text-forged-text2 mt-1 leading-relaxed">{recap.focus.detail}</p>
              </div>
            </Card>
          )}

          {/* 7. Week in dots */}
          <Card delay={420}>
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Week in dots</p>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {recap.dayScores.map((d, i) => {
                const opacity = d.score === 0 ? 0
                  : d.score < 25 ? 0.25
                  : d.score < 50 ? 0.5
                  : d.score < 75 ? 0.7
                  : 1
                return (
                  <div key={i} className="text-center">
                    <p className="text-[9px] text-forged-text2 font-bold mb-1">{d.dayLabel[0]}</p>
                    <div
                      className="aspect-square rounded-md"
                      style={{
                        backgroundColor: d.score === 0 ? 'var(--forged-surface2)' : '#6D28D9',
                        opacity: opacity || 0.15,
                      }}
                      title={`${d.dayLabel}: ${d.score}/100`}
                    />
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-forged-text2 text-center">Darker = more on track</p>
          </Card>

          {/* 8. Share */}
          <Card delay={480}>
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
                hover:brightness-110 active:scale-[0.98] transition-all
                flex items-center justify-center gap-2"
            >
              <Icon d={I.share} size={14} sw={2.5} />Share this week
            </button>
            <p className="text-[10px] text-forged-text2 text-center mt-2">
              Shares a text recap via your device's share sheet
            </p>
          </Card>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}

// ══════════════════════════════════
// SUBCOMPONENTS
// ══════════════════════════════════

function dayDetail(day: { meals: number; workoutDone: boolean; calories: number }): string {
  const parts: string[] = []
  if (day.workoutDone) parts.push('workout')
  if (day.meals > 0) parts.push(`${day.meals} meal${day.meals > 1 ? 's' : ''}`)
  if (day.calories > 0) parts.push(`${day.calories} cal`)
  return parts.length > 0 ? parts.join(' · ') : 'No meals logged'
}

function DayHighlight({ day, label, color, detail }: {
  day: { date: Date; dayLabel: string }
  label: string
  color: 'green' | 'amber'
  detail: string
}) {
  const border = color === 'green' ? 'border-forged-green' : 'border-yellow-500'
  const text = color === 'green' ? 'text-forged-green' : 'text-yellow-500'
  return (
    <div className={`bg-forged-bg rounded-xl p-3 border-l-[3px] ${border}`}>
      <p className={`text-[9px] font-black uppercase tracking-wider ${text}`}>{label}</p>
      <p className="text-sm font-black text-forged-text mt-1">
        {day.dayLabel}, {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
      <p className="text-[10px] text-forged-text2 mt-0.5">{detail}</p>
    </div>
  )
}

function NumberTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-forged-bg rounded-xl p-3 text-center">
      <p className="text-base font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[9px] text-forged-text2 mt-1 font-bold uppercase tracking-wider">{label}</p>
    </div>
  )
}