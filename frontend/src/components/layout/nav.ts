import type { ReactNode } from 'react'
import { I } from '../ui/Icon'

/**
 * All addressable tabs/pages inside the Dashboard shell.
 * Used as a discriminated string union for tab state and navigation.
 */
export type TabId =
  | 'food'
  | 'workouts'
  | 'dashboard'
  | 'progress'
  | 'profile'
  | 'settings'
  | 'weekly'
  | 'photos'
  | 'streaks'
  | 'privacy'
  | 'recipes'
  | 'feedback'
  | 'fasting'

export interface NavItem {
  id: TabId
  label: string
  icon: ReactNode
}

/**
 * Primary nav items shown in Sidebar (desktop) and BottomNav (mobile).
 * Order matters: "dashboard" sits in the visual center on mobile.
 */
export const NAV: readonly NavItem[] = [
  { id: 'food', label: 'Food', icon: I.food },
  { id: 'workouts', label: 'Workouts', icon: I.workout },
  { id: 'dashboard', label: 'Home', icon: I.dashboard },
  { id: 'progress', label: 'Progress', icon: I.progress },
  { id: 'profile', label: 'Profile', icon: I.profile },
] as const