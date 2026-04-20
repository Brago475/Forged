import { useState, useRef, useEffect } from 'react'
import { api } from '../../hooks/api'
import type { Food } from '../../types'
import { searchCustomFoods } from '../food/customFoodsStorage'
import {
  foodToIngredient,
  type Recipe, type RecipeIngredient, type RecipeStep, type RecipeDifficulty,
} from './recipesStorage'

const I = {
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  grip: <><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>,
  arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
  arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
  import: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>{d}</svg>
}

const COMMON_TAGS = ['bulking', 'cutting', 'highprotein', 'lowcarb', 'vegan', 'vegetarian', 'glutenfree', 'mealprep', 'quick', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert']

export function RecipeEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Recipe
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | Recipe) => void
  onClose: () => void
}) {
  const photoRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState<string>(initial?.name ?? '')
  const [description, setDescription] = useState<string>(initial?.description ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(initial?.photoDataUrl ?? '')
  const [servings, setServings] = useState<string>(String(initial?.servings ?? 2))
  const [prep, setPrep] = useState<string>(initial?.prepMinutes ? String(initial.prepMinutes) : '')
  const [cook, setCook] = useState<string>(initial?.cookMinutes ? String(initial.cookMinutes) : '')
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | ''>(initial?.difficulty ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [customTag, setCustomTag] = useState<string>('')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(initial?.ingredients ?? [])
  const [steps, setSteps] = useState<RecipeStep[]>(initial?.steps ?? [])
  const [favorite] = useState<boolean>(initial?.favorite ?? false)

  // Ingredient search
  const [query, setQuery] = useState<string>('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState<boolean>(false)
  const [showImport, setShowImport] = useState<boolean>(false)
  const debounceRef = useRef<number>(0)

  // URL import
  const [importUrl, setImportUrl] = useState<string>('')

  const doSearch = (q: string) => {
    setQuery(q)
    clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); return }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        const [backend, custom] = await Promise.all([
          api.food.search(q).catch(() => []),
          Promise.resolve(searchCustomFoods(q)),
        ])
        setResults([...custom, ...backend])
      } catch (e) { console.error(e) }
      finally { setSearching(false) }
    }, 300)
  }

  const addIngredient = (food: Food) => {
    setIngredients([...ingredients, foodToIngredient(food, 1)])
    setQuery('')
    setResults([])
  }

  const updateIngredient = (id: string, patch: Partial<RecipeIngredient>) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id))
  }

  const addStep = () => {
    setSteps([...steps, { id: `step_${crypto.randomUUID()}`, text: '' }])
  }
  const updateStep = (id: string, text: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, text } : s))
  }
  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id))
  }
  const moveStep = (id: string, dir: -1 | 1) => {
    const idx = steps.findIndex(s => s.id === id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= steps.length) return
    const copy = [...steps]
    ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
    setSteps(copy)
  }

  const toggleTag = (tag: string) => {
    setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }
  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setCustomTag('')
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImport = () => {
    alert('URL import is coming soon — add the Anthropic API + a backend recipe parser first.')
    setImportUrl('')
  }

  const canSave = name.trim() && ingredients.length > 0 && parseInt(servings) > 0

  const handleSave = () => {
    if (!canSave) return
    const draft: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      photoDataUrl: photoDataUrl || undefined,
      servings: parseInt(servings) || 1,
      prepMinutes: prep ? parseInt(prep) : undefined,
      cookMinutes: cook ? parseInt(cook) : undefined,
      difficulty: difficulty || undefined,
      tags,
      ingredients,
      steps,
      favorite,
    }
    if (initial) {
      onSave({ ...initial, ...draft })
    } else {
      onSave(draft)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="bg-forged-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

        <div className="sticky top-0 bg-forged-surface/95 backdrop-blur-sm border-b border-forged-border p-4 flex items-center justify-between z-10">
          <p className="text-base font-black text-forged-text">
            {initial ? 'Edit recipe' : 'New recipe'}
          </p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
            <Icon d={I.x} size={18} sw={2} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Import from URL */}
          {!initial && (
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full py-2.5 rounded-xl text-xs font-black
                bg-forged-bg border border-dashed border-forged-purple/40 text-forged-purple
                hover:bg-forged-purple/5 active:scale-[0.98] transition-all
                flex items-center justify-center gap-2"
            >
              <Icon d={I.import} size={14} sw={2} />
              Import from URL
            </button>
          )}
          {showImport && (
            <div className="bg-forged-bg border border-forged-border rounded-xl p-3 flex flex-col gap-2">
              <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Paste recipe URL</p>
              <input
                type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-forged-surface border border-forged-border rounded-lg text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={handleImport}
                  className="flex-1 py-2 rounded-lg text-[11px] font-black bg-forged-purple text-white hover:brightness-110 active:scale-[0.98] transition-all">
                  Import
                </button>
                <button onClick={() => { setShowImport(false); setImportUrl('') }}
                  className="px-3 py-2 rounded-lg text-[11px] font-black bg-forged-surface border border-forged-border text-forged-text2 hover:text-forged-text active:scale-[0.98] transition-all">
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-forged-text2 italic leading-relaxed">
                Coming soon. Will parse structured recipe data from most cooking websites.
              </p>
            </div>
          )}

          {/* Photo */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Photo (optional)</label>
            {photoDataUrl ? (
              <div className="relative">
                <img src={photoDataUrl} alt={name} className="w-full aspect-video object-cover rounded-xl" />
                <button
                  onClick={() => photoRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-xs font-black hover:bg-black/80 transition-all"
                >
                  Change
                </button>
                <button
                  onClick={() => setPhotoDataUrl('')}
                  className="absolute bottom-2 right-20 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-xs font-black hover:bg-black/80 transition-all"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-forged-purple/40 bg-forged-purple/5 flex flex-col items-center justify-center gap-2 hover:bg-forged-purple/10 transition-all"
              >
                <Icon d={I.camera} size={24} className="text-forged-purple" />
                <p className="text-xs font-black text-forged-purple">Add photo</p>
              </button>
            )}
          </div>

          {/* Name + description */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">
              Name <span className="text-forged-red">*</span>
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. High-protein chicken bowl"
              className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value.slice(0, 240))}
              placeholder="One-line description" rows={2}
              className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors resize-none"
            />
          </div>

          {/* Servings / times / difficulty */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Servings *</label>
              <input
                type="number" value={servings} onChange={e => setServings(e.target.value)}
                min={1} step={1}
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums text-center focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Prep (min)</label>
              <input
                type="number" value={prep} onChange={e => setPrep(e.target.value)}
                min={0} step={1}
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums text-center focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Cook (min)</label>
              <input
                type="number" value={cook} onChange={e => setCook(e.target.value)}
                min={0} step={1}
                className="w-full px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm tabular-nums text-center focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'advanced'] as const).map(d => (
                <button
                  key={d} onClick={() => setDifficulty(difficulty === d ? '' : d)}
                  className={`py-2 rounded-lg text-xs font-black capitalize transition-all
                    ${difficulty === d
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag} onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-all
                    ${tags.includes(tag)
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}
                >
                  #{tag}
                </button>
              ))}
              {tags.filter(t => !COMMON_TAGS.includes(t)).map(tag => (
                <button
                  key={tag} onClick={() => toggleTag(tag)}
                  className="text-[10px] font-black px-2.5 py-1 rounded-full bg-forged-purple text-white"
                >
                  #{tag} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Custom tag"
                className="flex-1 px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors"
              />
              <button onClick={addCustomTag} disabled={!customTag.trim()}
                className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-purple text-xs font-black hover:bg-forged-purple/10 disabled:opacity-40 transition-all">
                Add
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider block mb-1.5">
              Ingredients <span className="text-forged-red">*</span>
            </label>
            <div className="relative mb-2">
              <Icon d={I.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forged-text2" />
              <input
                type="text" value={query} onChange={e => doSearch(e.target.value)}
                placeholder="Search foods..."
                className="w-full pl-9 pr-3 py-2 bg-forged-bg border border-forged-border rounded-lg text-forged-text text-sm focus:border-forged-purple/50 outline-none transition-colors"
              />
            </div>
            {searching && (
              <p className="text-xs text-forged-text2 py-1">Searching...</p>
            )}
            {results.length > 0 && (
              <div className="bg-forged-bg border border-forged-border rounded-lg max-h-48 overflow-y-auto mb-2">
                {results.map(food => (
                  <button
                    key={food.id} onClick={() => addIngredient(food)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-forged-surface2 transition-colors border-b border-forged-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-forged-text truncate">{food.name}</p>
                      {food.brand && <p className="text-[10px] text-forged-text2 truncate">{food.brand}</p>}
                    </div>
                    <span className="text-xs font-black text-forged-purple tabular-nums ml-2">
                      {food.calories ?? 0} cal
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected ingredients */}
            <div className="flex flex-col gap-2">
              {ingredients.length === 0 ? (
                <p className="text-xs text-forged-text2 italic text-center py-3">
                  Search and tap a food to add it.
                </p>
              ) : (
                ingredients.map(ing => (
                  <div key={ing.id} className="bg-forged-bg border border-forged-border rounded-lg p-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forged-text truncate">{ing.foodName}</p>
                      <p className="text-[10px] text-forged-text2">
                        {Math.round(ing.calories * ing.servings)} cal · {Math.round(ing.protein * ing.servings)}g P
                      </p>
                    </div>
                    <input
                      type="number" value={ing.servings} step="0.25" min={0.25}
                      onChange={e => updateIngredient(ing.id, { servings: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-forged-surface border border-forged-border rounded text-forged-text text-xs tabular-nums text-center focus:border-forged-purple/50 outline-none transition-colors"
                    />
                    <span className="text-[10px] text-forged-text2 font-bold">serv</span>
                    <button onClick={() => removeIngredient(ing.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all">
                      <Icon d={I.trash} size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Instructions</label>
              <button onClick={addStep}
                className="text-[10px] font-black text-forged-purple hover:brightness-110 transition-all flex items-center gap-1">
                <Icon d={I.plus} size={10} sw={2.5} />Add step
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {steps.length === 0 ? (
                <p className="text-xs text-forged-text2 italic text-center py-3">
                  Add step-by-step instructions.
                </p>
              ) : (
                steps.map((step, i) => (
                  <div key={step.id} className="bg-forged-bg border border-forged-border rounded-lg p-2 flex gap-2">
                    <div className="flex flex-col gap-0.5 items-center justify-center pt-1">
                      <span className="text-[10px] font-black text-forged-purple tabular-nums">{i + 1}</span>
                      <button onClick={() => moveStep(step.id, -1)} disabled={i === 0}
                        className="w-5 h-5 text-forged-text2 hover:text-forged-text disabled:opacity-30">
                        <Icon d={I.arrowUp} size={10} sw={2} />
                      </button>
                      <button onClick={() => moveStep(step.id, 1)} disabled={i === steps.length - 1}
                        className="w-5 h-5 text-forged-text2 hover:text-forged-text disabled:opacity-30">
                        <Icon d={I.arrowDown} size={10} sw={2} />
                      </button>
                    </div>
                    <textarea
                      value={step.text}
                      onChange={e => updateStep(step.id, e.target.value)}
                      placeholder={`Step ${i + 1}...`} rows={2}
                      className="flex-1 px-2 py-1.5 bg-forged-surface border border-forged-border rounded text-forged-text text-xs focus:border-forged-purple/50 outline-none transition-colors resize-none"
                    />
                    <button onClick={() => removeStep(step.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-all flex-shrink-0 self-start">
                      <Icon d={I.trash} size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-forged-surface border-t border-forged-border p-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 rounded-xl bg-forged-purple text-white font-black text-sm
              hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {initial ? 'Save changes' : 'Create recipe'}
          </button>
        </div>
      </div>
    </div>
  )
}