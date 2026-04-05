import { useState, useEffect } from 'react'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

interface Recipe { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; ingredients: string; instructions: string }
const RECIPES_KEY = 'forged_recipes'
function loadRecipes(): Recipe[] { try { return JSON.parse(localStorage.getItem(RECIPES_KEY) || '[]') } catch { return [] } }
function saveRecipes(r: Recipe[]) { localStorage.setItem(RECIPES_KEY, JSON.stringify(r)) }

export default function RecipesPage({ onBack }: { onBack: () => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', ingredients: '', instructions: '' })
  const [expanded, setExpanded] = useState<string | null>(null)

  const handleAdd = () => {
    if (!draft.name) return
    const recipe: Recipe = {
      id: crypto.randomUUID(), name: draft.name,
      calories: parseInt(draft.calories) || 0, protein: parseInt(draft.protein) || 0,
      carbs: parseInt(draft.carbs) || 0, fat: parseInt(draft.fat) || 0,
      ingredients: draft.ingredients, instructions: draft.instructions,
    }
    const next = [recipe, ...recipes]; setRecipes(next); saveRecipes(next)
    setDraft({ name: '', calories: '', protein: '', carbs: '', fat: '', ingredients: '', instructions: '' })
    setAdding(false)
  }

  const deleteRecipe = (id: string) => { const next = recipes.filter(r => r.id !== id); setRecipes(next); saveRecipes(next) }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevL} size={16} /></button>
        <h1 className="text-2xl font-black text-forged-text">Recipes</h1>
      </div>

      {adding ? (
        <Card delay={0}>
          <p className="text-xs font-bold text-forged-text2 uppercase tracking-widest mb-3">New Recipe</p>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Recipe name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors" />
            <div className="grid grid-cols-4 gap-2">
              {[{ k: 'calories', p: 'Cal' }, { k: 'protein', p: 'Protein' }, { k: 'carbs', p: 'Carbs' }, { k: 'fat', p: 'Fat' }].map(f => (
                <input key={f.k} type="number" placeholder={f.p} value={(draft as any)[f.k]} onChange={e => setDraft({ ...draft, [f.k]: e.target.value })}
                  className="px-2 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-xs text-center placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors" />
              ))}
            </div>
            <textarea placeholder="Ingredients (one per line)" value={draft.ingredients} onChange={e => setDraft({ ...draft, ingredients: e.target.value })} rows={3}
              className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors resize-none" />
            <textarea placeholder="Instructions" value={draft.instructions} onChange={e => setDraft({ ...draft, instructions: e.target.value })} rows={3}
              className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl text-forged-text text-sm placeholder:text-forged-text2 focus:border-forged-purple/50 transition-colors resize-none" />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2.5 bg-forged-purple text-white font-black rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition-all">Save Recipe</button>
              <button onClick={() => setAdding(false)} className="px-4 py-2.5 text-forged-text2 hover:text-forged-text text-sm font-bold">Cancel</button>
            </div>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full py-3 rounded-xl text-sm font-bold bg-forged-purple text-white shadow-lg shadow-forged-purple/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <Icon d={I.plus} size={16} sw={2.5} /> Add Recipe
        </button>
      )}

      {recipes.length === 0 && !adding ? (
        <Card delay={60}>
          <div className="py-8 text-center">
            <Icon d={I.book} size={32} className="text-forged-text2 mx-auto mb-3" />
            <p className="text-sm font-bold text-forged-text mb-1">No recipes yet</p>
            <p className="text-xs text-forged-text2">Save your favorite meals for quick logging</p>
          </div>
        </Card>
      ) : (
        recipes.map((recipe, i) => (
          <Card key={recipe.id} delay={80 + i * 50}>
            <button onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)} className="w-full flex items-center justify-between text-left">
              <div>
                <p className="text-sm font-black text-forged-text">{recipe.name}</p>
                <p className="text-[11px] text-forged-text2">{recipe.calories} cal &middot; P:{recipe.protein}g &middot; C:{recipe.carbs}g &middot; F:{recipe.fat}g</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all"><Icon d={I.trash} size={12} /></button>
            </button>
            {expanded === recipe.id && (
              <div className="mt-3 pt-3 border-t border-forged-text2/10">
                {recipe.ingredients && <div className="mb-3"><p className="text-[10px] font-bold text-forged-text2 uppercase mb-1">Ingredients</p><p className="text-sm text-forged-text whitespace-pre-line">{recipe.ingredients}</p></div>}
                {recipe.instructions && <div><p className="text-[10px] font-bold text-forged-text2 uppercase mb-1">Instructions</p><p className="text-sm text-forged-text whitespace-pre-line">{recipe.instructions}</p></div>}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}