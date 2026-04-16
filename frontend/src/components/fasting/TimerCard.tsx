import { useEffect, useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import type { FastingLog } from '../../types'
import { getPreset, formatTime } from './fastingConstants'

interface TimerCardProps {
  fast: FastingLog
  onEnd: () => void
  /** Navigate to food log to add a meal during eating window. */
  onAddMeal?: () => void
}

/**
 * Active fast timer with animated SVG ring, stats row,
 * meal window preview, and end button.
 */
export function TimerCard({ fast, onEnd, onAddMeal }: TimerCardProps) {
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

  const rem = formatTime(remainingSec)
  const elap = formatTime(elapsedSec)

  const startDate = new Date(fast.startTime)
  const eatOpen = new Date(startDate.getTime() + fast.targetHours * 3600000)
  const eatClose = new Date(eatOpen.getTime() + preset.eat * 3600000)
  const inEatingWindow = now >= eatOpen.getTime()

  // SVG ring dimensions
  const size = 200
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const fmtTime = (d: Date): string =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <Card delay={0} className="!p-6 relative overflow-hidden">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: preset.color }}
          />
          <span className="text-base font-black text-forged-text">
            {preset.id}
          </span>
          <span className="text-xs text-forged-text2">{preset.name}</span>
        </div>
        <span
          className={`text-[10px] font-bold px-3 py-1 rounded-full
            ${inEatingWindow
              ? 'bg-forged-green/15 text-forged-green'
              : 'bg-forged-purple/15 text-forged-purple'
            }`}
        >
          {isDone ? 'Complete' : inEatingWindow ? 'Eating Window' : 'Fasting'}
        </span>
      </div>

      {/* Ring timer */}
      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              opacity={0.2}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isDone ? '#2ecc71' : preset.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.5s ease',
                filter: `drop-shadow(0 0 10px ${preset.color}40)`,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isDone ? (
              <>
                <Icon d={I.check} size={36} className="text-forged-green mb-1" sw={2.5} />
                <p className="text-lg font-black text-forged-green">
                  Fast Complete!
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-forged-text2 font-bold uppercase mb-1">
                  Remaining
                </p>
                <p className="text-4xl font-black text-forged-text tabular-nums tracking-tight">
                  {String(rem.h).padStart(2, '0')}:{String(rem.m).padStart(2, '0')}
                </p>
                <p className="text-xl font-bold text-forged-text2 tabular-nums -mt-1">
                  {String(rem.s).padStart(2, '0')}
                  <span className="text-xs">s</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">
            {elap.h}h {elap.m}m
          </p>
          <p className="text-[9px] text-forged-text2 font-medium">Elapsed</p>
        </div>
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">
            {Math.round(pct * 100)}%
          </p>
          <p className="text-[9px] text-forged-text2 font-medium">Progress</p>
        </div>
        <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5 text-center">
          <p className="text-xs font-black text-forged-text tabular-nums">
            {fast.targetHours}h
          </p>
          <p className="text-[9px] text-forged-text2 font-medium">Goal</p>
        </div>
      </div>

      {/* Meal window */}
      <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
            Meal Window
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] text-forged-text2 uppercase font-bold">Opens</p>
            <p className="text-sm font-black text-forged-text">
              {fmtTime(eatOpen)}
            </p>
          </div>
          <div className="flex-1 mx-4 h-1 rounded-full bg-forged-surface2 relative overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(pct / (fast.targetHours / 24), 1) * 100}%`,
                backgroundColor: preset.color,
              }}
            />
          </div>
          <div className="text-right">
            <p className="text-[9px] text-forged-text2 uppercase font-bold">Closes</p>
            <p className="text-sm font-black text-forged-text">
              {fmtTime(eatClose)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-forged-text2 mt-2 text-center">
          {preset.meals} meal{preset.meals > 1 ? 's' : ''} recommended
        </p>

        {/* Add meal button during eating window */}
        {inEatingWindow && onAddMeal && (
          <button
            onClick={onAddMeal}
            className="w-full mt-3 py-2.5 rounded-xl text-xs font-black
              bg-forged-green/10 text-forged-green border border-forged-green/20
              hover:bg-forged-green hover:text-white active:scale-95 transition-all
              flex items-center justify-center gap-2"
          >
            <Icon d={I.food} size={14} sw={2} />
            Add Meal
          </button>
        )}
      </div>

      {/* End button */}
      <button
        onClick={onEnd}
        className="w-full py-3.5 rounded-xl text-sm font-black border
          transition-all active:scale-[0.98]
          bg-forged-red/10 text-forged-red border-forged-red/25
          hover:bg-forged-red hover:text-white"
      >
        End Fast
      </button>
    </Card>
  )
}