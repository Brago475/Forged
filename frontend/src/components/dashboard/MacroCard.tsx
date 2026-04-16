import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

interface MacroCardProps {
  label: string
  current: number
  goal: number
}

/**
 * Single macro nutrient card (protein, carbs, fat).
 * Shows an animated count-up, a progress bar, and over-goal warning.
 */
export function MacroCard({ label, current, goal }: MacroCardProps) {
  const pct = Math.min((current / goal) * 100, 100)
  const isOver = current > goal
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
          className="h-full rounded-full bg-forged-purple transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {isOver && (
        <p className="text-[10px] text-forged-red font-black mt-1">
          +{current - goal}g over
        </p>
      )}
    </div>
  )
}