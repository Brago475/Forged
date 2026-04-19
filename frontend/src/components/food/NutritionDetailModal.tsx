import type { FoodLog } from '../../types'
import { MacroBar } from './MacroBar'
import type { FoodGoals } from './goalStorage'
import { getWarnLevel } from './goalStorage'

interface NutritionDetailModalProps {
  logs: FoodLog[]
  goals: FoodGoals
  onClose: () => void
}

const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

const WARN_COLORS: Record<string, string> = {
  ok: '#2ecc71',
  close: '#eab308',
  over: '#991B1B',
}

export function NutritionDetailModal({ logs, goals, onClose }: NutritionDetailModalProps) {
  const totals = {
    cal: logs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0),
    protein: logs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0),
    carbs: logs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0),
    fat: logs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0),
    fiber: logs.reduce((s, l) => s + (l.food?.fiber ?? 0) * l.servings, 0),
    sugar: logs.reduce((s, l) => s + (l.food?.sugar ?? 0) * l.servings, 0),
    sodium: logs.reduce((s, l) => s + (l.food?.sodium ?? 0) * l.servings, 0),
  }

  const pCal = totals.protein * 4
  const cCal = totals.carbs * 4
  const fCal = totals.fat * 9
  const totalMacroCal = pCal + cCal + fCal

  // Sort foods by calorie contribution
  const foodsByCalories = [...logs]
    .map(l => ({
      log: l,
      cal: (l.food?.calories ?? 0) * l.servings,
    }))
    .sort((a, b) => b.cal - a.cal)

  // Group by meal
  const byMeal: Record<string, FoodLog[]> = {}
  logs.forEach(l => {
    const k = l.mealType || 'snack'
    if (!byMeal[k]) byMeal[k] = []
    byMeal[k].push(l)
  })

  const Warn = ({ value, goal }: { value: number; goal: number }) => {
    const level = getWarnLevel(value, goal)
    if (level === 'ok') return null
    return (
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: WARN_COLORS[level] + '20',
          color: WARN_COLORS[level],
        }}
      >
        {level === 'close' ? 'Close' : 'Over'}
      </span>
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
          p-5 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-forged-text">Nutrition Breakdown</h2>
            <p className="text-[11px] text-forged-text2">{logs.length} item{logs.length !== 1 ? 's' : ''} logged</p>
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

        {/* Macro split */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
              Macro Calorie Split
            </p>
            <span className="text-sm font-black text-forged-text tabular-nums">{totals.cal} cal</span>
          </div>
          <MacroBar
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
          />
          {totalMacroCal > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9b59b6' }} />
                  <span className="text-[9px] font-bold text-forged-text2 uppercase">Protein</span>
                </div>
                <p className="text-xs font-black text-forged-text tabular-nums mt-0.5">
                  {Math.round((pCal / totalMacroCal) * 100)}%
                </p>
                <p className="text-[9px] text-forged-text2 tabular-nums">{pCal} cal</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3498db' }} />
                  <span className="text-[9px] font-bold text-forged-text2 uppercase">Carbs</span>
                </div>
                <p className="text-xs font-black text-forged-text tabular-nums mt-0.5">
                  {Math.round((cCal / totalMacroCal) * 100)}%
                </p>
                <p className="text-[9px] text-forged-text2 tabular-nums">{cCal} cal</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e74c3c' }} />
                  <span className="text-[9px] font-bold text-forged-text2 uppercase">Fat</span>
                </div>
                <p className="text-xs font-black text-forged-text tabular-nums mt-0.5">
                  {Math.round((fCal / totalMacroCal) * 100)}%
                </p>
                <p className="text-[9px] text-forged-text2 tabular-nums">{fCal} cal</p>
              </div>
            </div>
          )}
        </div>

        {/* Goal progress */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Goal Progress
          </p>
          <div className="flex flex-col gap-2">
            <GoalRow label="Calories" value={totals.cal} goal={goals.calories} color="#6D28D9" unit="cal" />
            <GoalRow label="Protein" value={totals.protein} goal={goals.protein} color="#9b59b6" unit="g" />
            <GoalRow label="Carbs" value={totals.carbs} goal={goals.carbs} color="#3498db" unit="g" />
            <GoalRow label="Fat" value={totals.fat} goal={goals.fat} color="#e74c3c" unit="g" />
          </div>
        </div>

        {/* Per meal */}
        {Object.keys(byMeal).length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              By Meal
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(byMeal).map(([mealKey, mealLogs]) => {
                const mealCal = mealLogs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
                const mealP = mealLogs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
                const mealC = mealLogs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0)
                const mealF = mealLogs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0)
                return (
                  <div key={mealKey} className="bg-forged-bg border border-forged-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-forged-text uppercase tracking-wider">
                        {MEAL_LABELS[mealKey] || mealKey}
                      </span>
                      <span className="text-xs font-black text-forged-text tabular-nums">{mealCal} cal</span>
                    </div>
                    <MacroBar protein={mealP} carbs={mealC} fat={mealF} compact />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top foods */}
        {foodsByCalories.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Foods by Calories
            </p>
            <div className="flex flex-col gap-1.5">
              {foodsByCalories.map(({ log }) => {
                const p = (log.food?.protein ?? 0) * log.servings
                const c = (log.food?.carbs ?? 0) * log.servings
                const f = (log.food?.fat ?? 0) * log.servings
                const cal = (log.food?.calories ?? 0) * log.servings
                return (
                  <div
                    key={log.id}
                    className="bg-forged-bg border border-forged-border rounded-xl p-2.5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-forged-text truncate">
                          {log.food?.name || 'Food'}
                        </p>
                        <p className="text-[9px] text-forged-text2">
                          {MEAL_LABELS[log.mealType || 'snack']}
                          {log.servings !== 1 && ` · ${log.servings}x`}
                        </p>
                      </div>
                      <span className="text-xs font-black text-forged-text tabular-nums ml-2">
                        {cal} cal
                      </span>
                    </div>
                    <MacroBar protein={p} carbs={c} fat={f} compact />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Other nutrients */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Other Nutrients
          </p>
          <div className="grid grid-cols-3 gap-2">
            <NutrientCell label="Fiber" value={totals.fiber} unit="g" warn={<Warn value={totals.fiber} goal={30} />} />
            <NutrientCell label="Sugar" value={totals.sugar} unit="g" warn={<Warn value={totals.sugar} goal={50} />} />
            <NutrientCell label="Sodium" value={totals.sodium} unit="mg" warn={<Warn value={totals.sodium} goal={2300} />} />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-black
            bg-forged-purple text-white
            hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function GoalRow({ label, value, goal, color, unit }: {
  label: string; value: number; goal: number; color: string; unit: string
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const over = value > goal
  const level = getWarnLevel(value, goal)
  const statusColor = level === 'ok' ? '#2ecc71' : level === 'close' ? '#eab308' : '#991B1B'
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-forged-text">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tabular-nums" style={{ color: statusColor }}>
            {Math.round(value)}
          </span>
          <span className="text-[10px] text-forged-text2 tabular-nums">
            / {goal}{unit}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-forged-surface2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: over ? '#991B1B' : color }}
        />
      </div>
    </div>
  )
}

function NutrientCell({ label, value, unit, warn }: {
  label: string; value: number; unit: string; warn?: React.ReactNode
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-2 text-center">
      <p className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-forged-text tabular-nums mt-0.5">{Math.round(value)}</p>
      <p className="text-[8px] text-forged-text2">{unit}</p>
      {warn && <div className="mt-1">{warn}</div>}
    </div>
  )
}