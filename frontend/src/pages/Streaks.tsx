import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import type { FoodLog } from '../types'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

export default function StreaksPage({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<any>(null)
  const [weekFood, setWeekFood] = useState<FoodLog[][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await api.workout.dashboard())
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

  const daysLogged = weekFood.filter(d => d.length > 0).length
  const daysOnTarget = weekFood.filter(d => { const c = d.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0); return c > 0 && c <= 2400 }).length
  const daysProtein = weekFood.filter(d => { const p = d.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0); return p >= 180 }).length

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2"><Icon d={I.chevL} size={16} /></button>
        <h1 className="text-2xl font-black text-forged-text">Streaks</h1>
      </div>
      {[1, 2].map(i => <div key={i} className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevL} size={16} /></button>
        <h1 className="text-2xl font-black text-forged-text">Streaks</h1>
      </div>

      <Card delay={60} className="!p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-forged-purple/15 flex items-center justify-center mb-3">
          <Icon d={I.flame} size={36} className="text-forged-purple" />
        </div>
        <p className="text-5xl font-black text-forged-text tabular-nums">{stats?.currentStreak ?? 0}</p>
        <p className="text-sm text-forged-text2 font-bold mt-1">Day Streak</p>
        <p className="text-xs text-forged-text2 mt-2">
          {(stats?.currentStreak ?? 0) >= 7 ? 'On fire! Keep it going.' : (stats?.currentStreak ?? 0) >= 3 ? 'Building momentum.' : 'Log workouts daily to build your streak.'}
        </p>
      </Card>

      <Card delay={140}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">This Week</p>
        <div className="flex justify-between mb-4">
          {weekFood.slice().reverse().map((day, i) => {
            const has = day.length > 0
            const d = new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'narrow' })
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${has ? 'bg-forged-green/15 text-forged-green' : 'bg-forged-surface2 text-forged-text2'}`}>
                  {has ? <Icon d={I.check} size={14} sw={2.5} /> : ''}
                </div>
                <span className="text-[9px] text-forged-text2 font-bold">{d}</span>
              </div>
            )
          })}
        </div>
        <Row label="Days Logged Food" value={`${daysLogged}/7`} />
        <Row label="Within Calorie Goal" value={`${daysOnTarget}/7`} />
        <Row label="Protein Target Hit" value={`${daysProtein}/7`} />
        <Row label="Total Workouts" value={`${stats?.totalWorkouts ?? 0}`} />
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-black text-forged-text tabular-nums">{value}</span>
    </div>
  )
}