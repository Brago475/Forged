import { useRef, useState } from 'react'
import { Icon, I } from '../ui/Icon'
import { api } from '../../hooks/api'
import type { Food, FoodLog } from '../../types'

interface FoodLoggerProps {
  /** ISO date (YYYY-MM-DD) the log will be attached to. */
  date: string
  /** Meal type override. Auto-detected from time of day if omitted. */
  mealType?: string
  /** Called after a successful log with the new entry. */
  onLogged?: (log: FoodLog) => void
  /** Compact variant: smaller padding for tight spaces. */
  compact?: boolean
}

const MEAL_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  snack: 'Snacks',
}

/**
 * Meal type key based on current hour of day. Matches Food Log's keys
 * so logs show in the right section.
 */
function getDefaultMealType(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 16) return 'afternoon'
  if (h >= 16 && h < 21) return 'evening'
  return 'snack'
}

/**
 * Inline food logger. Search existing foods or create a custom one, log
 * with one tap. Same API the Food tab uses.
 */
export function FoodLogger({ date, mealType, onLogged, compact = false }: FoodLoggerProps) {
  const effectiveMeal = mealType ?? getDefaultMealType()

  const [query, setQuery] = useState<string>('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState<boolean>(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [cal, setCal] = useState<string>('')
  const [protein, setProtein] = useState<string>('')
  const [carbs, setCarbs] = useState<string>('')
  const [fat, setFat] = useState<string>('')
  const [savingCustom, setSavingCustom] = useState<boolean>(false)
  const debounceRef = useRef<number>(0)

  const doSearch = (q: string): void => {
    setQuery(q)
    clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); return }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        setResults(await api.food.search(q))
      } catch (err) {
        console.error('Food search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const addFood = async (foodId: string): Promise<void> => {
    setAdding(foodId)
    try {
      const log = await api.food.log({ foodId, date, mealType: effectiveMeal, servings: 1 })
      if (log) onLogged?.(log)
      setQuery('')
      setResults([])
    } catch (err) {
      console.error('Failed to log food:', err)
    } finally {
      setAdding(null)
    }
  }

  const createAndLog = async (): Promise<void> => {
    if (!name || !cal) return
    setSavingCustom(true)
    try {
      const food = await api.food.create({
        name,
        calories: parseInt(cal) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
      })
      const log = await api.food.log({
        foodId: food.id, date, mealType: effectiveMeal, servings: 1,
      })
      if (log) onLogged?.(log)
      setName(''); setCal(''); setProtein(''); setCarbs(''); setFat('')
      setShowCreate(false)
    } catch (err) {
      console.error('Failed to create food:', err)
    } finally {
      setSavingCustom(false)
    }
  }

  const pad = compact ? 'p-3' : 'p-4'

  return (
    <div className={`bg-forged-bg border border-forged-border rounded-xl ${pad}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Icon d={I.food} size={12} className="text-forged-text2" />
          <span className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider">
            Log Food
          </span>
        </div>
       <span className="text-[9px] font-bold text-forged-green bg-forged-green/15 px-2 py-0.5 rounded-full">
  {MEAL_LABELS[effectiveMeal] ?? effectiveMeal}
</span>
      </div>

      <div className="relative mb-2">
        <Icon
          d={I.search}
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-forged-text2"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => doSearch(e.target.value)}
          placeholder="Search foods..."
          className="w-full pl-9 pr-3 py-2 bg-forged-surface border border-forged-border
            rounded-lg text-forged-text text-sm placeholder:text-forged-text2
            focus:border-forged-green/40 transition-colors outline-none"
        />
      </div>

      {query.length >= 2 && (
        <div className="flex flex-col gap-1 mb-2 max-h-40 overflow-y-auto">
          {searching ? (
            <p className="text-[10px] text-forged-text2 text-center py-2">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-[10px] text-forged-text2 text-center py-2">No matches</p>
          ) : (
            results.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg
                  hover:bg-forged-surface2/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-forged-text truncate">{f.name}</p>
                  <p className="text-[10px] text-forged-text2">
                    {f.calories} cal{f.brand ? ` · ${f.brand}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => addFood(f.id)}
                  disabled={adding === f.id}
                  className="ml-2 w-7 h-7 rounded-lg bg-forged-green/15 text-forged-green
                    flex items-center justify-center hover:bg-forged-green hover:text-white
                    active:scale-95 transition-all disabled:opacity-50"
                >
                  <Icon d={adding === f.id ? I.check : I.plus} size={12} sw={2.5} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <button
        onClick={() => setShowCreate((s) => !s)}
        className="w-full text-[11px] font-bold text-forged-text2 hover:text-forged-text
          flex items-center justify-center gap-1.5 py-1.5 transition-colors"
      >
        <Icon d={showCreate ? I.x : I.plus} size={10} sw={2.5} />
        {showCreate ? 'Cancel' : 'Create custom food'}
      </button>

      {showCreate && (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-forged-surface border border-forged-border
              rounded-lg text-forged-text text-sm placeholder:text-forged-text2
              focus:border-forged-green/40 transition-colors outline-none"
          />
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: cal, s: setCal, p: 'Cal' },
              { v: protein, s: setProtein, p: 'P (g)' },
              { v: carbs, s: setCarbs, p: 'C (g)' },
              { v: fat, s: setFat, p: 'F (g)' },
            ].map((f, i) => (
              <input
                key={i}
                type="number"
                placeholder={f.p}
                value={f.v}
                onChange={(e) => f.s(e.target.value)}
                className="px-2 py-2 bg-forged-surface border border-forged-border
                  rounded-lg text-forged-text text-sm text-center placeholder:text-forged-text2
                  focus:border-forged-green/40 transition-colors outline-none"
              />
            ))}
          </div>
          <button
            onClick={createAndLog}
            disabled={savingCustom || !name || !cal}
            className="w-full py-2 bg-forged-green text-white font-black rounded-lg text-xs
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {savingCustom ? 'Adding...' : 'Add Food'}
          </button>
        </div>
      )}
    </div>
  )
}