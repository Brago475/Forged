import type { FoodLog } from '../../types'

export interface DerivedNutrition {
  /** Calories from carbs - fiber (sugar alcohols ignored, we don't track them) */
  netCarbs: number
  /** Percentage of calories from protein */
  proteinPct: number
  /** Percentage of calories from carbs */
  carbsPct: number
  /** Percentage of calories from fat */
  fatPct: number
  /** Calories per gram of food (protein+carbs+fat basis) */
  calorieDensity: number
  /** Grams of protein per 100 calories — high = lean food */
  proteinDensity: number
}

/**
 * Compute derived metrics from raw totals.
 */
export function computeDerived(totals: {
  cal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}): DerivedNutrition {
  const pCal = totals.protein * 4
  const cCal = totals.carbs * 4
  const fCal = totals.fat * 9
  const macroCal = pCal + cCal + fCal

  return {
    netCarbs: Math.max(totals.carbs - totals.fiber, 0),
    proteinPct: macroCal > 0 ? (pCal / macroCal) * 100 : 0,
    carbsPct: macroCal > 0 ? (cCal / macroCal) * 100 : 0,
    fatPct: macroCal > 0 ? (fCal / macroCal) * 100 : 0,
    calorieDensity: totals.cal > 0 ? totals.cal / Math.max(totals.protein + totals.carbs + totals.fat, 1) : 0,
    proteinDensity: totals.cal > 0 ? (totals.protein / totals.cal) * 100 : 0,
  }
}

export type Rating = 1 | 2 | 3 | 4 | 5
export type EnergyImpact = 'Low' | 'Medium' | 'Medium-High' | 'High'

export interface NutritionRatings {
  muscleGain: Rating
  muscleGainReason: string
  fatLoss: Rating
  fatLossReason: string
  energyImpact: EnergyImpact
  energyReason: string
  proteinQuality: 'Low' | 'Medium' | 'High'
}

/**
 * Compute fitness-oriented ratings and explanations from nutritional data.
 *
 * Scoring logic (transparent so user can trust it):
 *
 * Muscle Gain (1-5): based on protein density (g per 100 cal) and total protein.
 *   - 30g+ protein/meal AND >=7g per 100 cal → 5 stars
 *   - 20g+ protein AND >=5g per 100 cal → 4 stars
 *   - 15g+ protein → 3 stars
 *   - 10g+ protein → 2 stars
 *   - otherwise 1 star
 *
 * Fat Loss (1-5): based on protein density and fat density.
 *   - high protein density + low-moderate calorie density → 5 stars
 *   - penalized if >35% cal from fat AND protein < 20g
 *
 * Energy Impact: based on carb content and fiber-to-carb ratio.
 *   - high carbs + low fiber → high spike (Medium-High)
 *   - high carbs + high fiber → sustained (High)
 *   - moderate carbs + protein → Medium-High
 *   - low carbs → Low-Medium
 *
 * Protein Quality: naive, based on total protein per calorie.
 *   - complete proteins with >= 20g and >=7g/100cal = High
 *   - backend can later add amino acid profile for real scoring
 */
export function computeRatings(totals: {
  cal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}): NutritionRatings {
  const derived = computeDerived(totals)

  // Muscle gain scoring
  let muscleGain: Rating = 1
  let muscleGainReason = 'Low protein content'
  if (totals.protein >= 30 && derived.proteinDensity >= 7) {
    muscleGain = 5
    muscleGainReason = 'Excellent protein profile, high density'
  } else if (totals.protein >= 20 && derived.proteinDensity >= 5) {
    muscleGain = 4
    muscleGainReason = 'Strong protein content'
  } else if (totals.protein >= 15) {
    muscleGain = 3
    muscleGainReason = 'Moderate protein'
  } else if (totals.protein >= 10) {
    muscleGain = 2
    muscleGainReason = 'Some protein, could be higher'
  }

  // Fat loss scoring
  let fatLoss: Rating = 3
  let fatLossReason = 'Balanced profile'
  const fatCalPct = derived.fatPct
  if (derived.proteinDensity >= 7 && totals.cal < 600) {
    fatLoss = 5
    fatLossReason = 'High protein, calorie-controlled'
  } else if (derived.proteinDensity >= 5) {
    fatLoss = 4
    fatLossReason = 'Good protein-to-calorie ratio'
  } else if (fatCalPct > 40 && totals.protein < 20) {
    fatLoss = 2
    fatLossReason = 'High fat, low protein'
  } else if (totals.cal > 800 && derived.proteinDensity < 4) {
    fatLoss = 1
    fatLossReason = 'Calorie-dense, low protein'
  }

  // Energy impact
  let energyImpact: EnergyImpact = 'Medium'
  let energyReason = 'Balanced energy source'
  const fiberRatio = totals.carbs > 0 ? totals.fiber / totals.carbs : 0
  if (totals.carbs >= 40 && fiberRatio >= 0.15) {
    energyImpact = 'High'
    energyReason = 'Complex carbs, sustained energy'
  } else if (totals.carbs >= 40 && fiberRatio < 0.1) {
    energyImpact = 'Medium-High'
    energyReason = 'Fast carbs, quick spike'
  } else if (totals.carbs < 20 && totals.fat > 15) {
    energyImpact = 'Medium'
    energyReason = 'Fat-based energy, steady burn'
  } else if (totals.cal < 300) {
    energyImpact = 'Low'
    energyReason = 'Light meal, short boost'
  }

  // Protein quality
  let proteinQuality: 'Low' | 'Medium' | 'High' = 'Low'
  if (totals.protein >= 20 && derived.proteinDensity >= 7) {
    proteinQuality = 'High'
  } else if (totals.protein >= 10 && derived.proteinDensity >= 4) {
    proteinQuality = 'Medium'
  }

  return {
    muscleGain,
    muscleGainReason,
    fatLoss,
    fatLossReason,
    energyImpact,
    energyReason,
    proteinQuality,
  }
}

/**
 * Compute totals from a list of food logs.
 */
export function computeTotals(logs: FoodLog[]) {
  return {
    cal: logs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0),
    protein: logs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0),
    carbs: logs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0),
    fat: logs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0),
    fiber: logs.reduce((s, l) => s + (l.food?.fiber ?? 0) * l.servings, 0),
    sugar: logs.reduce((s, l) => s + (l.food?.sugar ?? 0) * l.servings, 0),
    sodium: logs.reduce((s, l) => s + (l.food?.sodium ?? 0) * l.servings, 0),
  }
}