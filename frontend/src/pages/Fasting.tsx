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
import { DatePopover } from '../components/ui/DatePopover'
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
}

/**
 * Fasting page shell. Manages view state, API calls, and history.
 * All visual sub-sections are extracted into dedicated components.
 */
export default function FastingPage({ onBack }: FastingPageProps) {
  const [view, setView] = useState<View>('home')
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null)
  const [history, setHistory] = useState<FastRecord[]>(loadFasts)
  const [customFasts, setCustomFasts] = useState<CustomFast[]>(loadCustomFasts)
  const [selectedPreset, setSelectedPreset] = useState<FastingPreset | null>(null)
  const [calMonth, setCalMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<{
  date: string
  entries: CalendarEntry[]
} | null>(null)

  // Load active fast from backend on mount.
  const loadActive = useCallback(async () => {
    try {
      const fast = await api.fasting.getActive()
      if (fast) {
        setActiveFast(fast)
        setView('active')
      }
    } catch {
      // No active fast, that's fine.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  // Start a new fast via API.
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

  // End the active fast, save to local history.
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
      setView('home')
    } catch (err) {
      console.error('Failed to end fast:', err)
    }
  }

  // Save a new custom fast template.
  const handleSaveCustom = (cf: CustomFast): void => {
    const updated = [cf, ...customFasts]
    setCustomFasts(updated)
    saveCustomFasts(updated)
    setView('home')
  }

  // Delete a custom fast template.
  const handleDeleteCustom = (id: string): void => {
    const updated = customFasts.filter(c => c.id !== id)
    setCustomFasts(updated)
    saveCustomFasts(updated)
  }

  // Delete a history entry.
  const handleDeleteHistory = (id: string): void => {
    const updated = history.filter(f => f.id !== id)
    setHistory(updated)
    saveFasts(updated)
  }

  // Derived stats
  const streak = calculateStreak(history)
  const totalHours = history.reduce((sum, f) => sum + f.hours, 0)
  const longestFast = history.length > 0
    ? Math.max(...history.map(f => f.hours))
    : 0

  // Convert history to CalendarEntry format for the shared Calendar.
  const calendarEntries: CalendarEntry[] = history.map(f => ({
    date: f.date,
    color: getPreset(f.hours).color,
    label: `${f.name || getPreset(f.hours).name} (${f.hours}h)`,
  }))

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader onBack={onBack} title="Fasting" subtitle="Intermittent fasting tracker" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-forged-surface2 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader onBack={onBack} title="Fasting" subtitle="Intermittent fasting tracker" />

      {/* Active fast timer */}
      {view === 'active' && activeFast && (
        <TimerCard fast={activeFast} onEnd={endFast} />
      )}

      {/* Confirm preset before starting */}
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

      {/* Custom fast creation form */}
      {view === 'custom' && (
        <CustomFastForm
          onSave={handleSaveCustom}
          onStart={startFast}
          onCancel={() => setView('home')}
        />
      )}

      {/* Home view + always-visible stats/calendar/chart */}
      {(view === 'home' || view === 'active') && (
        <>
          {/* Preset selection (only on home, not during active fast) */}
          {view === 'home' && (
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

          {/* Stats */}
          <Card delay={view === 'active' ? 60 : 140}>
            <SectionLabel>Your Progress</SectionLabel>
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="Fasts" value={`${history.length}`} />
              <MiniStat label="Streak" value={`${streak}d`} />
              <MiniStat label="Longest" value={`${longestFast}h`} />
              <MiniStat label="Total" value={`${totalHours}h`} />
            </div>
          </Card>

          {/* Calendar */}
          <Card delay={view === 'active' ? 120 : 200}>
            <Calendar
              month={calMonth}
              onMonthChange={setCalMonth}
              entries={calendarEntries}
              legend={FASTING_LEGEND}
              onDateClick={(date, dayEntries) => {
                setSelectedDate({ date, entries: dayEntries })
              }}
            />
          </Card>

          {/* Weekly chart */}
          <WeekChart
            history={history}
            delay={view === 'active' ? 180 : 260}
          />

          {/* Recent fasts */}
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
{/* Date detail popover */}
      {selectedDate && (
        <DatePopover
          date={selectedDate.date}
          entries={selectedDate.entries}
          onClose={() => setSelectedDate(null)}
        />
      )}

      <div className="h-4" />
      <div className="h-4" />
    </div>
  )
}