import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useLoadingState, useLoadingEffect } from '../hooks/useLoading'
import type { DashboardStats, User, FastingLog, FoodLog } from '../types'
import type { TabId } from '../components/layout/nav'
import type { Macros } from '../components/dashboard/types'

// Layout
import { LOADING_STYLES } from '../components/loading/loadingStyles'
import { BrandLoader } from '../components/loading/BrandLoader'
import { PageLoader } from '../components/loading/PageLoader'
import { Sidebar } from '../components/layout/Sidebar'
import { BottomNav } from '../components/layout/BottomNav'
import { PageTransition } from '../components/layout/PageTransition'

// Tab content
import { HomeTab } from '../components/dashboard/HomeTab'
import FoodLogPage from './FoodLog'
import WorkoutPage from './WorkoutPage'
import ProgressPage from './ProgressPage'
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import WeeklySummaryPage from './WeeklySummary'
import ProgressPhotosPage from './ProgressPhotos'
import StreaksPage from './Streaks'
import RecipesPage from './Recipes'
import FeedbackPage from './Feedback'
import FastingPage from './Fasting'

interface DashboardProps {
  onLogout: () => void
}

/**
 * Root shell for the authenticated app. Handles:
 *   - Initial data fetch (dashboard stats, user, fasting, food)
 *   - Brand loader + centralized overlay loader
 *   - Tab state and routing to sub-pages
 *   - Responsive layout (sidebar on desktop, bottom nav on mobile)
 *
 * Loading state is managed via LoadingContext. Individual pages
 * declare their own loading via useLoadingEffect; the overlay
 * shows whenever ANY loading task is in flight.
 */
export default function Dashboard({ onLogout }: DashboardProps) {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [todayFood, setTodayFood] = useState<FoodLog[]>([])
  const [brandDone, setBrandDone] = useState<boolean>(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isLoading = useLoadingState()

  // Fetch dashboard data whenever the user returns to the dashboard tab.
  useLoadingEffect(async () => {
    if (tab !== 'dashboard') return

    const today = new Date().toISOString().split('T')[0]
    const [d, u, f, fd] = await Promise.allSettled([
      api.workout.dashboard(),
      api.auth.me(),
      api.fasting.getActive(),
      api.food.getLogs(today),
    ])

    if (d.status === 'fulfilled') setStats(d.value)
    if (u.status === 'fulfilled') setUser(u.value)

    // Only show fasts that aren't way past their target.
    if (f.status === 'fulfilled' && f.value) {
      const startMs = new Date(f.value.startTime).getTime()
      const elapsedHours = (Date.now() - startMs) / 3600000
      if (!isNaN(startMs) && elapsedHours <= f.value.targetHours * 2) {
        setActiveFast(f.value)
      } else {
        setActiveFast(null)
      }
    } else {
      setActiveFast(null)
    }

    if (fd.status === 'fulfilled') setTodayFood(fd.value)
  }, [tab])

  // Brand loader: visible for at least 1.2s so the logo registers.
  useEffect(() => {
    const timer = setTimeout(() => setBrandDone(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Aggregate today's macros from food logs.
  const macros: Macros = {
    cal: todayFood.reduce((sum, log) => sum + (log.food?.calories ?? 0) * log.servings, 0),
    protein: todayFood.reduce((sum, log) => sum + (log.food?.protein ?? 0) * log.servings, 0),
    carbs: todayFood.reduce((sum, log) => sum + (log.food?.carbs ?? 0) * log.servings, 0),
    fat: todayFood.reduce((sum, log) => sum + (log.food?.fat ?? 0) * log.servings, 0),
    fiber: todayFood.reduce((sum, log) => sum + (log.food?.fiber ?? 0) * log.servings, 0),
  }

  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 68 : 240) : 0

  return (
    <div className="min-h-screen bg-forged-bg">
      <style>{LOADING_STYLES}</style>

      {/* Phase 1: brand loader on first app launch only */}
      {!brandDone && <BrandLoader />}

      {/* Phase 2: overlay loader - shows whenever any page is loading data */}
      {brandDone && isLoading && <PageLoader />}

      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar
          active={tab}
          onChange={setTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={onLogout}
        />
      )}

      <main
        className="transition-all duration-300 pb-28 md:pb-6"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <PageTransition tabKey={tab}>
            {tab === 'dashboard' && (
              <HomeTab
                stats={stats}
                user={user}
                activeFast={activeFast}
                macros={macros}
                todayFood={todayFood}
                onTabChange={setTab}
                onLogout={onLogout}
              />
            )}
            {tab === 'food' && <FoodLogPage onNavigate={(t) => setTab(t as TabId)} />}
            {tab === 'workouts' && <WorkoutPage />}
            {tab === 'progress' && <ProgressPage />}
            {tab === 'profile' && <ProfilePage user={user} onLogout={onLogout} />}
            {tab === 'settings' && <SettingsPage onBack={() => setTab('dashboard')} />}
            {tab === 'weekly' && <WeeklySummaryPage onBack={() => setTab('dashboard')} />}
            {tab === 'photos' && <ProgressPhotosPage onBack={() => setTab('dashboard')} />}
            {tab === 'streaks' && <StreaksPage onBack={() => setTab('dashboard')} />}
            {tab === 'recipes' && <RecipesPage onBack={() => setTab('dashboard')} />}
            {tab === 'feedback' && <FeedbackPage onBack={() => setTab('dashboard')} />}
            {tab === 'fasting' && <FastingPage onBack={() => setTab('dashboard')} />}
          </PageTransition>
        </div>
      </main>

      {/* Mobile bottom nav */}
      {!isDesktop && (
        <BottomNav
          active={tab}
          onChange={setTab}
          onLogout={onLogout}
          onProfile={() => setTab('profile')}
        />
      )}
    </div>
  )
}