import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

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
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  droplet: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  dumbbell: <><path d="M6.5 6.5L17.5 17.5"/><path d="M2 12l2-2 2 2"/><path d="M18 12l2-2 2 2"/><path d="M7 7L5 5"/><path d="M17 17l2 2"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
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

// ══════════════════════════════════
// SHARED UI
// ══════════════════════════════════
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// SETTINGS — localStorage
// ══════════════════════════════════
interface AppSettings {
  notifications: {
    mealReminders: boolean
    workoutReminders: boolean
    waterReminders: boolean
    fastingAlerts: boolean
  }
  units: {
    weight: 'lbs' | 'kg'
    food: 'g' | 'oz'
    water: 'ml' | 'oz'
  }
  behavior: {
    autoFillLastWorkout: boolean
    defaultMealView: 'daily' | 'weekly'
    weekStartsOn: 'sunday' | 'monday'
  }
}

const SETTINGS_KEY = 'forged_settings'
const defaultSettings: AppSettings = {
  notifications: { mealReminders: false, workoutReminders: false, waterReminders: false, fastingAlerts: false },
  units: { weight: 'lbs', food: 'g', water: 'ml' },
  behavior: { autoFillLastWorkout: true, defaultMealView: 'daily', weekStartsOn: 'sunday' },
}

function loadSettings(): AppSettings {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return defaultSettings }
}
function saveSettings(s: AppSettings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) }

// ══════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════
export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const update = (fn: (s: AppSettings) => AppSettings) => {
    setSettings(prev => {
      const next = fn(prev)
      saveSettings(next)
      return next
    })
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
        <div className="flex flex-col gap-1">
          <Toggle label="Meal Reminders" sublabel="Remind to log meals"
            value={settings.notifications.mealReminders}
            onChange={v => update(s => ({ ...s, notifications: { ...s.notifications, mealReminders: v } }))} />
          <Toggle label="Workout Reminders" sublabel="Daily workout nudge"
            value={settings.notifications.workoutReminders}
            onChange={v => update(s => ({ ...s, notifications: { ...s.notifications, workoutReminders: v } }))} />
          <Toggle label="Water Reminders" sublabel="Hydration check-ins"
            value={settings.notifications.waterReminders}
            onChange={v => update(s => ({ ...s, notifications: { ...s.notifications, waterReminders: v } }))} />
          <Toggle label="Fasting Alerts" sublabel="Start and end notifications"
            value={settings.notifications.fastingAlerts}
            onChange={v => update(s => ({ ...s, notifications: { ...s.notifications, fastingAlerts: v } }))} />
        </div>
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
            <div>
              <p className="text-sm text-forged-text font-medium">Theme</p>
              <p className="text-[10px] text-forged-text2">Switch between dark and light mode</p>
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
            onChange={v => update(s => ({ ...s, units: { ...s.units, weight: v as any } }))} />
          <UnitPicker label="Food" icon={I.sliders}
            options={[{ value: 'g', label: 'grams' }, { value: 'oz', label: 'ounces' }]}
            current={settings.units.food}
            onChange={v => update(s => ({ ...s, units: { ...s.units, food: v as any } }))} />
          <UnitPicker label="Water" icon={I.droplet}
            options={[{ value: 'ml', label: 'ml' }, { value: 'oz', label: 'oz' }]}
            current={settings.units.water}
            onChange={v => update(s => ({ ...s, units: { ...s.units, water: v as any } }))} />
        </div>
      </Card>

      {/* ── App Behavior ── */}
      <Card delay={240}>
        <SectionHeader icon={I.sliders} label="App Behavior" />
        <div className="flex flex-col gap-1">
          <Toggle label="Auto-fill Last Workout" sublabel="Pre-fill weights from previous session"
            value={settings.behavior.autoFillLastWorkout}
            onChange={v => update(s => ({ ...s, behavior: { ...s.behavior, autoFillLastWorkout: v } }))} />
        </div>
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-forged-text2/10">
          <UnitPicker label="Default Meal View" icon={I.calendar}
            options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]}
            current={settings.behavior.defaultMealView}
            onChange={v => update(s => ({ ...s, behavior: { ...s.behavior, defaultMealView: v as any } }))} />
          <UnitPicker label="Week Starts On" icon={I.clock}
            options={[{ value: 'sunday', label: 'Sunday' }, { value: 'monday', label: 'Monday' }]}
            current={settings.behavior.weekStartsOn}
            onChange={v => update(s => ({ ...s, behavior: { ...s.behavior, weekStartsOn: v as any } }))} />
        </div>
      </Card>

      {/* ── Data ── */}
      <Card delay={300}>
        <SectionHeader icon={I.database} label="Data" />
        <div className="flex flex-col gap-2">
          <SettingsButton icon={I.download} label="Export Data" sublabel="Download your data as JSON"
            onClick={() => {
              const data = {
                routines: localStorage.getItem('forged_routines'),
                goals: localStorage.getItem('forged_goals'),
                settings: localStorage.getItem('forged_settings'),
                exportedAt: new Date().toISOString(),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `forged-export-${new Date().toISOString().split('T')[0]}.json`
              a.click(); URL.revokeObjectURL(url)
            }} />
          <SettingsButton icon={I.trash} label="Clear Local Data" sublabel="Reset routines, goals, and settings"
            danger
            onClick={() => {
              if (confirm('This will clear all locally stored data (routines, goals, settings). Continue?')) {
                localStorage.removeItem('forged_routines')
                localStorage.removeItem('forged_goals')
                localStorage.removeItem('forged_settings')
                setSettings(defaultSettings)
              }
            }} />
        </div>
      </Card>

      {/* ── About ── */}
      <Card delay={360}>
        <SectionHeader icon={I.info} label="About" />
        <div className="flex flex-col gap-0">
          <AboutRow label="Version" value="1.0.0" />
          <AboutRow label="Build" value="Phase 1" />
          <AboutRow label="Developer" value="TCW Studio" />
        </div>
      </Card>

      <div className="h-4" />
    </div>
  )
}

// ══════════════════════════════════
// SECTION HEADER
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

// ══════════════════════════════════
// TOGGLE
// ══════════════════════════════════
function Toggle({ label, sublabel, value, onChange }: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between p-3 rounded-xl
        hover:bg-forged-surface2/50 transition-all text-left">
      <div>
        <p className="text-sm text-forged-text font-medium">{label}</p>
        {sublabel && <p className="text-[10px] text-forged-text2">{sublabel}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5
        ${value ? 'bg-forged-purple' : 'bg-forged-surface2 border border-forged-border'}`}>
        <div className={`w-5 h-5 rounded-full transition-all duration-200 shadow-sm
          ${value ? 'translate-x-5 bg-white' : 'translate-x-0 bg-forged-text2/40'}`} />
      </div>
    </button>
  )
}

// ══════════════════════════════════
// UNIT PICKER
// ══════════════════════════════════
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

// ══════════════════════════════════
// SETTINGS BUTTON
// ══════════════════════════════════
function SettingsButton({ icon, label, sublabel, onClick, danger }: {
  icon: React.ReactNode; label: string; sublabel?: string
  onClick: () => void; danger?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl
        bg-forged-bg border border-forged-border text-left transition-all
        ${danger ? 'hover:border-forged-red/30 group' : 'hover:border-forged-purple/30'}`}>
      <Icon d={icon} size={16} className={danger ? 'text-forged-text2 group-hover:text-forged-red transition-colors' : 'text-forged-text2'} />
      <div>
        <p className={`text-sm font-medium ${danger ? 'text-forged-text group-hover:text-forged-red transition-colors' : 'text-forged-text'}`}>{label}</p>
        {sublabel && <p className="text-[10px] text-forged-text2">{sublabel}</p>}
      </div>
    </button>
  )
}

// ══════════════════════════════════
// ABOUT ROW
// ══════════════════════════════════
function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text">{value}</span>
    </div>
  )
}