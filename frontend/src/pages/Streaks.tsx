import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import type { FoodLog, WorkoutLog } from '../types'
import { loadGoals } from '../components/food/goalStorage'
import {
  buildLoggingStreak, buildWorkoutStreak, buildProteinStreak, buildCaloriesStreak,
  buildHeatmap, findNextMilestone, MILESTONES, buildMonthComparison,
  getRecoveryMessage, hasFreezeBeenUsedThisMonth, useFreeze,
  type StreakData, type StreakType,
} from '../components/streaks/streaksLogic'
import { useLoadingEffect } from '../hooks/useLoading'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
  snowflake: <><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M20 16l-4-4 4-4"/><path d="M4 8l4 4-4 4"/><path d="M16 4l-4 4-4-4"/><path d="M8 20l4-4 4 4"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zM21 15v7"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
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
// STREAKS PAGE
// ══════════════════════════════════
export default function StreaksPage({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState<StreakType>('logging')
  const [streaks, setStreaks] = useState<Record<StreakType, StreakData> | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [freezePrompt, setFreezePrompt] = useState<boolean>(false)

  useLoadingEffect(async () => {
    // Generate 84 dates (last 12 weeks)
    const dates: string[] = []
    for (let i = 0; i < 84; i++) {
      const dt = new Date()
      dt.setDate(dt.getDate() - i)
      dates.push(dt.toISOString().split('T')[0])
    }

    // Fetch everything in parallel: workouts + all 84 days of food at once.
    // Much faster than looping with sequential awaits.
    const [workouts, ...foodResults] = await Promise.all([
      api.workout.getLogs(120),
      ...dates.map(iso =>
        api.food.getLogs(iso).catch(() => [] as FoodLog[])
      ),
    ])

    const foodByDay = new Map<string, FoodLog[]>()
    dates.forEach((iso, i) => foodByDay.set(iso, foodResults[i]))

    const goals = loadGoals()
    const logging = buildLoggingStreak(foodByDay)
    const workout = buildWorkoutStreak(workouts as WorkoutLog[])
    const protein = buildProteinStreak(foodByDay, goals.protein)
    const calories = buildCaloriesStreak(foodByDay, goals.calories)

    setStreaks({ logging, workout, protein, calories })
  }, [reloadKey])

  const streak = streaks?.[active]

  const handleShare = async (): Promise<void> => {
    if (!streak) return
    const text = `${streak.currentStreak} days · ${streak.label}
Best ever: ${streak.bestStreak} days
forgedgyms.com`
    if (navigator.share) {
      try { await navigator.share({ text, title: 'My FORGED streak' }) } catch { /* cancel */ }
    } else {
      try { await navigator.clipboard.writeText(text); alert('Streak copied') }
      catch { alert('Share not supported') }
    }
  }

  const handleUseFreeze = (): void => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    useFreeze(yesterday.toISOString().split('T')[0])
    setFreezePrompt(false)
    setReloadKey(k => k + 1)
  }

  if (!streak || !streaks) return null

  const heatmap = buildHeatmap(streak.activeDays, 12)
  const nextMilestone = findNextMilestone(streak.currentStreak)
  const comparison = buildMonthComparison(streak.activeDays)
  const recovery = getRecoveryMessage(streak.currentStreak, streak.bestStreak)
  const freezeUsed = hasFreezeBeenUsedThisMonth()

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Header onBack={onBack} />

      {/* Type selector */}
      <div className="flex bg-forged-surface border border-forged-border rounded-xl p-0.5 gap-0.5 overflow-x-auto">
        <StreakTab icon={I.utensils} label="Logging" type="logging" active={active} onClick={setActive} data={streaks.logging} />
        <StreakTab icon={I.dumbbell} label="Workouts" type="workout" active={active} onClick={setActive} data={streaks.workout} />
        <StreakTab icon={I.target} label="Protein" type="protein" active={active} onClick={setActive} data={streaks.protein} />
        <StreakTab icon={I.zap} label="Calories" type="calories" active={active} onClick={setActive} data={streaks.calories} />
      </div>

      {/* ── 1. Flame hero ── */}
      <Card delay={60} className="!p-6 text-center relative overflow-hidden">
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500
          ${streak.currentStreak >= 7 ? 'opacity-100' : 'opacity-30'}`}
          style={{
            background: 'radial-gradient(circle at center top, rgba(109,40,217,0.25) 0%, transparent 60%)'
          }} />

        <div className="relative">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all
            ${streak.currentStreak >= 7
              ? 'bg-gradient-to-br from-forged-purple to-purple-900 shadow-2xl shadow-forged-purple/40'
              : streak.currentStreak >= 3
                ? 'bg-forged-purple/25'
                : 'bg-forged-purple/10'}`}
          >
            <Icon d={I.flame} size={44}
              className={streak.currentStreak >= 7 ? 'text-white' : 'text-forged-purple'} />
          </div>

          <p className="text-6xl font-black text-forged-text tabular-nums leading-none">
            {streak.currentStreak}
          </p>
          <p className="text-xs text-forged-text2 font-black uppercase tracking-widest mt-2">
            {streak.currentStreak === 1 ? 'Day' : 'Days'} · {streak.label}
          </p>
          <p className="text-[11px] text-forged-text2 mt-2 max-w-[240px] mx-auto leading-relaxed">
            {streak.sublabel}
          </p>

          {/* Best badge */}
          {streak.bestStreak > streak.currentStreak && (
            <div className="inline-flex items-center gap-1.5 bg-forged-bg border border-forged-border px-3 py-1 rounded-full mt-4">
              <Icon d={I.trophy} size={11} className="text-forged-purple" />
              <span className="text-[10px] font-black text-forged-text">
                Best: {streak.bestStreak} days
              </span>
            </div>
          )}
          {streak.currentStreak > 0 && streak.currentStreak >= streak.bestStreak && streak.currentStreak >= 3 && (
            <div className="inline-flex items-center gap-1.5 bg-forged-purple/15 border border-forged-purple/30 px-3 py-1 rounded-full mt-4">
              <Icon d={I.trophy} size={11} className="text-forged-purple" />
              <span className="text-[10px] font-black text-forged-purple">
                New record
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── 2. Recovery message ── */}
      {recovery && (
        <Card delay={120}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-forged-purple/15 flex items-center justify-center flex-shrink-0">
              <Icon d={I.flame} size={14} className="text-forged-purple" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-forged-text">Reset day</p>
              <p className="text-[11px] text-forged-text2 mt-1 leading-relaxed">{recovery}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── 3. Next milestone ── */}
      {nextMilestone && streak.currentStreak > 0 && (
        <Card delay={180}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest">Next milestone</p>
              <p className="text-sm font-black text-forged-text mt-1">
                {nextMilestone.label} · {nextMilestone.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-forged-purple tabular-nums">
                {nextMilestone.days - streak.currentStreak}
              </p>
              <p className="text-[9px] text-forged-text2 font-bold uppercase">days to go</p>
            </div>
          </div>
          <div className="h-2 bg-forged-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forged-purple to-forged-purple/60 transition-all duration-700"
              style={{ width: `${(streak.currentStreak / nextMilestone.days) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* ── 4. 12-week heatmap ── */}
      <Card delay={240}>
        <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-3">Last 12 weeks</p>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {heatmap.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] flex-shrink-0">
              {col.map((cell, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-[2px] transition-all
                    ${cell.active
                      ? 'bg-forged-purple hover:brightness-125'
                      : 'bg-forged-bg border border-forged-border'}`}
                  title={`${cell.date}${cell.active ? ' · on track' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[9px] text-forged-text2">Less</p>
          <div className="flex gap-[3px]">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-forged-bg border border-forged-border" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-forged-purple/40" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-forged-purple/70" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-forged-purple" />
          </div>
          <p className="text-[9px] text-forged-text2">More</p>
        </div>
      </Card>

      {/* ── 5. This month vs last month ── */}
      <Card delay={300}>
        <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-3">You vs yourself</p>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div className="bg-forged-bg rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold text-forged-text2 uppercase">{comparison.lastMonth.label}</p>
            <p className="text-xl font-black text-forged-text tabular-nums mt-1">
              {comparison.lastMonth.count}
            </p>
            <p className="text-[9px] text-forged-text2 mt-0.5">/ {comparison.lastMonth.total}</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-black tabular-nums
              ${comparison.delta > 0 ? 'text-forged-green' : comparison.delta < 0 ? 'text-forged-red' : 'text-forged-text2'}`}>
              {comparison.delta > 0 ? '+' : ''}{comparison.delta}
            </p>
            <p className="text-[8px] text-forged-text2 font-bold uppercase mt-0.5">change</p>
          </div>
          <div className="bg-forged-purple/10 border border-forged-purple/30 rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold text-forged-purple uppercase">{comparison.thisMonth.label}</p>
            <p className="text-xl font-black text-forged-text tabular-nums mt-1">
              {comparison.thisMonth.count}
            </p>
            <p className="text-[9px] text-forged-text2 mt-0.5">/ {comparison.thisMonth.total}</p>
          </div>
        </div>
        <p className="text-[10px] text-forged-text2 text-center mt-3 leading-relaxed">
          {comparison.delta > 0
            ? `You're ahead of last month's pace. Keep it up.`
            : comparison.delta < 0
              ? `Behind last month's pace. Still time to catch up.`
              : `Same pace as last month. Consistency is the point.`}
        </p>
      </Card>

      {/* ── 6. Milestones ── */}
      <Card delay={360}>
        <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-3">Milestones</p>
        <div className="grid grid-cols-4 gap-2">
          {MILESTONES.map(m => {
            const earned = streak.bestStreak >= m.days
            return (
              <div
                key={m.days}
                className={`rounded-xl p-2.5 text-center transition-all
                  ${earned
                    ? 'bg-forged-purple/10 border border-forged-purple'
                    : 'bg-forged-bg border border-forged-border opacity-40'}`}
              >
                <Icon d={I.trophy} size={14} sw={2}
                  className={`mx-auto ${earned ? 'text-forged-purple' : 'text-forged-text2'}`} />
                <p className={`text-[10px] font-black mt-1.5 leading-tight
                  ${earned ? 'text-forged-text' : 'text-forged-text2'}`}>
                  {m.label}
                </p>
                <p className="text-[8px] text-forged-text2 mt-0.5 leading-tight">
                  {earned ? 'Earned' : m.description}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── 7. Streak freeze ── */}
      <Card delay={420}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${freezeUsed ? 'bg-forged-bg border border-forged-border' : 'bg-cyan-500/15'}`}>
            <Icon d={I.snowflake} size={18} sw={2}
              className={freezeUsed ? 'text-forged-text2' : 'text-cyan-400'} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-forged-text">Streak freeze</p>
            <p className="text-[10px] text-forged-text2 mt-1 leading-relaxed">
              {freezeUsed
                ? 'Used this month. Resets on the 1st.'
                : 'One grace day per month. Use it when life happens — your streak survives.'}
            </p>
            {!freezeUsed && streak.currentStreak > 0 && (
              <button
                onClick={() => setFreezePrompt(true)}
                className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-cyan-500/15 text-cyan-400
                  border border-cyan-500/30 hover:bg-cyan-500/25 active:scale-95 transition-all"
              >
                Use on yesterday
              </button>
            )}
          </div>
        </div>
      </Card>

      {freezePrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
             onClick={() => setFreezePrompt(false)}>
          <div className="bg-forged-surface rounded-2xl max-w-sm w-full p-5"
               onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-3">
              <Icon d={I.snowflake} size={22} className="text-cyan-400" />
            </div>
            <p className="text-base font-black text-forged-text">Freeze yesterday?</p>
            <p className="text-xs text-forged-text2 mt-2 leading-relaxed">
              This uses your grace day for this month. Your streak won't break from yesterday's miss.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setFreezePrompt(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-forged-bg border border-forged-border
                  text-forged-text2 hover:text-forged-text active:scale-[0.98] transition-all">
                Cancel
              </button>
              <button onClick={handleUseFreeze}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-cyan-500 text-white
                  hover:brightness-110 active:scale-[0.98] transition-all">
                Use freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Share card ── */}
      <Card delay={480}>
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
            hover:brightness-110 active:scale-[0.98] transition-all
            flex items-center justify-center gap-2"
        >
          <Icon d={I.share} size={14} sw={2.5} />Share streak card
        </button>
        <p className="text-[10px] text-forged-text2 text-center mt-2">
          Text recap via your device share sheet
        </p>
      </Card>
    </div>
  )
}

// ══════════════════════════════════
// SUBCOMPONENTS
// ══════════════════════════════════

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
          flex items-center justify-center text-forged-text2
          hover:text-forged-text active:scale-95 transition-all">
        <Icon d={I.chevL} size={16} />
      </button>
      <h1 className="text-2xl font-black text-forged-text">Streaks</h1>
    </div>
  )
}

function StreakTab({ icon, label, type, active, onClick, data }: {
  icon: React.ReactNode
  label: string
  type: StreakType
  active: StreakType
  onClick: (t: StreakType) => void
  data: StreakData
}) {
  const isActive = active === type
  return (
    <button
      onClick={() => onClick(type)}
      className={`flex-1 min-w-[68px] flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-all
        ${isActive ? 'bg-forged-purple text-white' : 'text-forged-text2 hover:text-forged-text'}`}
    >
      <Icon d={icon} size={14} sw={isActive ? 2.4 : 1.8} />
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-black tabular-nums">{data.currentStreak}</span>
    </button>
  )
}