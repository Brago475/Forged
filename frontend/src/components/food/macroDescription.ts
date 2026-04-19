/**
 * Turns a macro profile into a short, friendly description.
 * Kept intentionally simple — will be replaced by a real food
 * recommendation database later.
 */
export function describeMacros(m: {
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  calories: number
}): string {
  const pCal = m.protein * 4
  const cCal = m.carbs * 4
  const fCal = m.fat * 9
  const total = pCal + cCal + fCal

  if (total === 0) return 'no nutrition data'

  const pPct = pCal / total
  const cPct = cCal / total
  const fPct = fCal / total
  const fiber = m.fiber ?? 0
  const sugar = m.sugar ?? 0

  // Protein-dominant
  if (pPct >= 0.45 && m.protein >= 15) {
    if (m.calories < 200) return `${Math.round(m.protein)}g protein · lean & light`
    return `${Math.round(m.protein)}g protein · muscle fuel`
  }
  if (pPct >= 0.3 && m.protein >= 20) {
    return `${Math.round(m.protein)}g protein · high protein`
  }

  // Fat-dominant
  if (fPct >= 0.55) {
    if (m.carbs < 10) return 'fat-based · keto-friendly'
    return 'rich in healthy fats'
  }

  // Carb-dominant
  if (cPct >= 0.55) {
    if (fiber >= 5) return `${Math.round(m.carbs)}g carbs · complex & fiber-rich`
    if (sugar >= 15) return `${Math.round(m.carbs)}g carbs · sweet treat`
    return `${Math.round(m.carbs)}g carbs · quick energy`
  }

  // Balanced
  if (m.calories < 150) return 'light snack'
  return 'balanced macros'
}