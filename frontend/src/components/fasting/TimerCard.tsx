import { useEffect, useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import { FoodLogger } from './FoodLogger'
import { EditFastSheet } from './EditFastSheet'
import { api } from '../../hooks/api'
import type { FastingLog, FoodLog } from '../../types'
import {
  getPreset,
  formatTime,
  loadCustomEatHours,
  saveCustomEatHours,
  loadCustomStartTime,
  saveCustomStartTime,
  loadCustomTargetHours,
  saveCustomTargetHours,
} from './fastingConstants'

interface TimerCardProps {
  fast: FastingLog
  onEnd: () => void
  todayFood?: FoodLog[]
  onFoodLogged?: (log: FoodLog) => void
  onFoodDeleted?: (logId: string) => void
  /** Called after edits are saved, so the parent can refresh. */
  onFastEdited?: () => void
}

const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

function getMealTypeForTime(d: Date): string {
  const h = d.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 16) return 'afternoon'
  if (h >= 16 && h < 21) return 'evening'
  return 'snack'
}

export function TimerCard({
  fast,
  onEnd,
  todayFood = [],
  onFoodLogged,
  onFoodDeleted,
  onFastEdited,
}: TimerCardProps) {
  const [now, setNow] = useState<number>(Date.now())
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null)
  const [showEdit, setShowEdit] = useState<boolean>(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Resolve effective values (localStorage overrides backend values)
  const customStart = loadCustomStartTime(fast.id)
  const customTarget = loadCustomTargetHours(fast.id)
  const customEatHours = loadCustomEatHours(fast.id)

  const effectiveStartTime = customStart ?? fast.startTime
  const effectiveTargetHours = customTarget ?? fast.targetHours
  const preset = getPreset(effectiveTargetHours)
  const eatHours = customEatHours ?? preset.eat

  const startMs = new Date(effectiveStartTime).getTime()
  if (isNaN(startMs)) return null

  const elapsedSec = Math.max((now - startMs) / 1000, 0)
  const totalSec = effectiveTargetHours * 3600
  const remainingSec = Math.max(totalSec - elapsedSec, 0)
  const pct = Math.min(elapsedSec / totalSec, 1)
  const isDone = remainingSec <= 0

  const anyModified = customStart !== null || customTarget !== null || (customEatHours !== null && customEatHours !== preset.eat)

  const rem = formatTime(remainingSec)
  const elap = formatTime(elapsedSec)

  const startDate = new Date(effectiveStartTime)
  const eatOpen = new Date(startDate.getTime() + effectiveTargetHours * 3600000)
  const eatClose = new Date(eatOpen.getTime() + eatHours * 3600000)
  const inEatingWindow = now >= eatOpen.getTime() && now < eatClose.getTime()

  const size = 200
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const fmtTime = (d: Date): string =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const mealSlots: { label: string; time: Date }[] = []
  if (preset.meals > 0) {
    const eatDurationMs = eatClose.getTime() - eatOpen.getTime()
    for (let i = 0; i < preset.meals; i++) {
      const offset = preset.meals === 1
        ? eatDurationMs / 2
        : (eatDurationMs / (preset.meals - 1)) * i
      mealSlots.push({
        label: `Meal ${i + 1}`,
        time: new Date(eatOpen.getTime() + offset),
      })
    }
  }

  const currentSlotIndex = inEatingWindow
    ? mealSlots.findIndex(slot => now <= slot.time.getTime() + 30 * 60000)
    : -1

  const totalCal = todayFood.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
  const totalProtein = todayFood.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
  const todayIso = new Date().toISOString().split('T')[0]

  const handleDelete = async (logId: string): Promise<void> => {
    try {
      await api.food.deleteFoodLog(logId)
      onFoodDeleted?.(logId)
    } catch (err) {
      console.error('Failed to delete log:', err)
    }
  }

  const handleEditSave = (next: { startTime: string; targetHours: number; eatHours: number }): void => {
    saveCustomStartTime(fast.id, next.startTime)
    saveCustomTargetHours(fast.id, next.targetHours)
    const newPreset = getPreset(next.targetHours)
    if (next.eatHours !== newPreset.eat) {
      saveCustomEatHours(fast.id, next.eatHours)
    }
    onFastEdited?.()
  }

  return (
    <>
      <Card delay={0} className="!p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }} />
            <span className="text-base font-black text-forged-text">{preset.id}</span>
            <span className="text-xs text-forged-text2">{preset.name}</span>
            {anyModified && (
              <span className="text-[9px] font-bold text-forged-purple bg-forged-purple/10 px-1.5 py-0.5 rounded-full">
                Edited
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="w-8 h-8 rounded-lg border border-forged-border
                flex items-center justify-center text-forged-text2
                hover:text-forged-text active:scale-95 transition-all"
              title="Edit fast"
            >
              <Icon d={I.edit} size={13} />
            </button>
            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full
                ${isDone
                  ? 'bg-forged-green/15 text-forged-green'
                  : inEatingWindow
                    ? 'bg-forged-green/15 text-forged-green'
                    : 'bg-forged-purple/15 text-forged-purple'
                }`}
            >
              {isDone ? 'Complete' : inEatingWindow ? 'Eating Window' : 'Fasting'}
            </span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="var(--border)" strokeWidth={strokeWidth} opacity={0.2} />
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={isDone ? '#2ecc71' : preset.color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.5s ease',
                  filter: `drop-shadow(0 0 10px ${preset.color}40)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isDone ? (
                <>
                  <Icon d={I.check} size={36} className="text-forged-green mb-1" sw={2.5} />
                  <p className="text-lg font-black text-forged-green">Fast Complete!</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-forged-text2 font-bold uppercase mb-1">Remaining</p>
                  <p className="text-4xl font-black text-forged-text tabular-nums tracking-tight">
                    {String(rem.h).padStart(2, '0')}:{String(rem.m).padStart(2, '0')}
                  </p>
                  <p className="text-xl font-bold text-forged-text2 tabular-nums -mt-1">
                    {String(rem.s).padStart(2, '0')}<span className="text-xs">s</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-xs font-black text-forged-text tabular-nums">{elap.h}h {elap.m}m</p>
            <p className="text-[9px] text-forged-text2 font-medium">Elapsed</p>
          </div>
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-xs font-black text-forged-text tabular-nums">{Math.round(pct * 100)}%</p>
            <p className="text-[9px] text-forged-text2 font-medium">Progress</p>
          </div>
          <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
            <p className="text-xs font-black text-forged-text tabular-nums">{effectiveTargetHours}h</p>
            <p className="text-[9px] text-forged-text2 font-medium">Goal</p>
          </div>
        </div>

        <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon d={I.food} size={14} className="text-forged-text2" />
            <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
              Meal Window
            </span>
            <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full
              ${inEatingWindow
                ? 'bg-forged-green/15 text-forged-green'
                : 'bg-forged-surface2 text-forged-text2'
              }`}>
              {inEatingWindow ? 'Open' : 'Closed'}
            </span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[9px] text-forged-text2 uppercase font-bold">Opens</p>
              <p className="text-sm font-black text-forged-text">{fmtTime(eatOpen)}</p>
            </div>
            <div className="flex-1 mx-4 h-1 rounded-full bg-forged-surface2 relative overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${Math.min(pct, 1) * 100}%`,
                backgroundColor: preset.color,
              }} />
            </div>
            <div className="text-right">
              <p className="text-[9px] text-forged-text2 uppercase font-bold">Closes</p>
              <p className="text-sm font-black text-forged-text">{fmtTime(eatClose)}</p>
            </div>
          </div>

          {todayFood.length > 0 && (
            <div className="flex justify-between items-center py-2.5 px-3 mb-3
              rounded-lg bg-forged-surface2/50 border border-forged-border">
              <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
                Today
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-forged-text tabular-nums">{totalCal} cal</span>
                <span className="text-[11px] font-black text-forged-purple tabular-nums">{totalProtein}g protein</span>
              </div>
            </div>
          )}

          {mealSlots.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-forged-border pt-3">
              <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider mb-1">
                Meals
              </p>
              {mealSlots.map((slot, i) => {
                const slotMealType = getMealTypeForTime(slot.time)
                const slotFoods = todayFood.filter(l => l.mealType === slotMealType)
                const slotCal = slotFoods.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
                const isCurrent = i === currentSlotIndex
                const isPast = now > slot.time.getTime() + 60 * 60000
                const isExpanded = expandedSlot === i

                return (
                  <div
                    key={i}
                    className={`rounded-xl border transition-all overflow-hidden
                      ${isCurrent
                        ? 'border-forged-green/30 bg-forged-green/5'
                        : isPast
                          ? 'border-forged-border bg-forged-surface2/30'
                          : 'border-forged-border'
                      }`}
                  >
                    <button
                      onClick={() => setExpandedSlot(isExpanded ? null : i)}
                      className="w-full flex items-center gap-2.5 p-2.5 text-left
                        hover:bg-forged-surface2/40 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                        ${isCurrent ? 'bg-forged-green/15' : 'bg-forged-surface2'}`}>
                        <Icon d={I.food} size={13} sw={2}
                          className={isCurrent ? 'text-forged-green' : 'text-forged-text2'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold ${isPast && !isCurrent ? 'text-forged-text2' : 'text-forged-text'}`}>
                            {slot.label}
                          </p>
                          <span className="text-[9px] text-forged-text2">
                            · {MEAL_LABELS[slotMealType]}
                          </span>
                        </div>
                        <p className="text-[9px] text-forged-text2">
                          {fmtTime(slot.time)}
                          {slotFoods.length > 0 && (
                            <span className="text-forged-text font-bold"> · {slotFoods.length} item{slotFoods.length > 1 ? 's' : ''}</span>
                          )}
                        </p>
                      </div>
                      {slotCal > 0 && (
                        <span className="text-xs font-black text-forged-text tabular-nums">
                          {slotCal} cal
                        </span>
                      )}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform
                        ${isExpanded ? 'rotate-45' : ''}
                        ${isCurrent ? 'bg-forged-green/20 text-forged-green' : 'bg-forged-surface2 text-forged-text2'}`}>
                        <Icon d={I.plus} size={10} sw={2.5} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-forged-border p-3 bg-forged-bg/40">
                        {slotFoods.length > 0 && (
                          <div className="flex flex-col gap-1.5 mb-3">
                            {slotFoods.map(log => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between py-1.5 px-2
                                  rounded-lg bg-forged-surface2/50"
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
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-[10px] font-bold text-forged-text tabular-nums">
                                    {(log.food?.calories ?? 0) * log.servings} cal
                                  </span>
                                  <button
                                    onClick={() => handleDelete(log.id)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center
                                      text-forged-text2 hover:text-forged-red hover:bg-forged-red/10
                                      active:scale-90 transition-all"
                                  >
                                    <Icon d={I.x} size={10} sw={2} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Logger always available, time-routed to the correct meal type */}
                        <FoodLogger
                          date={todayIso}
                          mealType={slotMealType}
                          onLogged={onFoodLogged}
                          compact
                        />
                        {!inEatingWindow && (
                          <p className="text-[9px] text-forged-text2 italic text-center mt-2">
                            Logging outside eating window
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button onClick={onEnd}
          className="w-full py-3.5 rounded-xl text-sm font-black border transition-all active:scale-[0.98]
            bg-forged-red/10 text-forged-red border-forged-red/25 hover:bg-forged-red hover:text-white">
          End Fast
        </button>
      </Card>

      {showEdit && (
        <EditFastSheet
          startTime={effectiveStartTime}
          targetHours={effectiveTargetHours}
          eatHours={eatHours}
          onSave={handleEditSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}