import { Icon, I } from '../ui/Icon'
import type { FoodLog } from '../../types'

interface FoodSnapshotProps {
  todayFood: FoodLog[]
  proteinLeft: number
  onGo: () => void
}

/**
 * Shows the most recent meal logged today with an "Add" button
 * and a protein-remaining hint when relevant.
 */
export function FoodSnapshot({ todayFood, proteinLeft, onGo }: FoodSnapshotProps) {
  const last = todayFood[todayFood.length - 1]

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forged-purple/10 flex items-center justify-center">
            <Icon d={I.food} size={18} className="text-forged-purple" />
          </div>
          <div>
            <p className="text-sm font-bold text-forged-text">
              {last?.food?.name || 'No meals yet'}
            </p>
            <p className="text-xs text-forged-text2">
              {last
                ? `${last.mealType} - ${last.food?.calories ?? 0} cal`
                : 'Log your first meal'}
            </p>
          </div>
        </div>
        <button
          onClick={onGo}
          className="px-4 py-2 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple
            border border-forged-purple/20 hover:bg-forged-purple hover:text-white
            active:scale-95 transition-all"
        >
          Add
        </button>
      </div>

      {proteinLeft > 0 && todayFood.length > 0 && (
        <p className="text-xs text-forged-purple font-bold mt-2">
          {proteinLeft}g protein remaining
        </p>
      )}
    </div>
  )
}