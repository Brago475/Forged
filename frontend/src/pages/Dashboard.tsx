import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import { useTheme } from '../hooks/useTheme'
import type { DashboardStats, User, WeightEntry, FastingLog, FoodLog } from '../types'
import logo from '../public/logo.png'

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
  dots: <><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  coffee: <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
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
function useMediaQuery(q: string) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(q)
    setM(mql.matches)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  }, [q])
  return m
}

function useAnimNum(target: number, dur = 800) {
  const [v, setV] = useState(0)
  const r = useRef(0)
  useEffect(() => {
    const s = performance.now()
    const tick = (n: number) => {
      const t = Math.min((n - s) / dur, 1)
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) r.current = requestAnimationFrame(tick)
    }
    r.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(r.current)
  }, [target, dur])
  return v
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
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
      transition-all duration-500 ease-out
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-xs font-semibold text-forged-text3 uppercase tracking-widest mb-3">{children}</h3>
}

function SegmentedControl({ options, active, onChange }: {
  options: string[]; active: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-forged-bg rounded-xl p-1 gap-0.5 mb-4">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
            ${active === o ? 'bg-forged-surface text-forged-text shadow-sm' : 'text-forged-text3 hover:text-forged-text2'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────
// 3-DOT SETTINGS DROPDOWN
// ──────────────────────────────────
function SettingsDropdown({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  useClickOutside(ref, () => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
          flex items-center justify-center text-forged-text3
          hover:text-forged-text hover:border-forged-purple/30 transition-all">
        <Icon d={I.dots} size={16}/>
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-48 bg-forged-surface border border-forged-border
          rounded-xl shadow-lg overflow-hidden z-50 animate-in">
          <button onClick={() => { toggleTheme(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text2
              hover:bg-forged-bg transition-colors text-left">
            <Icon d={theme === 'dark' ? I.sun : I.moon} size={16}/>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text2
              hover:bg-forged-bg transition-colors text-left border-t border-forged-border">
            <Icon d={I.settings} size={16}/>
            <span>Settings</span>
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-red
              hover:bg-forged-red/5 transition-colors text-left border-t border-forged-border">
            <Icon d={I.logout} size={16}/>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────
// NAV CONFIG (Dashboard in center)
// ──────────────────────────────────
type TabId = 'food' | 'workouts' | 'dashboard' | 'progress' | 'profile'

const NAV: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'food', label: 'Food', icon: I.food },
  { id: 'workouts', label: 'Workouts', icon: I.workout },
  { id: 'dashboard', label: 'Dashboard', icon: I.dashboard },
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
      flex flex-col z-50 transition-all duration-300
      ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
      <div className={`flex items-center h-16 px-4 border-b border-forged-border ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <img src={logo} alt="FORGED" className="w-8 h-8 rounded-lg object-contain flex-shrink-0"/>
        {!collapsed && <span className="text-base font-bold text-forged-text tracking-wide">FORGED</span>}
      </div>
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {NAV.map(item => {
          const isA = active === item.id
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200
                ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                ${isA ? 'bg-forged-purple/10 text-forged-purple' : 'text-forged-text3 hover:text-forged-text hover:bg-forged-bg'}`}>
              <Icon d={item.icon} size={20} sw={isA ? 2.2 : 1.6} className="flex-shrink-0"/>
              {!collapsed && <span className={`text-sm ${isA ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <div className="px-2 py-3 border-t border-forged-border flex flex-col gap-1">
        <button onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-xl text-forged-text3
            hover:text-forged-text hover:bg-forged-bg transition-all
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={theme === 'dark' ? I.sun : I.moon} size={18} className="flex-shrink-0"/>
          {!collapsed && <span className="text-sm font-medium">Theme</span>}
        </button>
        <button onClick={onLogout}
          className={`flex items-center gap-3 rounded-xl text-forged-text3
            hover:text-forged-red hover:bg-forged-red/5 transition-all
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={I.logout} size={18} className="flex-shrink-0"/>
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
      <button onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-forged-border
          text-forged-text3 hover:text-forged-text transition-colors">
        <Icon d={collapsed ? I.chevronsRight : I.chevronsLeft} size={16}/>
      </button>
    </aside>
  )
}

// ──────────────────────────────────
// BOTTOM NAV (mobile, dashboard centered + highlighted)
// ──────────────────────────────────
function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
      bg-forged-bg/90 backdrop-blur-xl border-t border-forged-border
      flex justify-around items-end"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: '6px' }}>
      {NAV.map(tab => {
        const isA = active === tab.id
        const isCenter = tab.id === 'dashboard'
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-1 min-w-[52px]
              ${isCenter ? '-mt-4' : 'py-1'}`}>
            {isCenter ? (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                transition-all duration-300 shadow-lg
                ${isA ? 'bg-forged-purple shadow-forged-purple/30' : 'bg-forged-surface border border-forged-border'}`}>
                <Icon d={tab.icon} size={24} sw={2}
                  className={isA ? 'text-white' : 'text-forged-text3'}/>
              </div>
            ) : (
              <>
                <div className={`px-3 py-1 rounded-xl transition-all duration-300
                  ${isA ? 'bg-forged-purple/15' : ''}`}>
                  <Icon d={tab.icon} size={21} sw={isA ? 2.2 : 1.6}
                    className={`transition-colors ${isA ? 'text-forged-purple' : 'text-forged-text3'}`}/>
                </div>
                <span className={`text-[10px] ${isA ? 'font-semibold text-forged-purple' : 'text-forged-text3'}`}>
                  {tab.label}</span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ══════════════════════════════════
// MAIN DASHBOARD SHELL
// ══════════════════════════════════
interface Props { onLogout: () => void }

export default function Dashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [sidebarCollapsed, setSC] = useState(false)
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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const macros = {
    cal: todayFood.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0),
    protein: todayFood.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0),
    carbs: todayFood.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0),
    fat: todayFood.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0),
    fiber: todayFood.reduce((s, l) => s + (l.food?.fiber ?? 0) * l.servings, 0),
  }

  if (loading) return (
    <div className="min-h-screen bg-forged-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-forged-purple border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-forged-text3">Loading...</p>
      </div>
    </div>
  )

  const sw = isDesktop ? (sidebarCollapsed ? 68 : 220) : 0

  return (
    <div className="min-h-screen bg-forged-bg">
      {isDesktop && <Sidebar active={tab} onChange={setTab} collapsed={sidebarCollapsed}
        onToggle={() => setSC(!sidebarCollapsed)} onLogout={onLogout}/>}

      <main className="transition-all duration-300 pb-28 md:pb-6" style={{ marginLeft: sw }}>
        <div className="max-w-2xl mx-auto px-4 pt-4">
          {tab === 'dashboard' && <HomeTab stats={stats} user={user} activeFast={activeFast}
            macros={macros} todayFood={todayFood} onRefresh={loadData} onTabChange={setTab} onLogout={onLogout}/>}
          {tab === 'food' && <FoodTab />}
          {tab === 'workouts' && <WorkoutsTab />}
          {tab === 'progress' && <ProgressTab stats={stats} />}
          {tab === 'profile' && <ProfileTab user={user} onLogout={onLogout} />}
        </div>
      </main>

      {!isDesktop && <BottomNav active={tab} onChange={setTab}/>}

      <style>{`
        @keyframes animate-in { from { opacity:0; transform:translateY(-4px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .animate-in { animation: animate-in 0.15s ease-out; }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════
// HOME TAB
// ══════════════════════════════════
type Macros = { cal: number; protein: number; carbs: number; fat: number; fiber: number }

function HomeTab({ stats, user, activeFast, macros, todayFood, onRefresh, onTabChange, onLogout }: {
  stats: DashboardStats | null; user: User | null; activeFast: FastingLog | null
  macros: Macros; todayFood: FoodLog[]
  onRefresh: () => void; onTabChange: (t: TabId) => void; onLogout: () => void
}) {
  const calGoal = 2400, pGoal = 180, cGoal = 250, fGoal = 65
  const calLeft = Math.max(calGoal - macros.cal, 0)
  const calPct = Math.min(macros.cal / calGoal, 1)
  const onTrack = macros.cal <= calGoal

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div className="w-11 h-11 rounded-full bg-forged-purple/15 border-2 border-forged-purple/30
            flex items-center justify-center overflow-hidden">
            <span className="text-lg font-bold text-forged-purple">
              {(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-base font-bold text-forged-text">
              {getGreeting()}, {user?.displayName || user?.username || 'Athlete'}</p>
            <p className="text-xs text-forged-text3">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <SettingsDropdown onLogout={onLogout}/>
      </div>

      {/* ── HERO: CALORIES + FASTING ── */}
      <Card delay={60}>
        {/* Calorie section */}
        <div className="flex items-center gap-5 mb-4">
          <CalorieRing pct={calPct} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-bold text-forged-text tabular-nums">{useAnimNum(macros.cal, 900)}</span>
              <span className="text-xs text-forged-text3">/ {calGoal} cal</span>
            </div>
            <p className="text-sm text-forged-text2 mb-2">{calLeft} cal remaining</p>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
              ${onTrack ? 'bg-forged-green/10 text-forged-green' : 'bg-forged-red/10 text-forged-red'}`}>
              <Icon d={onTrack ? I.check : I.x} size={12} sw={2.5}/>
              {onTrack ? 'On Track' : 'Over Goal'}
            </div>
          </div>
          {/* + button to log food */}
          <button onClick={() => onTabChange('food')}
            className="w-11 h-11 rounded-xl bg-forged-purple flex items-center justify-center
              text-white shadow-lg shadow-forged-purple/20
              hover:opacity-90 active:scale-95 transition-all">
            <Icon d={I.plus} size={20} sw={2.5}/>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-forged-border my-4"/>

        {/* Fasting timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${activeFast ? 'bg-forged-green/10' : 'bg-forged-surface2'}`}>
              <Icon d={I.clock} size={18} className={activeFast ? 'text-forged-green' : 'text-forged-text3'}/>
            </div>
            {activeFast ? (
              <FastingMini fast={activeFast}/>
            ) : (
              <div>
                <p className="text-sm font-medium text-forged-text">Fasting</p>
                <p className="text-xs text-forged-text3">Not active</p>
              </div>
            )}
          </div>
          {activeFast ? (
            <button onClick={async () => {
              try { await api.fasting.end(activeFast.id, {}); window.location.reload() } catch {}
            }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-forged-red/10 text-forged-red border border-forged-red/20
                hover:bg-forged-red hover:text-white transition-all">
              End Fast</button>
          ) : (
            <button onClick={async () => {
              try { await api.fasting.start({ targetHours: 16 }); window.location.reload() } catch {}
            }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-forged-green/10 text-forged-green border border-forged-green/20
                hover:bg-forged-green hover:text-white transition-all">
              Start 16:8</button>
          )}
        </div>
      </Card>

      {/* ── MACROS ── */}
      <Card delay={140}>
        <SectionLabel>Macros</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <MacroCard label="Protein" current={macros.protein} goal={pGoal} color="blue" unit="g"/>
          <MacroCard label="Carbs" current={macros.carbs} goal={cGoal} color="gold" unit="g"/>
          <MacroCard label="Fat" current={macros.fat} goal={fGoal} color="red" unit="g"/>
        </div>
        {/* Optional water/fiber row */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <MiniStat label="Fiber" value={`${Math.round(macros.fiber)}g`} icon={I.heart} color="green"/>
          <MiniStat label="Water" value="-- glasses" icon={I.droplet} color="blue"/>
        </div>
      </Card>

      {/* ── QUICK ACTIONS ── */}
      <Card delay={220}>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={I.plus} label="Add Meal" color="gold" onClick={() => onTabChange('food')}/>
          <QuickAction icon={I.workout} label="Log Workout" color="purple" onClick={() => onTabChange('workouts')}/>
          <QuickAction icon={I.droplet} label="Add Water" color="blue"/>
          <QuickAction icon={I.clock} label="Start Fast" color="green" onClick={async () => {
            if (activeFast) return
            try { await api.fasting.start({ targetHours: 16 }); window.location.reload() } catch {}
          }}/>
        </div>
      </Card>

      {/* ── TODAY'S SUMMARY ── */}
      <Card delay={300}>
        <SectionLabel>Today's checklist</SectionLabel>
        <div className="flex flex-col gap-2">
          <CheckItem done={todayFood.length > 0} label={todayFood.length > 0
            ? `${todayFood.length} meal${todayFood.length > 1 ? 's' : ''} logged` : 'No meals logged'}/>
          <CheckItem done={false} label="Workout not completed"/>
          <CheckItem done={false} label="Water -- track coming soon"/>
          <CheckItem done={activeFast !== null} label={activeFast ? 'Fasting active' : 'No fast today'}/>
        </div>
      </Card>

      {/* ── WORKOUT SNAPSHOT ── */}
      <Card delay={380}>
        <SectionLabel>Workout</SectionLabel>
        <WorkoutSnapshot onGoToWorkouts={() => onTabChange('workouts')}/>
      </Card>

      {/* ── FOOD SNAPSHOT ── */}
      <Card delay={460}>
        <SectionLabel>Last meal</SectionLabel>
        <FoodSnapshot todayFood={todayFood} macros={macros} proteinGoal={pGoal} onGoToFood={() => onTabChange('food')}/>
      </Card>

      {/* ── PROGRESS PREVIEW ── */}
      <Card delay={540}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Progress</SectionLabel>
          <button onClick={() => onTabChange('progress')}
            className="text-xs text-forged-purple font-medium hover:text-forged-blue transition-colors -mt-2">
            See all</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MiniStat label="Weight" value={stats ? `${stats.currentWeight} lbs` : '--'} icon={I.scale} color="purple"/>
          <MiniStat label="Lost" value={stats ? `${stats.weightLost} lbs` : '--'} icon={I.trendDown} color="green"/>
          <MiniStat label="Streak" value={stats ? `${stats.currentStreak}d` : '--'} icon={I.flame} color="gold"/>
        </div>
        <MiniWeightChart data={stats?.recentWeights ?? []}/>
      </Card>

      {/* ── MOTIVATION ── */}
      <Card delay={620}>
        <InsightCard macros={macros} stats={stats} streak={stats?.currentStreak ?? 0} proteinGoal={pGoal}/>
      </Card>
    </div>
  )
}

// ── CALORIE RING ──
function CalorieRing({ pct }: { pct: number }) {
  const sz = 80, s = 7, r = (sz - s) / 2, c = 2 * Math.PI * r
  const [off, setOff] = useState(c)
  useEffect(() => { const t = setTimeout(() => setOff(c * (1 - pct)), 150); return () => clearTimeout(t) }, [pct, c])

  return (
    <div className="relative flex-shrink-0" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border)" strokeWidth={s}/>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#9b59b6" strokeWidth={s}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 6px rgba(155,89,182,0.3))' }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon d={I.flame} size={20} className="text-forged-purple"/>
      </div>
    </div>
  )
}

// ── FASTING MINI (inline) ──
function FastingMini({ fast }: { fast: FastingLog }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const elapsed = (now - new Date(fast.startTime).getTime()) / 3600000
  const rem = Math.max(fast.targetHours - elapsed, 0)
  const h = Math.floor(rem), m = Math.floor((rem % 1) * 60)
  return (
    <div>
      <p className="text-sm font-semibold text-forged-green tabular-nums">{h}h {m}m remaining</p>
      <p className="text-xs text-forged-text3">
        {Math.floor(elapsed)}h elapsed / {fast.targetHours}h window</p>
    </div>
  )
}

// ── MACRO CARD ──
function MacroCard({ label, current, goal, color, unit }: {
  label: string; current: number; goal: number; color: string; unit: string
}) {
  const pct = Math.min((current / goal) * 100, 100)
  const over = current > goal
  const anim = useAnimNum(current, 800)
  const cMap: Record<string, { bar: string; text: string; bg: string }> = {
    blue: { bar: 'bg-forged-blue', text: 'text-forged-blue', bg: 'bg-forged-blue/10' },
    gold: { bar: 'bg-forged-gold', text: 'text-forged-gold', bg: 'bg-forged-gold/10' },
    red: { bar: 'bg-forged-red', text: 'text-forged-red', bg: 'bg-forged-red/10' },
    green: { bar: 'bg-forged-green', text: 'text-forged-green', bg: 'bg-forged-green/10' },
    purple: { bar: 'bg-forged-purple', text: 'text-forged-purple', bg: 'bg-forged-purple/10' },
  }
  const c = cMap[color] || cMap.gold

  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
      <p className="text-[11px] text-forged-text3 font-medium mb-1">{label}</p>
      <p className="text-lg font-bold text-forged-text tabular-nums">{anim}<span className="text-xs font-normal text-forged-text3">{unit}</span></p>
      <p className="text-[10px] text-forged-text3 mb-2">/ {goal}{unit}</p>
      <div className={`h-1.5 rounded-full ${c.bg} overflow-hidden`}>
        <div className={`h-full rounded-full ${c.bar} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}/>
      </div>
      {over && <p className={`text-[10px] ${c.text} font-semibold mt-1`}>+{current - goal}{unit} over</p>}
    </div>
  )
}

// ── MINI STAT ──
function MiniStat({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string
}) {
  const cMap: Record<string, string> = {
    blue: 'bg-forged-blue/10 text-forged-blue',
    gold: 'bg-forged-gold/10 text-forged-gold',
    red: 'bg-forged-red/10 text-forged-red',
    green: 'bg-forged-green/10 text-forged-green',
    purple: 'bg-forged-purple/10 text-forged-purple',
  }
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cMap[color]}`}>
        <Icon d={icon} size={15}/>
      </div>
      <div>
        <p className="text-[10px] text-forged-text3">{label}</p>
        <p className="text-sm font-semibold text-forged-text tabular-nums">{value}</p>
      </div>
    </div>
  )
}

// ── QUICK ACTION ──
function QuickAction({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: string; onClick?: () => void
}) {
  const cMap: Record<string, string> = {
    blue: 'bg-forged-blue/10 text-forged-blue',
    gold: 'bg-forged-gold/10 text-forged-gold',
    red: 'bg-forged-red/10 text-forged-red',
    green: 'bg-forged-green/10 text-forged-green',
    purple: 'bg-forged-purple/10 text-forged-purple',
  }
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 py-3 rounded-xl
        hover:bg-forged-bg active:scale-95 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cMap[color]}`}>
        <Icon d={icon} size={20} sw={2}/>
      </div>
      <span className="text-[11px] text-forged-text2 font-medium text-center leading-tight">{label}</span>
    </button>
  )
}

// ── CHECK ITEM ──
function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
        ${done ? 'bg-forged-green/20' : 'bg-forged-bg border border-forged-border'}`}>
        {done && <Icon d={I.check} size={12} sw={2.5} className="text-forged-green"/>}
      </div>
      <span className={`text-sm ${done ? 'text-forged-text2' : 'text-forged-text3'}`}>{label}</span>
    </div>
  )
}

// ── WORKOUT SNAPSHOT ──
function WorkoutSnapshot({ onGoToWorkouts }: { onGoToWorkouts: () => void }) {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => { api.workout.getLogs(3).then(setLogs).catch(console.error) }, [])

  if (logs.length === 0) return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
          <Icon d={I.workout} size={18} className="text-forged-purple"/>
        </div>
        <div>
          <p className="text-sm text-forged-text2">No workouts yet</p>
          <p className="text-xs text-forged-text3">Start your first session</p>
        </div>
      </div>
      <button onClick={onGoToWorkouts}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-forged-purple/10 text-forged-purple border border-forged-purple/20
          hover:bg-forged-purple hover:text-white transition-all">
        Start</button>
    </div>
  )

  const last = logs[0]
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
          <Icon d={I.workout} size={18} className="text-forged-purple"/>
        </div>
        <div>
          <p className="text-sm font-semibold text-forged-text">{last.dayName || last.planType || 'Workout'}</p>
          <p className="text-xs text-forged-text3">
            {new Date(last.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {last.durationMinutes ? ` \u00B7 ${last.durationMinutes}min` : ''}</p>
        </div>
      </div>
      <button onClick={onGoToWorkouts}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-forged-purple/10 text-forged-purple border border-forged-purple/20
          hover:bg-forged-purple hover:text-white transition-all">
        Go</button>
    </div>
  )
}

// ── FOOD SNAPSHOT ──
function FoodSnapshot({ todayFood, macros, proteinGoal, onGoToFood }: {
  todayFood: FoodLog[]; macros: Macros; proteinGoal: number; onGoToFood: () => void
}) {
  const proteinLeft = Math.max(proteinGoal - macros.protein, 0)
  if (todayFood.length === 0) return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forged-gold/10 flex items-center justify-center">
          <Icon d={I.food} size={18} className="text-forged-gold"/>
        </div>
        <div>
          <p className="text-sm text-forged-text2">No meals logged</p>
          <p className="text-xs text-forged-text3">Tap to add your first meal</p>
        </div>
      </div>
      <button onClick={onGoToFood}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-forged-gold/10 text-forged-gold border border-forged-gold/20
          hover:bg-forged-gold hover:text-white transition-all">
        Add</button>
    </div>
  )

  const lastMeal = todayFood[todayFood.length - 1]
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forged-gold/10 flex items-center justify-center">
            <Icon d={I.food} size={18} className="text-forged-gold"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-forged-text">{lastMeal.food?.name || 'Meal'}</p>
            <p className="text-xs text-forged-text3">{lastMeal.mealType} - {lastMeal.food?.calories ?? 0} cal</p>
          </div>
        </div>
        <button onClick={onGoToFood}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-forged-gold/10 text-forged-gold border border-forged-gold/20
            hover:bg-forged-gold hover:text-white transition-all">
          Add</button>
      </div>
      {proteinLeft > 0 && (
        <p className="text-xs text-forged-blue font-medium mt-2">{proteinLeft}g protein remaining today</p>
      )}
    </div>
  )
}

// ── MINI WEIGHT CHART ──
function MiniWeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t) }, [])
  if (data.length < 2) return <p className="text-xs text-forged-text3 text-center py-2">Need 2+ entries</p>

  const recent = data.slice(-10)
  const w = 500, h = 80, px = 20, py = 8
  const vals = recent.map(d => d.weight)
  const mn = Math.min(...vals) - 0.5, mx = Math.max(...vals) + 0.5
  const pts = recent.map((d, i) => ({
    x: px + (i / (recent.length - 1)) * (w - 2 * px),
    y: py + ((mx - d.weight) / (mx - mn)) * (h - 2 * py),
  }))
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1], cpx = (prev.x + p.x) / 2
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={pathD + ` L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`}
        fill="url(#mg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.6s ease' }}/>
      <path d={pathD} fill="none" stroke="#9b59b6" strokeWidth="1.5" strokeLinecap="round"
        opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.6s ease 0.2s' }}/>
    </svg>
  )
}

// ── INSIGHT CARD ──
function InsightCard({ macros, stats, streak, proteinGoal }: {
  macros: Macros; stats: DashboardStats | null; streak: number; proteinGoal: number
}) {
  const proteinGap = proteinGoal - macros.protein
  let msg = '', icon = I.zap, color = 'text-forged-purple'

  if (streak >= 3) {
    msg = `${streak}-day streak! Keep it going.`
    icon = I.flame; color = 'text-forged-gold'
  } else if (proteinGap > 0 && proteinGap < 40) {
    msg = `You're ${proteinGap}g short on protein today.`
    icon = I.target; color = 'text-forged-blue'
  } else if (macros.cal > 0 && macros.cal <= 2400) {
    msg = 'You\'re within your calorie goal. Nice work.'
    icon = I.check; color = 'text-forged-green'
  } else {
    msg = 'Log your meals and workouts to unlock insights.'
    icon = I.zap; color = 'text-forged-purple'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${color.replace('text-', 'bg-')}/10`}>
        <Icon d={icon} size={18} className={color}/>
      </div>
      <p className="text-sm text-forged-text2 flex-1">{msg}</p>
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
            <Icon d={I.food} size={28} className="text-forged-gold"/></div>
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
            <Icon d={I.workout} size={28} className="text-forged-purple"/></div>
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
  const [range, setRange] = useState('30d')

  useEffect(() => { loadWeights() }, [])
  const loadWeights = async () => {
    try { setEntries(await api.weight.getAll(90)) } catch (e) { console.error(e) }
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

  const filteredEntries = (() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cut = new Date(); cut.setDate(cut.getDate() - days)
    return entries.filter(w => new Date(w.date) >= cut)
  })()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-forged-text">Progress</h1>

      <Card delay={60}>
        <SectionLabel>Log weight</SectionLabel>
        <div className="flex gap-2">
          <input type="number" step="0.1" placeholder="e.g. 181.5" value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3 focus:border-forged-purple/50 transition-colors"/>
          <input type="text" placeholder="Notes" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-forged-bg border border-forged-border rounded-xl
              text-forged-text text-sm placeholder:text-forged-text3 focus:border-forged-purple/50 transition-colors"/>
          <button onClick={handleLog} disabled={saving}
            className="px-5 py-2.5 bg-forged-purple text-white font-semibold rounded-xl text-sm
              hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
            {saving ? '...' : 'Log'}</button>
        </div>
      </Card>

      <Card delay={160}>
        <SectionLabel>Weight trend</SectionLabel>
        <SegmentedControl options={['7d', '30d', '90d']} active={range} onChange={setRange}/>
        <FullWeightChart data={filteredEntries}/>
      </Card>

      <Card delay={260}>
        <SectionLabel>History</SectionLabel>
        {entries.length === 0 ? <p className="text-sm text-forged-text3 py-2">No entries yet</p> : (
          <div className="flex flex-col">
            {entries.slice(0, 20).map(e => (
              <div key={e.id} className="flex justify-between items-center py-3 border-b border-forged-border last:border-0">
                <span className="text-sm text-forged-text2">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-forged-text">{e.weight} lbs</span>
                  {e.notes && <span className="text-[10px] text-forged-text3 bg-forged-surface2 px-2 py-0.5 rounded-full">{e.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function FullWeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { setDrawn(false); const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t) }, [data])
  if (data.length < 2) return <p className="text-sm text-forged-text3 text-center py-4">Need 2+ entries</p>

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
        <linearGradient id="fwg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b59b6" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#9b59b6" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="fwl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b59b6"/><stop offset="100%" stopColor="#3498db"/>
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = py + f * (h - 2 * py)
        return <line key={i} x1={px} y1={y} x2={w - px} y2={y} stroke="var(--border)" strokeWidth="0.5"/>
      })}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map(d => {
        const idx = data.indexOf(d)
        return <text key={idx} x={pts[idx].x} y={h - 2} fill="var(--text3)" fontSize="9" textAnchor="middle"
          fontFamily="-apple-system,system-ui,sans-serif">{fmtDate(d.date)}</text>
      })}
      <path d={pathD + ` L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`}
        fill="url(#fwg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.8s ease 0.2s' }}/>
      <path d={pathD} fill="none" stroke="url(#fwl)" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: drawn ? 'none' : '1200', strokeDashoffset: drawn ? 0 : 1200,
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}/>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--bg)" stroke="#9b59b6" strokeWidth="1.5"
          opacity={drawn ? 1 : 0} style={{ transition: `opacity 0.3s ease ${0.2 + i * 0.05}s` }}/>
      ))}
      {drawn && <g>
        <rect x={pts[pts.length-1].x - 24} y={pts[pts.length-1].y - 24} width="48" height="18" rx="5" fill="#9b59b6"/>
        <text x={pts[pts.length-1].x} y={pts[pts.length-1].y - 12} fill="#fff" fontSize="10"
          fontWeight="600" textAnchor="middle" fontFamily="-apple-system,system-ui,sans-serif">
          {data[data.length-1].weight}</text>
      </g>}
    </svg>
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
      {/* Profile header */}
      <Card delay={60}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-forged-purple/15 border-2 border-forged-purple/30
            flex items-center justify-center">
            <span className="text-2xl font-bold text-forged-purple">
              {(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-forged-text">{user?.displayName || user?.username}</p>
            <p className="text-sm text-forged-text3">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <ProfileRow label="Starting Weight" value={user?.startingWeight ? `${user.startingWeight} lbs` : 'Not set'}/>
          <ProfileRow label="Goal Weight" value={user?.goalWeight ? `${user.goalWeight} lbs` : 'Not set'}/>
        </div>
      </Card>

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
              text-forged-text3 text-sm font-semibold hover:border-forged-red/30 hover:text-forged-red transition-all">
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