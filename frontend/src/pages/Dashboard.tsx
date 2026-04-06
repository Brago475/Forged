import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../hooks/api'
import { useTheme } from '../hooks/useTheme'
import type { DashboardStats, User, WeightEntry, FastingLog, FoodLog } from '../types'
import logo from '../public/logo.png'

// ── Page imports ──
import FoodLogPage from './FoodLog'
import WorkoutPage from './WorkoutPage'
import ProgressPage from './ProgressPage'
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import WeeklySummaryPage from './WeeklySummary'
import ProgressPhotosPage from './ProgressPhotos'
import StreaksPage from './Streaks'
import PrivacyPage from './Privacy'
import RecipesPage from './Recipes'
import FeedbackPage from './Feedback'
import FastingPage from './Fasting'

// ══════════════════════════════════════════
// CONSTANTS — nutrition goals
// TODO: connect to Profile/backend so users
// can set their own targets
// ══════════════════════════════════════════
const GOALS = {
  calories: 2400,
  protein: 180,
  carbs: 250,
  fat: 65,
  fiber: 30,
} as const

/** FORGE UI primary for SVG strokes (CSS class fallback) */
const PRIMARY = '#6D28D9'

// ══════════════════════════════════════════
// ICONS — Lucide-style SVG path fragments
// ══════════════════════════════════════════
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
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
}

/** SVG icon wrapper */
function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin="round" className={className}>{d}</svg>
  )
}

// ══════════════════════════════════════════
// HOOKS
// ══════════════════════════════════════════

/** Reactive CSS media query */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const h = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  }, [query])
  return matches
}

/** Animate number 0 → target with easeOutCubic */
function useAnimNum(target: number, dur = 800) {
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])
  return val
}

/** Close handler when clicking outside ref */
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

// ══════════════════════════════════════════
// SKELETON — mirrors Dashboard layout
// ══════════════════════════════════════════

function Sk({ className = '' }: { className?: string }) {
  return <div className={`bg-forged-surface2 rounded-xl animate-pulse ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Sk className="w-12 h-12 !rounded-full" />
        <div className="flex-1 flex flex-col gap-2"><Sk className="h-5 w-48" /><Sk className="h-3 w-32" /></div>
      </div>
      <Sk className="h-64 !rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><Sk key={i} className="h-28 !rounded-2xl" />)}</div>
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><Sk key={i} className="h-20 !rounded-2xl" />)}</div>
      <Sk className="h-40 !rounded-2xl" /><Sk className="h-28 !rounded-2xl" /><Sk className="h-28 !rounded-2xl" /><Sk className="h-44 !rounded-2xl" />
    </div>
  )
}

// ══════════════════════════════════════════
// SHARED UI
// ══════════════════════════════════════════

/** Animated card with stagger entrance */
function Card({ children, className = '', delay = 0, hero = false }: {
  children: React.ReactNode; className?: string; delay?: number; hero?: boolean
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface rounded-2xl p-5
      transition-all duration-500 ease-out
      ${hero ? 'shadow-lg shadow-forged-purple/5' : ''}
      ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

/** FORGE UI section label: 10px uppercase */
function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-3">{children}</h3>
}

// ══════════════════════════════════════════
// 3-DOT SETTINGS DROPDOWN
// ══════════════════════════════════════════

function SettingsDropdown({ onLogout, onProfile, onSettings, onNavigate, dropUp = false }: {
  onLogout: () => void; onProfile?: () => void; onSettings?: () => void
  onNavigate?: (tab: string) => void; dropUp?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  useClickOutside(ref, () => setOpen(false))
  const go = (tab: string) => { onNavigate?.(tab); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
          flex items-center justify-center text-forged-text2
          hover:text-forged-text hover:border-forged-purple/30 hover:bg-forged-surface2
          active:scale-[0.97] transition-all">
        <Icon d={I.dots} size={16} />
      </button>
      {open && (
        <div className={`absolute right-0 w-48 bg-forged-surface border border-forged-border
          rounded-xl shadow-xl overflow-hidden z-[60] max-h-[70vh] overflow-y-auto
          ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          style={{ animation: 'fadeSlide 0.15s ease-out' }}>
          {onProfile && <DI icon={I.profile} label="Profile" bold onClick={() => { onProfile(); setOpen(false) }} />}
          <DI icon={theme==='dark'?I.sun:I.moon} label={theme==='dark'?'Light Mode':'Dark Mode'} border onClick={() => { toggleTheme(); setOpen(false) }} />
          <DI icon={I.settings} label="Settings" border onClick={() => { onSettings?.(); setOpen(false) }} />
          <DI icon={I.scale} label="Weekly Summary" border onClick={() => go('weekly')} />
          <DI icon={I.heart} label="Progress Photos" border onClick={() => go('photos')} />
          <DI icon={I.flame} label="Streaks" border onClick={() => go('streaks')} />
          <DI icon={I.target} label="Privacy" border onClick={() => go('privacy')} />
          <DI icon={I.food} label="Recipes" border onClick={() => go('recipes')} />
          <DI icon={I.edit} label="Feedback" border onClick={() => go('feedback')} />
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-red
              hover:bg-forged-red/5 transition-colors text-left border-t border-forged-border">
            <Icon d={I.logout} size={16} /><span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Dropdown menu item */
function DI({ icon, label, onClick, border, bold }: {
  icon: React.ReactNode; label: string; onClick: () => void; border?: boolean; bold?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-forged-surface2 transition-colors text-left
        ${border ? 'border-t border-forged-border' : ''} ${bold ? 'text-forged-text font-semibold' : 'text-forged-text2'}`}>
      <Icon d={icon} size={16} /><span>{label}</span>
    </button>
  )
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════

type TabId = 'food' | 'workouts' | 'dashboard' | 'progress' | 'profile'
  | 'settings' | 'weekly' | 'photos' | 'streaks' | 'privacy'
  | 'recipes' | 'feedback' | 'fasting'

const NAV: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'food', label: 'Food', icon: I.food },
  { id: 'workouts', label: 'Workouts', icon: I.workout },
  { id: 'dashboard', label: 'Home', icon: I.dashboard },
  { id: 'progress', label: 'Progress', icon: I.progress },
  { id: 'profile', label: 'Profile', icon: I.profile },
]

// ══════════════════════════════════════════
// SIDEBAR — desktop (md+)
// ══════════════════════════════════════════

function Sidebar({ active, onChange, collapsed, onToggle, onLogout }: {
  active: TabId; onChange: (t: TabId) => void; collapsed: boolean; onToggle: () => void; onLogout: () => void
}) {
  const { theme, toggleTheme } = useTheme()
  return (
    <aside className={`fixed left-0 top-0 h-full bg-forged-surface border-r border-forged-border
      flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-forged-border ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className={`w-10 h-10 rounded-xl border-2 border-forged-red flex items-center justify-center flex-shrink-0 overflow-hidden ${theme === 'dark' ? 'bg-white' : 'bg-forged-surface'}`}>
          <img src={logo} alt="FORGED" className="w-7 h-7 object-contain" />
        </div>
        {!collapsed && <div><span className="text-base font-black text-forged-text tracking-wide block">FORGED</span><span className="text-[9px] text-forged-text2 font-medium -mt-0.5 block">Fitness Tracker</span></div>}
      </div>
      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5">
        {!collapsed && <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-widest px-3 mb-2">Menu</p>}
        {NAV.map(item => {
          const a = active === item.id
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200 relative
                ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'}
                ${a ? 'bg-forged-purple/15 text-forged-purple shadow-sm' : 'text-forged-text2 hover:text-forged-text hover:bg-forged-surface2'}`}>
              {a && !collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-forged-purple rounded-r-full" />}
              <Icon d={item.icon} size={20} sw={a ? 2.2 : 1.6} className="flex-shrink-0" />
              {!collapsed && <span className={`text-sm ${a ? 'font-black' : 'font-semibold'}`}>{item.label}</span>}
            </button>
          )
        })}
      </nav>
      {/* Bottom */}
      <div className="px-3 py-3 border-t border-forged-border flex flex-col gap-1.5">
        {!collapsed && <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-widest px-3 mb-1">Settings</p>}
        <button onClick={toggleTheme} className={`flex items-center gap-3 rounded-xl text-forged-text2 hover:text-forged-text hover:bg-forged-surface2 transition-all ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={theme === 'dark' ? I.sun : I.moon} size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={onLogout} className={`flex items-center gap-3 rounded-xl text-forged-text2 hover:text-forged-red hover:bg-forged-red/5 transition-all ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}>
          <Icon d={I.logout} size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Sign Out</span>}
        </button>
      </div>
      <button onClick={onToggle} className="flex items-center justify-center h-10 border-t border-forged-border text-forged-text2 hover:text-forged-text hover:bg-forged-surface2 transition-all">
        <Icon d={collapsed ? I.chevronsRight : I.chevronsLeft} size={16} />
      </button>
    </aside>
  )
}

// ══════════════════════════════════════════
// BOTTOM NAV — mobile (<md)
// ══════════════════════════════════════════

function BottomNav({ active, onChange, onLogout, onProfile }: {
  active: TabId; onChange: (t: TabId) => void; onLogout: () => void; onProfile: () => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forged-surface/95 backdrop-blur-xl border-t border-forged-border flex items-end"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 6px)', paddingTop: '4px' }}>
      <div className="flex-1 flex justify-around items-end">
        {NAV.map(tab => {
          const a = active === tab.id, c = tab.id === 'dashboard'
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center min-w-[48px] transition-all duration-200 ${c ? '-mt-5 pb-0' : 'py-1 hover:opacity-80 active:scale-[0.97]'}`}>
              {c ? (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-[0.97]
                  ${a ? 'bg-forged-purple shadow-lg shadow-forged-purple/40' : 'bg-forged-surface2 border border-forged-border shadow-md hover:border-forged-purple/30'}`}>
                  <Icon d={tab.icon} size={24} sw={2} className={a ? 'text-white' : 'text-forged-text2'} />
                </div>
              ) : (
                <>
                  <div className={`px-3 py-1 rounded-xl transition-all duration-200 ${a ? 'bg-forged-purple/15' : 'hover:bg-forged-surface2'}`}>
                    <Icon d={tab.icon} size={20} sw={a ? 2.2 : 1.5} className={a ? 'text-forged-purple' : 'text-forged-text2'} />
                  </div>
                  <span className={`text-[9px] mt-0.5 ${a ? 'font-bold text-forged-purple' : 'text-forged-text2'}`}>{tab.label}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
      <div className="pr-2 pb-2">
        <SettingsDropdown onLogout={onLogout} onProfile={onProfile} onSettings={() => onChange('settings')} onNavigate={(t) => onChange(t as TabId)} dropUp />
      </div>
    </nav>
  )
}

// ══════════════════════════════════════════
// MAIN DASHBOARD SHELL
// ══════════════════════════════════════════

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

  /** Fetch all dashboard data in parallel */
  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [d, u, f, fd] = await Promise.allSettled([
        api.workout.dashboard(), api.auth.me(), api.fasting.getActive(), api.food.getLogs(today),
      ])
      if (d.status === 'fulfilled') setStats(d.value)
      if (u.status === 'fulfilled') setUser(u.value)
      if (f.status === 'fulfilled' && f.value?.startTime && !isNaN(new Date(f.value.startTime).getTime())) setActiveFast(f.value)
      if (fd.status === 'fulfilled') setTodayFood(fd.value)
    } catch (e) { console.error('Dashboard load error:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /** Aggregate today's macros */
  const macros = {
    cal: todayFood.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0),
    protein: todayFood.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0),
    carbs: todayFood.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0),
    fat: todayFood.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0),
    fiber: todayFood.reduce((s, l) => s + (l.food?.fiber ?? 0) * l.servings, 0),
  }

  const sw = isDesktop ? (sidebarCollapsed ? 68 : 240) : 0

  return (
    <div className="min-h-screen bg-forged-bg">
      {isDesktop && <Sidebar active={tab} onChange={setTab} collapsed={sidebarCollapsed} onToggle={() => setSC(!sidebarCollapsed)} onLogout={onLogout} />}
      <main className="transition-all duration-300 pb-28 md:pb-6" style={{ marginLeft: sw }}>
        {loading ? <DashboardSkeleton /> : (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            {/* Core pages */}
            {tab === 'dashboard' && <HomeTab stats={stats} user={user} activeFast={activeFast} macros={macros} todayFood={todayFood} onRefresh={loadData} onTabChange={setTab} onLogout={onLogout} />}
            {tab === 'food' && <FoodLogPage />}
            {tab === 'workouts' && <WorkoutPage />}
            {tab === 'progress' && <ProgressPage />}
            {tab === 'profile' && <ProfilePage user={user} onLogout={onLogout} />}
            {/* Secondary pages */}
            {tab === 'settings' && <SettingsPage onBack={() => setTab('dashboard')} />}
            {tab === 'weekly' && <WeeklySummaryPage onBack={() => setTab('dashboard')} />}
            {tab === 'photos' && <ProgressPhotosPage onBack={() => setTab('dashboard')} />}
            {tab === 'streaks' && <StreaksPage onBack={() => setTab('dashboard')} />}
            {tab === 'privacy' && <PrivacyPage onBack={() => setTab('dashboard')} />}
            {tab === 'recipes' && <RecipesPage onBack={() => setTab('dashboard')} />}
            {tab === 'feedback' && <FeedbackPage onBack={() => setTab('dashboard')} />}
            {tab === 'fasting' && <FastingPage onBack={() => setTab('dashboard')} />}
          </div>
        )}
      </main>
      {!isDesktop && <BottomNav active={tab} onChange={setTab} onLogout={onLogout} onProfile={() => setTab('profile')} />}
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(4px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  )
}

// ══════════════════════════════════════════
// FASTING MINI — compact timer for HomeTab
// ══════════════════════════════════════════

function FastingMini({ fast }: { fast: FastingLog }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const startMs = new Date(fast.startTime).getTime()
  if (isNaN(startMs)) return <div><p className="text-sm font-bold text-forged-text">Fasting</p><p className="text-xs text-forged-text2">Timer unavailable</p></div>

  const elapsed = Math.max((now - startMs) / 3600000, 0)
  const remaining = Math.max(fast.targetHours - elapsed, 0)

  return (
    <div>
      <p className="text-sm font-black text-forged-green tabular-nums">{Math.floor(remaining)}h {Math.floor((remaining % 1) * 60)}m remaining</p>
      <p className="text-xs text-forged-text2">{Math.floor(elapsed)}h {Math.floor((elapsed % 1) * 60)}m elapsed / {fast.targetHours}h</p>
    </div>
  )
}

// ══════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════

type Macros = { cal: number; protein: number; carbs: number; fat: number; fiber: number }

function HomeTab({ stats, user, activeFast, macros, todayFood, onRefresh, onTabChange, onLogout }: {
  stats: DashboardStats | null; user: User | null; activeFast: FastingLog | null
  macros: Macros; todayFood: FoodLog[]
  onRefresh: () => void; onTabChange: (t: TabId) => void; onLogout: () => void
}) {
  const calLeft = Math.max(GOALS.calories - macros.cal, 0)
  const calPct = Math.min(macros.cal / GOALS.calories, 1)
  const onTrack = macros.cal <= GOALS.calories
  const animCal = useAnimNum(macros.cal, 1000)

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })()

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-forged-text">{greeting}, {user?.displayName || user?.username || 'Athlete'}</p>
          <p className="text-xs text-forged-text2 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="hidden md:block">
          <SettingsDropdown onLogout={onLogout} onProfile={() => onTabChange('profile')} onSettings={() => onTabChange('settings')} onNavigate={(t) => onTabChange(t as TabId)} />
        </div>
      </div>

      {/* ══ HERO: Calorie ring ══ */}
      <Card delay={60} hero className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forged-purple/[0.07] via-transparent to-forged-purple/[0.03] pointer-events-none" />
        <div className="relative flex items-center gap-6">
          <CalorieRing pct={calPct} />
          <div className="flex-1 min-w-0">
            <p className="text-6xl font-black text-forged-text tabular-nums leading-none tracking-tighter">{animCal}</p>
            <p className="text-sm text-forged-text2 mt-1.5 font-medium">of <span className="font-black text-forged-text">{GOALS.calories}</span> cal</p>
            <p className="text-sm text-forged-text2">{calLeft} remaining</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black mt-3
              ${onTrack ? 'bg-forged-green/15 text-forged-green border border-forged-green/25' : 'bg-forged-red/15 text-forged-red border border-forged-red/25'}`}>
              <Icon d={onTrack ? I.check : I.x} size={13} sw={3} />{onTrack ? 'On Track' : 'Over Goal'}
            </div>
          </div>
        </div>
        <button onClick={() => onTabChange('food')}
          className="w-full mt-5 py-3.5 rounded-xl font-black text-sm bg-forged-purple text-white shadow-lg shadow-forged-purple/30 hover:shadow-forged-purple/50 hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2">
          <Icon d={I.plus} size={16} sw={2.5} />Add Meal
        </button>
        {/* Fasting shortcut */}
        <div className="border-t border-forged-border mt-5 pt-4">
          <button onClick={() => onTabChange('fasting')} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeFast ? 'bg-forged-green/15' : 'bg-forged-surface2'}`}>
                <Icon d={I.clock} size={16} className={activeFast ? 'text-forged-green' : 'text-forged-text2'} />
              </div>
              {activeFast ? <FastingMini fast={activeFast} /> : (
                <div className="text-left"><p className="text-sm font-bold text-forged-text">Fasting</p><p className="text-xs text-forged-text2">Tap to start or view history</p></div>
              )}
            </div>
            <Icon d={I.chevron} size={16} className="text-forged-text2" />
          </button>
        </div>
      </Card>

      {/* ══ Macros ══ */}
      <Card delay={160}>
        <SectionLabel>Macros</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <MacroCard label="Protein" current={macros.protein} goal={GOALS.protein} />
          <MacroCard label="Carbs" current={macros.carbs} goal={GOALS.carbs} />
          <MacroCard label="Fat" current={macros.fat} goal={GOALS.fat} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <MacroSmall label="Fiber" value={`${Math.round(macros.fiber)}g`} pct={macros.fiber / GOALS.fiber} />
          <MacroSmall label="Water" value="--" pct={0} />
        </div>
      </Card>

      {/* ══ Quick actions ══ */}
      <Card delay={240}>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          <QA icon={I.plus} label="Add Meal" onClick={() => onTabChange('food')} />
          <QA icon={I.workout} label="Log Workout" onClick={() => onTabChange('workouts')} />
          <QA icon={I.droplet} label="Add Water" />
          <QA icon={I.clock} label="Start Fast" onClick={() => onTabChange('fasting')} />
        </div>
      </Card>

      {/* ══ Today's goals ══ */}
      <Card delay={320}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Today's goals</SectionLabel>
          <button onClick={() => onTabChange('progress')} className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors -mt-2 flex items-center gap-1"><Icon d={I.edit} size={12} sw={2} />Edit</button>
        </div>
        <GoalCheck done={todayFood.length > 0} label={todayFood.length > 0 ? `${todayFood.length} meal${todayFood.length > 1 ? 's' : ''} logged` : 'Log at least 1 meal'} />
        <GoalCheck done={false} label="Complete a workout" />
        <GoalCheck done={activeFast !== null} label={activeFast ? 'Fasting active' : 'Start a fast'} />
        <GoalCheck done={macros.protein >= GOALS.protein} label={macros.protein >= GOALS.protein ? `Hit ${GOALS.protein}g protein` : `Hit ${GOALS.protein}g protein (${macros.protein}g so far)`} />
        <GoalCheck done={macros.cal > 0 && macros.cal <= GOALS.calories} label={`Stay under ${GOALS.calories} cal`} />
      </Card>

      {/* ══ Workout snapshot ══ */}
      <Card delay={400}>
        <SectionLabel>Workout</SectionLabel>
        <WorkoutSnap onGo={() => onTabChange('workouts')} />
      </Card>

      {/* ══ Food snapshot ══ */}
      <Card delay={480}>
        <SectionLabel>Last meal</SectionLabel>
        <FoodSnap todayFood={todayFood} proteinLeft={Math.max(GOALS.protein - macros.protein, 0)} onGo={() => onTabChange('food')} />
      </Card>

      {/* ══ Progress preview ══ */}
      <Card delay={560}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Progress</SectionLabel>
          <button onClick={() => onTabChange('progress')} className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors -mt-2">See all</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Stat label="Weight" value={stats ? `${stats.currentWeight}` : '--'} unit="lbs" />
          <Stat label="Lost" value={stats?.weightLost ? `-${stats.weightLost}` : '--'} unit="lbs" accent />
          <Stat label="Streak" value={stats ? `${stats.currentStreak}` : '--'} unit="days" />
        </div>
        {stats?.recentWeights && stats.recentWeights.length >= 2 && (
          <p className="text-[10px] text-forged-text2 mb-1">
            {new Date(stats.recentWeights[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' — '}
            {new Date(stats.recentWeights[stats.recentWeights.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <WeightChart data={stats?.recentWeights ?? []} />
      </Card>

      {/* ══ Insight ══ */}
      <Card delay={640}>
        <Insight macros={macros} streak={stats?.currentStreak ?? 0} />
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════
// REUSABLE COMPONENTS
// ══════════════════════════════════════════

/** Calorie ring — FORGE UI primary with glow */
function CalorieRing({ pct }: { pct: number }) {
  const sz = 110, sw = 9, r = (sz - sw) / 2, c = 2 * Math.PI * r
  const [off, setOff] = useState(c)
  useEffect(() => { const t = setTimeout(() => setOff(c * (1 - pct)), 200); return () => clearTimeout(t) }, [pct, c])
  return (
    <div className="relative flex-shrink-0" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} opacity={0.4} />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={PRIMARY} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 12px ${PRIMARY}80)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-forged-purple tabular-nums">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  )
}

/** Macro card with 3px progress bar */
function MacroCard({ label, current, goal }: { label: string; current: number; goal: number }) {
  const pct = Math.min((current / goal) * 100, 100), over = current > goal, anim = useAnimNum(current, 800)
  return (
    <div className="bg-forged-bg rounded-xl p-3 hover:bg-forged-surface2 transition-all duration-200">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-forged-text tabular-nums leading-none">{anim}<span className="text-[11px] font-medium text-forged-text2 ml-0.5">g</span></p>
      <p className="text-[10px] text-forged-text2 mt-0.5 mb-2">/ {goal}g</p>
      <div className="h-[3px] rounded-full bg-forged-surface2 overflow-hidden">
        <div className="h-full rounded-full bg-forged-purple transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
      </div>
      {over && <p className="text-[10px] text-forged-red font-black mt-1">+{current - goal}g over</p>}
    </div>
  )
}

/** Compact macro (fiber/water) */
function MacroSmall({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="bg-forged-bg rounded-xl p-3 hover:bg-forged-surface2 transition-all duration-200">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-forged-text tabular-nums">{value}</p>
      </div>
      <div className="h-[3px] rounded-full bg-forged-surface2 overflow-hidden">
        <div className="h-full rounded-full bg-forged-purple/60 transition-all duration-700" style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
    </div>
  )
}

/** Quick action button */
function QA({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-forged-surface2 active:scale-[0.97] transition-all duration-150 group">
      <div className="w-12 h-12 rounded-2xl bg-forged-purple/10 flex items-center justify-center group-hover:bg-forged-purple/20 group-hover:shadow-md group-hover:shadow-forged-purple/10 transition-all duration-200">
        <Icon d={icon} size={20} sw={2} className="text-forged-purple" />
      </div>
      <span className="text-[10px] text-forged-text font-semibold text-center leading-tight">{label}</span>
    </button>
  )
}

/** Goal checklist item */
function GoalCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-forged-text2/20 last:border-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-forged-green shadow-sm shadow-forged-green/20' : 'border-2 border-forged-text2/40'}`}>
        {done && <Icon d={I.check} size={11} sw={3} className="text-white" />}
      </div>
      <span className={`text-sm font-medium text-forged-text ${done ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </div>
  )
}

/** Stat chip */
function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="bg-forged-bg rounded-xl p-3 text-center transition-all">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black tabular-nums mt-1 ${accent ? 'text-forged-green' : 'text-forged-text'}`}>{value}</p>
      <p className="text-[10px] text-forged-text2">{unit}</p>
    </div>
  )
}

/** Workout snapshot */
function WorkoutSnap({ onGo }: { onGo: () => void }) {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => { api.workout.getLogs(1).then(setLogs).catch(console.error) }, [])
  const last = logs[0]
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center"><Icon d={I.workout} size={18} className="text-forged-purple" /></div>
        <div>
          <p className="text-sm font-bold text-forged-text">{last?.dayName || last?.planType || 'No workout yet'}</p>
          <p className="text-xs text-forged-text2">{last ? new Date(last.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start your first'}</p>
        </div>
      </div>
      <button onClick={onGo} className="px-4 py-2 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple border border-forged-purple/20 hover:bg-forged-purple hover:text-white active:scale-[0.97] transition-all">{last ? 'Go' : 'Start'}</button>
    </div>
  )
}

/** Food snapshot */
function FoodSnap({ todayFood, proteinLeft, onGo }: { todayFood: FoodLog[]; proteinLeft: number; onGo: () => void }) {
  const last = todayFood[todayFood.length - 1]
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center"><Icon d={I.food} size={18} className="text-forged-purple" /></div>
          <div>
            <p className="text-sm font-bold text-forged-text">{last?.food?.name || 'No meals yet'}</p>
            <p className="text-xs text-forged-text2">{last ? `${last.mealType} — ${last.food?.calories ?? 0} cal` : 'Log your first meal'}</p>
          </div>
        </div>
        <button onClick={onGo} className="px-4 py-2 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple border border-forged-purple/20 hover:bg-forged-purple hover:text-white active:scale-[0.97] transition-all">Add</button>
      </div>
      {proteinLeft > 0 && todayFood.length > 0 && <p className="text-xs text-forged-purple font-bold mt-2">{proteinLeft}g protein remaining</p>}
    </div>
  )
}

/** Sparkline weight chart */
function WeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t) }, [])
  if (data.length < 2) return <p className="text-xs text-forged-text2 text-center py-2">Need 2+ entries for chart</p>
  const recent = data.slice(-10)
  const w = 500, h = 60, px = 10, py = 6
  const vals = recent.map(d => d.weight), mn = Math.min(...vals) - 0.5, mx = Math.max(...vals) + 0.5
  const pts = recent.map((d, i) => ({ x: px + (i / (recent.length - 1)) * (w - 2 * px), y: py + ((mx - d.weight) / (mx - mn)) * (h - 2 * py) }))
  const pathD = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i-1], cpx = (prev.x + p.x) / 2; return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}` }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs><linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PRIMARY} stopOpacity="0.15" /><stop offset="100%" stopColor={PRIMARY} stopOpacity="0" /></linearGradient></defs>
      <path d={pathD + ` L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`} fill="url(#mcg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.5s ease' }} />
      <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.5s ease 0.2s' }} />
    </svg>
  )
}

/** Contextual insight */
function Insight({ macros, streak }: { macros: Macros; streak: number }) {
  const gap = GOALS.protein - macros.protein
  let msg: string, icon = I.zap
  if (streak >= 3) { msg = `${streak}-day streak! Keep pushing.`; icon = I.flame }
  else if (gap > 0 && gap < 40) { msg = `You're ${gap}g short on protein today.`; icon = I.target }
  else if (macros.cal > 0 && macros.cal <= GOALS.calories) { msg = 'Within your calorie goal. Solid work.'; icon = I.check }
  else { msg = 'Log meals and workouts to unlock insights.'; icon = I.zap }
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center flex-shrink-0"><Icon d={icon} size={18} className="text-forged-purple" /></div>
      <p className="text-sm text-forged-text2 font-medium flex-1">{msg}</p>
    </div>
  )
}