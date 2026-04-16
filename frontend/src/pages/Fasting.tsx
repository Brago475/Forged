import { useState, useEffect, useCallback } from 'react'
import { api } from '../hooks/api'
import type { FastingLog } from '../types'
import type { CalendarEntry } from '../components/ui/Calendar'

// Shared UI
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { SectionLabel } from '../components/ui/SectionLabel'
import { MiniStat } from '../components/ui/MiniStat'
import { Calendar } from '../components/ui/Calendar'
import { Icon, I } from '../components/ui/Icon'

// Fasting components
import { TimerCard } from '../components/fasting/TimerCard'
import { ConfirmCard } from '../components/fasting/ConfirmCard'
import { CustomFastForm } from '../components/fasting/CustomFastForm'
import { PresetList } from '../components/fasting/PresetList'
import { WeekChart } from '../components/fasting/WeekChart'
import {
  type FastingPreset,
  type FastRecord,
  type CustomFast,
  getPreset,
  calculateStreak,
  loadFasts,
  saveFasts,
  loadCustomFasts,
  saveCustomFasts,
  FASTING_LEGEND,
} from '../components/fasting/fastingConstants'

type View = 'home' | 'confirm' | 'custom' | 'active'

interface FastingPageProps {
  onBack: () => void
  onNavigate?: (tab: string) => void
}

export default function FastingPage({ onBack, onNavigate }: FastingPageProps) {
  const [view, setView] = useState<View>('home')
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [history, setHistory] = useState<FastRecord[]>(loadFasts)
  const [customFasts, setCustomFasts] = useState<CustomFast[]>(loadCustomFasts)
  const [selectedPreset, setSelectedPreset] = useState<FastingPreset | null>(null)
  const [calMonth, setCalMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(true)

  const loadActive = useCallback(async () => {
    try {
      const fast = await api.fasting.getActive()
      if (fast) {
        const startMs = new Date(fast.startTime).getTime()
        const elapsedHours = (Date.now() - startMs) / 3600000

        // If the fast is way past its target, mark it as stale
        // so we show a dismissal banner instead of the full timer.
        if (elapsedHours > fast.targetHours * 2) {
          setActiveFast(fast)
          setIsStale(true)
          // Stay on home view so presets are visible behind the banner
          setView('home')
        } else {
          setActiveFast(fast)
          setIsStale(false)
          setView('active')
        }
      }
    } catch {
      // No active fast
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  // Dismiss a stale fast (end it on the backend, optionally save to history).
  const dismissStaleFast = async (saveToHistory: boolean): Promise<void> => {
    if (!activeFast) return
    try {
      await api.fasting.end(activeFast.id, {})
      if (saveToHistory) {
        const preset = getPreset(activeFast.targetHours)
        const record: FastRecord = {
          id: crypto.randomUUID(),
          name: preset.name,
          hours: activeFast.targetHours,
          meals: preset.meals,
          mealTimes: [],
          notes: 'Completed (late)',
          startTime: activeFast.startTime,
          endTime: new Date().toISOString(),
          date: new Date(activeFast.startTime).toISOString().split('T')[0],
        }
        const updated = [record, ...history]
        setHistory(updated)
        saveFasts(updated)
      }
      setActiveFast(null)
      setIsStale(false)
    } catch (err) {
      console.error('Failed to dismiss fast:', err)
    }
  }

  const startFast = async (hours: number): Promise<void> => {
    try {
      await api.fasting.start({ targetHours: hours })
      await loadActive()
      setView('active')
      setSelectedPreset(null)
    } catch (err) {
      console.error('Failed to start fast:', err)
    }
  }

  const endFast = async (): Promise<void> => {
    if (!activeFast) return
    try {
      await api.fasting.end(activeFast.id, {})
      const preset = getPreset(activeFast.targetHours)
      const record: FastRecord = {
        id: crypto.randomUUID(),
        name: preset.name,
        hours: activeFast.targetHours,
        meals: preset.meals,
        mealTimes: [],
        notes: '',
        startTime: activeFast.startTime,
        endTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      }
      const updated = [record, ...history]
      setHistory(updated)
      saveFasts(updated)
      setActiveFast(null)
      setIsStale(false)
      setView('home')
    } catch (err) {
      console.error('Failed to end fast:', err)
    }
  }

  const handleSaveCustom = (cf: CustomFast): void => {
    const updated = [cf, ...customFasts]
    setCustomFasts(updated)
    saveCustomFasts(updated)
    setView('home')
  }

  const handleDeleteCustom = (id: string): void => {
    const updated = customFasts.filter(c => c.id !== id)
    setCustomFasts(updated)
    saveCustomFasts(updated)
  }

  const handleDeleteHistory = (id: string): void => {
    const updated = history.filter(f => f.id !== id)
    setHistory(updated)
    saveFasts(updated)
  }

  const streak = calculateStreak(history)
  const totalHours = history.reduce((sum, f) => sum + f.hours, 0)
  const longestFast = history.length > 0
    ? Math.max(...history.map(f => f.hours))
    : 0

  const calendarEntries: CalendarEntry[] = history.map(f => {
    const preset = getPreset(f.hours)
    return {
      date: f.date,
      color: preset.color,
      label: `${f.name || preset.name} (${f.hours}h)`,
      iconKey: preset.iconKey,
    }
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader onBack={onBack} title="Fasting" subtitle="Intermittent fasting tracker" />
        {/* Quick action: always available to log food */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('food')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl
            bg-forged-surface border border-forged-border
            hover:border-forged-green/30 active:scale-[0.99] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-forged-green/15 flex items-center justify-center flex-shrink-0">
            <Icon d={I.food} size={18} className="text-forged-green" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-forged-text">Log a Meal</p>
            <p className="text-[10px] text-forged-text2">
              {activeFast && !isStale
                ? 'Track what you eat during your fast'
                : 'Log your meal before starting a fast'
              }
            </p>
          </div>
          <Icon d={I.chevron} size={16} className="text-forged-text2" />
        </button>
      )}
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader onBack={onBack} title="Fasting" subtitle="Intermittent fasting tracker" />

      {/* Stale fast banner: old fast that was never ended */}
      {isStale && activeFast && (
        <Card delay={0} className="!p-4 border-forged-red/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-forged-red/10 flex items-center justify-center flex-shrink-0">
              <Icon d={I.clock} size={16} className="text-forged-red" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-forged-text">Unfinished fast</p>
              <p className="text-[10px] text-forged-text2">
                {getPreset(activeFast.targetHours).name} ({activeFast.targetHours}h) from{' '}
                {new Date(activeFast.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dismissStaleFast(true)}
              className="flex-1 py-2.5 rounded-xl text-xs font-black
                bg-forged-purple/10 text-forged-purple border border-forged-purple/20
                hover:bg-forged-purple hover:text-white active:scale-95 transition-all"
            >
              Save & Dismiss
            </button>
            <button
              onClick={() => dismissStaleFast(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-black
                bg-forged-surface2 text-forged-text2 border border-forged-border
                hover:text-forged-text active:scale-95 transition-all"
            >
              Discard
            </button>
          </div>
        </Card>
      )}

      {/* Active fast timer (only for fresh, non-stale fasts) */}
      {view === 'active' && activeFast && !isStale && (
        <TimerCard
          fast={activeFast}
          onEnd={endFast}
          onAddMeal={onNavigate ? () => onNavigate('food') : undefined}
        />
      )}

      {view === 'confirm' && selectedPreset && (
        <ConfirmCard
          preset={selectedPreset}
          onStart={() => startFast(selectedPreset.hours)}
          onCancel={() => {
            setView('home')
            setSelectedPreset(null)
          }}
        />
      )}

      {view === 'custom' && (
        <CustomFastForm
          onSave={handleSaveCustom}
          onStart={startFast}
          onCancel={() => setView('home')}
        />
      )}

      {(view === 'home' || view === 'active') && (
        <>
          {/* Presets: show on home, or on active if the fast is stale (so user can start a new one) */}
          {(view === 'home' || isStale) && (
            <PresetList
              onSelect={(preset) => {
                setSelectedPreset(preset)
                setView('confirm')
              }}
              onStartCustom={startFast}
              onCreateCustom={() => setView('custom')}
              customFasts={customFasts}
              onDeleteCustom={handleDeleteCustom}
            />
          )}

          <Card delay={view === 'active' ? 60 : 140}>
            <SectionLabel>Your Progress</SectionLabel>
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="Fasts" value={`${history.length}`} />
              <MiniStat label="Streak" value={`${streak}d`} />
              <MiniStat label="Longest" value={`${longestFast}h`} />
              <MiniStat label="Total" value={`${totalHours}h`} />
            </div>
          </Card>

          <Card delay={view === 'active' ? 120 : 200}>
            <Calendar
              month={calMonth}
              onMonthChange={setCalMonth}
              entries={calendarEntries}
              legend={FASTING_LEGEND}
            />
          </Card>

          <WeekChart
            history={history}
            delay={view === 'active' ? 180 : 260}
          />

          <Card delay={view === 'active' ? 240 : 320}>
            <SectionLabel>Recent Fasts</SectionLabel>
            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Icon d={I.moon} size={28} className="text-forged-text2 mx-auto mb-2" />
                <p className="text-sm font-bold text-forged-text">No fasts yet</p>
                <p className="text-xs text-forged-text2 mt-1">
                  Complete your first fast to see it here
                </p>
              </div>
            ) : (
              <div className="flex flex-col max-h-60 overflow-y-auto">
                {history.slice(0, 20).map(fast => {
                  const preset = getPreset(fast.hours)
                  const start = new Date(fast.startTime)
                  const end = new Date(fast.endTime)
                  const durationHours = (
                    (end.getTime() - start.getTime()) / 3600000
                  ).toFixed(1)

                  return (
                    <div
                      key={fast.id}
                      className="flex items-center justify-between py-3
                        border-b border-forged-text2/10 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-forged-text">
                              {fast.name || preset.name}
                            </p>
                            <span className="text-[9px] text-forged-text2">
                              · {preset.id}
                            </span>
                          </div>
                          <p className="text-[10px] text-forged-text2">
                            {start.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · {durationHours}h · {fast.meals} meal
                            {fast.meals !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHistory(fast.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center
                          text-forged-text2 hover:text-forged-red transition-colors"
                      >
                        <Icon d={I.trash} size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}