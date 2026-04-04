import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import { useTheme } from '../hooks/useTheme'
import type { DashboardStats, User, WeightEntry, FastingLog, FoodLog } from '../types'

// ──────────────────────────────────
// SVG ICON PATHS
// ──────────────────────────────────
const Icons = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5" /><path d="M2 12l2-2 2 2" /><path d="M18 12l2-2 2 2" /><path d="M7 7L5 5" /><path d="M17 17l2 2" /></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  barChart: <><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  scale: <><path d="M8 21h8" /><path d="M12 17V3" /><path d="M2 11h4l2-4 4 8 4-8 2 4h4" /></>,
  play: <><polygon points="5 3 19 12 5 21 5 3" /></>,
  droplet: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z" /></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  sun: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  chevron: <><path d="M9 18l6-6-6-6" /></>,
  trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
}

function Icon({ path, size = 20, className = '', strokeWidth = 1.8 }: {
  path: React.ReactNode; size?: number; className?: string; strokeWidth?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      {path}
    </svg>
  )
}

// ──────────────────────────────────
// ANIMATED NUMBER HOOK
// ──────────────────────────────────
function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * ease))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

// ──────────────────────────────────
// PROGRESS RING
// ──────────────────────────────────
function ProgressRing({ value, max, size = 76, stroke = 5, colorClass, children }: {
  value: number; max: number; size?: number; stroke?: number
  colorClass: string; children?: React.ReactNode
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const t = setTimeout(() => setOffset(circumference * (1 - pct)), 120)
    return () => clearTimeout(t)
  }, [pct, circumference])

  // Map Tailwind color classes to actual hex for SVG stroke
  const colorMap: Record<string, string> = {
    'text-forged-red': '#e74c3c',
    'text-forged-blue': '#3498db',
    'text-forged-green': '#2ecc71',
    'text-forged-gold': '#f39c12',
    'text-forged-purple': '#9b59b6',
  }
  const strokeColor = colorMap[colorClass] || '#f39c12'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={strokeColor} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
            filter: `drop-shadow(0 0 6px ${strokeColor}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ──────────────────────────────────
// WEIGHT CHART (pure SVG)
// ──────────────────────────────────
function WeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 250)
    return () => clearTimeout(t)
  }, [])

  if (data.length < 2) {
    return <p className="text-sm text-forged-text3 py-4">Log at least 2 weights to see your trend</p>
  }

  const w = 600, h = 180, px = 44, py = 20
  const vals = data.map(d => d.weight)
  const min = Math.min(...vals) - 1
  const max = Math.max(...vals) + 1

  const points = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * (w - 2 * px),
    y: py + ((max - d.weight) / (max - min)) * (h - 2 * py),
  }))

  const pathD = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }).join(' ')

  const areaD = pathD + ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b59b6" />
          <stop offset="100%" stopColor="#3498db" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = py + f * (h - 2 * py)
        const val = (max - f * (max - min)).toFixed(1)
        return (
          <g key={i}>
            <line x1={px} y1={y} x2={w - px} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={px - 6} y={y + 4} fill="var(--text3)" fontSize="10" textAnchor="end"
              fontFamily="-apple-system, system-ui, sans-serif">{val}</text>
          </g>
        )
      })}
      {/* X labels */}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map((d) => {
        const idx = data.indexOf(d)
        return (
          <text key={idx} x={points[idx].x} y={h - 2} fill="var(--text3)"
            fontSize="10" textAnchor="middle"
            fontFamily="-apple-system, system-ui, sans-serif">
            {formatDate(d.date)}
          </text>
        )
      })}
      {/* Area + line */}
      <path d={areaD} fill="url(#weightGrad)"
        opacity={drawn ? 1 : 0} style={{ transition: 'opacity 1s ease 0.3s' }} />
      <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round"
        style={{
          strokeDasharray: drawn ? 'none' : '1200',
          strokeDashoffset: drawn ? 0 : 1200,
          transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4"
          fill="var(--bg)" stroke="#9b59b6" strokeWidth="2"
          opacity={drawn ? 1 : 0}
          style={{ transition: `opacity 0.4s ease ${0.3 + i * 0.08}s` }}
        />
      ))}
      {/* Latest value badge */}
      {drawn && points.length > 0 && (
        <g>
          <rect x={points[points.length - 1].x - 26} y={points[points.length - 1].y - 28}
            width="52" height="20" rx="6" fill="#9b59b6" />
          <text x={points[points.length - 1].x} y={points[points.length - 1].y - 14}
            fill="#fff" fontSize="11" fontWeight="600" textAnchor="middle"
            fontFamily="-apple-system, system-ui, sans-serif">
            {data[data.length - 1].weight}
          </text>
        </g>
      )}
    </svg>
  )
}

// ──────────────────────────────────
// FASTING TIMER
// ──────────────────────────────────
function FastingTimer({ fast }: { fast: FastingLog }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const startMs = new Date(fast.startTime).getTime()
  const elapsedHrs = (now - startMs) / (1000 * 60 * 60)
  const pct = Math.min(elapsedHrs / fast.targetHours, 1)
  const remainingHrs = Math.max(fast.targetHours - elapsedHrs, 0)
  const hrs = Math.floor(remainingHrs)
  const mins = Math.floor((remainingHrs - hrs) * 60)
  const secs = Math.floor(((remainingHrs - hrs) * 60 - mins) * 60)

  const size = 132, stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    setOffset(circumference * (1 - pct))
  }, [pct, circumference])

  const [ending, setEnding] = useState(false)
  const handleEnd = async () => {
    setEnding(true)
    try {
      await api.fasting.end(fast.id, {})
      window.location.reload()
    } catch (err) {
      console.error(err)
      setEnding(false)
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#2ecc71" strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              filter: 'drop-shadow(0 0 8px rgba(46,204,113,0.3))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-forged-text tabular-nums">
            {hrs}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-forged-text3 mt-0.5">remaining</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-[10px] text-forged-text3 uppercase tracking-widest">Elapsed</p>
          <p className="text-base font-semibold text-forged-text">
            {Math.floor(elapsedHrs)}h {Math.floor((elapsedHrs % 1) * 60)}m
            <span className="text-forged-text3 font-normal"> / {fast.targetHours}h</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-forged-text3 uppercase tracking-widest">Started</p>
          <p className="text-sm text-forged-text2">
            {new Date(fast.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={handleEnd} disabled={ending}
          className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold
            bg-forged-red/10 text-forged-red border border-forged-red/20
            hover:bg-forged-red hover:text-white
            transition-all duration-200 disabled:opacity-50">
          {ending ? 'Ending...' : 'End Fast'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────
// CARD WRAPPER
// ──────────────────────────────────
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-700 ease-out
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
      ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-semibold text-forged-text tracking-wide">{title}</h3>
      {action && (
        <button onClick={onAction}
          className="text-xs font-medium text-forged-purple hover:text-forged-blue transition-colors">
          {action}
        </button>
      )}
    </div>
  )
}

// ──────────────────────────────────
// QUICK ACTION BUTTON
// ──────────────────────────────────
function QuickAction({ icon, label, colorClass, onClick }: {
  icon: React.ReactNode; label: string; colorClass: string; onClick?: () => void
}) {
  const colorMap: Record<string, string> = {
    'text-forged-red': 'bg-forged-red/10 text-forged-red',
    'text-forged-blue': 'bg-forged-blue/10 text-forged-blue',
    'text-forged-green': 'bg-forged-green/10 text-forged-green',
    'text-forged-gold': 'bg-forged-gold/10 text-forged-gold',
    'text-forged-purple': 'bg-forged-purple/10 text-forged-purple',
  }
  const ringColors = colorMap[colorClass] || colorMap['text-forged-gold']

  return (
    <button onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-xl
        bg-forged-surface border border-forged-border
        hover:border-forged-purple/30 hover:-translate-y-0.5
        active:scale-95 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ringColors}`}>
        <Icon path={icon} size={18} strokeWidth={2} />
      </div>
      <span className="text-[11px] font-medium text-forged-text2">{label}</span>
    </button>
  )
}

// ──────────────────────────────────
// BOTTOM TAB NAV
// ──────────────────────────────────
type TabId = 'home' | 'workout' | 'food' | 'track' | 'profile'

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: Icons.grid },
  { id: 'workout', label: 'Workout', icon: Icons.dumbbell },
  { id: 'food', label: 'Food', icon: Icons.utensils },
  { id: 'track', label: 'Track', icon: Icons.barChart },
  { id: 'profile', label: 'Profile', icon: Icons.user },
]

function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50
      bg-forged-bg/90 backdrop-blur-xl border-t border-forged-border
      flex justify-around items-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: '6px' }}>
      {TAB_CONFIG.map(tab => {
        const isActive = active === tab.id
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all duration-200">
            <div className={`px-3.5 py-1 rounded-xl transition-all duration-300
              ${isActive ? 'bg-forged-purple/20' : 'bg-transparent'}`}>
              <Icon path={tab.icon} size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                className={`transition-colors duration-200
                  ${isActive ? 'text-forged-purple' : 'text-forged-text3'}`}
              />
            </div>
            <span className={`text-[10px] transition-all duration-200
              ${isActive ? 'font-semibold text-forged-purple' : 'font-normal text-forged-text3'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ══════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════
interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<TabId>('home')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [todayFood, setTodayFood] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [dashData, userData, fastData, foodData] = await Promise.allSettled([
        api.workout.dashboard(),
        api.auth.me(),
        api.fasting.getActive(),
        api.food.getLogs(today),
      ])

      if (dashData.status === 'fulfilled') setStats(dashData.value)
      if (userData.status === 'fulfilled') setUser(userData.value)
      if (fastData.status === 'fulfilled' && fastData.value) setActiveFast(fastData.value)
      if (foodData.status === 'fulfilled') setTodayFood(foodData.value)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Compute daily nutrition from food logs
  const dailyCals = todayFood.reduce((sum, log) => sum + (log.food?.calories ?? 0) * log.servings, 0)
  const dailyProtein = todayFood.reduce((sum, log) => sum + (log.food?.protein ?? 0) * log.servings, 0)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-forged-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forged-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-forged-text3">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forged-bg pb-24">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-1 flex justify-between items-start">
        <div>
          <p className="text-xs text-forged-text3">{dateStr}</p>
          <h1 className="text-2xl font-bold text-forged-text mt-1">
            {getGreeting()}, {user?.displayName || user?.username || 'Athlete'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
              flex items-center justify-center text-forged-text3
              hover:text-forged-text hover:border-forged-purple/30 transition-all">
            <Icon path={theme === 'dark' ? Icons.sun : Icons.moon} size={16} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text3
            hover:text-forged-text hover:border-forged-purple/30 transition-all">
            <Icon path={Icons.bell} size={16} />
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-4 pt-3">
        {tab === 'home' && (
          <HomeTab
            stats={stats} user={user} activeFast={activeFast}
            dailyCals={dailyCals} dailyProtein={dailyProtein}
            onRefresh={loadData} onTabChange={setTab}
          />
        )}
        {tab === 'workout' && <WorkoutTab />}
        {tab === 'food' && <FoodTab />}
        {tab === 'track' && <TrackTab onRefresh={loadData} />}
        {tab === 'profile' && <ProfileTab user={user} onLogout={onLogout} />}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

// ══════════════════════════════════
// HOME TAB (redesigned)
// ══════════════════════════════════
function HomeTab({ stats, user, activeFast, dailyCals, dailyProtein, onRefresh, onTabChange }: {
  stats: DashboardStats | null; user: User | null
  activeFast: FastingLog | null
  dailyCals: number; dailyProtein: number
  onRefresh: () => void; onTabChange: (t: TabId) => void
}) {
  const calGoal = 2400
  const proteinGoal = 180
  const animCals = useAnimatedNumber(dailyCals, 900)
  const animProtein = useAnimatedNumber(dailyProtein, 900)
  const animWeight = useAnimatedNumber(stats?.currentWeight ?? 0, 1000)
  const animStreak = useAnimatedNumber(stats?.currentStreak ?? 0, 600)

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── Daily Summary ── */}
      <Card delay={60}>
        <SectionHeader title="Daily Summary" />
        <div className="grid grid-cols-2 gap-4">
          {/* Calories */}
          <div className="flex items-center gap-3">
            <ProgressRing value={dailyCals} max={calGoal} size={68} stroke={5} colorClass="text-forged-gold">
              <span className="text-xs font-bold text-forged-text">{animCals}</span>
            </ProgressRing>
            <div>
              <p className="text-[11px] text-forged-text3 font-medium">Calories</p>
              <p className="text-lg font-bold text-forged-text">{animCals}</p>
              <p className="text-[10px] text-forged-text3">/ {calGoal} cal</p>
            </div>
          </div>
          {/* Protein */}
          <div className="flex items-center gap-3">
            <ProgressRing value={dailyProtein} max={proteinGoal} size={68} stroke={5} colorClass="text-forged-blue">
              <span className="text-xs font-bold text-forged-text">{animProtein}g</span>
            </ProgressRing>
            <div>
              <p className="text-[11px] text-forged-text3 font-medium">Protein</p>
              <p className="text-lg font-bold text-forged-text">{animProtein}g</p>
              <p className="text-[10px] text-forged-text3">/ {proteinGoal}g</p>
            </div>
          </div>
          {/* Weight */}
          <div className="flex items-center gap-3">
            <ProgressRing value={1} max={1} size={68} stroke={5} colorClass="text-forged-red">
              <Icon path={Icons.scale} size={16} className="text-forged-red" />
            </ProgressRing>
            <div>
              <p className="text-[11px] text-forged-text3 font-medium">Weight</p>
              <p className="text-lg font-bold text-forged-text">{animWeight}</p>
              <p className="text-[10px] text-forged-text3">
                {stats && stats.weightLost > 0 ? `-${stats.weightLost} lbs` : 'lbs'}
              </p>
            </div>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-3">
            <ProgressRing value={1} max={1} size={68} stroke={5} colorClass="text-forged-green">
              <Icon path={Icons.flame} size={16} className="text-forged-green" />
            </ProgressRing>
            <div>
              <p className="text-[11px] text-forged-text3 font-medium">Streak</p>
              <p className="text-lg font-bold text-forged-text">{animStreak}</p>
              <p className="text-[10px] text-forged-text3">days</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Fasting ── */}
      <Card delay={160}>
        <SectionHeader title="Intermittent Fasting"
          action={activeFast ? 'History' : 'Start Fast'}
          onAction={() => onTabChange('food')} />
        {activeFast ? (
          <FastingTimer fast={activeFast} />
        ) : (
          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-14 rounded-full bg-forged-green/10 border border-forged-green/20
              flex items-center justify-center">
              <Icon path={Icons.clock} size={24} className="text-forged-green" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-forged-text2">No active fast</p>
              <p className="text-xs text-forged-text3 mt-0.5">Start one to track your fasting window</p>
            </div>
            <button onClick={async () => {
              try {
                await api.fasting.start({ targetHours: 16 })
                window.location.reload()
              } catch (err) { console.error(err) }
            }}
              className="px-4 py-2 rounded-lg text-sm font-semibold
                bg-forged-green/10 text-forged-green border border-forged-green/20
                hover:bg-forged-green hover:text-white transition-all duration-200">
              16:8
            </button>
          </div>
        )}
      </Card>

      {/* ── Weight Trend ── */}
      <Card delay={260}>
        <SectionHeader title="Weight Trend" action="Log Weight" onAction={() => onTabChange('track')} />
        {stats && stats.recentWeights?.length >= 2 && (
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-2xl font-bold text-forged-text">
                {stats.recentWeights[stats.recentWeights.length - 1]?.weight ?? stats.currentWeight}
              </span>
              <span className="text-xs text-forged-text3 ml-1">lbs</span>
            </div>
            {stats.weightLost > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forged-green/10">
                <Icon path={Icons.trendDown} size={12} className="text-forged-green" />
                <span className="text-xs font-semibold text-forged-green">
                  -{stats.weightLost} lbs
                </span>
              </div>
            )}
          </div>
        )}
        <WeightChart data={stats?.recentWeights ?? []} />
      </Card>

      {/* ── Quick Actions ── */}
      <Card delay={360}>
        <SectionHeader title="Quick Actions" />
        <div className="flex gap-2.5">
          <QuickAction icon={Icons.utensils} label="Log Food"
            colorClass="text-forged-gold" onClick={() => onTabChange('food')} />
          <QuickAction icon={Icons.barChart} label="Log Weight"
            colorClass="text-forged-purple" onClick={() => onTabChange('track')} />
          <QuickAction icon={Icons.play} label="Workout"
            colorClass="text-forged-green" onClick={() => onTabChange('workout')} />
          <QuickAction icon={Icons.droplet} label="Water"
            colorClass="text-forged-blue" />
        </div>
      </Card>

      {/* ── Recent Workouts ── */}
      <Card delay={460}>
        <SectionHeader title="Recent Workouts" action="View All" onAction={() => onTabChange('workout')} />
        <RecentWorkouts />
      </Card>
    </div>
  )
}

function RecentWorkouts() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    api.workout.getLogs(5).then(setLogs).catch(console.error)
  }, [])

  if (logs.length === 0) {
    return (
      <div className="py-4 text-center">
        <Icon path={Icons.dumbbell} size={28} className="text-forged-text3 mx-auto mb-2" />
        <p className="text-sm text-forged-text3">No workouts logged yet</p>
      </div>
    )
  }

  const dayColors = ['text-forged-purple', 'text-forged-blue', 'text-forged-gold']
  const dayBgs = ['bg-forged-purple/10', 'bg-forged-blue/10', 'bg-forged-gold/10']

  return (
    <div className="flex flex-col gap-2">
      {logs.slice(0, 3).map((log, i) => (
        <div key={log.id}
          className="flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 hover:bg-forged-surface2
            transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center
              ${dayBgs[i % 3]}`}>
              <Icon path={Icons.dumbbell} size={16}
                className={dayColors[i % 3]} />
            </div>
            <div>
              <p className="text-sm font-semibold text-forged-text">
                {log.dayName || log.planType || 'Workout'}
              </p>
              <p className="text-[11px] text-forged-text3">
                {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {log.durationMinutes ? ` \u00B7 ${log.durationMinutes}min` : ''}
              </p>
            </div>
          </div>
          <Icon path={Icons.chevron} size={16} className="text-forged-text3" />
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════
// WORKOUT TAB (scaffold)
// ══════════════════════════════════
function WorkoutTab() {
  return (
    <Card delay={60}>
      <div className="flex flex-col items-center py-8 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-forged-purple/10 flex items-center justify-center">
          <Icon path={Icons.dumbbell} size={28} className="text-forged-purple" />
        </div>
        <h2 className="text-lg font-bold text-forged-text">Workout Builder</h2>
        <p className="text-sm text-forged-text3 text-center max-w-[260px]">
          PPL plans, exercise logging, and workout history coming next
        </p>
      </div>
    </Card>
  )
}

// ══════════════════════════════════
// FOOD TAB (scaffold)
// ══════════════════════════════════
function FoodTab() {
  return (
    <Card delay={60}>
      <div className="flex flex-col items-center py-8 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-forged-gold/10 flex items-center justify-center">
          <Icon path={Icons.utensils} size={28} className="text-forged-gold" />
        </div>
        <h2 className="text-lg font-bold text-forged-text">Nutrition</h2>
        <p className="text-sm text-forged-text3 text-center max-w-[260px]">
          Food diary, meal logging, and fasting controls coming next
        </p>
      </div>
    </Card>
  )
}

// ══════════════════════════════════
// TRACK TAB
// ══════════════════════════════════
function TrackTab({ onRefresh }: { onRefresh: () => void }) {
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<WeightEntry[]>([])

  useEffect(() => { loadWeights() }, [])

  const loadWeights = async () => {
    try {
      const data = await api.weight.getAll(30)
      setEntries(data)
    } catch (err) { console.error(err) }
  }

  const handleLog = async () => {
    const w = parseFloat(weight)
    if (!w || w < 50 || w > 500) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.weight.add({ weight: w, date: today, notes: notes || undefined })
      setWeight('')
      setNotes('')
      await loadWeights()
      onRefresh()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Card delay={60}>
        <SectionHeader title="Log Weight" />
        <div className="flex flex-col gap-3">
          <input type="number" step="0.1" placeholder="e.g. 181.5" value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3
              focus:border-forged-purple/50 transition-colors" />
          <input type="text" placeholder="Notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3
              focus:border-forged-purple/50 transition-colors" />
          <button onClick={handleLog} disabled={saving}
            className="w-full py-3 bg-forged-purple text-white font-semibold rounded-xl text-sm
              hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Log Weight'}
          </button>
        </div>
      </Card>

      <Card delay={160}>
        <SectionHeader title="History" />
        {entries.length === 0 ? (
          <p className="text-sm text-forged-text3 py-2">No entries yet</p>
        ) : (
          <div className="flex flex-col">
            {entries.map((entry) => (
              <div key={entry.id}
                className="flex justify-between items-center py-3 border-b border-forged-border last:border-0">
                <span className="text-sm text-forged-text2">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-forged-text">{entry.weight} lbs</span>
                  {entry.notes && (
                    <span className="text-[10px] text-forged-text3 bg-forged-surface2 px-2 py-0.5 rounded-full">
                      {entry.notes}
                    </span>
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
// PROFILE TAB
// ══════════════════════════════════
function ProfileTab({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex flex-col gap-3.5">
      {/* User Info */}
      <Card delay={60}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-forged-purple/10 flex items-center justify-center">
            <span className="text-xl font-bold text-forged-purple">
              {(user?.displayName || user?.username || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-forged-text">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-forged-text3">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ProfileRow label="Starting Weight" value={user?.startingWeight ? `${user.startingWeight} lbs` : 'Not set'} />
          <ProfileRow label="Goal Weight" value={user?.goalWeight ? `${user.goalWeight} lbs` : 'Not set'} />
        </div>
      </Card>

      {/* Settings */}
      <Card delay={160}>
        <SectionHeader title="Settings" />
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 transition-all">
          <div className="flex items-center gap-3">
            <Icon path={theme === 'dark' ? Icons.moon : Icons.sun} size={18} className="text-forged-text2" />
            <span className="text-sm text-forged-text">Theme</span>
          </div>
          <span className="text-xs text-forged-text3 capitalize">{theme}</span>
        </button>
      </Card>

      <button onClick={onLogout}
        className="w-full py-3 bg-forged-surface border border-forged-border rounded-xl
          text-forged-text3 text-sm font-semibold
          hover:border-forged-red/30 hover:text-forged-red transition-all">
        Sign Out
      </button>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-forged-border last:border-0">
      <span className="text-xs text-forged-text3 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-forged-text font-medium">{value}</span>
    </div>
  )
}