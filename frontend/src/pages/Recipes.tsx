import { useState, useEffect, useMemo } from 'react'
import {
  loadRecipes, addRecipe, updateRecipe, deleteRecipe as removeRecipe, toggleFavorite,
  applyFilter, searchRecipes, computeRecipeMacros,
  type Recipe, type RecipeFilter,
} from '../components/recipes/recipesStorage'
import { RecipeEditor } from '../components/recipes/RecipeEditor'
import { RecipeDetailModal } from '../components/recipes/RecipeDetailModal'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8, fill = 'none' }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number; fill?: string
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

const FILTERS: Array<{ key: RecipeFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'highProtein', label: 'High protein' },
  { key: 'lowCal', label: 'Low cal' },
  { key: 'under500', label: 'Under 500' },
  { key: 'under30min', label: 'Under 30 min' },
]

export default function RecipesPage({ onBack }: { onBack: () => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [filter, setFilter] = useState<RecipeFilter>('all')
  const [query, setQuery] = useState<string>('')
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [creating, setCreating] = useState<boolean>(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(() => recipes.find(r => r.id === selectedId) ?? null, [recipes, selectedId])

  const filtered = useMemo(() => {
    let list = applyFilter(recipes, filter)
    list = searchRecipes(list, query)
    return list.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [recipes, filter, query])

  const handleCreate = (draft: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe = addRecipe(draft)
    setRecipes(loadRecipes())
    setCreating(false)
    setSelectedId(newRecipe.id)
  }

  const handleUpdate = (updated: Recipe) => {
    updateRecipe(updated.id, updated)
    setRecipes(loadRecipes())
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    removeRecipe(id)
    setRecipes(loadRecipes())
    setSelectedId(null)
  }

  const handleToggleFav = (id: string) => {
    toggleFavorite(id)
    setRecipes(loadRecipes())
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
            flex items-center justify-center text-forged-text2
            hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <h1 className="text-2xl font-black text-forged-text">Recipes</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon d={I.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forged-text2" />
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search recipes, tags, ingredients..."
          className="w-full pl-9 pr-3 py-2.5 bg-forged-surface border border-forged-border rounded-xl text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all
              ${filter === f.key
                ? 'bg-forged-purple text-white'
                : 'bg-forged-surface border border-forged-border text-forged-text2 hover:text-forged-text'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty states */}
      {recipes.length === 0 ? (
        <div className="bg-forged-surface border border-forged-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-forged-purple/15 flex items-center justify-center mx-auto mb-3">
            <Icon d={I.book} size={22} className="text-forged-purple" />
          </div>
          <p className="text-sm font-bold text-forged-text mb-1">No recipes yet</p>
          <p className="text-xs text-forged-text2 mb-4">Build reusable meals once, log them with one tap forever.</p>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-forged-purple text-white font-black text-xs
              hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Create first recipe
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-forged-surface border border-forged-border rounded-2xl p-6 text-center">
          <p className="text-xs text-forged-text2">No recipes match.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(recipe => {
            const macros = computeRecipeMacros(recipe)
            const totalTime = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
            return (
              <button
                key={recipe.id}
                onClick={() => setSelectedId(recipe.id)}
                className="bg-forged-surface border border-forged-border rounded-2xl overflow-hidden
                  hover:border-forged-purple/40 active:scale-[0.99] transition-all text-left"
              >
                <div className="flex">
                  {recipe.photoDataUrl ? (
                    <img src={recipe.photoDataUrl} alt=""
                      className="w-24 h-24 object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 bg-forged-bg flex items-center justify-center flex-shrink-0">
                      <Icon d={I.book} size={20} className="text-forged-text2" />
                    </div>
                  )}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-forged-text truncate">{recipe.name}</p>
                      {recipe.favorite && (
                        <Icon d={I.heart} size={12} fill="currentColor" className="text-forged-red flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-forged-text2 mt-0.5 truncate">
                      Serves {recipe.servings} · {macros.perServing.calories} cal · {macros.perServing.protein}g P
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {totalTime > 0 && (
                        <span className="text-[9px] font-bold text-forged-text2 flex items-center gap-0.5">
                          <Icon d={I.clock} size={9} sw={2} />{totalTime}m
                        </span>
                      )}
                      {recipe.difficulty && (
                        <span className="text-[9px] font-black text-forged-text2 capitalize">
                          {recipe.difficulty}
                        </span>
                      )}
                      {recipe.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-black text-forged-purple">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {recipes.length > 0 && (
        <button
          onClick={() => setCreating(true)}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 w-14 h-14 rounded-2xl bg-forged-purple
            shadow-lg shadow-forged-purple/30 text-white flex items-center justify-center
            hover:brightness-110 active:scale-95 transition-all z-30"
        >
          <Icon d={I.plus} size={22} sw={2.5} />
        </button>
      )}

      {/* Modals */}
      {creating && (
        <RecipeEditor onSave={handleCreate as (r: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void}
          onClose={() => setCreating(false)} />
      )}
      {editing && (
        <RecipeEditor initial={editing} onSave={handleUpdate as (r: Recipe) => void}
          onClose={() => setEditing(null)} />
      )}
      {selected && !editing && (
        <RecipeDetailModal
          recipe={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditing(selected)}
          onDelete={() => handleDelete(selected.id)}
          onToggleFavorite={() => handleToggleFav(selected.id)}
        />
      )}
    </div>
  )
}