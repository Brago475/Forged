import { useState } from 'react'
import type { BodyGoals } from './bodyGoalsStorage'

interface BodyGoalsModalProps {
  initial: BodyGoals
  /** Suggested start weight — first ever weight entry. User can override. */
  firstEntryWeight?: number
  firstEntryDate?: string
  onSave: (goals: BodyGoals) => void
  onClose: () => void
}

/**
 * Edit body composition goals — start weight, goal weight, goal date.
 * Pre-fills start values from the user's first weight entry if available.
 */
export function BodyGoalsModal({
  initial, firstEntryWeight, firstEntryDate, onSave, onClose,
}: BodyGoalsModalProps) {
  const [startWeight, setStartWeight] = useState<string>(
    initial.startWeight?.toString() ?? firstEntryWeight?.toString() ?? ''
  )
  const [startDate, setStartDate] = useState<string>(
    initial.startDate ?? firstEntryDate ?? ''
  )
  const [goalWeight, setGoalWeight] = useState<string>(initial.goalWeight?.toString() ?? '')
  const [goalDate, setGoalDate] = useState<string>(initial.goalDate ?? '')

  const handleSave = (): void => {
    const next: BodyGoals = {
      unit: 'lbs',
      startWeight: startWeight ? parseFloat(startWeight) : undefined,
      startDate: startDate || undefined,
      goalWeight: goalWeight ? parseFloat(goalWeight) : undefined,
      goalDate: goalDate || undefined,
    }
    onSave(next)
    onClose()
  }

  const handleClear = (): void => {
    onSave({ unit: 'lbs' })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center
        bg-black/50 backdrop-blur-sm px-3 py-4"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-forged-text">Body Goals</h2>
            <p className="text-[11px] text-forged-text2">Set your weight journey</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Start */}
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">
              Starting Point
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">Start weight</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number" step="0.1" inputMode="decimal"
                    value={startWeight} onChange={(e) => setStartWeight(e.target.value)}
                    placeholder="e.g. 215.0"
                    className="w-full px-3 py-2 bg-forged-surface border border-forged-border
                      rounded-lg text-forged-text text-sm tabular-nums placeholder:text-forged-text2
                      focus:border-forged-purple/50 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-forged-text2 font-bold">lbs</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">Start date</label>
                <input
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-forged-surface border border-forged-border
                    rounded-lg text-forged-text text-sm
                    focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>
            {firstEntryWeight && !initial.startWeight && (
              <p className="text-[10px] text-forged-text2 mt-2">
                Suggested from your first entry: {firstEntryWeight} lbs
                {firstEntryDate && ` on ${new Date(firstEntryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </p>
            )}
          </div>

          {/* Goal */}
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">
              Target
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">Goal weight</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number" step="0.1" inputMode="decimal"
                    value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full px-3 py-2 bg-forged-surface border border-forged-border
                      rounded-lg text-forged-text text-sm tabular-nums placeholder:text-forged-text2
                      focus:border-forged-purple/50 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-forged-text2 font-bold">lbs</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">Goal date</label>
                <input
                  type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-forged-surface border border-forged-border
                    rounded-lg text-forged-text text-sm
                    focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>
            <p className="text-[10px] text-forged-text2 mt-2">
              Optional. Helps pace yourself — set a realistic date.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="text-[11px] text-forged-text2 hover:text-forged-red
              font-bold transition-colors py-1"
          >
            Clear all body goals
          </button>
        </div>

        <div className="flex gap-2 mt-5">
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