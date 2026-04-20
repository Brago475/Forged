import type { Food } from '../../types'

export type RecipeDifficulty = 'easy' | 'medium' | 'advanced'

export interface RecipeIngredient {
  id: string
  foodId: string          // backend food ID or custom food ID
  foodName: string
  brand?: string
  servings: number        // how many servings of the food the recipe uses
  // cached macros per 1 serving of that food (for offline display)
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface RecipeStep {
  id: string
  text: string
}

export interface Recipe {
  id: string
  name: string
  description?: string
  photoDataUrl?: string
  servings: number        // how many this recipe makes
  prepMinutes?: number
  cookMinutes?: number
  difficulty?: RecipeDifficulty
  tags: string[]
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

const KEY = 'forged:recipes'

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveRecipes(recipes: Recipe[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(recipes)) } catch { /* ignore */ }
}

export function addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe {
  const now = new Date().toISOString()
  const complete: Recipe = {
    ...recipe,
    id: `r_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  }
  const all = loadRecipes()
  saveRecipes([complete, ...all])
  return complete
}

export function updateRecipe(id: string, patch: Partial<Recipe>): Recipe | null {
  const all = loadRecipes()
  const idx = all.findIndex(r => r.id === id)
  if (idx < 0) return null
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }
  all[idx] = updated
  saveRecipes(all)
  return updated
}

export function deleteRecipe(id: string): void {
  saveRecipes(loadRecipes().filter(r => r.id !== id))
}

export function toggleFavorite(id: string): Recipe | null {
  const recipe = loadRecipes().find(r => r.id === id)
  if (!recipe) return null
  return updateRecipe(id, { favorite: !recipe.favorite })
}

// ──────────────────────────────
// Macros calc
// ──────────────────────────────

export interface RecipeMacros {
  total: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }
  perServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }
}

export function computeRecipeMacros(recipe: Recipe): RecipeMacros {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  for (const ing of recipe.ingredients) {
    total.calories += ing.calories * ing.servings
    total.protein += ing.protein * ing.servings
    total.carbs += ing.carbs * ing.servings
    total.fat += ing.fat * ing.servings
    total.fiber += (ing.fiber ?? 0) * ing.servings
    total.sugar += (ing.sugar ?? 0) * ing.servings
    total.sodium += (ing.sodium ?? 0) * ing.servings
  }
  const divisor = Math.max(recipe.servings, 1)
  const perServing = {
    calories: Math.round(total.calories / divisor),
    protein: Math.round(total.protein / divisor * 10) / 10,
    carbs: Math.round(total.carbs / divisor * 10) / 10,
    fat: Math.round(total.fat / divisor * 10) / 10,
    fiber: Math.round(total.fiber / divisor * 10) / 10,
    sugar: Math.round(total.sugar / divisor * 10) / 10,
    sodium: Math.round(total.sodium / divisor),
  }
  return { total, perServing }
}

// ──────────────────────────────
// Filters
// ──────────────────────────────

export type RecipeFilter = 'all' | 'favorites' | 'highProtein' | 'lowCal' | 'under500' | 'under30min'

export function applyFilter(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  switch (filter) {
    case 'favorites':
      return recipes.filter(r => r.favorite)
    case 'highProtein':
      return recipes.filter(r => computeRecipeMacros(r).perServing.protein >= 30)
    case 'lowCal':
      return recipes.filter(r => {
        const cal = computeRecipeMacros(r).perServing.calories
        return cal > 0 && cal <= 400
      })
    case 'under500':
      return recipes.filter(r => {
        const cal = computeRecipeMacros(r).perServing.calories
        return cal > 0 && cal <= 500
      })
    case 'under30min':
      return recipes.filter(r => {
        const total = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0)
        return total > 0 && total <= 30
      })
    default:
      return recipes
  }
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  if (!query || query.length < 2) return recipes
  const q = query.toLowerCase()
  return recipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.description?.toLowerCase().includes(q) ?? false) ||
    r.tags.some(t => t.toLowerCase().includes(q)) ||
    r.ingredients.some(i => i.foodName.toLowerCase().includes(q))
  )
}

// ──────────────────────────────
// Convert a Food backend response into a RecipeIngredient
// ──────────────────────────────

export function foodToIngredient(food: Food, servings: number = 1): RecipeIngredient {
  return {
    id: `ing_${crypto.randomUUID()}`,
    foodId: food.id,
    foodName: food.name,
    brand: food.brand,
    servings,
    calories: food.calories ?? 0,
    protein: food.protein ?? 0,
    carbs: food.carbs ?? 0,
    fat: food.fat ?? 0,
    fiber: food.fiber,
    sugar: food.sugar,
    sodium: food.sodium,
  }
}

// ──────────────────────────────
// Share
// ──────────────────────────────

export function shareRecipeText(recipe: Recipe): string {
  const macros = computeRecipeMacros(recipe)
  const lines: string[] = []
  lines.push(recipe.name.toUpperCase())
  if (recipe.description) lines.push(recipe.description)
  lines.push('')
  lines.push(`Serves: ${recipe.servings}`)
  if (recipe.prepMinutes || recipe.cookMinutes) {
    const total = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
    lines.push(`Time: ${total} min total`)
  }
  lines.push(`Per serving: ${macros.perServing.calories} cal · ${macros.perServing.protein}g protein`)
  lines.push('')
  lines.push('INGREDIENTS')
  for (const ing of recipe.ingredients) {
    lines.push(`  • ${ing.servings}x ${ing.foodName}${ing.brand ? ` (${ing.brand})` : ''}`)
  }
  if (recipe.steps.length > 0) {
    lines.push('')
    lines.push('STEPS')
    recipe.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s.text}`))
  }
  lines.push('')
  lines.push('via forgedgyms.com')
  return lines.join('\n')
}