import { Icon, I } from '../ui/Icon'
import type { Macros } from './types'

interface InsightCardProps {
  macros: Macros
  streak: number
  proteinGoal: number
}

/**
 * Context-aware tip card at the bottom of the home tab.
 * Picks the most relevant message based on today's data.
 */
export function InsightCard({ macros, streak, proteinGoal }: InsightCardProps) {
  const gap = proteinGoal - macros.protein

  let msg: string
  let icon = I.zap

  if (streak >= 3) {
    msg = `${streak}-day streak! Keep pushing.`
    icon = I.flame
  } else if (gap > 0 && gap < 40) {
    msg = `You're ${gap}g short on protein today.`
    icon = I.target
  } else if (macros.cal > 0 && macros.cal <= 2400) {
    msg = 'Within your calorie goal. Solid work.'
    icon = I.check
  } else {
    msg = 'Log meals and workouts to unlock insights.'
    icon = I.zap
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center flex-shrink-0">
        <Icon d={icon} size={18} className="text-forged-purple" />
      </div>
      <p className="text-sm text-forged-text2 font-medium flex-1">{msg}</p>
    </div>
  )
}