import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { DashboardStats, User, FastingLog, FoodLog } from '../types'
import type { TabId } from '../components/layout/nav'
import type { Macros } from '../components/dashboard/types'

// Layout
import { LOADING_STYLES } from '../components/loading/loadingStyles'
import { BrandLoader } from '../components/loading/BrandLoader'
import { DashboardSkeleton } from '../components/loading/DashboardSkeleton'
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
import PrivacyPage from './Privacy'
import RecipesPage from './Recipes'
import FeedbackPage from './Feedback'
import FastingPage from './Fasting'

interface DashboardProps {
  onLogout: () => void
}

/**
 * Root shell for the authenticated app. Handles:
 *   - Initial data fetch (dashboard stats, user, fasting, food)
 *   - Brand loader + skeleton bridge loading sequence
 *   - Tab state and routing to sub-pages
 *   - Responsive layout (sidebar on desktop, bottom nav on mobile)
 */
export default function Dashboard({ onLogout }: DashboardProps) {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [todayFood, setTodayFood] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [brandDone, setBrandDone] = useState<boolean>(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Fetch all dashboard data in parallel.
  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [d, u, f, fd] = await Promise.allSettled([
        api.workout.dashboard(),
        api.auth.me(),
        api.fasting.getActive(),
        api.food.getLogs(today),
      ])

      if (d.status === 'fulfilled') setStats(d.value)
      if (u.status === 'fulfilled') setUser(u.value)
      if (
        f.status === 'fulfilled' &&
        f.value &&
        f.value.startTime &&
        !isNaN(new Date(f.value.startTime).getTime())
      ) {
        setActiveFast(f.value)
      }
      if (fd.status === 'fulfilled') setTodayFood(fd.value)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Brand loader: visible for at least 1.2s so the logo registers.
  useEffect(() => {
    const timer = setTimeout(() => setBrandDone(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const showBrand = !brandDone || loading
  const showSkeleton = brandDone && loading

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

      {/* Phase 1: brand loader on first app launch */}
      {showBrand && !showSkeleton && <BrandLoader />}

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
        {/* Phase 2: skeleton bridge while data loads */}
        {showSkeleton ? (
          <DashboardSkeleton />
        ) : (
          !showBrand && (
            <div className="max-w-2xl mx-auto px-4 pt-4">
              {/* Phase 3: page transitions */}
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
              </PageTransition>
            </div>
          )
        )}
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