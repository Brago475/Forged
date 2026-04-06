
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
// CONSTANTS
// TODO: connect to Profile/backend for user-set targets
// ══════════════════════════════════════════
const GOALS = { calories: 2400, protein: 180, carbs: 250, fat: 65, fiber: 30 } as const
const PRIMARY = '#6D28D9'

// ══════════════════════════════════════════
// ICONS — Lucide-style SVG fragments
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

function useMediaQuery(q: string) {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(q); setM(mql.matches)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    mql.addEventListener('change', h); return () => mql.removeEventListener('change', h)
  }, [q]); return m
}

/** Animate number 0 -> target with easeOutCubic */
function useAnimNum(target: number, dur = 800) {
  const [v, setV] = useState(0); const r = useRef(0)
  useEffect(() => {
    const s = performance.now()
    const tick = (n: number) => { const t = Math.min((n - s) / dur, 1); setV(Math.round(target * (1 - Math.pow(1 - t, 3)))); if (t < 1) r.current = requestAnimationFrame(tick) }
    r.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(r.current)
  }, [target, dur]); return v
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const l = (e: MouseEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; handler() }
    document.addEventListener('mousedown', l); return () => document.removeEventListener('mousedown', l)
  }, [ref, handler])
}

// ══════════════════════════════════════════
// SKELETON — matches destination page shape
// ══════════════════════════════════════════

function Sk({ className = '' }: { className?: string }) {
  return <div className={`bg-forged-surface2 rounded-lg animate-pulse ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-6">
      <div className="flex items-center gap-3"><Sk className="w-6 h-6 !rounded-full" /><Sk className="h-4 w-32" /></div>
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i}><Sk className="h-3 w-16 mb-2" /><Sk className="h-7 w-12 mb-1" /><Sk className="h-3 w-20" /></div>)}</div>
      <Sk className="h-[3px] w-full" />
      {[1,2,3,4].map(i => <div key={i} className="flex items-center gap-3"><Sk className="w-8 h-8 !rounded-lg" /><div className="flex-1"><Sk className="h-3 w-28 mb-1" /><Sk className="h-2 w-20" /></div><Sk className="h-3 w-12" /></div>)}
      <Sk className="h-[3px] w-full" />
      <Sk className="h-10 w-full !rounded-lg" />
    </div>
  )
}

// ══════════════════════════════════════════
// STAGGER — animation wrapper (no visual box)
// Replaces the old Card component.
// FORGE UI: no background, no border, just spacing.
// ══════════════════════════════════════════

function Stagger({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`transition-all duration-500 ease-out ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  )
}

/** FORGE UI section header: Archivo 13px bold */
function SectionHeader({ children, action, onAction }: {
  children: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-[13px] font-bold text-forged-text">{children}</h3>
      {action && <button onClick={onAction} className="text-[9px] font-semibold text-forged-text2 px-3 py-1 rounded-full border border-forged-purple/40 hover:border-forged-purple transition-colors">{action}</button>}
    </div>
  )
}

/** FORGE UI stat label: 8px uppercase muted */
function StatLabel({ children }: { children: string }) {
  return <p className="text-[8px] font-semibold text-forged-text2 uppercase tracking-wider mb-1.5">{children}</p>
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
  const go = (t: string) => { onNavigate?.(t); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text hover:border-forged-purple/30 hover:bg-forged-surface2 active:scale-[0.97] transition-all">
        <Icon d={I.dots} size={16} />
      </button>
      {open && (
        <div className={`absolute right-0 w-48 bg-forged-surface border border-forged-border rounded-xl shadow-xl overflow-hidden z-[60] max-h-[70vh] overflow-y-auto ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          style={{ animation: 'fadeSlide 0.15s ease-out' }}>
          {onProfile && <DI icon={I.profile} label="Profile" bold onClick={() => { onProfile(); setOpen(false) }} />}
          <DI icon={theme === 'dark' ? I.sun : I.moon} label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} border onClick={() => { toggleTheme(); setOpen(false) }} />
          <DI icon={I.settings} label="Settings" border onClick={() => { onSettings?.(); setOpen(false) }} />
          <DI icon={I.scale} label="Weekly Summary" border onClick={() => go('weekly')} />
          <DI icon={I.heart} label="Progress Photos" border onClick={() => go('photos')} />
          <DI icon={I.flame} label="Streaks" border onClick={() => go('streaks')} />
          <DI icon={I.target} label="Privacy" border onClick={() => go('privacy')} />
          <DI icon={I.food} label="Recipes" border onClick={() => go('recipes')} />
          <DI icon={I.edit} label="Feedback" border onClick={() => go('feedback')} />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-red hover:bg-forged-red/5 transition-colors text-left border-t border-forged-border">
            <Icon d={I.logout} size={16} /><span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

function DI({ icon, label, onClick, border, bold }: { icon: React.ReactNode; label: string; onClick: () => void; border?: boolean; bold?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-forged-surface2 transition-colors text-left ${border ? 'border-t border-forged-border' : ''} ${bold ? 'text-forged-text font-semibold' : 'text-forged-text2'}`}>
      <Icon d={icon} size={16} /><span>{label}</span>
    </button>
  )
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════

type TabId = 'food' | 'workouts' | 'dashboard' | 'progress' | 'profile' | 'settings' | 'weekly' | 'photos' | 'streaks' | 'privacy' | 'recipes' | 'feedback' | 'fasting'

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
    <aside className={`fixed left-0 top-0 h-full bg-forged-surface border-r border-forged-border flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
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
        {NAV.map(item => { const a = active === item.id; return (
          <button key={item.id} onClick={() => onChange(item.id)} className={`flex items-center gap-3 rounded-xl transition-all duration-200 relative ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'} ${a ? 'bg-forged-purple/15 text-forged-purple shadow-sm' : 'text-forged-text2 hover:text-forged-text hover:bg-forged-surface2'}`}>
            {a && !collapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-forged-purple rounded-r-full" />}
            <Icon d={item.icon} size={20} sw={a ? 2.2 : 1.6} className="flex-shrink-0" />
            {!collapsed && <span className={`text-sm ${a ? 'font-black' : 'font-semibold'}`}>{item.label}</span>}
          </button>
        )})}
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
// FORGE UI: gold dot on active, filled icon
// ══════════════════════════════════════════

function BottomNav({ active, onChange, onLogout, onProfile }: {
  active: TabId; onChange: (t: TabId) => void; onLogout: () => void; onProfile: () => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forged-surface/95 backdrop-blur-xl border-t border-forged-border flex items-end"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 6px)', paddingTop: '4px' }}>
      <div className="flex-1 flex justify-around items-end">
        {NAV.map(tab => { const a = active === tab.id, c = tab.id === 'dashboard'; return (
          <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex flex-col items-center min-w-[48px] transition-all duration-200 ${c ? '-mt-5 pb-0' : 'py-1 hover:opacity-80 active:scale-[0.97]'}`}>
            {c ? (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-[0.97] ${a ? 'bg-forged-purple shadow-lg shadow-forged-purple/40' : 'bg-forged-surface2 border border-forged-border shadow-md hover:border-forged-purple/30'}`}>
                <Icon d={tab.icon} size={24} sw={2} className={a ? 'text-white' : 'text-forged-text2'} />
              </div>
            ) : (<>
              <div className={`px-3 py-1 rounded-xl transition-all duration-200 ${a ? 'bg-forged-purple/15' : 'hover:bg-forged-surface2'}`}>
                <Icon d={tab.icon} size={20} sw={a ? 2.2 : 1.5} className={a ? 'text-forged-purple' : 'text-forged-text2'} />
              </div>
              <span className={`text-[9px] mt-0.5 ${a ? 'font-bold text-forged-purple' : 'text-forged-text2'}`}>{tab.label}</span>
            </>)}
          </button>
        )})}
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

  const sw = isDesktop ? (sidebarCollapsed ? 68 : 240) : 0

  return (
    <div className="min-h-screen bg-forged-bg">
      {isDesktop && <Sidebar active={tab} onChange={setTab} collapsed={sidebarCollapsed} onToggle={() => setSC(!sidebarCollapsed)} onLogout={onLogout} />}
      <main className="transition-all duration-300 pb-28 md:pb-6" style={{ marginLeft: sw }}>
        {loading ? <DashboardSkeleton /> : (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            {tab === 'dashboard' && <HomeTab stats={stats} user={user} activeFast={activeFast} macros={macros} todayFood={todayFood} onRefresh={loadData} onTabChange={setTab} onLogout={onLogout} />}
            {tab === 'food' && <FoodLogPage />}
            {tab === 'workouts' && <WorkoutPage />}
            {tab === 'progress' && <ProgressPage />}
            {tab === 'profile' && <ProfilePage user={user} onLogout={onLogout} />}
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
// HOME TAB — FORGE UI: no cards, naked stats,
// rows with icon squares, 3px progress bars
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
    <div className="flex flex-col gap-8">

      {/* ── Header: logo + greeting + avatar ── */}
      <Stagger delay={0}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-forged-text">F<span className="text-[#D4A853]">O</span>RGED</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block"><SettingsDropdown onLogout={onLogout} onProfile={() => onTabChange('profile')} onSettings={() => onTabChange('settings')} onNavigate={(t) => onTabChange(t as TabId)} /></div>
            <button onClick={() => onTabChange('profile')} className="w-6 h-6 rounded-full bg-forged-purple flex items-center justify-center border-[1.5px] border-[#D4A853]">
              <span className="text-[9px] font-semibold text-white">{(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
            </button>
          </div>
        </div>
      </Stagger>

      {/* ── Naked stats: calories, macros, fasting ── */}
      <Stagger delay={70}>
        <div className="grid grid-cols-3 mb-0">
          <div>
            <StatLabel>Calories</StatLabel>
            <p className="text-2xl font-bold text-forged-text tabular-nums tracking-tight">{animCal}</p>
            <p className="text-[9px] font-semibold text-[#D4A853] mt-0.5">{calLeft} remaining</p>
          </div>
          <div>
            <StatLabel>Protein</StatLabel>
            <p className="text-2xl font-bold text-forged-text tabular-nums tracking-tight">{macros.protein}g</p>
            <p className="text-[9px] font-semibold text-[#D4A853] mt-0.5">/ {GOALS.protein}g goal</p>
          </div>
          <div>
            <StatLabel>Fasting</StatLabel>
            {activeFast ? (
              <><p className="text-2xl font-bold text-[#D4A853] tabular-nums tracking-tight">{Math.floor(Math.max(activeFast.targetHours - ((Date.now() - new Date(activeFast.startTime).getTime()) / 3600000), 0))}h</p>
              <p className="text-[9px] font-semibold text-[#D4A853] mt-0.5">remaining</p></>
            ) : (
              <><p className="text-2xl font-bold text-forged-text tabular-nums tracking-tight">--</p>
              <p className="text-[9px] font-semibold text-forged-text2 mt-0.5">not active</p></>
            )}
          </div>
        </div>
      </Stagger>

      {/* ── Today's session section ── */}
      <Stagger delay={140}>
        <SectionHeader action={onTrack ? 'On track' : 'Over goal'}>{greeting}</SectionHeader>

        {/* Calorie progress bar — FORGE UI: 3px */}
        <div className="h-[3px] rounded-full bg-forged-border overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${calPct * 100}%`, backgroundColor: PRIMARY }} />
        </div>

        {/* Macro rows — FORGE UI row pattern: icon square + text + value */}
        <Row icon={<span className="text-[11px] font-bold">P</span>} iconBg="bg-forged-purple" name="Protein" sub={`${GOALS.protein}g goal`} value={`${macros.protein}g`} />
        <Row icon={<span className="text-[11px] font-bold">C</span>} iconBg="bg-forged-purple" name="Carbs" sub={`${GOALS.carbs}g goal`} value={`${macros.carbs}g`} />
        <Row icon={<span className="text-[11px] font-bold">F</span>} iconBg="bg-forged-purple" name="Fat" sub={`${GOALS.fat}g goal`} value={`${macros.fat}g`} />

        {/* Progress: macro completion */}
        <div className="h-[3px] rounded-full bg-forged-border overflow-hidden mt-3 mb-1">
          <div className="h-full rounded-full bg-forged-purple transition-all duration-700" style={{ width: `${Math.min((macros.protein / GOALS.protein) * 100, 100)}%` }} />
        </div>
        <p className="text-[9px] text-forged-text2">{Math.round((macros.protein / GOALS.protein) * 100)}% of protein goal</p>
      </Stagger>

      {/* ── Actions ── */}
      <Stagger delay={210}>
        <div className="flex gap-2">
          <button onClick={() => onTabChange('food')} className="flex-1 py-2.5 rounded-lg text-[11px] font-semibold bg-forged-purple text-white active:scale-[0.97] transition-all">Add meal</button>
          <button onClick={() => onTabChange('fasting')} className="flex-1 py-2.5 rounded-lg text-[11px] font-semibold text-forged-text2 border-[1.5px] border-forged-purple/40 active:scale-[0.97] transition-all">
            {activeFast ? 'View fast' : 'Start fast'}
          </button>
        </div>
      </Stagger>

      {/* ── Workout snapshot ── */}
      <Stagger delay={280}>
        <SectionHeader action="View all" onAction={() => onTabChange('workouts')}>Workout</SectionHeader>
        <WorkoutSnap onGo={() => onTabChange('workouts')} />
      </Stagger>

      {/* ── Food snapshot ── */}
      <Stagger delay={350}>
        <SectionHeader action="View all" onAction={() => onTabChange('food')}>Last meal</SectionHeader>
        <FoodSnap todayFood={todayFood} onGo={() => onTabChange('food')} />
      </Stagger>

      {/* ── Progress ── */}
      <Stagger delay={420}>
        <SectionHeader action="See all" onAction={() => onTabChange('progress')}>Progress</SectionHeader>
        <div className="grid grid-cols-3">
          <div><StatLabel>Weight</StatLabel><p className="text-2xl font-bold text-forged-text tabular-nums">{stats?.currentWeight ?? '--'}</p><p className="text-[9px] text-forged-text2">lbs</p></div>
          <div><StatLabel>Lost</StatLabel><p className="text-2xl font-bold text-forged-green tabular-nums">{stats?.weightLost ? `-${stats.weightLost}` : '--'}</p><p className="text-[9px] text-forged-text2">lbs</p></div>
          <div><StatLabel>Streak</StatLabel><p className="text-2xl font-bold text-forged-text tabular-nums">{stats?.currentStreak ?? '--'}</p><p className="text-[9px] text-[#D4A853]">days</p></div>
        </div>
        <WeightChart data={stats?.recentWeights ?? []} />
      </Stagger>

      {/* ── Streak banner (FORGE UI: gold border) ── */}
      {(stats?.currentStreak ?? 0) >= 3 && (
        <Stagger delay={490}>
          <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-[#D4A853]">
            <span className="text-base">&#9733;</span>
            <div>
              <p className="text-[11px] font-bold text-[#D4A853]">{stats!.currentStreak}-day streak!</p>
              <p className="text-[9px] text-forged-text2">Keep pushing</p>
            </div>
          </div>
        </Stagger>
      )}

      {/* ── Insight ── */}
      <Stagger delay={560}>
        <Insight macros={macros} streak={stats?.currentStreak ?? 0} />
      </Stagger>
    </div>
  )
}

// ══════════════════════════════════════════
// FORGE UI ROW — icon square + text + value
// ══════════════════════════════════════════

function Row({ icon, iconBg, name, sub, value, valueBold, valueColor }: {
  icon: React.ReactNode; iconBg: string; name: string; sub?: string
  value: string; valueBold?: boolean; valueColor?: string
}) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 rounded-lg hover:bg-forged-surface2/50 -mx-1.5 px-1.5 transition-colors">
      <div className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-forged-text">{name}</p>
        {sub && <p className="text-[9px] text-forged-text2 mt-px">{sub}</p>}
      </div>
      <p className={`text-[12px] font-bold tabular-nums ${valueColor || 'text-forged-text'}`}>{value}</p>
    </div>
  )
}

// ══════════════════════════════════════════
// SNAPSHOT COMPONENTS
// ══════════════════════════════════════════

function WorkoutSnap({ onGo }: { onGo: () => void }) {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => { api.workout.getLogs(1).then(setLogs).catch(console.error) }, [])
  const last = logs[0]
  return (
    <Row
      icon={<Icon d={I.workout} size={14} className="text-white" />} iconBg="bg-forged-purple"
      name={last?.dayName || last?.planType || 'No workout yet'}
      sub={last ? new Date(last.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start your first'}
      value={last ? 'Go' : 'Start'} />
  )
}

function FoodSnap({ todayFood, onGo }: { todayFood: FoodLog[]; onGo: () => void }) {
  const last = todayFood[todayFood.length - 1]
  return (
    <Row
      icon={<Icon d={I.food} size={14} className="text-white" />} iconBg="bg-forged-purple"
      name={last?.food?.name || 'No meals yet'}
      sub={last ? `${last.mealType} — ${last.food?.calories ?? 0} cal` : 'Log your first meal'}
      value={last ? `${last.food?.calories ?? 0} cal` : '--'} />
  )
}

/** Sparkline weight chart — FORGE UI primary */
function WeightChart({ data }: { data: WeightEntry[] }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t) }, [])
  if (data.length < 2) return <p className="text-[9px] text-forged-text2 text-center py-2">Need 2+ entries for chart</p>
  const recent = data.slice(-10), w = 500, h = 50, px = 10, py = 6
  const vals = recent.map(d => d.weight), mn = Math.min(...vals) - 0.5, mx = Math.max(...vals) + 0.5
  const pts = recent.map((d, i) => ({ x: px + (i / (recent.length - 1)) * (w - 2 * px), y: py + ((mx - d.weight) / (mx - mn)) * (h - 2 * py) }))
  const pathD = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1], cpx = (prev.x + p.x) / 2; return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}` }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto mt-3">
      <defs><linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PRIMARY} stopOpacity="0.15" /><stop offset="100%" stopColor={PRIMARY} stopOpacity="0" /></linearGradient></defs>
      <path d={pathD + ` L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`} fill="url(#mcg)" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.5s ease' }} />
      <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.5s ease 0.2s' }} />
    </svg>
  )
}

/** Contextual insight based on today's data */
function Insight({ macros, streak }: { macros: Macros; streak: number }) {
  const gap = GOALS.protein - macros.protein
  let msg: string, icon = I.zap
  if (streak >= 3) { msg = `${streak}-day streak! Keep pushing.`; icon = I.flame }
  else if (gap > 0 && gap < 40) { msg = `You're ${gap}g short on protein.`; icon = I.target }
  else if (macros.cal > 0 && macros.cal <= GOALS.calories) { msg = 'Within your calorie goal.'; icon = I.check }
  else { msg = 'Log meals and workouts to unlock insights.'; icon = I.zap }
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-forged-purple/15 flex items-center justify-center flex-shrink-0">
        <Icon d={icon} size={14} className="text-forged-purple" />
      </div>
      <p className="text-[11px] text-forged-text2 font-medium">{msg}</p>
    </div>
  )
}