import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { getWarnLevel } from '../food/goalStorage'

interface MacroCardProps {
  label: string
  current: number
  goal: number
}

/**
 * Single macro nutrient card (protein, carbs, fat).
 * Shows an animated count-up, a progress bar, and close/over warnings
 * based on the shared goal-warning logic.
 */
export function MacroCard({ label, current, goal }: MacroCardProps) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const level = getWarnLevel(current, goal)
  const barColor = level === 'over' ? 'bg-forged-red' : level === 'close' ? 'bg-yellow-500' : 'bg-forged-purple'
  const animated = useAnimatedNumber(current, 800)

  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3 hover:border-forged-purple/30 hover:shadow-md hover:shadow-forged-purple/5 transition-all duration-200">
      <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-forged-text tabular-nums leading-none">
        {animated}
        <span className="text-[11px] font-medium text-forged-text2 ml-0.5">g</span>
      </p>
      <p className="text-[10px] text-forged-text2 mt-0.5 mb-2">/ {goal}g</p>

      <div className="h-2 rounded-full bg-forged-surface2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {level === 'over' && (
        <p className="text-[10px] text-forged-red font-black mt-1">+{current - goal}g over</p>
      )}
      {level === 'close' && (
        <p className="text-[10px] text-yellow-600 font-black mt-1">Almost there</p>
      )}
    </div>
  )
}