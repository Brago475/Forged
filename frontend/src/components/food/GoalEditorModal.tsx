import { useState } from 'react'
import type { FoodGoals } from './goalStorage'

interface GoalEditorModalProps {
  initial: FoodGoals
  onSave: (goals: FoodGoals) => void
  onClose: () => void
}

const FIELDS: { key: keyof FoodGoals; label: string; color: string; unit: string; hint: string }[] = [
  { key: 'calories', label: 'Calories', color: '#6D28D9', unit: 'cal', hint: 'Daily calorie target' },
  { key: 'protein',  label: 'Protein',  color: '#9b59b6', unit: 'g',   hint: 'Muscle building & satiety' },
  { key: 'carbs',    label: 'Carbs',    color: '#3498db', unit: 'g',   hint: 'Primary energy source' },
  { key: 'fat',      label: 'Fat',      color: '#e74c3c', unit: 'g',   hint: 'Hormones & absorption' },
]

/**
 * Modal for editing daily nutrition goals.
 */
export function GoalEditorModal({ initial, onSave, onClose }: GoalEditorModalProps) {
  const [goals, setGoals] = useState<FoodGoals>(initial)

  const update = (key: keyof FoodGoals, v: string): void => {
    const n = parseInt(v) || 0
    setGoals((prev) => ({ ...prev, [key]: Math.max(0, n) }))
  }

  const handleSave = (): void => {
    onSave(goals)
    onClose()
  }

  // Auto-calculate macro cal total for sanity check
  const macroCal = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9
  const calDelta = Math.abs(macroCal - goals.calories)
  const calMismatch = goals.calories > 0 && calDelta > goals.calories * 0.1

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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-forged-text">Daily Goals</h2>
            <p className="text-[11px] text-forged-text2">Set your nutrition targets</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3 mb-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="bg-forged-bg border border-forged-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="text-sm font-bold text-forged-text">{f.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={goals[f.key] || ''}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-20 px-2 py-1.5 bg-forged-surface border border-forged-border
                      rounded-lg text-forged-text text-sm font-black text-right tabular-nums
                      focus:border-forged-purple/50 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-forged-text2 font-bold">{f.unit}</span>
                </div>
              </div>
              <p className="text-[10px] text-forged-text2">{f.hint}</p>
            </div>
          ))}
        </div>

        {/* Sanity check */}
        {calMismatch && (
          <div className="bg-forged-red/5 border border-forged-red/20 rounded-xl p-3 mb-4">
            <p className="text-[10px] font-bold text-forged-red uppercase tracking-wider mb-1">
              Heads up
            </p>
            <p className="text-[11px] text-forged-text">
              Your macros add up to {macroCal} cal, but your calorie goal is {goals.calories}.
              That's {calDelta} cal off.
            </p>
          </div>
        )}

        {/* Warning info */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-5">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Warnings
          </p>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forged-green" />
              <span className="text-forged-text2">Under 80% of goal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-forged-text2">80-99% of goal (close)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forged-red" />
              <span className="text-forged-text2">Over 100% (exceeded)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-black
              bg-forged-surface2 text-forged-text2 border border-forged-border
              hover:text-forged-text active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white
              bg-forged-purple hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  )
}