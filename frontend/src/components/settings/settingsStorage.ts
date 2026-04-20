const SETTINGS_KEY = 'forged:app-settings'

export type NotificationTime = `${number}:${number}` // "HH:MM"

export interface AppSettings {
  notifications: {
    enabled: boolean
    mealReminders: boolean
    mealReminderTimes: string[] // "HH:MM" array (breakfast, lunch, dinner)
    workoutReminders: boolean
    workoutReminderTime: string
    waterReminders: boolean
    waterReminderInterval: number // minutes
    fastingAlerts: boolean
    weighInReminder: boolean
    weighInReminderTime: string
  }
  units: {
    weight: 'lbs' | 'kg'
    food: 'g' | 'oz'
    water: 'ml' | 'oz'
    height: 'in' | 'cm'
    distance: 'mi' | 'km'
    energy: 'cal' | 'kj'
  }
  features: {
    fastingEnabled: boolean
    dailyGoalsEnabled: boolean
    workoutsEnabled: boolean
    progressEnabled: boolean
    achievementsEnabled: boolean
    insightsEnabled: boolean
  }
  behavior: {
    autoFillLastWorkout: boolean
    defaultMealView: 'daily' | 'weekly'
    weekStartsOn: 'sunday' | 'monday'
    confirmBeforeDelete: boolean
    hapticFeedback: boolean
  }
  cache: {
    preloadFoodLibrary: boolean
    preloadWorkoutHistory: boolean
  }
  sync: {
    autoSync: boolean
    syncOnWifiOnly: boolean
    offlineMode: boolean
  }
  integrations: {
    appleHealth: boolean
    googleFit: boolean
    strava: boolean
    myFitnessPal: boolean
  }
  accessibility: {
    largerText: boolean
    reducedMotion: boolean
    highContrast: boolean
    boldText: boolean
  }
  privacy: {
    analytics: boolean
    crashReports: boolean
    personalizedInsights: boolean
  }
  developer: {
    enabled: boolean
    apiUrl: string
    debugLogs: boolean
    showFeatureFlags: boolean
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    enabled: false,
    mealReminders: false,
    mealReminderTimes: ['08:00', '12:30', '18:30'],
    workoutReminders: false,
    workoutReminderTime: '17:00',
    waterReminders: false,
    waterReminderInterval: 60,
    fastingAlerts: false,
    weighInReminder: false,
    weighInReminderTime: '07:30',
  },
  units: {
    weight: 'lbs', food: 'g', water: 'ml',
    height: 'in', distance: 'mi', energy: 'cal',
  },
  features: {
    fastingEnabled: true,
    dailyGoalsEnabled: true,
    workoutsEnabled: true,
    progressEnabled: true,
    achievementsEnabled: true,
    insightsEnabled: true,
  },
  behavior: {
    autoFillLastWorkout: true,
    defaultMealView: 'daily',
    weekStartsOn: 'sunday',
    confirmBeforeDelete: true,
    hapticFeedback: true,
  },
  cache: {
    preloadFoodLibrary: true,
    preloadWorkoutHistory: true,
  },
  sync: {
    autoSync: true,
    syncOnWifiOnly: false,
    offlineMode: false,
  },
  integrations: {
    appleHealth: false,
    googleFit: false,
    strava: false,
    myFitnessPal: false,
  },
  accessibility: {
    largerText: false,
    reducedMotion: false,
    highContrast: false,
    boldText: false,
  },
  privacy: {
    analytics: true,
    crashReports: true,
    personalizedInsights: true,
  },
  developer: {
    enabled: false,
    apiUrl: '',
    debugLogs: false,
    showFeatureFlags: false,
  },
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    // Deep-merge with defaults so new fields added later don't break existing users
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      units: { ...DEFAULT_SETTINGS.units, ...parsed.units },
      features: { ...DEFAULT_SETTINGS.features, ...parsed.features },
      behavior: { ...DEFAULT_SETTINGS.behavior, ...parsed.behavior },
      cache: { ...DEFAULT_SETTINGS.cache, ...parsed.cache },
      sync: { ...DEFAULT_SETTINGS.sync, ...parsed.sync },
      integrations: { ...DEFAULT_SETTINGS.integrations, ...parsed.integrations },
      accessibility: { ...DEFAULT_SETTINGS.accessibility, ...parsed.accessibility },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed.privacy },
      developer: { ...DEFAULT_SETTINGS.developer, ...parsed.developer },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
}

/**
 * Add the Forged storage keys here too for the Settings clear-data flow.
 */
export const FORGED_LOCAL_KEYS: string[] = [
  'forged:food-goals',
  'forged:daily-goals',
  'forged:daily-goal-checks',
  'forged:daily-goal-values',
  'forged:body-goals',
  'forged:profile-extras',
  'forged:profile-prefs',
  'forged:app-settings',
  'forged_goals',
  'forged_settings',
  'forged_routines',
]