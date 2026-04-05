import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import type { WeightEntry, FoodLog, WorkoutLog } from '../types'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/><path d="M7 7L5 5"/><path d="M17 17l2 2"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

export default function WeeklySummaryPage({ onBack }: { onBack: () => void }) {
  const [weekFood, setWeekFood] = useState<FoodLog[][]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [weight, setWeight] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [w, wk] = await Promise.all([api.weight.getAll(14), api.workout.getLogs(7)])
        setWeight(w); setWorkouts(wk)
        const days: FoodLog[][] = []
        for (let i = 0; i < 7; i++) {
          const dt = new Date(); dt.setDate(dt.getDate() - i)
          try { days.push(await api.food.getLogs(dt.toISOString().split('T')[0])) } catch { days.push([]) }
        }
        setWeekFood(days)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const daysWithFood = weekFood.filter(d => d.length > 0).length || 1
  const avgCal = Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0) / daysWithFood)
  const avgProtein = Math.round(weekFood.flat().reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0) / daysWithFood)
  const totalMeals = weekFood.flat().length
  const completedWorkouts = workouts.filter(w => w.completed).length
  const weekWeights = weight.filter(w => { const d = new Date(w.date + 'T00:00:00'); const ago = new Date(); ago.setDate(ago.getDate() - 7); return d >= ago })
  const weightChange = weekWeights.length >= 2 ? weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight : 0

  if (loading) return (
    <div className="flex flex-col gap-4">
      <Header title="Weekly Summary" onBack={onBack} />
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-forged-surface2 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <Header title="Weekly Summary" onBack={onBack} />
      <Card delay={60} className="!p-6">
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-4">This Week at a Glance</p>
        <div className="grid grid-cols-2 gap-4">
          <Chip icon={I.zap} label="Avg Calories" value={`${avgCal}`} unit="cal/day" />
          <Chip icon={I.target} label="Avg Protein" value={`${avgProtein}`} unit="g/day" />
          <Chip icon={I.dumbbell} label="Workouts" value={`${completedWorkouts}`} unit="completed" />
          <Chip icon={I.scale} label="Weight Change" value={weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '--'} unit="lbs"
            accent={weightChange < 0 ? 'green' : weightChange > 0 ? 'red' : undefined} />
        </div>
      </Card>
      <Card delay={140}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Daily Breakdown</p>
        {weekFood.slice().reverse().map((day, i) => {
          const date = new Date(); date.setDate(date.getDate() - (6 - i))
          const cals = day.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
          return (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-forged-text2/10 last:border-0">
              <span className="text-sm text-forged-text2">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-forged-text2">{day.length} meals</span>
                <span className="text-sm font-black text-forged-text tabular-nums">{cals} cal</span>
              </div>
            </div>
          )
        })}
      </Card>
      <Card delay={220}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Stats</p>
        <Row label="Total Meals Logged" value={`${totalMeals}`} />
        <Row label="Days Tracked" value={`${daysWithFood}`} />
        <Row label="Workouts Completed" value={`${completedWorkouts}`} />
      </Card>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
        <Icon d={I.chevL} size={16} />
      </button>
      <h1 className="text-2xl font-black text-forged-text">{title}</h1>
    </div>
  )
}

function Chip({ icon, label, value, unit, accent }: { icon: React.ReactNode; label: string; value: string; unit: string; accent?: 'green' | 'red' }) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3 text-center">
      <div className="w-8 h-8 mx-auto rounded-lg bg-forged-purple/10 flex items-center justify-center mb-2"><Icon d={icon} size={14} className="text-forged-purple" /></div>
      <p className={`text-xl font-black tabular-nums ${accent === 'green' ? 'text-forged-green' : accent === 'red' ? 'text-forged-red' : 'text-forged-text'}`}>{value}</p>
      <p className="text-[9px] text-forged-text2 font-bold uppercase">{unit}</p>
      <p className="text-[8px] text-forged-text2 mt-0.5">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text">{value}</span>
    </div>
  )
}