import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../hooks/useTheme'
import {
  loadAppSettings,
  saveAppSettings,
  DEFAULT_SETTINGS,
  FORGED_LOCAL_KEYS,
  type AppSettings,
} from '../components/settings/settingsStorage'
import { exportAllData, importAllData, clearAllForgedData, type ExportBundle } from '../components/profile/profileStorage'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  droplet: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  cpu: <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
  activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  link: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  gavel: <><path d="M14 10L4 20"/><path d="M14 10l4 4"/><path d="M6 6l8 8"/><path d="M10 2l8 8-4 4-8-8z"/></>,
  wifi: <><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
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

function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState<boolean>(false)
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════
export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState<boolean>(false)
  const [confirmReset, setConfirmReset] = useState<boolean>(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof AppSettings>(section: K, patch: Partial<AppSettings[K]>): void => {
    setSettings(prev => {
      const next = { ...prev, [section]: { ...prev[section], ...patch } }
      saveAppSettings(next)
      return next
    })
  }

  const handleExport = (): void => {
    const bundle = exportAllData()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forged-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result as string) as ExportBundle
        if (bundle.version !== 1 || !bundle.data) {
          setImportStatus('Invalid backup file')
          return
        }
        const { imported, failed } = importAllData(bundle)
        setImportStatus(`Imported ${imported} keys${failed.length > 0 ? ` (${failed.length} failed)` : ''}. Reload to see changes.`)
      } catch {
        setImportStatus('Could not parse file')
      }
    }
    reader.readAsText(file)
  }

  const handleClear = (): void => {
    if (!confirmClear) { setConfirmClear(true); return }
    clearAllForgedData()
    for (const key of FORGED_LOCAL_KEYS) localStorage.removeItem(key)
    setSettings(DEFAULT_SETTINGS)
    setImportStatus('All local data cleared. Reload recommended.')
    setConfirmClear(false)
  }

  const handleResetDefaults = (): void => {
    if (!confirmReset) { setConfirmReset(true); return }
    setSettings(DEFAULT_SETTINGS)
    saveAppSettings(DEFAULT_SETTINGS)
    setConfirmReset(false)
    setImportStatus('Settings reset to defaults.')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text2
            hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <h1 className="text-2xl font-black text-forged-text">Settings</h1>
      </div>

      {/* ── Notifications ── */}
      <Card delay={60}>
        <SectionHeader icon={I.bell} label="Notifications" />
        <Toggle label="Enable all notifications" sublabel="Master switch"
          value={settings.notifications.enabled}
          onChange={v => update('notifications', { enabled: v })} />
        <div className={`mt-2 pt-2 border-t border-forged-border ${!settings.notifications.enabled && 'opacity-50 pointer-events-none'}`}>
          <Toggle label="Meal reminders" sublabel={`At ${settings.notifications.mealReminderTimes.join(', ')}`}
            value={settings.notifications.mealReminders}
            onChange={v => update('notifications', { mealReminders: v })} />
          {settings.notifications.mealReminders && (
            <div className="pl-3 pt-1 pb-2 flex flex-col gap-2">
              {settings.notifications.mealReminderTimes.map((t, i) => (
                <TimeRow key={i} label={['Breakfast', 'Lunch', 'Dinner'][i] ?? `Meal ${i+1}`}
                  value={t}
                  onChange={(v) => {
                    const copy = [...settings.notifications.mealReminderTimes]
                    copy[i] = v
                    update('notifications', { mealReminderTimes: copy })
                  }}
                />
              ))}
            </div>
          )}

          <Toggle label="Workout reminder" sublabel={`Daily at ${settings.notifications.workoutReminderTime}`}
            value={settings.notifications.workoutReminders}
            onChange={v => update('notifications', { workoutReminders: v })} />
          {settings.notifications.workoutReminders && (
            <div className="pl-3 pt-1 pb-2">
              <TimeRow label="Time"
                value={settings.notifications.workoutReminderTime}
                onChange={v => update('notifications', { workoutReminderTime: v })} />
            </div>
          )}

          <Toggle label="Water reminders" sublabel={`Every ${settings.notifications.waterReminderInterval} min`}
            value={settings.notifications.waterReminders}
            onChange={v => update('notifications', { waterReminders: v })} />
          {settings.notifications.waterReminders && (
            <div className="pl-3 pt-1 pb-2">
              <NumberRow label="Interval (min)" min={15} max={240} step={15}
                value={settings.notifications.waterReminderInterval}
                onChange={v => update('notifications', { waterReminderInterval: v })} />
            </div>
          )}

          <Toggle label="Fasting alerts" sublabel="Start and end notifications"
            value={settings.notifications.fastingAlerts}
            onChange={v => update('notifications', { fastingAlerts: v })} />

          <Toggle label="Weigh-in reminder" sublabel={`Morning nudge at ${settings.notifications.weighInReminderTime}`}
            value={settings.notifications.weighInReminder}
            onChange={v => update('notifications', { weighInReminder: v })} />
          {settings.notifications.weighInReminder && (
            <div className="pl-3 pt-1 pb-2">
              <TimeRow label="Time"
                value={settings.notifications.weighInReminderTime}
                onChange={v => update('notifications', { weighInReminderTime: v })} />
            </div>
          )}
        </div>
        <p className="text-[10px] text-forged-text2 mt-2">
          Push notifications require OS-level permission once backend is wired up.
        </p>
      </Card>

      {/* ── Appearance ── */}
      <Card delay={120}>
        <SectionHeader icon={I.sun} label="Appearance" />
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 transition-all">
          <div className="flex items-center gap-3">
            <Icon d={theme === 'dark' ? I.moon : I.sun} size={18} className="text-forged-text2" />
            <div className="text-left">
              <p className="text-sm text-forged-text font-medium">Theme</p>
              <p className="text-[10px] text-forged-text2">Dark or light mode</p>
            </div>
          </div>
          <span className="text-xs text-forged-purple font-bold capitalize">{theme}</span>
        </button>
      </Card>

      {/* ── Units ── */}
      <Card delay={180}>
        <SectionHeader icon={I.scale} label="Units" />
        <div className="flex flex-col gap-3">
          <UnitPicker label="Weight" icon={I.scale}
            options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
            current={settings.units.weight}
            onChange={v => update('units', { weight: v as 'lbs' | 'kg' })} />
          <UnitPicker label="Height" icon={I.activity}
            options={[{ value: 'in', label: 'in' }, { value: 'cm', label: 'cm' }]}
            current={settings.units.height}
            onChange={v => update('units', { height: v as 'in' | 'cm' })} />
          <UnitPicker label="Distance" icon={I.activity}
            options={[{ value: 'mi', label: 'mi' }, { value: 'km', label: 'km' }]}
            current={settings.units.distance}
            onChange={v => update('units', { distance: v as 'mi' | 'km' })} />
          <UnitPicker label="Energy" icon={I.dumbbell}
            options={[{ value: 'cal', label: 'cal' }, { value: 'kj', label: 'kJ' }]}
            current={settings.units.energy}
            onChange={v => update('units', { energy: v as 'cal' | 'kj' })} />
          <UnitPicker label="Food mass" icon={I.sliders}
            options={[{ value: 'g', label: 'grams' }, { value: 'oz', label: 'oz' }]}
            current={settings.units.food}
            onChange={v => update('units', { food: v as 'g' | 'oz' })} />
          <UnitPicker label="Water" icon={I.droplet}
            options={[{ value: 'ml', label: 'ml' }, { value: 'oz', label: 'oz' }]}
            current={settings.units.water}
            onChange={v => update('units', { water: v as 'ml' | 'oz' })} />
        </div>
      </Card>

      {/* ── Features ── */}
      <Card delay={240}>
        <SectionHeader icon={I.layers} label="Features" />
        <p className="text-[11px] text-forged-text2 mb-3">Turn sections on or off. Disabled features disappear from the app.</p>
        <div className="flex flex-col gap-1">
          <Toggle label="Fasting" sublabel="Intermittent fasting tracker"
            value={settings.features.fastingEnabled}
            onChange={v => update('features', { fastingEnabled: v })} />
          <Toggle label="Daily Goals" sublabel="Today's Goals checklist"
            value={settings.features.dailyGoalsEnabled}
            onChange={v => update('features', { dailyGoalsEnabled: v })} />
          <Toggle label="Workouts" sublabel="Workout logging and plans"
            value={settings.features.workoutsEnabled}
            onChange={v => update('features', { workoutsEnabled: v })} />
          <Toggle label="Progress" sublabel="Progress page and charts"
            value={settings.features.progressEnabled}
            onChange={v => update('features', { progressEnabled: v })} />
          <Toggle label="Achievements" sublabel="Badges and milestones"
            value={settings.features.achievementsEnabled}
            onChange={v => update('features', { achievementsEnabled: v })} />
          <Toggle label="Insights" sublabel="Smart observations on your data"
            value={settings.features.insightsEnabled}
            onChange={v => update('features', { insightsEnabled: v })} />
        </div>
      </Card>

      {/* ── Behavior ── */}
      <Card delay={300}>
        <SectionHeader icon={I.sliders} label="App behavior" />
        <div className="flex flex-col gap-1">
          <Toggle label="Auto-fill last workout" sublabel="Pre-fill weights from previous session"
            value={settings.behavior.autoFillLastWorkout}
            onChange={v => update('behavior', { autoFillLastWorkout: v })} />
          <Toggle label="Confirm before deleting" sublabel="Show confirm dialog for destructive actions"
            value={settings.behavior.confirmBeforeDelete}
            onChange={v => update('behavior', { confirmBeforeDelete: v })} />
          <Toggle label="Haptic feedback" sublabel="Small vibration on tap (mobile)"
            value={settings.behavior.hapticFeedback}
            onChange={v => update('behavior', { hapticFeedback: v })} />
        </div>
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-forged-border">
          <UnitPicker label="Default meal view" icon={I.calendar}
            options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]}
            current={settings.behavior.defaultMealView}
            onChange={v => update('behavior', { defaultMealView: v as 'daily' | 'weekly' })} />
          <UnitPicker label="Week starts on" icon={I.clock}
            options={[{ value: 'sunday', label: 'Sun' }, { value: 'monday', label: 'Mon' }]}
            current={settings.behavior.weekStartsOn}
            onChange={v => update('behavior', { weekStartsOn: v as 'sunday' | 'monday' })} />
        </div>
      </Card>

      {/* ── Cache ── */}
      <Card delay={360}>
        <SectionHeader icon={I.cpu} label="Cache" />
        <div className="flex flex-col gap-1">
          <Toggle label="Preload food library" sublabel="Speeds up search, uses more memory"
            value={settings.cache.preloadFoodLibrary}
            onChange={v => update('cache', { preloadFoodLibrary: v })} />
          <Toggle label="Preload workout history" sublabel="Instant recall of recent sessions"
            value={settings.cache.preloadWorkoutHistory}
            onChange={v => update('cache', { preloadWorkoutHistory: v })} />
        </div>
        <button
          onClick={() => {
            sessionStorage.clear()
            setImportStatus('Session cache cleared.')
          }}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-black
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/40 active:scale-[0.98] transition-all"
        >
          Clear search cache now
        </button>
      </Card>

      {/* ── Sync ── */}
      <Card delay={420}>
        <SectionHeader icon={I.wifi} label="Sync" />
        <div className="flex flex-col gap-1">
          <Toggle label="Auto sync" sublabel="Sync changes to server automatically"
            value={settings.sync.autoSync}
            onChange={v => update('sync', { autoSync: v })} />
          <Toggle label="Wi-Fi only" sublabel="Never use cellular data"
            value={settings.sync.syncOnWifiOnly}
            onChange={v => update('sync', { syncOnWifiOnly: v })} />
          <Toggle label="Offline mode" sublabel="Work without backend until toggled off"
            value={settings.sync.offlineMode}
            onChange={v => update('sync', { offlineMode: v })} />
        </div>
      </Card>

      {/* ── Integrations ── */}
      <Card delay={480}>
        <SectionHeader icon={I.link} label="Integrations" />
        <p className="text-[11px] text-forged-text2 mb-3">Third-party services. All require backend wiring.</p>
        <div className="flex flex-col gap-1">
          <Toggle label="Apple Health" sublabel="Sync weight, workouts, nutrition"
            value={settings.integrations.appleHealth}
            onChange={v => update('integrations', { appleHealth: v })} />
          <Toggle label="Google Fit" sublabel="Sync with Android fitness data"
            value={settings.integrations.googleFit}
            onChange={v => update('integrations', { googleFit: v })} />
          <Toggle label="Strava" sublabel="Import cardio and runs"
            value={settings.integrations.strava}
            onChange={v => update('integrations', { strava: v })} />
          <Toggle label="MyFitnessPal" sublabel="Import historical food logs"
            value={settings.integrations.myFitnessPal}
            onChange={v => update('integrations', { myFitnessPal: v })} />
        </div>
      </Card>

      {/* ── Accessibility ── */}
      <Card delay={540}>
        <SectionHeader icon={I.eye} label="Accessibility" />
        <div className="flex flex-col gap-1">
          <Toggle label="Larger text" sublabel="Bump all font sizes up"
            value={settings.accessibility.largerText}
            onChange={v => update('accessibility', { largerText: v })} />
          <Toggle label="Bold text" sublabel="Heavier weight across the app"
            value={settings.accessibility.boldText}
            onChange={v => update('accessibility', { boldText: v })} />
          <Toggle label="Reduced motion" sublabel="Minimal animations and transitions"
            value={settings.accessibility.reducedMotion}
            onChange={v => update('accessibility', { reducedMotion: v })} />
          <Toggle label="High contrast" sublabel="Stronger color separation"
            value={settings.accessibility.highContrast}
            onChange={v => update('accessibility', { highContrast: v })} />
        </div>
      </Card>

      {/* ── Privacy ── */}
      <Card delay={600}>
        <SectionHeader icon={I.shield} label="Privacy" />
        <div className="flex flex-col gap-1">
          <Toggle label="Analytics" sublabel="Share anonymous usage data"
            value={settings.privacy.analytics}
            onChange={v => update('privacy', { analytics: v })} />
          <Toggle label="Crash reports" sublabel="Help fix bugs faster"
            value={settings.privacy.crashReports}
            onChange={v => update('privacy', { crashReports: v })} />
          <Toggle label="Personalized insights" sublabel="Opt into AI-generated suggestions"
            value={settings.privacy.personalizedInsights}
            onChange={v => update('privacy', { personalizedInsights: v })} />
        </div>
      </Card>

      {/* ── Data & Privacy Actions ── */}
      <Card delay={660}>
        <SectionHeader icon={I.database} label="Data" />
        <div className="flex flex-col gap-2">
          <SettingsButton icon={I.download} label="Export data" sublabel="Download a JSON backup of your local data"
            onClick={handleExport} />
          <SettingsButton icon={I.upload} label="Import data" sublabel="Restore from a FORGED backup file"
            onClick={() => importFileRef.current?.click()} />
          <input ref={importFileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />

          <button
            onClick={handleClear}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
              ${confirmClear
                ? 'bg-forged-red/10 border-forged-red'
                : 'bg-forged-bg border-forged-border hover:border-forged-red/40'}`}
          >
            <Icon d={I.trash} size={16} className={confirmClear ? 'text-forged-red' : 'text-forged-text2'} />
            <div>
              <p className={`text-sm font-medium ${confirmClear ? 'text-forged-red' : 'text-forged-text'}`}>
                {confirmClear ? 'Tap again to confirm' : 'Clear local data'}
              </p>
              <p className="text-[10px] text-forged-text2">
                {confirmClear ? 'Wipes all FORGED localStorage. Backend data unaffected.' : 'Goals, checklist, body goals, settings, profile extras'}
              </p>
            </div>
          </button>
          {confirmClear && (
            <button onClick={() => setConfirmClear(false)}
              className="text-[10px] text-forged-text2 font-bold py-1">
              Cancel
            </button>
          )}

          <button
            onClick={handleResetDefaults}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
              ${confirmReset
                ? 'bg-forged-purple/10 border-forged-purple'
                : 'bg-forged-bg border-forged-border hover:border-forged-purple/40'}`}
          >
            <Icon d={I.sliders} size={16} className={confirmReset ? 'text-forged-purple' : 'text-forged-text2'} />
            <div>
              <p className={`text-sm font-medium ${confirmReset ? 'text-forged-purple' : 'text-forged-text'}`}>
                {confirmReset ? 'Tap again to confirm' : 'Reset settings to defaults'}
              </p>
              <p className="text-[10px] text-forged-text2">
                {confirmReset ? 'Restores every toggle and picker on this page.' : 'Your data stays, only settings revert.'}
              </p>
            </div>
          </button>
          {confirmReset && (
            <button onClick={() => setConfirmReset(false)}
              className="text-[10px] text-forged-text2 font-bold py-1">
              Cancel
            </button>
          )}

          {importStatus && (
            <div className="bg-forged-purple/10 border border-forged-purple/30 rounded-xl p-3 mt-1">
              <p className="text-xs text-forged-purple font-bold">{importStatus}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Developer ── */}
      <Card delay={720}>
        <SectionHeader icon={I.cpu} label="Developer" />
        <Toggle label="Enable developer mode" sublabel="Show internals and debug switches"
          value={settings.developer.enabled}
          onChange={v => update('developer', { enabled: v })} />
        {settings.developer.enabled && (
          <div className="mt-3 pt-3 border-t border-forged-border flex flex-col gap-2">
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">API URL override</label>
              <input
                type="text" value={settings.developer.apiUrl}
                onChange={(e) => update('developer', { apiUrl: e.target.value })}
                placeholder="https://api.forgedgyms.com"
                className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
                  rounded-lg text-forged-text text-sm font-mono
                  focus:border-forged-purple/50 outline-none transition-colors"
              />
              <p className="text-[10px] text-forged-text2 mt-1">Leave blank for default. Requires reload.</p>
            </div>
            <Toggle label="Debug logs" sublabel="Verbose console output"
              value={settings.developer.debugLogs}
              onChange={v => update('developer', { debugLogs: v })} />
            <Toggle label="Show feature flags" sublabel="Expose experimental toggles"
              value={settings.developer.showFeatureFlags}
              onChange={v => update('developer', { showFeatureFlags: v })} />
            <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mt-1">
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-1">Local Storage</p>
              <p className="text-[10px] text-forged-text2 font-mono">
                {Object.keys(localStorage).filter(k => k.startsWith('forged')).length} FORGED keys
              </p>
              <p className="text-[10px] text-forged-text2 font-mono">
                Theme: {theme}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ── About ── */}
      <Card delay={780}>
        <SectionHeader icon={I.info} label="About" />
        <div className="flex flex-col gap-0">
          <AboutRow label="Version" value="1.0.0" />
          <AboutRow label="Build" value="Phase 1" />
          <AboutRow label="Developer" value="TCW Studio" />
          <AboutRow label="Released" value="April 2026" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <LinkButton label="Changelog" onClick={() => alert('Changelog coming soon')} />
          <LinkButton label="Credits" onClick={() => alert('Credits coming soon')} />
        </div>
      </Card>

      {/* ── Legal ── */}
      <Card delay={840}>
        <SectionHeader icon={I.gavel} label="Legal" />
        <div className="flex flex-col gap-2">
          <LinkButton fullWidth label="Terms of Service" onClick={() => alert('Terms coming soon')} />
          <LinkButton fullWidth label="Privacy Policy" onClick={() => alert('Privacy policy coming soon')} />
          <LinkButton fullWidth label="Open Source Licenses" onClick={() => alert('Licenses coming soon')} />
          <LinkButton fullWidth label="Contact Support" onClick={() => alert('Contact: support@forgedgyms.com')} />
        </div>
      </Card>

      <div className="h-4" />
    </div>
  )
}

// ══════════════════════════════════
// SUBCOMPONENTS
// ══════════════════════════════════

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
        <Icon d={icon} size={16} className="text-forged-purple" />
      </div>
      <p className="text-sm font-black text-forged-text">{label}</p>
    </div>
  )
}

function Toggle({ label, sublabel, value, onChange }: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 rounded-xl
        hover:bg-forged-surface2/50 transition-all text-left">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-sm text-forged-text font-medium truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-forged-text2 truncate">{sublabel}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 flex-shrink-0
        ${value ? 'bg-forged-purple' : 'bg-forged-surface2 border border-forged-border'}`}>
        <div className={`w-5 h-5 rounded-full transition-all duration-200 shadow-sm
          ${value ? 'translate-x-5 bg-white' : 'translate-x-0 bg-forged-text2/40'}`} />
      </div>
    </button>
  )
}

function UnitPicker({ label, icon, options, current, onChange }: {
  label: string; icon: React.ReactNode
  options: { value: string; label: string }[]
  current: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon d={icon} size={16} className="text-forged-text2" />
        <span className="text-sm text-forged-text font-medium">{label}</span>
      </div>
      <div className="flex bg-forged-bg rounded-lg p-0.5 gap-0.5">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all
              ${current === opt.value
                ? 'bg-forged-purple text-white'
                : 'text-forged-text2 hover:text-forged-text'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function TimeRow({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-forged-text2 font-bold">{label}</span>
      <input
        type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 bg-forged-bg border border-forged-border
          rounded-md text-forged-text text-xs tabular-nums
          focus:border-forged-purple/50 outline-none transition-colors"
      />
    </div>
  )
}

function NumberRow({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-forged-text2 font-bold">{label}</span>
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-20 px-2 py-1 bg-forged-bg border border-forged-border
          rounded-md text-forged-text text-xs tabular-nums text-center
          focus:border-forged-purple/50 outline-none transition-colors"
      />
    </div>
  )
}

function SettingsButton({ icon, label, sublabel, onClick }: {
  icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl
        bg-forged-bg border border-forged-border text-left transition-all
        hover:border-forged-purple/40 active:scale-[0.99]">
      <Icon d={icon} size={16} className="text-forged-text2" />
      <div>
        <p className="text-sm font-medium text-forged-text">{label}</p>
        {sublabel && <p className="text-[10px] text-forged-text2">{sublabel}</p>}
      </div>
    </button>
  )
}

function LinkButton({ label, onClick, fullWidth }: {
  label: string; onClick: () => void; fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-xl text-xs font-bold text-forged-text
        bg-forged-bg border border-forged-border
        hover:border-forged-purple/40 hover:text-forged-purple
        active:scale-[0.98] transition-all
        ${fullWidth ? 'w-full flex items-center justify-between' : ''}`}
    >
      {label}
      {fullWidth && <span className="text-forged-text2">→</span>}
    </button>
  )
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-forged-border last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text">{value}</span>
    </div>
  )
}