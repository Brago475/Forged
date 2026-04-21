import { useEffect, useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { api } from '../../hooks/api'
import type { FoodLog } from '../../types'
import { getPreset, type FastRecord } from './fastingConstants'
import { InlineSpinner } from '../loading/InlineSpinner'

interface FastDetailModalProps {
  fast: FastRecord
  onClose: () => void
  onDelete: (id: string) => void
}

const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

/**
 * Detail modal for a completed fast: shows start/end times, duration,
 * eating window times, and any food logged during the eating window.
 */
export function FastDetailModal({ fast, onClose, onDelete }: FastDetailModalProps) {
  const [foods, setFoods] = useState<FoodLog[]>([])
  const [loadingFoods, setLoadingFoods] = useState<boolean>(true)

  const preset = getPreset(fast.hours)
  const startDate = new Date(fast.startTime)
  const endDate = new Date(fast.endTime)
  const durationMs = endDate.getTime() - startDate.getTime()
  const durationHours = durationMs / 3600000
  const completionPct = Math.min((durationHours / fast.hours) * 100, 100)
  const completed = durationHours >= fast.hours

  // Eating window: the period AFTER the fast ended (on the end date)
  const eatOpen = endDate
  const eatClose = new Date(eatOpen.getTime() + preset.eat * 3600000)

  useEffect(() => {
    const loadFoods = async (): Promise<void> => {
      setLoadingFoods(true)
      try {
        const logs = await api.food.getLogs(fast.date)
        setFoods(logs ?? [])
      } catch {
        setFoods([])
      } finally {
        setLoadingFoods(false)
      }
    }
    loadFoods()
  }, [fast.date])

  const totalCal = foods.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
  const totalProtein = foods.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
  const totalCarbs = foods.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0)
  const totalFat = foods.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0)

  const fmtDateTime = (d: Date): string =>
    d.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

  const fmtTime = (d: Date): string =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const handleDelete = (): void => {
    if (confirm('Delete this fast from history?')) {
      onDelete(fast.id)
      onClose()
    }
  }

  // Group foods by meal
  const byMeal: Record<string, FoodLog[]> = {}
  foods.forEach(log => {
    const key = log.mealType || 'snack'
    if (!byMeal[key]) byMeal[key] = []
    byMeal[key].push(log)
  })

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center
        bg-black/50 backdrop-blur-sm px-3 py-4"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: preset.color + '20', color: preset.color }}
            >
              <Icon d={I[preset.iconKey]} size={20} sw={2} />
            </div>
            <div>
              <p className="text-lg font-black text-forged-text">
                {fast.name || preset.name}
              </p>
              <p className="text-[10px] text-forged-text2">
                {preset.id} &middot; {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <Icon d={I.x} size={16} />
          </button>
        </div>

        {/* Status pill */}
        <div className="mb-4">
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full
              ${completed
                ? 'bg-forged-green/15 text-forged-green'
                : 'bg-forged-purple/15 text-forged-purple'}`}
          >
            {completed ? 'Completed' : 'Incomplete'} &middot; {durationHours.toFixed(1)}h / {fast.hours}h
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-forged-surface2 overflow-hidden mb-5">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${completionPct}%`, backgroundColor: preset.color }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-sm font-black text-forged-text tabular-nums">{durationHours.toFixed(1)}h</p>
            <p className="text-[9px] text-forged-text2 font-bold uppercase">Duration</p>
          </div>
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-sm font-black text-forged-text tabular-nums">{foods.length}</p>
            <p className="text-[9px] text-forged-text2 font-bold uppercase">Meals</p>
          </div>
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-sm font-black text-forged-text tabular-nums">{totalCal}</p>
            <p className="text-[9px] text-forged-text2 font-bold uppercase">Calories</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-3">
            Timeline
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-forged-purple flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-forged-text2 font-bold uppercase">Fast Started</p>
                <p className="text-xs font-bold text-forged-text">{fmtDateTime(startDate)}</p>
              </div>
            </div>
            <div className="h-4 w-px bg-forged-border ml-[3px]" />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-forged-green flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-forged-text2 font-bold uppercase">Fast Ended / Eating Opened</p>
                <p className="text-xs font-bold text-forged-text">{fmtDateTime(endDate)}</p>
              </div>
            </div>
            <div className="h-4 w-px bg-forged-border ml-[3px]" />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-forged-text2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-forged-text2 font-bold uppercase">Eating Window Closes</p>
                <p className="text-xs font-bold text-forged-text">{fmtTime(eatClose)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Foods */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-3">
            Foods Logged
          </p>
          {loadingFoods ? (
            <div className="py-4 flex justify-center"><InlineSpinner size="md" /></div>
          ) : foods.length === 0 ? (
            <div className="py-6 text-center bg-forged-bg border border-forged-border rounded-xl">
              <Icon d={I.food} size={20} className="text-forged-text2 mx-auto mb-1.5" />
              <p className="text-xs text-forged-text2">No foods logged on this day</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {Object.entries(byMeal).map(([mealKey, logs]) => (
                  <div key={mealKey} className="bg-forged-bg border border-forged-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-black text-forged-text uppercase tracking-wider">
                        {MEAL_LABELS[mealKey] || mealKey}
                      </p>
                      <p className="text-[10px] font-bold text-forged-text2 tabular-nums">
                        {logs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)} cal
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {logs.map(log => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-1 px-2 rounded-md
                            bg-forged-surface2/40"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-forged-text truncate">
                              {log.food?.name || 'Food'}
                            </p>
                            <p className="text-[9px] text-forged-text2">
                              P:{(log.food?.protein ?? 0) * log.servings}g
                              {' · '}C:{(log.food?.carbs ?? 0) * log.servings}g
                              {' · '}F:{(log.food?.fat ?? 0) * log.servings}g
                            </p>
                          </div>
                          <p className="text-[10px] font-bold text-forged-text tabular-nums ml-2">
                            {(log.food?.calories ?? 0) * log.servings} cal
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Macro summary */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="bg-forged-bg border border-forged-border rounded-lg p-2 text-center">
                  <p className="text-xs font-black text-forged-text tabular-nums">{totalProtein}g</p>
                  <p className="text-[8px] text-forged-text2 font-bold uppercase">Protein</p>
                </div>
                <div className="bg-forged-bg border border-forged-border rounded-lg p-2 text-center">
                  <p className="text-xs font-black text-forged-text tabular-nums">{totalCarbs}g</p>
                  <p className="text-[8px] text-forged-text2 font-bold uppercase">Carbs</p>
                </div>
                <div className="bg-forged-bg border border-forged-border rounded-lg p-2 text-center">
                  <p className="text-xs font-black text-forged-text tabular-nums">{totalFat}g</p>
                  <p className="text-[8px] text-forged-text2 font-bold uppercase">Fat</p>
                </div>
                <div className="bg-forged-bg border border-forged-border rounded-lg p-2 text-center">
                  <p className="text-xs font-black text-forged-text tabular-nums">{totalCal}</p>
                  <p className="text-[8px] text-forged-text2 font-bold uppercase">Cal</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        {fast.notes && (
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-5">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-xs text-forged-text">{fast.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-black
              bg-forged-surface2 text-forged-text2 border border-forged-border
              hover:text-forged-text active:scale-[0.98] transition-all"
          >
            Close
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-3 rounded-xl text-sm font-black
              bg-forged-red/10 text-forged-red border border-forged-red/25
              hover:bg-forged-red hover:text-white active:scale-[0.98] transition-all"
          >
            <Icon d={I.trash} size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}