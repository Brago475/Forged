import { useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import type { CustomFast } from './fastingConstants'

interface CustomFastFormProps {
  onSave: (cf: CustomFast) => void
  onStart: (hours: number) => void
  onCancel: () => void
}

/**
 * Form for creating a custom fasting window with name, hours,
 * meal count, meal times, and optional save-as-template.
 */
export function CustomFastForm({ onSave, onStart, onCancel }: CustomFastFormProps) {
  const [name, setName] = useState<string>('')
  const [hours, setHours] = useState<string>('')
  const [meals, setMeals] = useState<string>('2')
  const [mealTimes, setMealTimes] = useState<string[]>(['12:00', '18:00'])
  const [notes, setNotes] = useState<string>('')
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false)

  const eat = Math.max(24 - (parseInt(hours) || 0), 0)
  const mealCount = parseInt(meals) || 0

  const updateMealCount = (n: string): void => {
    setMeals(n)
    const count = parseInt(n) || 0
    const times: string[] = []
    for (let i = 0; i < count; i++) {
      times.push(mealTimes[i] || `${12 + i * 3}:00`)
    }
    setMealTimes(times)
  }

  const handleStart = (): void => {
    const h = parseInt(hours)
    if (!h || h < 1 || h > 72) return

    if (saveTemplate && name) {
      const cf: CustomFast = {
        id: crypto.randomUUID(),
        name,
        hours: h,
        eat,
        meals: mealCount,
        mealTimes,
        notes,
        color: '#e74c3c',
      }
      onSave(cf)
    }

    onStart(h)
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl ' +
    'text-forged-text text-sm placeholder:text-forged-text2 ' +
    'focus:border-forged-purple/50 transition-colors'

  return (
    <Card delay={0} className="!p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-lg font-black text-forged-text">
          Create Custom Fast
        </p>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center
            text-forged-text2 hover:text-forged-text transition-colors"
        >
          <Icon d={I.x} size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
            Fast Name
          </label>
          <input
            type="text"
            placeholder="e.g. My Evening Fast"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Hours + eating window */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
              Fasting Hours
            </label>
            <input
              type="number"
              placeholder="16"
              min={1}
              max={72}
              value={hours}
              onChange={e => setHours(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
              Eating Window
            </label>
            <div className="px-3.5 py-2.5 bg-forged-bg border border-forged-border rounded-xl">
              <span className="text-sm font-bold text-forged-text">
                {eat > 0 ? `${eat} hours` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Meal count */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
            Meals in Eating Window
          </label>
          <div className="flex gap-2">
            {['1', '2', '3', '4'].map(n => (
              <button
                key={n}
                onClick={() => updateMealCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${meals === n
                    ? 'bg-forged-purple text-white'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Meal times */}
        {mealCount > 0 && (
          <div>
            <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
              Meal Times
            </label>
            <div className="flex flex-col gap-2">
              {mealTimes.map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-forged-text2 w-16">
                    Meal {i + 1}
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={e => {
                      const updated = [...mealTimes]
                      updated[i] = e.target.value
                      setMealTimes(updated)
                    }}
                    className="flex-1 px-3 py-2 bg-forged-bg border border-forged-border
                      rounded-xl text-forged-text text-sm
                      focus:border-forged-purple/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            placeholder="Any notes about this fast..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Save toggle */}
        <button
          onClick={() => setSaveTemplate(!saveTemplate)}
          className="flex items-center justify-between py-2"
        >
          <span className="text-sm text-forged-text font-medium">
            Save as template
          </span>
          <div
            className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5
              ${saveTemplate
                ? 'bg-forged-purple'
                : 'bg-forged-surface2 border border-forged-border'
              }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-all duration-200 shadow-sm
                ${saveTemplate
                  ? 'translate-x-5 bg-white'
                  : 'translate-x-0 bg-forged-text2/40'
                }`}
            />
          </div>
        </button>

        {/* Summary */}
        {parseInt(hours) > 0 && (
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
            <p className="text-[10px] font-bold text-forged-text2 uppercase mb-2">
              Summary
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">
                {hours}h fasting
              </span>
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">
                {eat}h eating
              </span>
              <span className="text-[10px] font-bold text-forged-text bg-forged-surface2 px-2.5 py-1 rounded-full">
                {mealCount} meal{mealCount !== 1 ? 's' : ''}
              </span>
              {name && (
                <span className="text-[10px] font-bold text-forged-purple bg-forged-purple/10 px-2.5 py-1 rounded-full">
                  {name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={!parseInt(hours)}
            className="flex-1 py-3 rounded-xl text-sm font-black
              bg-forged-purple text-white hover:brightness-110
              active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Start Fast
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl text-sm font-bold text-forged-text2
              hover:text-forged-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Card>
  )
}