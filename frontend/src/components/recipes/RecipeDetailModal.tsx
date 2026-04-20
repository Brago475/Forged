import { useState } from 'react'
import { api } from '../../hooks/api'
import { NutritionLabel } from './NutritionLabel'
import {
  computeRecipeMacros, shareRecipeText,
  type Recipe,
} from './recipesStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8, fill = 'none' }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number; fill?: string
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

const MEALS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'snack', label: 'Snack' },
]

export function RecipeDetailModal({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  recipe: Recipe
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const [scale, setScale] = useState<number>(1)
  const [servingsToLog, setServingsToLog] = useState<number>(1)
  const [logging, setLogging] = useState<boolean>(false)
  const [showMealPicker, setShowMealPicker] = useState<boolean>(false)
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false)
  const [toast, setToast] = useState<string | null>(null)

  const scaledRecipe: Recipe = {
    ...recipe,
    servings: recipe.servings * scale,
    ingredients: recipe.ingredients.map(i => ({ ...i, servings: i.servings * scale })),
  }
  const macros = computeRecipeMacros(scaledRecipe)
  const totalTime = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)

  const handleShare = async () => {
    const text = shareRecipeText(recipe)
    if (navigator.share) {
      try { await navigator.share({ text, title: recipe.name }) } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setToast('Recipe copied to clipboard')
        setTimeout(() => setToast(null), 2000)
      } catch { setToast('Share not supported') }
    }
  }

  const logToMeal = async (mealType: string): Promise<void> => {
    setLogging(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      // For each ingredient, log (servings × requested servings of recipe × scale)
      for (const ing of recipe.ingredients) {
        const totalServings = ing.servings * servingsToLog * scale
        if (ing.foodId.startsWith('cf_')) {
          // Custom food - skip backend, not yet wired
          continue
        }
        try {
          await api.food.log({
            foodId: ing.foodId, date: today, mealType,
            servings: totalServings,
          })
        } catch (e) { console.error('Failed to log ingredient:', ing.foodName, e) }
      }
      setToast(`Logged to ${mealType}`)
      setShowMealPicker(false)
      setTimeout(() => setToast(null), 2000)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="bg-forged-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Hero image or header */}
        {recipe.photoDataUrl ? (
          <div className="relative">
            <img src={recipe.photoDataUrl} alt={recipe.name} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <button onClick={onClose}
                className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all">
                <Icon d={I.x} size={18} sw={2} />
              </button>
              <div className="flex gap-2">
                <button onClick={onToggleFavorite}
                  className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center active:scale-95 transition-all
                    ${recipe.favorite ? 'bg-forged-red/80 text-white' : 'bg-black/60 text-white'}`}>
                  <Icon d={I.heart} size={16} fill={recipe.favorite ? 'currentColor' : 'none'} />
                </button>
                <button onClick={onEdit}
                  className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-all">
                  <Icon d={I.edit} size={14} sw={2} />
                </button>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-xl font-black text-white leading-tight">{recipe.name}</p>
              {recipe.description && (
                <p className="text-xs text-white/80 mt-1">{recipe.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="sticky top-0 bg-forged-surface/95 backdrop-blur-sm border-b border-forged-border p-4 flex items-center justify-between z-10">
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-forged-text truncate">{recipe.name}</p>
              {recipe.description && (
                <p className="text-[11px] text-forged-text2 truncate mt-0.5">{recipe.description}</p>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              <button onClick={onToggleFavorite}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95
                  ${recipe.favorite ? 'text-forged-red bg-forged-red/10' : 'text-forged-text2 hover:text-forged-red'}`}>
                <Icon d={I.heart} size={14} fill={recipe.favorite ? 'currentColor' : 'none'} />
              </button>
              <button onClick={onEdit}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
                <Icon d={I.edit} size={14} sw={2} />
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
                <Icon d={I.x} size={18} sw={2} />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-bg border border-forged-border text-forged-text">
              Serves {scaledRecipe.servings}
            </span>
            {totalTime > 0 && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-bg border border-forged-border text-forged-text flex items-center gap-1">
                <Icon d={I.clock} size={10} sw={2} />{totalTime} min
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-bg border border-forged-border text-forged-text capitalize">
                {recipe.difficulty}
              </span>
            )}
            {recipe.tags.map(tag => (
              <span key={tag}
                className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-purple/15 text-forged-purple">
                #{tag}
              </span>
            ))}
          </div>

          {/* Scale */}
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">Scale recipe</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.5, 1, 2, 3].map(s => (
                <button key={s} onClick={() => setScale(s)}
                  className={`py-2 rounded-lg text-xs font-black transition-all
                    ${scale === s
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-surface border border-forged-border text-forged-text2 hover:text-forged-text'}`}>
                  {s === 1 ? '1x' : s === 0.5 ? '½x' : `${s}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Log to diary */}
          <div className="bg-forged-purple/10 border border-forged-purple/30 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Log to diary</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-forged-text2 font-bold">Servings:</span>
                <input
                  type="number" value={servingsToLog} min={0.25} step={0.25}
                  onChange={e => setServingsToLog(parseFloat(e.target.value) || 1)}
                  className="w-14 px-2 py-1 bg-forged-surface border border-forged-border rounded text-forged-text text-xs tabular-nums text-center focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>
            {showMealPicker ? (
              <div className="grid grid-cols-4 gap-1.5">
                {MEALS.map(m => (
                  <button key={m.key} onClick={() => logToMeal(m.key)} disabled={logging}
                    className="py-2 rounded-lg text-[10px] font-black bg-forged-purple text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setShowMealPicker(true)}
                className="w-full py-2 rounded-lg text-xs font-black bg-forged-purple text-white hover:brightness-110 active:scale-[0.98] transition-all">
                Log {servingsToLog}x to today
              </button>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">Ingredients</p>
            <div className="flex flex-col gap-1">
              {scaledRecipe.ingredients.map(ing => (
                <div key={ing.id} className="flex items-center justify-between py-2 border-b border-forged-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-forged-text truncate">{ing.foodName}</p>
                    {ing.brand && <p className="text-[10px] text-forged-text2 truncate">{ing.brand}</p>}
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs font-black text-forged-text tabular-nums">
                      {ing.servings.toFixed(ing.servings % 1 === 0 ? 0 : 2)}x
                    </p>
                    <p className="text-[10px] text-forged-text2 tabular-nums">
                      {Math.round(ing.calories * ing.servings)} cal
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">Instructions</p>
              <div className="flex flex-col gap-2">
                {recipe.steps.map((step, i) => (
                  <div key={step.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-forged-purple/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-forged-purple tabular-nums">{i + 1}</span>
                    </div>
                    <p className="text-xs text-forged-text leading-relaxed flex-1 pt-0.5">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition label */}
          <div>
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-2">Nutrition</p>
            <NutritionLabel macros={macros} servings={scaledRecipe.servings} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleShare}
              className="py-2.5 rounded-xl text-xs font-black bg-forged-bg border border-forged-border text-forged-text hover:border-forged-purple/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Icon d={I.share} size={12} sw={2} />Share
            </button>
            <button
              onClick={() => {
                if (confirmDelete) { onDelete(); return }
                setConfirmDelete(true)
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2
                ${confirmDelete
                  ? 'bg-forged-red text-white'
                  : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-red hover:border-forged-red/40'}`}>
              <Icon d={I.trash} size={12} sw={2} />
              {confirmDelete ? 'Tap again' : 'Delete'}
            </button>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-forged-purple text-white px-4 py-2 rounded-xl text-xs font-black shadow-xl z-[70]">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}