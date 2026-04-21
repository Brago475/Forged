import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { WeightEntry, FoodLog } from '../types'
import { loadBodyGoals, saveBodyGoals, type BodyGoals } from '../components/progress/bodyGoalsStorage'
import { BodyGoalsModal } from '../components/progress/BodyGoalsModal'
import { WeightChart, type WeightRange } from '../components/progress/WeightChart'
import { loadGoals } from '../components/food/goalStorage'
import {
  summarizeWindow,
  computeConsistencyScore,
  computeAllTimeStats,
  findWeightNearDate,
  generateInsights,
  type Insight,
} from '../components/progress/progressInsights'
import { PageHeaderSkeleton, CardSkeleton } from '../components/loading/PageSkeletons'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  flame: <><path d="M13 2s1 4 4 6.5c2.5 2.1 3.5 5 3.5 7.5a7.5 7.5 0 01-15 0c0-2.5 1-4.5 3-6 0 2 1 3 2 3 0-5 2.5-8 2.5-11z"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
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
// PROGRESS PAGE
// ══════════════════════════════════
export default function ProgressPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [weekFood, setWeekFood] = useState<FoodLog[][]>([])
  const [prevWeekFood, setPrevWeekFood] = useState<FoodLog[][]>([])
  const [dashStats, setDashStats] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [range, setRange] = useState<WeightRange>('30d')
  const [bodyGoals, setBodyGoals] = useState<BodyGoals>(loadBodyGoals)
  const [showBodyGoals, setShowBodyGoals] = useState<boolean>(false)

  // Weight form
  const [weight, setWeight] = useState<string>('')
  const [wNotes, setWNotes] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [w, d] = await Promise.all([
        api.weight.getAll(365),
        api.workout.dashboard(),
      ])
      setEntries(w)
      setDashStats(d)

      const thisWeek: FoodLog[][] = []
      const lastWeek: FoodLog[][] = []
      for (let i = 0; i < 7; i++) {
        const dt = new Date()
        dt.setDate(dt.getDate() - i)
        try { thisWeek.push(await api.food.getLogs(dt.toISOString().split('T')[0])) }
        catch { thisWeek.push([]) }
      }
      for (let i = 7; i < 14; i++) {
        const dt = new Date()
        dt.setDate(dt.getDate() - i)
        try { lastWeek.push(await api.food.getLogs(dt.toISOString().split('T')[0])) }
        catch { lastWeek.push([]) }
      }
      setWeekFood(thisWeek)
      setPrevWeekFood(lastWeek)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleLogWeight = async (): Promise<void> => {
    const w = parseFloat(weight)
    if (!w || w < 50 || w > 500) return
    setSaving(true)
    try {
      await api.weight.add({
        weight: w,
        date: new Date().toISOString().split('T')[0],
        notes: wNotes || undefined,
      })
      setWeight('')
      setWNotes('')
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBodyGoals = (next: BodyGoals): void => {
    setBodyGoals(next)
    saveBodyGoals(next)
  }

  // ── Computed ──
  const foodGoals = loadGoals()
  const calGoal = foodGoals.calories
  const proteinGoal = foodGoals.protein

  const now = new Date()
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7)
  const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(now.getDate() - 14)

  const thisWeek = summarizeWindow(weekFood, entries, sevenDaysAgo, now, calGoal, proteinGoal)
  const lastWeek = summarizeWindow(prevWeekFood, entries, fourteenDaysAgo, sevenDaysAgo, calGoal, proteinGoal)

  const consistency = computeConsistencyScore(thisWeek)
  const insights = generateInsights(thisWeek, lastWeek, proteinGoal, calGoal)
  const allTime = computeAllTimeStats(entries)

  // Filter data by range
  const rangedEntries = (() => {
    if (range === 'all') return entries
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '6m' ? 180 : 365
    const cut = new Date(); cut.setDate(now.getDate() - days)
    return entries.filter(e => new Date(e.date + 'T00:00:00') >= cut)
  })()

  // On-this-day lookups
  const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1)
  const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3)
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6)
  const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1)

  const onThisDay = [
    { label: '1 month ago',  entry: findWeightNearDate(entries, oneMonthAgo, 3) },
    { label: '3 months ago', entry: findWeightNearDate(entries, threeMonthsAgo, 5) },
    { label: '6 months ago', entry: findWeightNearDate(entries, sixMonthsAgo, 7) },
    { label: '1 year ago',   entry: findWeightNearDate(entries, oneYearAgo, 14) },
  ]

  // Body goal progress
  const startWeight = bodyGoals.startWeight ?? allTime.start?.weight
  const goalWeight = bodyGoals.goalWeight
  const currentWeight = allTime.current?.weight ?? 0
  const goalProgress = (startWeight && goalWeight && currentWeight)
    ? Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))
    : null

  // Milestones
  const lost = Math.max(0, (startWeight ?? 0) - currentWeight)
  const milestones = [
    { label: 'First 5 lbs lost',  threshold: 5,  hit: lost >= 5 },
    { label: 'First 10 lbs lost', threshold: 10, hit: lost >= 10 },
    { label: 'First 20 lbs lost', threshold: 20, hit: lost >= 20 },
    { label: '30-day streak',     threshold: 30, hit: (dashStats?.currentStreak ?? 0) >= 30 },
    { label: '100 workouts',      threshold: 100, hit: (dashStats?.totalWorkouts ?? 0) >= 100 },
  ]

  // Workout heatmap — 30 days
  const heatmapCells = Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (29 - i))
    const iso = dt.toISOString().split('T')[0]
    const intensity = dashStats?.workoutDaysLast30?.includes?.(iso) ? 1 : 0
    return { date: iso, intensity }
  })
  const heatmapActive = heatmapCells.filter(c => c.intensity > 0).length

  if (loading) {
    return (
      <div className="flex flex-col gap-4 content-fade-in">
        <PageHeaderSkeleton />
        <CardSkeleton height={28} />
        <CardSkeleton height={36} />
        <CardSkeleton height={52} />
        <CardSkeleton height={28} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black text-forged-text">Progress</h1>

      {/* ── 1. Hero: Consistency Score ── */}
      <Card delay={60}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Consistency Score
        </p>
        <ConsistencyHero score={consistency} week={thisWeek} />
      </Card>

      {/* ── 2. This Week vs Last Week ── */}
      <Card delay={120}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          This Week vs Last Week
        </p>
        <div className="grid grid-cols-2 gap-2">
          <CompareTile
            label="Weight"
            value={thisWeek.weightChange !== 0
              ? `${thisWeek.weightChange > 0 ? '+' : ''}${thisWeek.weightChange.toFixed(1)}`
              : 'Same'}
            unit={thisWeek.weightChange !== 0 ? 'lbs' : ''}
            delta={thisWeek.weightChange - lastWeek.weightChange}
            deltaUnit="lbs"
            goodDirection="down"
          />
          <CompareTile
            label="Avg Cal"
            value={thisWeek.avgCal || '--'}
            unit="cal"
            delta={thisWeek.avgCal - lastWeek.avgCal}
            deltaUnit=""
            goodDirection="down"
          />
          <CompareTile
            label="Avg Protein"
            value={thisWeek.avgProtein || '--'}
            unit="g"
            delta={thisWeek.avgProtein - lastWeek.avgProtein}
            deltaUnit="g"
            goodDirection="up"
          />
          <CompareTile
            label="Days Logged"
            value={thisWeek.daysWithFood}
            unit="/7"
            delta={thisWeek.daysWithFood - lastWeek.daysWithFood}
            deltaUnit=""
            goodDirection="up"
          />
        </div>
      </Card>

      {/* ── 3. Weight Journey ── */}
      <Card delay={180}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest">
            Weight Journey
          </p>
          <button
            onClick={() => setShowBodyGoals(true)}
            className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors flex items-center gap-1"
          >
            <Icon d={I.edit} size={11} sw={2} />Edit
          </button>
        </div>
        <WeightJourney
          start={startWeight}
          startDate={bodyGoals.startDate ?? allTime.start?.date}
          current={currentWeight}
          currentDate={allTime.current?.date}
          goal={goalWeight}
          goalDate={bodyGoals.goalDate}
          progress={goalProgress}
          lost={lost}
        />
      </Card>

      {/* ── 4. Insights ── */}
      <Card delay={240}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Insights
        </p>
        <InsightList insights={insights} />
      </Card>

      {/* ── 5. Weight Trend with Range Toggle ── */}
      <Card delay={300}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Weight Trend
        </p>
        <div className="flex bg-forged-bg rounded-xl p-1 gap-0.5 mb-4">
          {(['7d', '30d', '90d', '6m', '1y', 'all'] as WeightRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${range === r ? 'bg-forged-surface text-forged-text shadow-sm' : 'text-forged-text2 hover:text-forged-text'}`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <WeightChart data={rangedEntries} range={range} />
      </Card>

      {/* ── 6. Workout Heatmap ── */}
      <Card delay={360}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest">
            Workouts (30 days)
          </p>
          <span className="text-[10px] text-forged-text2 font-bold">
            {heatmapActive} active days
          </span>
        </div>
        <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
          {heatmapCells.map(cell => (
            <div
              key={cell.date}
              title={cell.date}
              className={`aspect-square rounded transition-all
                ${cell.intensity === 0
                  ? 'bg-forged-surface2'
                  : 'bg-forged-purple'}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-forged-text2 mt-2">
          Requires workout dates from backend. Will populate as you log.
        </p>
      </Card>

      {/* ── 7. Personal Records ── */}
      <Card delay={420}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Icon d={I.trophy} size={11} sw={2} className="text-forged-purple" />Personal Records
        </p>
        <PRRow
          label="Heaviest weight"
          value={allTime.heaviest ? `${allTime.heaviest.weight} lbs` : 'No record'}
          date={allTime.heaviest?.date}
        />
        <PRRow
          label="Lightest weight"
          value={allTime.lightest ? `${allTime.lightest.weight} lbs` : 'No record'}
          date={allTime.lightest?.date}
        />
        <PRRow
          label="Longest fast"
          value={dashStats?.longestFastHours ? `${dashStats.longestFastHours.toFixed(1)} hrs` : 'No record'}
        />
        <PRRow
          label="Best streak"
          value={dashStats?.bestStreak ? `${dashStats.bestStreak} days` : 'No record'}
        />
        <PRRow
          label="Most protein in a day"
          value={dashStats?.mostProteinInDay ? `${dashStats.mostProteinInDay}g` : 'No record'}
        />
      </Card>

      {/* ── 8. Milestones ── */}
      <Card delay={480}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Milestones
        </p>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map(m => (
            <MilestoneBadge key={m.label} label={m.label} hit={m.hit} remaining={
              m.label.includes('lbs') ? Math.max(0, m.threshold - lost).toFixed(1) + ' to go'
              : m.label.includes('streak') ? `${Math.max(0, m.threshold - (dashStats?.currentStreak ?? 0))} to go`
              : `${Math.max(0, m.threshold - (dashStats?.totalWorkouts ?? 0))} to go`
            } />
          ))}
        </div>
      </Card>

      {/* ── 9. Averages ── */}
      <Card delay={540}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Averages
        </p>
        <div className="grid grid-cols-3 gap-3">
          <AvgStat
            value={allTime.avgPerWeek !== 0 ? `${allTime.avgPerWeek > 0 ? '-' : '+'}${Math.abs(allTime.avgPerWeek).toFixed(2)}` : '--'}
            label="lbs/week"
          />
          <AvgStat
            value={allTime.avgPerMonth !== 0 ? `${allTime.avgPerMonth > 0 ? '-' : '+'}${Math.abs(allTime.avgPerMonth).toFixed(1)}` : '--'}
            label="lbs/month"
          />
          <AvgStat
            value={allTime.avgOverall ? allTime.avgOverall.toFixed(1) : '--'}
            label="avg weight"
          />
        </div>
      </Card>

      {/* ── 10. On This Day ── */}
      <Card delay={600}>
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Icon d={I.calendar} size={11} sw={2} className="text-forged-purple" />On This Day
        </p>
        {onThisDay.map(row => (
          <div
            key={row.label}
            className="flex justify-between items-center py-2 border-b border-forged-border last:border-0"
          >
            <span className="text-xs text-forged-text2 font-bold">{row.label}</span>
            <span className={`text-sm font-black tabular-nums
              ${row.entry ? 'text-forged-text' : 'text-forged-text2'}`}>
              {row.entry ? `${row.entry.weight} lbs` : 'No record'}
            </span>
          </div>
        ))}
      </Card>

      {/* ── Log Weight ── */}
      <Card delay={660}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-2">
          Log Weight
        </p>
        <div className="flex gap-2">
          <input
            type="number" step="0.1" placeholder="e.g. 181.5"
            value={weight} onChange={e => setWeight(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors"
          />
          <input
            type="text" placeholder="Note (optional)"
            value={wNotes} onChange={e => setWNotes(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-purple/50 transition-colors"
          />
          <button
            onClick={handleLogWeight} disabled={saving}
            className="px-5 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? '...' : 'Log'}
          </button>
        </div>
      </Card>

      {/* ── Weight History ── */}
      <Card delay={720}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">
          Weight History
        </p>
        {entries.length === 0 ? (
          <p className="text-sm text-forged-text2 text-center py-4">
            No entries yet. Log your first weight above.
          </p>
        ) : (
          <div className="flex flex-col max-h-64 overflow-y-auto">
            {entries.slice().reverse().slice(0, 20).map(e => (
              <div key={e.id} className="flex justify-between items-center py-3
                border-b border-forged-border last:border-0">
                <span className="text-sm text-forged-text2">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-forged-text tabular-nums">
                    {e.weight} lbs
                  </span>
                  {e.notes && (
                    <span className="text-[10px] text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">
                      {e.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showBodyGoals && (
        <BodyGoalsModal
          initial={bodyGoals}
          firstEntryWeight={allTime.start?.weight}
          firstEntryDate={allTime.start?.date}
          onSave={handleSaveBodyGoals}
          onClose={() => setShowBodyGoals(false)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════
// SUBCOMPONENTS
// ══════════════════════════════════

function ConsistencyHero({ score, week }: { score: number | null; week: { daysWithFood: number } }) {
  const ring = score ?? 0
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (ring / 100) * circumference

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#6D28D9" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-forged-text tabular-nums">
            {score ?? '--'}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-forged-text">
          {score === null ? 'No data yet' :
            score >= 75 ? 'On track this week' :
            score >= 50 ? 'Keep building' :
            'Needs attention'}
        </p>
        <p className="text-[11px] text-forged-text2 mt-0.5">
          Weighted from nutrition, logging, and consistency.
        </p>
        <p className="text-[10px] text-forged-text2 mt-0.5">
          {week.daysWithFood} of 7 days logged
        </p>
      </div>
    </div>
  )
}

function CompareTile({ label, value, unit, delta, deltaUnit, goodDirection }: {
  label: string
  value: number | string
  unit: string
  delta: number
  deltaUnit: string
  goodDirection: 'up' | 'down'
}) {
  const isGood = goodDirection === 'up' ? delta > 0 : delta < 0
  const isNeutral = delta === 0 || isNaN(delta)
  const color = isNeutral ? 'text-forged-text2'
    : isGood ? 'text-forged-green' : 'text-forged-red'

  const deltaText = isNeutral ? 'same as last week'
    : `${delta > 0 ? '+' : ''}${typeof delta === 'number' ? delta.toFixed(delta % 1 === 0 ? 0 : 1) : delta}${deltaUnit} vs last`

  return (
    <div className="bg-forged-bg rounded-xl p-3">
      <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black text-forged-text mt-1 tabular-nums">
        {value}
        {unit && <span className="text-xs font-medium text-forged-text2 ml-0.5">{unit}</span>}
      </p>
      <p className={`text-[10px] font-bold mt-0.5 ${color}`}>{deltaText}</p>
    </div>
  )
}

function WeightJourney({ start, startDate, current, currentDate, goal, goalDate, progress, lost }: {
  start?: number
  startDate?: string
  current: number
  currentDate?: string
  goal?: number
  goalDate?: string
  progress: number | null
  lost: number
}) {
  const fmtDate = (d?: string): string => {
    if (!d) return '--'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!start) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-forged-text2">Log weight + set goals to see your journey</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-[9px] text-forged-text2 font-bold uppercase">Start</p>
          <p className="text-base font-black text-forged-text tabular-nums mt-1">{start}</p>
          <p className="text-[9px] text-forged-text2 mt-0.5">{fmtDate(startDate)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-forged-purple font-bold uppercase">Now</p>
          <p className="text-base font-black text-forged-purple tabular-nums mt-1">{current || '--'}</p>
          <p className="text-[9px] text-forged-text2 mt-0.5">{fmtDate(currentDate) || 'Today'}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-forged-text2 font-bold uppercase">Goal</p>
          <p className="text-base font-black text-forged-text tabular-nums mt-1">{goal ?? '--'}</p>
          <p className="text-[9px] text-forged-text2 mt-0.5">{goalDate ? fmtDate(goalDate) : 'Set date'}</p>
        </div>
      </div>
      {progress !== null && goal && (
        <>
          <div className="h-2 rounded-full bg-forged-surface2 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-forged-purple transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-forged-text2 text-center">
            {progress.toFixed(0)}% of the way · {lost.toFixed(1)} lbs lost · {Math.max(0, current - goal).toFixed(1)} to go
          </p>
        </>
      )}
    </div>
  )
}

function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-[11px] text-forged-text2 text-center py-3">
        Keep logging for personalized insights.
      </p>
    )
  }

  const colorFor = (kind: Insight['kind']): string => {
    if (kind === 'good') return 'border-forged-green'
    if (kind === 'warn') return 'border-yellow-500'
    return 'border-forged-red'
  }

  return (
    <div className="flex flex-col gap-2">
      {insights.map((ins, i) => (
        <div
          key={i}
          className={`bg-forged-bg border-l-[3px] rounded-r-xl py-2 px-3 ${colorFor(ins.kind)}`}
        >
          <p className="text-xs font-bold text-forged-text">{ins.title}</p>
          <p className="text-[10px] text-forged-text2 mt-0.5">{ins.detail}</p>
        </div>
      ))}
    </div>
  )
}

function PRRow({ label, value, date }: { label: string; value: string; date?: string }) {
  const isRecord = value !== 'No record'
  return (
    <div className="flex justify-between items-center py-2 border-b border-forged-border last:border-0">
      <span className="text-xs text-forged-text font-bold">{label}</span>
      <div className="text-right">
        <span className={`text-xs font-black tabular-nums
          ${isRecord ? 'text-forged-purple' : 'text-forged-text2'}`}>{value}</span>
        {date && isRecord && (
          <span className="text-[10px] text-forged-text2 ml-2">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

function MilestoneBadge({ label, hit, remaining }: { label: string; hit: boolean; remaining: string }) {
  return (
    <div
      className={`rounded-xl p-3 text-center transition-all
        ${hit
          ? 'bg-forged-bg border border-forged-purple'
          : 'bg-forged-bg border border-forged-border opacity-60'}`}
    >
      <p className={`text-[11px] font-black ${hit ? 'text-forged-purple' : 'text-forged-text2'}`}>
        {label}
      </p>
      <p className="text-[9px] text-forged-text2 mt-0.5">
        {hit ? 'Unlocked' : remaining}
      </p>
    </div>
  )
}

function AvgStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[9px] text-forged-text2 font-bold uppercase mt-0.5">{label}</p>
    </div>
  )
}