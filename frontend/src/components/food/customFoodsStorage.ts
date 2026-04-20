import type { Food } from '../../types'

const KEY = 'forged:custom-foods'

export interface CustomFood extends Food {
  id: string
  name: string
  brand?: string
  barcode?: string
  photoDataUrl?: string
  servingSize?: number
  servingUnit?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
  createdAt: string
  source: 'barcode' | 'photo' | 'manual'
}

export function loadCustomFoods(): CustomFood[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveCustomFoods(foods: CustomFood[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(foods)) } catch { /* ignore */ }
}

export function addCustomFood(food: Omit<CustomFood, 'id' | 'createdAt'>): CustomFood {
  const complete: CustomFood = {
    ...food,
    id: `cf_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  }
  const all = loadCustomFoods()
  saveCustomFoods([complete, ...all])
  return complete
}

export function deleteCustomFood(id: string): void {
  const next = loadCustomFoods().filter(f => f.id !== id)
  saveCustomFoods(next)
}

export function findCustomByBarcode(barcode: string): CustomFood | undefined {
  return loadCustomFoods().find(f => f.barcode === barcode)
}

/**
 * Fuzzy search custom foods by name or brand.
 * Called by Food Log to blend custom foods with backend search results.
 */
export function searchCustomFoods(query: string): CustomFood[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return loadCustomFoods().filter(f =>
    f.name.toLowerCase().includes(q) ||
    (f.brand?.toLowerCase().includes(q) ?? false)
  )
}