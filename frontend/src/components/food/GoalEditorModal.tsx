import { useState } from 'react'
import type { FoodGoals } from './goalStorage'

interface GoalEditorModalProps {
  initial: FoodGoals
  onSave: (goals: FoodGoals) => void
  onClose: () => void
}

interface FieldConfig {
  key: keyof FoodGoals
  label: string
  letter: string
  color: string
  unit: string
  hint: string
}

const FIELDS: FieldConfig[] = [
  { key: 'calories', label: 'Calories', letter: 'K', color: '#6D28D9', unit: 'cal', hint: 'Daily calorie target' },
  { key: 'protein',  label: 'Protein',  letter: 'P', color: '#9b59b6', unit: 'g',   hint: 'Muscle & satiety' },
  { key: 'carbs',    label: 'Carbs',    letter: 'C', color: '#3498db', unit: 'g',   hint: 'Primary energy' },
  { key: 'fat',      label: 'Fat',      letter: 'F', color: '#e74c3c', unit: 'g',   hint: 'Hormones & absorption' },
]

/**
 * Compute calories from macros.
 */
const macroToCal = (p: number, c: number, f: number): number =>
  Math.round(p * 4 + c * 4 + f * 9)

/**
 * Redistribute macros so their calorie total equals targetCal, keeping the
 * current proportional split. If current macros are all zero, fall back to a
 * 30/40/30 balanced split.
 */
const rebalanceMacros = (
  targetCal: number,
  current: { protein: number; carbs: number; fat: number }
): { protein: number; carbs: number; fat: number } => {
  const pCal = current.protein * 4
  const cCal = current.carbs * 4
  const fCal = current.fat * 9
  const currentTotal = pCal + cCal + fCal

  // If no existing macros, use a balanced default split
  let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3
  if (currentTotal > 0) {
    pRatio = pCal / currentTotal
    cRatio = cCal / currentTotal
    fRatio = fCal / currentTotal
  }

  return {
    protein: Math.max(0, Math.round((targetCal * pRatio) / 4)),
    carbs:   Math.max(0, Math.round((targetCal * cRatio) / 4)),
    fat:     Math.max(0, Math.round((targetCal * fRatio) / 9)),
  }
}

/**
 * Modal for editing daily nutrition goals with auto-balancing.
 * - Change calories → macros rescale proportionally
 * - Change any macro → calories recompute from P*4 + C*4 + F*9
 */
export function GoalEditorModal({ initial, onSave, onClose }: GoalEditorModalProps) {
  const [goals, setGoals] = useState<FoodGoals>(initial)

  const updateCalories = (v: string): void => {
    const n = Math.max(0, parseInt(v) || 0)
    const next = rebalanceMacros(n, goals)
    setGoals({
      calories: n,
      protein: next.protein,
      carbs: next.carbs,
      fat: next.fat,
    })
  }

  const updateMacro = (key: 'protein' | 'carbs' | 'fat', v: string): void => {
    const n = Math.max(0, parseInt(v) || 0)
    const updated = { ...goals, [key]: n }
    updated.calories = macroToCal(updated.protein, updated.carbs, updated.fat)
    setGoals(updated)
  }

  const handleSave = (): void => {
    onSave(goals)
    onClose()
  }

  // Reset to balanced 30/40/30 based on current calories
  const resetBalanced = (): void => {
    const cal = goals.calories > 0 ? goals.calories : 2400
    setGoals({
      calories: cal,
      protein: Math.round((cal * 0.3) / 4),
      carbs:   Math.round((cal * 0.4) / 4),
      fat:     Math.round((cal * 0.3) / 9),
    })
  }

  // Macro split percentages (visual indicator)
  const pCal = goals.protein * 4
  const cCal = goals.carbs * 4
  const fCal = goals.fat * 9
  const totalMacroCal = pCal + cCal + fCal
  const pPct = totalMacroCal > 0 ? (pCal / totalMacroCal) * 100 : 0
  const cPct = totalMacroCal > 0 ? (cCal / totalMacroCal) * 100 : 0
  const fPct = totalMacroCal > 0 ? (fCal / totalMacroCal) * 100 : 0

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
          <div>
            <h2 className="text-lg font-black text-forged-text">Daily Goals</h2>
            <p className="text-[11px] text-forged-text2">Macros and calories auto-balance</p>
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

        {/* Current macro split visual */}
        {totalMacroCal > 0 && (
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
                Macro Split
              </span>
              <span className="text-[10px] text-forged-text2 tabular-nums">
                {Math.round(pPct)}% · {Math.round(cPct)}% · {Math.round(fPct)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-forged-surface2 overflow-hidden flex">
              {pPct > 0 && (
                <div className="h-full" style={{ width: `${pPct}%`, backgroundColor: '#9b59b6' }} />
              )}
              {cPct > 0 && (
                <div className="h-full" style={{ width: `${cPct}%`, backgroundColor: '#3498db' }} />
              )}
              {fPct > 0 && (
                <div className="h-full" style={{ width: `${fPct}%`, backgroundColor: '#e74c3c' }} />
              )}
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-2.5 mb-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="bg-forged-bg border border-forged-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: f.color + '20' }}
                  >
                    <span
                      className="text-[11px] font-black"
                      style={{ color: f.color }}
                    >
                      {f.letter}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-forged-text leading-tight">{f.label}</div>
                    <div className="text-[10px] text-forged-text2 leading-tight">{f.hint}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    value={goals[f.key] || ''}
                    onChange={(e) => {
                      if (f.key === 'calories') {
                        updateCalories(e.target.value)
                      } else {
                        updateMacro(f.key, e.target.value)
                      }
                    }}
                    className="w-20 px-2 py-1.5 bg-forged-surface border border-forged-border
                      rounded-lg text-forged-text text-sm font-black text-right tabular-nums
                      focus:border-forged-purple/50 outline-none transition-colors"
                  />
                  <span className="text-[10px] text-forged-text2 font-bold w-6">{f.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reset + warning info */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
              Warnings
            </span>
            <button
              onClick={resetBalanced}
              className="text-[10px] font-bold text-forged-purple hover:brightness-110 transition-all"
            >
              Reset to 30/40/30
            </button>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forged-green" />
              <span className="text-forged-text2">&lt;80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-forged-text2">80-99%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forged-red" />
              <span className="text-forged-text2">100%+</span>
            </div>
          </div>
        </div>

        {/* Actions */}
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