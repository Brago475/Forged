import { useState } from 'react'
import type { FoodGoals } from './goalStorage'

interface GoalEditorModalProps {
  initial: FoodGoals
  onSave: (goals: FoodGoals) => void
  onClose: () => void
}

type Mode = 'grams' | 'percent'

interface FieldConfig {
  key: 'calories' | 'protein' | 'carbs' | 'fat'
  label: string
  letter: string
  color: string
  unit: string
  hint: string
  calPerGram: number
}

const FIELDS: FieldConfig[] = [
  { key: 'calories', label: 'Calories', letter: 'K', color: '#6D28D9', unit: 'cal', hint: 'Daily calorie target', calPerGram: 0 },
  { key: 'protein',  label: 'Protein',  letter: 'P', color: '#9b59b6', unit: 'g',   hint: 'Muscle & satiety',    calPerGram: 4 },
  { key: 'carbs',    label: 'Carbs',    letter: 'C', color: '#3498db', unit: 'g',   hint: 'Primary energy',      calPerGram: 4 },
  { key: 'fat',      label: 'Fat',      letter: 'F', color: '#e74c3c', unit: 'g',   hint: 'Hormones & absorption', calPerGram: 9 },
]

const macroToCal = (p: number, c: number, f: number): number =>
  Math.round(p * 4 + c * 4 + f * 9)

/**
 * Rebalance macros proportionally so their calorie sum equals targetCal.
 * Default fallback if no current macros: 30/40/30 split.
 */
const rebalanceMacros = (
  targetCal: number,
  current: { protein: number; carbs: number; fat: number }
): { protein: number; carbs: number; fat: number } => {
  const pCal = current.protein * 4
  const cCal = current.carbs * 4
  const fCal = current.fat * 9
  const currentTotal = pCal + cCal + fCal

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
 * Convert grams to percent of total macro calories.
 */
const gramsToPct = (goals: FoodGoals): { p: number; c: number; f: number } => {
  const pCal = goals.protein * 4
  const cCal = goals.carbs * 4
  const fCal = goals.fat * 9
  const total = pCal + cCal + fCal
  if (total === 0) return { p: 30, c: 40, f: 30 }
  return {
    p: Math.round((pCal / total) * 100),
    c: Math.round((cCal / total) * 100),
    f: Math.round((fCal / total) * 100),
  }
}

/**
 * Goal editor with dual-mode input (grams/percent) and auto-balancing.
 * - Grams mode: edit any field, others auto-update to stay in sync.
 * - Percent mode: edit P/C/F %, third macro auto-fills to keep sum at 100%;
 *   gram values computed from current calorie target.
 */
export function GoalEditorModal({ initial, onSave, onClose }: GoalEditorModalProps) {
  const [goals, setGoals] = useState<FoodGoals>(initial)
  const [mode, setMode] = useState<Mode>('grams')
  const [pcts, setPcts] = useState(() => gramsToPct(initial))

  const updateCalories = (v: string): void => {
    const n = Math.max(0, parseInt(v) || 0)
    if (mode === 'grams') {
      const next = rebalanceMacros(n, goals)
      setGoals({ calories: n, ...next })
    } else {
      // Percent mode: recompute grams from pcts + new calories
      setGoals({
        calories: n,
        protein: Math.max(0, Math.round((n * pcts.p / 100) / 4)),
        carbs:   Math.max(0, Math.round((n * pcts.c / 100) / 4)),
        fat:     Math.max(0, Math.round((n * pcts.f / 100) / 9)),
      })
    }
  }

  const updateMacroGrams = (key: 'protein' | 'carbs' | 'fat', v: string): void => {
    const n = Math.max(0, parseInt(v) || 0)
    const updated = { ...goals, [key]: n }
    updated.calories = macroToCal(updated.protein, updated.carbs, updated.fat)
    setGoals(updated)
    setPcts(gramsToPct(updated))
  }

  const updateMacroPct = (key: 'p' | 'c' | 'f', v: string): void => {
    const n = Math.max(0, Math.min(100, parseInt(v) || 0))
    // Auto-balance the other two to keep sum = 100
    let { p, c, f } = pcts
    if (key === 'p') {
      const remaining = 100 - n
      const otherSum = c + f
      if (otherSum > 0) {
        c = Math.round((c / otherSum) * remaining)
        f = remaining - c
      } else {
        c = Math.round(remaining / 2)
        f = remaining - c
      }
      p = n
    } else if (key === 'c') {
      const remaining = 100 - n
      const otherSum = p + f
      if (otherSum > 0) {
        p = Math.round((p / otherSum) * remaining)
        f = remaining - p
      } else {
        p = Math.round(remaining / 2)
        f = remaining - p
      }
      c = n
    } else {
      const remaining = 100 - n
      const otherSum = p + c
      if (otherSum > 0) {
        p = Math.round((p / otherSum) * remaining)
        c = remaining - p
      } else {
        p = Math.round(remaining / 2)
        c = remaining - p
      }
      f = n
    }

    const newPcts = {
      p: Math.max(0, p),
      c: Math.max(0, c),
      f: Math.max(0, f),
    }
    setPcts(newPcts)
    setGoals({
      calories: goals.calories,
      protein: Math.max(0, Math.round((goals.calories * newPcts.p / 100) / 4)),
      carbs:   Math.max(0, Math.round((goals.calories * newPcts.c / 100) / 4)),
      fat:     Math.max(0, Math.round((goals.calories * newPcts.f / 100) / 9)),
    })
  }

  const handleSave = (): void => {
    onSave(goals)
    onClose()
  }

  const resetBalanced = (): void => {
    const cal = goals.calories > 0 ? goals.calories : 2400
    const newGoals: FoodGoals = {
      calories: cal,
      protein: Math.round((cal * 0.3) / 4),
      carbs:   Math.round((cal * 0.4) / 4),
      fat:     Math.round((cal * 0.3) / 9),
    }
    setGoals(newGoals)
    setPcts({ p: 30, c: 40, f: 30 })
  }

  // Preset macro splits
  const applyPreset = (p: number, c: number, f: number): void => {
    const newPcts = { p, c, f }
    setPcts(newPcts)
    setGoals({
      calories: goals.calories,
      protein: Math.max(0, Math.round((goals.calories * p / 100) / 4)),
      carbs:   Math.max(0, Math.round((goals.calories * c / 100) / 4)),
      fat:     Math.max(0, Math.round((goals.calories * f / 100) / 9)),
    })
  }

  // Current split for visual bar
  const pCal = goals.protein * 4
  const cCal = goals.carbs * 4
  const fCal = goals.fat * 9
  const totalMacroCal = pCal + cCal + fCal
  const pPct = totalMacroCal > 0 ? (pCal / totalMacroCal) * 100 : 0
  const cPct = totalMacroCal > 0 ? (cCal / totalMacroCal) * 100 : 0
  const fPct = totalMacroCal > 0 ? (fCal / totalMacroCal) * 100 : 0

  // Render helper for each field
  const renderMacroField = (field: FieldConfig): React.ReactNode => {
    const isPercentMode = mode === 'percent' && field.key !== 'calories'
    const pctKey: 'p' | 'c' | 'f' = field.key === 'protein' ? 'p' : field.key === 'carbs' ? 'c' : 'f'
    const displayValue = isPercentMode
      ? pcts[pctKey]
      : goals[field.key]
    const displayUnit = isPercentMode ? '%' : field.unit

    return (
      <div key={field.key} className="bg-forged-bg border border-forged-border rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: field.color + '20' }}
            >
              <span className="text-[11px] font-black" style={{ color: field.color }}>
                {field.letter}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-forged-text leading-tight">{field.label}</div>
              <div className="text-[10px] text-forged-text2 leading-tight">
                {isPercentMode ? `${goals[field.key]}${field.unit}` : field.hint}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              type="number"
              value={displayValue || ''}
              onChange={(e) => {
                if (field.key === 'calories') {
                  updateCalories(e.target.value)
                } else if (isPercentMode) {
                  updateMacroPct(pctKey, e.target.value)
                } else {
                  updateMacroGrams(field.key, e.target.value)
                }
              }}
              className="w-20 px-2 py-1.5 bg-forged-surface border border-forged-border
                rounded-lg text-forged-text text-sm font-black text-right tabular-nums
                focus:border-forged-purple/50 outline-none transition-colors"
            />
            <span className="text-[10px] text-forged-text2 font-bold w-6">{displayUnit}</span>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-forged-text">Daily Goals</h2>
            <p className="text-[11px] text-forged-text2">Auto-balancing macros & calories</p>
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

        {/* Mode toggle */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-1 mb-4 flex gap-1">
          <button
            onClick={() => setMode('grams')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all
              ${mode === 'grams'
                ? 'bg-forged-purple text-white shadow-sm'
                : 'text-forged-text2 hover:text-forged-text'}`}
          >
            Grams
          </button>
          <button
            onClick={() => setMode('percent')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all
              ${mode === 'percent'
                ? 'bg-forged-purple text-white shadow-sm'
                : 'text-forged-text2 hover:text-forged-text'}`}
          >
            Percent
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

        {/* Quick presets (only in percent mode) */}
        {mode === 'percent' && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Quick Splits
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              <PresetButton label="Balanced" sub="30/40/30" onClick={() => applyPreset(30, 40, 30)} active={pcts.p === 30 && pcts.c === 40 && pcts.f === 30} />
              <PresetButton label="High Protein" sub="40/30/30" onClick={() => applyPreset(40, 30, 30)} active={pcts.p === 40 && pcts.c === 30 && pcts.f === 30} />
              <PresetButton label="Low Carb" sub="35/25/40" onClick={() => applyPreset(35, 25, 40)} active={pcts.p === 35 && pcts.c === 25 && pcts.f === 40} />
              <PresetButton label="Keto" sub="25/5/70" onClick={() => applyPreset(25, 5, 70)} active={pcts.p === 25 && pcts.c === 5 && pcts.f === 70} />
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-2.5 mb-4">
          {FIELDS.map(renderMacroField)}
        </div>

        {/* Reset + warnings */}
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

function PresetButton({ label, sub, onClick, active }: {
  label: string; sub: string; onClick: () => void; active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-lg text-center transition-all active:scale-95
        ${active
          ? 'bg-forged-purple text-white'
          : 'bg-forged-bg border border-forged-border hover:border-forged-purple/40'}`}
    >
      <div className={`text-[10px] font-black leading-tight ${active ? 'text-white' : 'text-forged-text'}`}>
        {label}
      </div>
      <div className={`text-[8px] font-bold tabular-nums leading-tight ${active ? 'text-white/80' : 'text-forged-text2'}`}>
        {sub}
      </div>
    </button>
  )
}