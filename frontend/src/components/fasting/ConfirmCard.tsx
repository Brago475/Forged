import { useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import { FoodLogger } from './FoodLogger'
import type { FastingPreset } from './fastingConstants'

interface ConfirmCardProps {
  preset: FastingPreset
  onStart: (customEatHours: number) => void
  onCancel: () => void
}

/**
 * Preview card shown after selecting a preset. Shows the fasting and eating
 * windows, lets the user adjust eating window duration, and optionally log
 * a pre-fast meal.
 */
export function ConfirmCard({ preset, onStart, onCancel }: ConfirmCardProps) {
  const [eatHours, setEatHours] = useState<number>(preset.eat)
  const [showLogger, setShowLogger] = useState<boolean>(false)

  const now = new Date()
  const eatOpen = new Date(now.getTime() + preset.hours * 3600000)
  const eatClose = new Date(eatOpen.getTime() + eatHours * 3600000)

  const fmtTime = (d: Date): string =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const todayIso = now.toISOString().split('T')[0]
  const eatModified = eatHours !== preset.eat

  const adjustEat = (delta: number): void => {
    const next = Math.max(1, Math.min(14, eatHours + delta))
    setEatHours(next)
  }

  return (
    <Card delay={0} className="!p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: preset.color + '18' }}
          >
            <Icon d={I[preset.iconKey]} size={24} sw={2} style={{ color: preset.color }} />
          </div>
          <div>
            <p className="text-xl font-black text-forged-text">{preset.id}</p>
            <p className="text-xs text-forged-text2 font-medium">{preset.name}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center
            text-forged-text2 hover:text-forged-text transition-colors"
        >
          <Icon d={I.x} size={16} />
        </button>
      </div>

      <p className="text-sm text-forged-text2 mb-5">{preset.desc}</p>

      {/* Schedule preview */}
      <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-4">
        {/* Fasting window */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon d={I.moon} size={14} className="text-forged-text2" />
            <span className="text-xs font-bold text-forged-text">Fasting Window</span>
          </div>
          <span className="text-xs font-bold text-forged-text2">{preset.hours} hours</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] text-forged-text2">{fmtTime(now)}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-forged-surface2">
            <div
              className="h-full rounded-full"
              style={{ width: '100%', backgroundColor: preset.color + '80' }}
            />
          </div>
          <span className="text-[10px] text-forged-text2">{fmtTime(eatOpen)}</span>
        </div>

        {/* Eating window, editable */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon d={I.sun} size={14} className="text-forged-text2" />
            <span className="text-xs font-bold text-forged-text">Eating Window</span>
            {eatModified && (
              <span className="text-[9px] font-bold text-forged-purple bg-forged-purple/10 px-1.5 py-0.5 rounded-full">
                Custom
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustEat(-0.5)}
              disabled={eatHours <= 1}
              className="w-6 h-6 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.minus} size={10} sw={2.5} />
            </button>
            <span className="text-xs font-black text-forged-text tabular-nums min-w-[40px] text-center">
              {eatHours}h
            </span>
            <button
              onClick={() => adjustEat(0.5)}
              disabled={eatHours >= 14}
              className="w-6 h-6 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.plus} size={10} sw={2.5} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-forged-text2">{fmtTime(eatOpen)}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-forged-surface2">
            <div className="h-full rounded-full bg-forged-green/60" style={{ width: '100%' }} />
          </div>
          <span className="text-[10px] text-forged-text2">{fmtTime(eatClose)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Icon d={I.food} size={14} className="text-forged-text2" />
          <span className="text-xs text-forged-text2">
            {preset.meals} meal{preset.meals > 1 ? 's' : ''} during eating window
          </span>
        </div>
      </div>

      {/* Optional pre-fast meal log */}
      {showLogger ? (
        <div className="mb-4">
          <FoodLogger date={todayIso} compact />
          <button
            onClick={() => setShowLogger(false)}
            className="w-full mt-2 text-[11px] font-bold text-forged-text2
              hover:text-forged-text py-1.5 transition-colors"
          >
            Done logging
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLogger(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 py-2.5
            rounded-xl border border-dashed border-forged-border
            text-forged-text2 text-xs font-bold hover:text-forged-text
            hover:border-forged-green/30 transition-all"
        >
          <Icon d={I.food} size={12} />
          Log pre-fast meal (optional)
        </button>
      )}

      <button
        onClick={() => onStart(eatHours)}
        className="w-full py-3.5 rounded-xl text-sm font-black text-white
          transition-all active:scale-[0.98] hover:brightness-110 shadow-lg"
        style={{
          backgroundColor: preset.color,
          boxShadow: `0 8px 24px ${preset.color}30`,
        }}
      >
        Start {preset.id} Fast
      </button>
    </Card>
  )
}