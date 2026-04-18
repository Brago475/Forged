import { useEffect, useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import { FoodLogger } from './FoodLogger'
import type { FastingLog, FoodLog } from '../../types'
import { getPreset, formatTime, loadCustomEatHours } from './fastingConstants'

interface TimerCardProps {
  fast: FastingLog
  onEnd: () => void
  /** Today's food logs, shown in the "Logged Today" section. */
  todayFood?: FoodLog[]
  /** Called after a food is logged from the inline logger. */
  onFoodLogged?: (log: FoodLog) => void
}

export function TimerCard({ fast, onEnd, todayFood = [], onFoodLogged }: TimerCardProps) {
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const startMs = new Date(fast.startTime).getTime()
  if (isNaN(startMs)) return null

  const elapsedSec = Math.max((now - startMs) / 1000, 0)
  const totalSec = fast.targetHours * 3600
  const remainingSec = Math.max(totalSec - elapsedSec, 0)
  const pct = Math.min(elapsedSec / totalSec, 1)
  const preset = getPreset(fast.targetHours)
  const isDone = remainingSec <= 0

  const customEatHours = loadCustomEatHours(fast.id)
  const eatHours = customEatHours ?? preset.eat
  const eatModified = customEatHours !== null && customEatHours !== preset.eat

  const rem = formatTime(remainingSec)
  const elap = formatTime(elapsedSec)

  const startDate = new Date(fast.startTime)
  const eatOpen = new Date(startDate.getTime() + fast.targetHours * 3600000)
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

  const totalCal = todayFood.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
  const totalProtein = todayFood.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
  const todayIso = new Date().toISOString().split('T')[0]

  return (
    <Card delay={0} className="!p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }} />
          <span className="text-base font-black text-forged-text">{preset.id}</span>
          <span className="text-xs text-forged-text2">{preset.name}</span>
        </div>
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
          <p className="text-xs font-black text-forged-text tabular-nums">{fast.targetHours}h</p>
          <p className="text-[9px] text-forged-text2 font-medium">Goal</p>
        </div>
      </div>

      <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
            Meal Window
          </span>
          {eatModified && (
            <span className="text-[9px] font-bold text-forged-purple bg-forged-purple/10 px-1.5 py-0.5 rounded-full">
              Custom {eatHours}h
            </span>
          )}
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

        {/* Inline logger: only active during eating window */}
        {inEatingWindow && (
          <div className="border-t border-forged-border pt-3 mb-3">
            <FoodLogger date={todayIso} onLogged={onFoodLogged} compact />
          </div>
        )}

        {todayFood.length > 0 && (
          <div className="border-t border-forged-border pt-3 mb-3">
            <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Logged Today
            </p>
            <div className="flex flex-col gap-1.5">
              {todayFood.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-forged-surface2/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-forged-green/15 flex items-center justify-center">
                      <Icon d={I.check} size={10} sw={3} className="text-forged-green" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-forged-text">{log.food?.name || 'Food'}</p>
                      <p className="text-[9px] text-forged-text2">{log.mealType}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-forged-text tabular-nums">
                    {(log.food?.calories ?? 0) * log.servings} cal
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-forged-border">
                <p className="text-[10px] font-bold text-forged-text2">Total</p>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-forged-text tabular-nums">{totalCal} cal</p>
                  <p className="text-[10px] font-bold text-forged-purple tabular-nums">{totalProtein}g protein</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mealSlots.length > 0 && (
          <div className="border-t border-forged-border pt-3">
            <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Scheduled Meals
            </p>
            <div className="flex flex-col gap-2">
              {mealSlots.map((slot, i) => {
                const isPast = now > slot.time.getTime()
                const isCurrent = inEatingWindow && !isPast
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border
                      ${isCurrent
                        ? 'border-forged-green/30 bg-forged-green/5'
                        : isPast
                          ? 'border-forged-border bg-forged-surface2/50'
                          : 'border-forged-border'
                      }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                      ${isPast ? 'bg-forged-surface2' : isCurrent ? 'bg-forged-green/15' : 'bg-forged-surface2'}`}>
                      <Icon d={I.food} size={13} sw={2}
                        className={isPast ? 'text-forged-text2' : isCurrent ? 'text-forged-green' : 'text-forged-text2'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${isPast ? 'text-forged-text2' : 'text-forged-text'}`}>
                        {slot.label}
                      </p>
                      <p className="text-[9px] text-forged-text2">{fmtTime(slot.time)}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-forged-green bg-forged-green/15 px-2 py-0.5 rounded-full">
                        Now
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <button onClick={onEnd}
        className="w-full py-3.5 rounded-xl text-sm font-black border transition-all active:scale-[0.98]
          bg-forged-red/10 text-forged-red border-forged-red/25 hover:bg-forged-red hover:text-white">
        End Fast
      </button>
    </Card>
  )
}