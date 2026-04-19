import type { FoodLog } from '../../types'
import { MacroBar } from './MacroBar'
import type { FoodGoals } from './goalStorage'
import { getWarnLevel } from './goalStorage'
import { NutritionLabel, type NutritionData } from './NutritionLabel'

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

  // Build a NutritionData for the whole day
  const dailyData: NutritionData = {
    calories: totals.cal,
    protein: totals.protein,
    carbs: totals.carbs,
    fiber: totals.fiber,
    sugar: totals.sugar,
    fat: totals.fat,
    sodium: totals.sodium,
    // All other fields remain undefined until Tier 2 backend adds them.
  }

  // Sort foods by calorie contribution
  const foodsByCalories = [...logs].sort(
    (a, b) => (b.food?.calories ?? 0) * b.servings - (a.food?.calories ?? 0) * a.servings
  )

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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-forged-text">Nutrition Breakdown</h2>
            <p className="text-[11px] text-forged-text2">
              {logs.length} item{logs.length !== 1 ? 's' : ''} · {Math.round(totals.cal)} cal
            </p>
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

        {/* Macro split visual */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Macro Split
          </p>
          <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
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

        {/* Daily Nutrition Label */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Daily Total
          </p>
          <NutritionLabel
            title="All meals combined"
            subtitle={`${logs.length} item${logs.length !== 1 ? 's' : ''}`}
            data={dailyData}
            alwaysOpen
          />
        </div>

        {/* Per-food Nutrition Labels */}
        {foodsByCalories.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Foods (tap to expand)
            </p>
            <div className="flex flex-col gap-2">
              {foodsByCalories.map((log) => {
                const perFood: NutritionData = {
                  servings: log.servings !== 1 ? log.servings : undefined,
                  calories: (log.food?.calories ?? 0) * log.servings,
                  protein: (log.food?.protein ?? 0) * log.servings,
                  carbs: (log.food?.carbs ?? 0) * log.servings,
                  fiber: log.food?.fiber != null ? log.food.fiber * log.servings : undefined,
                  sugar: log.food?.sugar != null ? log.food.sugar * log.servings : undefined,
                  fat: (log.food?.fat ?? 0) * log.servings,
                  sodium: log.food?.sodium != null ? log.food.sodium * log.servings : undefined,
                }
                return (
                  <NutritionLabel
                    key={log.id}
                    title={log.food?.name || 'Food'}
                    subtitle={MEAL_LABELS[log.mealType || 'snack']}
                    data={perFood}
                    defaultOpen={false}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-black text-white
            bg-forged-purple hover:brightness-110 active:scale-[0.98] transition-all"
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
  const level = getWarnLevel(value, goal)
  const barColor = level === 'over' ? '#991B1B' : level === 'close' ? '#eab308' : color
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
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}