import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { api } from '../hooks/api'
import { useTheme } from '../hooks/useTheme'
import type { DashboardStats, User, WeightEntry, FastingLog, FoodLog } from '../types'

// ──────────────────────────────────
// ICONS
// ──────────────────────────────────
const I = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  food: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
  workout: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/><path d="M7 7L5 5"/><path d="M17 17l2 2"/></>,
  progress: <><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></>,
  profile: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  chevron: <><path d="M9 18l6-6-6-6"/></>,
  chevronsLeft: <><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></>,
  chevronsRight: <><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></>,
  trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  droplet: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></>,
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

// ──────────────────────────────────
// HOOKS
// ──────────────────────────────────
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

// ──────────────────────────────────
// SHARED UI
// ──────────────────────────────────
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-600 ease-out
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex justify-between items-center mb-3.5">
      <h3 className="text-sm font-semibold text-forged-text tracking-wide">{title}</h3>
      {action && <button onClick={onAction}
        className="text-xs font-medium text-forged-purple hover:text-forged-blue transition-colors">{action}</button>}
    </div>
  )
}

function SegmentedControl({ options, active, onChange }: {
  options: string[]; active: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-forged-bg rounded-xl p-1 gap-0.5 mb-4">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
            ${active === o
              ? 'bg-forged-surface text-forged-text shadow-sm'
              : 'text-forged-text3 hover:text-forged-text2'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────
// MACRO PROGRESS BAR
// ──────────────────────────────────
function MacroBar({ label, current, goal, color, unit = 'g' }: {
  label: string; current: number; goal: number; color: string; unit?: string
}) {
  const pct = Math.min((current / goal) * 100, 100)
  const animVal = useAnimatedNumber(current, 900)
  const colorMap: Record<string, { bg: string; fill: string; text: string }> = {
    red: { bg: 'bg-forged-red/10', fill: 'bg-forged-red', text: 'text-forged-red' },
    blue: { bg: 'bg-forged-blue/10', fill: 'bg-forged-blue', text: 'text-forged-blue' },
    green: { bg: 'bg-forged-green/10', fill: 'bg-forged-green', text: 'text-forged-green' },
    gold: { bg: 'bg-forged-gold/10', fill: 'bg-forged-gold', text: 'text-forged-gold' },
    purple: { bg: 'bg-forged-purple/10', fill: 'bg-forged-purple', text: 'text-forged-purple' },
  }
  const c = colorMap[color] || colorMap.gold

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-forged-text2 font-medium">{label}</span>
        <span className="text-xs text-forged-text3">
          <span className={`font-semibold ${c.text}`}>{animVal}</span>
          <span> / {goal}{unit}</span>
        </span>
      </div>
      <div className={`h-2 rounded-full ${c.bg} overflow-hidden`}>
        <div className={`h-full rounded-full ${c.fill} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────
// WEIGHT CHART
// ──────────────────────────────────
function WeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 250); return () => clearTimeout(t) }, [])

  if (data.length < 2) return <p className="text-sm text-forged-text3 py-6 text-center">Log at least 2 weights to see your trend</p>

  const w = 600, h = 160, px = 44, py = 16
  const vals = data.map(d => d.weight)
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1

  const pts = data.map((d, i) => ({
    x: px + (i / (data.length - 1)) * (w - 2 * px),
    y: py + ((max - d.weight) / (max - min)) * (h - 2 * py),
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
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="wl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b59b6"/><stop offset="100%" stopColor="#3498db"/>
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = py + f * (h - 2 * py)
        return <line key={i} x1={px} y1={y} x2={w - px} y2={y} stroke="var(--border)" strokeWidth="0.5"/>
      })}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map(d => {
        const idx = data.indexOf(d)
        return <text key={idx} x={pts[idx].x} y={h - 2} fill="var(--text3)" fontSize="9"
          textAnchor="middle" fontFamily="-apple-system,system-ui,sans-serif">{fmtDate(d.date)}</text>
      })}
      <path d={pathD + ` L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`}
        fill="url(#wg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.8s ease 0.3s' }}/>
      <path d={pathD} fill="none" stroke="url(#wl)" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: drawn ? 'none' : '1200', strokeDashoffset: drawn ? 0 : 1200,
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}/>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)" stroke="#9b59b6" strokeWidth="1.5"
          opacity={drawn ? 1 : 0} style={{ transition: `opacity 0.3s ease ${0.3 + i * 0.06}s` }}/>
      ))}
      {drawn && pts.length > 0 && (<g>
        <rect x={pts[pts.length-1].x - 24} y={pts[pts.length-1].y - 24} width="48" height="18" rx="5" fill="#9b59b6"/>
        <text x={pts[pts.length-1].x} y={pts[pts.length-1].y - 12} fill="#fff" fontSize="10"
          fontWeight="600" textAnchor="middle" fontFamily="-apple-system,system-ui,sans-serif">
          {data[data.length-1].weight}</text>
      </g>)}
    </svg>
  )
}

// ──────────────────────────────────
// FASTING TIMER
// ──────────────────────────────────
function FastingTimer({ fast }: { fast: FastingLog }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const elapsed = (now - new Date(fast.startTime).getTime()) / 3600000
  const pct = Math.min(elapsed / fast.targetHours, 1)
  const rem = Math.max(fast.targetHours - elapsed, 0)
  const hrs = Math.floor(rem), mins = Math.floor((rem % 1) * 60), secs = Math.floor(((rem % 1) * 60 % 1) * 60)

  const size = 120, s = 6, r = (size - s) / 2, circ = 2 * Math.PI * r

  const [ending, setEnding] = useState(false)
  const handleEnd = async () => {
    setEnding(true)
    try { await api.fasting.end(fast.id, {}); window.location.reload() }
    catch { setEnding(false) }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={s}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2ecc71" strokeWidth={s}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease',
              filter: 'drop-shadow(0 0 6px rgba(46,204,113,0.25))' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-forged-text tabular-nums">
            {hrs}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
          <span className="text-[10px] text-forged-text3 mt-0.5">remaining</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[10px] text-forged-text3 uppercase tracking-widest">Elapsed</p>
          <p className="text-sm font-semibold text-forged-text">
            {Math.floor(elapsed)}h {Math.floor((elapsed % 1) * 60)}m
            <span className="text-forged-text3 font-normal"> / {fast.targetHours}h</span></p>
        </div>
        <div>
          <p className="text-[10px] text-forged-text3 uppercase tracking-widest">Started</p>
          <p className="text-xs text-forged-text2">
            {new Date(fast.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
        <button onClick={handleEnd} disabled={ending}
          className="mt-1 px-4 py-1.5 rounded-lg text-xs font-semibold w-fit
            bg-forged-red/10 text-forged-red border border-forged-red/20
            hover:bg-forged-red hover:text-white transition-all duration-200 disabled:opacity-50">
          {ending ? 'Ending...' : 'End Fast'}</button>
      </div>
    </div>
  )
}

// ──────────────────────────────────
// NAV CONFIG
// ──────────────────────────────────
type TabId = 'dashboard' | 'food' | 'workouts' | 'progress' | 'profile'

const NAV: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: I.dashboard },
  { id: 'food', label: 'Food', icon: I.food },
  { id: 'workouts', label: 'Workouts', icon: I.workout },
  { id: 'progress', label: 'Progress', icon: I.progress },
  { id: 'profile', label: 'Profile', icon: I.profile },
]

// ──────────────────────────────────
// SIDEBAR (desktop)
// ──────────────────────────────────
function Sidebar({ active, onChange, collapsed, onToggle, onLogout }: {
  active: TabId; onChange: (t: TabId) => void
  collapsed: boolean; onToggle: () => void; onLogout: () => void
}) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className={`fixed left-0 top-0 h-full bg-forged-surface border-r border-forged-border
      flex flex-col z-50 transition-all duration-300 ease-out
      ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-forged-border
        ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-forged-purple/20 flex items-center justify-center flex-shrink-0">
          <Icon d={I.flame} size={18} className="text-forged-purple" sw={2.2}/>
        </div>
        {!collapsed && <span className="text-base font-bold text-forged-text tracking-wide">FORGED</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200
                ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-forged-purple/10 text-forged-purple'
                  : 'text-forged-text3 hover:text-forged-text hover:bg-forged-bg'}`}>
              <Icon d={item.icon} size={20} sw={isActive ? 2.2 : 1.6}
                className="flex-shrink-0"/>
              {!collapsed && <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-forged-border flex flex-col gap-1">
        <button onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-xl text-forged-text3
            hover:text-forged-text hover:bg-forged-bg transition-all duration-200
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={theme === 'dark' ? I.sun : I.moon} size={18} className="flex-shrink-0"/>
          {!collapsed && <span className="text-sm font-medium">Theme</span>}
        </button>
        <button onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl text-forged-text3
            hover:text-forged-red hover:bg-forged-red/5 transition-all duration-200
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={I.logout} size={18} className="flex-shrink-0"/>
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={onToggle}
        className={`flex items-center justify-center h-10 border-t border-forged-border
          text-forged-text3 hover:text-forged-text transition-colors`}>
        <Icon d={collapsed ? I.chevronsRight : I.chevronsLeft} size={16}/>
      </button>
    </aside>
  )
}

// ──────────────────────────────────
// BOTTOM NAV (mobile)
// ──────────────────────────────────
function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
      bg-forged-bg/90 backdrop-blur-xl border-t border-forged-border
      flex justify-around items-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: '6px' }}>
      {NAV.map(tab => {
        const isActive = active === tab.id
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-1 min-w-[52px] py-1">
            <div className={`px-3 py-1 rounded-xl transition-all duration-300
              ${isActive ? 'bg-forged-purple/15' : ''}`}>
              <Icon d={tab.icon} size={21} sw={isActive ? 2.2 : 1.6}
                className={`transition-colors ${isActive ? 'text-forged-purple' : 'text-forged-text3'}`}/>
            </div>
            <span className={`text-[10px] ${isActive ? 'font-semibold text-forged-purple' : 'text-forged-text3'}`}>
              {tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ══════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════
interface Props { onLogout: () => void }

export default function Dashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [todayFood, setTodayFood] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [d, u, f, fd] = await Promise.allSettled([
        api.workout.dashboard(), api.auth.me(),
        api.fasting.getActive(), api.food.getLogs(today),
      ])
      if (d.status === 'fulfilled') setStats(d.value)
      if (u.status === 'fulfilled') setUser(u.value)
      if (f.status === 'fulfilled' && f.value) setActiveFast(f.value)
      if (fd.status === 'fulfilled') setTodayFood(fd.value)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const dailyCals = todayFood.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
  const dailyProtein = todayFood.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
  const dailyCarbs = todayFood.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0)
  const dailyFat = todayFood.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-forged-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forged-purple border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm text-forged-text3">Loading...</p>
        </div>
      </div>
    )
  }

  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 68 : 220) : 0

  return (
    <div className="min-h-screen bg-forged-bg">
      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar active={tab} onChange={setTab}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={onLogout}/>
      )}

      {/* Main content */}
      <main className="transition-all duration-300 pb-24 md:pb-6"
        style={{ marginLeft: sidebarWidth }}>
        <div className="max-w-2xl mx-auto px-4 pt-5">
          {tab === 'dashboard' && (
            <HomeTab stats={stats} user={user} activeFast={activeFast}
              dailyCals={dailyCals} dailyProtein={dailyProtein}
              dailyCarbs={dailyCarbs} dailyFat={dailyFat}
              onRefresh={loadData} onTabChange={setTab}/>
          )}
          {tab === 'food' && <FoodTab />}
          {tab === 'workouts' && <WorkoutsTab />}
          {tab === 'progress' && <ProgressTab stats={stats} />}
          {tab === 'profile' && <ProfileTab user={user} onLogout={onLogout} />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      {!isDesktop && <BottomNav active={tab} onChange={setTab}/>}
    </div>
  )
}

// ══════════════════════════════════
// HOME TAB
// ══════════════════════════════════
function HomeTab({ stats, user, activeFast, dailyCals, dailyProtein, dailyCarbs, dailyFat, onRefresh, onTabChange }: {
  stats: DashboardStats | null; user: User | null; activeFast: FastingLog | null
  dailyCals: number; dailyProtein: number; dailyCarbs: number; dailyFat: number
  onRefresh: () => void; onTabChange: (t: TabId) => void
}) {
  const [weightRange, setWeightRange] = useState('30d')
  const calGoal = 2400, proteinGoal = 180, carbGoal = 250, fatGoal = 65

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-xs text-forged-text3">{dateStr}</p>
        <h1 className="text-2xl font-bold text-forged-text mt-1">
          {getGreeting()}, {user?.displayName || user?.username || 'Athlete'}</h1>
      </div>

      {/* Calories/Macros Hero */}
      <Card delay={60}>
        <div className="flex justify-between items-start mb-4">
          <SectionHeader title="Today's Nutrition" />
          <button onClick={() => onTabChange('food')}
            className="w-8 h-8 rounded-xl bg-forged-purple/10 flex items-center justify-center
              text-forged-purple hover:bg-forged-purple hover:text-white
              transition-all duration-200 active:scale-95 -mt-1">
            <Icon d={I.plus} size={16} sw={2.5}/>
          </button>
        </div>

        {/* Calorie ring + number */}
        <div className="flex items-center gap-5 mb-5">
          <CalorieRing consumed={dailyCals} goal={calGoal} />
          <div>
            <p className="text-3xl font-bold text-forged-text tabular-nums">
              {useAnimatedNumber(dailyCals, 900)}</p>
            <p className="text-xs text-forged-text3 mt-0.5">of {calGoal} cal</p>
            <p className="text-xs text-forged-text3">
              {Math.max(calGoal - dailyCals, 0)} remaining</p>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex flex-col gap-3">
          <MacroBar label="Protein" current={dailyProtein} goal={proteinGoal} color="blue"/>
          <MacroBar label="Carbs" current={dailyCarbs} goal={carbGoal} color="gold"/>
          <MacroBar label="Fat" current={dailyFat} goal={fatGoal} color="red"/>
        </div>
      </Card>

      {/* Fasting */}
      <Card delay={160}>
        <SectionHeader title="Intermittent Fasting"
          action={activeFast ? undefined : 'Start 16:8'}
          onAction={async () => {
            try { await api.fasting.start({ targetHours: 16 }); window.location.reload() }
            catch (e) { console.error(e) }
          }}/>
        {activeFast ? (
          <FastingTimer fast={activeFast}/>
        ) : (
          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-forged-green/10 border border-forged-green/20
              flex items-center justify-center">
              <Icon d={I.clock} size={22} className="text-forged-green"/>
            </div>
            <div>
              <p className="text-sm text-forged-text2">No active fast</p>
              <p className="text-xs text-forged-text3 mt-0.5">Tap "Start 16:8" to begin tracking</p>
            </div>
          </div>
        )}
      </Card>

      {/* Weight Trend */}
      <Card delay={260}>
        <SectionHeader title="Weight Trend" action="Log" onAction={() => onTabChange('progress')}/>
        <SegmentedControl options={['7d', '30d', '90d']} active={weightRange} onChange={setWeightRange}/>
        {stats && stats.recentWeights?.length >= 2 && (
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-2xl font-bold text-forged-text">
                {stats.recentWeights[stats.recentWeights.length - 1]?.weight ?? stats.currentWeight}</span>
              <span className="text-xs text-forged-text3 ml-1">lbs</span>
            </div>
            {stats.weightLost > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-forged-green/10">
                <Icon d={I.trendDown} size={12} className="text-forged-green"/>
                <span className="text-xs font-semibold text-forged-green">-{stats.weightLost} lbs</span>
              </div>
            )}
          </div>
        )}
        <WeightChart data={filterWeightsByRange(stats?.recentWeights ?? [], weightRange)}/>
      </Card>

      {/* Recent Workouts */}
      <Card delay={360}>
        <SectionHeader title="Recent Workouts" action="View All" onAction={() => onTabChange('workouts')}/>
        <RecentWorkoutsList />
      </Card>
    </div>
  )
}

function filterWeightsByRange(weights: WeightEntry[], range: string): WeightEntry[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return weights.filter(w => new Date(w.date) >= cutoff)
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 88, s = 7, r = (size - s) / 2, circ = 2 * Math.PI * r
  const pct = Math.min(consumed / goal, 1)
  const [offset, setOffset] = useState(circ)
  useEffect(() => { const t = setTimeout(() => setOffset(circ * (1 - pct)), 150); return () => clearTimeout(t) }, [pct, circ])

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={s}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#9b59b6" strokeWidth={s}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 6px rgba(155,89,182,0.3))' }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon d={I.flame} size={22} className="text-forged-purple"/>
      </div>
    </div>
  )
}

function RecentWorkoutsList() {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => { api.workout.getLogs(5).then(setLogs).catch(console.error) }, [])

  if (logs.length === 0) return (
    <div className="py-6 text-center">
      <Icon d={I.workout} size={28} className="text-forged-text3 mx-auto mb-2"/>
      <p className="text-sm text-forged-text3">No workouts logged yet</p>
    </div>
  )

  const colors = ['text-forged-purple', 'text-forged-blue', 'text-forged-gold']
  const bgs = ['bg-forged-purple/10', 'bg-forged-blue/10', 'bg-forged-gold/10']

  return (
    <div className="flex flex-col gap-2">
      {logs.slice(0, 4).map((log, i) => (
        <div key={log.id}
          className="flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/20 hover:bg-forged-surface2
            transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgs[i % 3]}`}>
              <Icon d={I.workout} size={15} className={colors[i % 3]}/>
            </div>
            <div>
              <p className="text-sm font-semibold text-forged-text">{log.dayName || log.planType || 'Workout'}</p>
              <p className="text-[11px] text-forged-text3">
                {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {log.durationMinutes ? ` \u00B7 ${log.durationMinutes}min` : ''}</p>
            </div>
          </div>
          <Icon d={I.chevron} size={16} className="text-forged-text3"/>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════
// FOOD TAB (scaffold)
// ══════════════════════════════════
function FoodTab() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-forged-text">Food Log</h1>
      <Card delay={60}>
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-forged-gold/10 flex items-center justify-center">
            <Icon d={I.food} size={28} className="text-forged-gold"/>
          </div>
          <p className="text-base font-semibold text-forged-text">Log your meals</p>
          <p className="text-sm text-forged-text3 text-center max-w-[280px]">
            Search foods, log meals by type, and track your daily macros</p>
        </div>
      </Card>
    </div>
  )
}

// ══════════════════════════════════
// WORKOUTS TAB (scaffold)
// ══════════════════════════════════
function WorkoutsTab() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-forged-text">Workouts</h1>
      <Card delay={60}>
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-forged-purple/10 flex items-center justify-center">
            <Icon d={I.workout} size={28} className="text-forged-purple"/>
          </div>
          <p className="text-base font-semibold text-forged-text">Workout Builder</p>
          <p className="text-sm text-forged-text3 text-center max-w-[280px]">
            PPL plans, exercise logging, and workout history coming next</p>
        </div>
      </Card>
    </div>
  )
}

// ══════════════════════════════════
// PROGRESS TAB
// ══════════════════════════════════
function ProgressTab({ stats }: { stats: DashboardStats | null }) {
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<WeightEntry[]>([])

  useEffect(() => { loadWeights() }, [])
  const loadWeights = async () => {
    try { setEntries(await api.weight.getAll(30)) } catch (e) { console.error(e) }
  }

  const handleLog = async () => {
    const w = parseFloat(weight)
    if (!w || w < 50 || w > 500) return
    setSaving(true)
    try {
      await api.weight.add({ weight: w, date: new Date().toISOString().split('T')[0], notes: notes || undefined })
      setWeight(''); setNotes(''); await loadWeights()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-forged-text">Progress</h1>

      {/* Quick log */}
      <Card delay={60}>
        <SectionHeader title="Log Weight"/>
        <div className="flex gap-2">
          <input type="number" step="0.1" placeholder="e.g. 181.5" value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3
              focus:border-forged-purple/50 transition-colors"/>
          <input type="text" placeholder="Notes" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3
              focus:border-forged-purple/50 transition-colors"/>
          <button onClick={handleLog} disabled={saving}
            className="px-5 py-2.5 bg-forged-purple text-white font-semibold rounded-xl text-sm
              hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
            {saving ? '...' : 'Log'}</button>
        </div>
      </Card>

      {/* Weight chart */}
      <Card delay={160}>
        <SectionHeader title="Weight Trend"/>
        <WeightChart data={entries}/>
      </Card>

      {/* History list */}
      <Card delay={260}>
        <SectionHeader title="History"/>
        {entries.length === 0 ? (
          <p className="text-sm text-forged-text3 py-2">No entries yet</p>
        ) : (
          <div className="flex flex-col">
            {entries.map(entry => (
              <div key={entry.id}
                className="flex justify-between items-center py-3 border-b border-forged-border last:border-0">
                <span className="text-sm text-forged-text2">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-forged-text">{entry.weight} lbs</span>
                  {entry.notes && <span className="text-[10px] text-forged-text3 bg-forged-surface2
                    px-2 py-0.5 rounded-full">{entry.notes}</span>}
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
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-forged-text">Profile</h1>

      <Card delay={60}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-forged-purple/10 flex items-center justify-center">
            <span className="text-xl font-bold text-forged-purple">
              {(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-base font-semibold text-forged-text">{user?.displayName || user?.username}</p>
            <p className="text-xs text-forged-text3">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <ProfileRow label="Starting Weight" value={user?.startingWeight ? `${user.startingWeight} lbs` : 'Not set'}/>
          <ProfileRow label="Goal Weight" value={user?.goalWeight ? `${user.goalWeight} lbs` : 'Not set'}/>
        </div>
      </Card>

      {/* Only show theme/logout on mobile (sidebar handles these on desktop) */}
      {!isDesktop && (
        <>
          <Card delay={160}>
            <button onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl
                bg-forged-bg border border-forged-border hover:border-forged-purple/30 transition-all">
              <div className="flex items-center gap-3">
                <Icon d={theme === 'dark' ? I.moon : I.sun} size={18} className="text-forged-text2"/>
                <span className="text-sm text-forged-text">Theme</span>
              </div>
              <span className="text-xs text-forged-text3 capitalize">{theme}</span>
            </button>
          </Card>
          <button onClick={onLogout}
            className="w-full py-3 bg-forged-surface border border-forged-border rounded-xl
              text-forged-text3 text-sm font-semibold
              hover:border-forged-red/30 hover:text-forged-red transition-all">
            Sign Out</button>
        </>
      )}
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-forged-border last:border-0">
      <span className="text-xs text-forged-text3 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-forged-text font-medium">{value}</span>
    </div>
  )
}