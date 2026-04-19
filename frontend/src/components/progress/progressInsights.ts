import type { WeightEntry, FoodLog } from '../../types'

export interface WeekSummary {
  avgCal: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  totalWorkouts: number
  weightChange: number
  daysProteinHit: number
  daysUnderCal: number
  daysWithFood: number
}

/**
 * Compute summary stats for a window of daily food logs + weight entries.
 * `foodByDay` is an array of daily arrays, index 0 = most recent day.
 */
export function summarizeWindow(
  foodByDay: FoodLog[][],
  weightEntries: WeightEntry[],
  windowStart: Date,
  windowEnd: Date,
  calGoal: number,
  proteinGoal: number,
): WeekSummary {
  const allLogs = foodByDay.flat()
  const daysWithFood = foodByDay.filter(d => d.length > 0).length || 1

  const weekWeights = weightEntries.filter(e => {
    const d = new Date(e.date + 'T00:00:00')
    return d >= windowStart && d <= windowEnd
  })
  const weightChange = weekWeights.length >= 2
    ? weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight
    : 0

  const daysProteinHit = foodByDay.filter(d => {
    const p = d.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
    return p >= proteinGoal
  }).length
  const daysUnderCal = foodByDay.filter(d => {
    const c = d.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
    return c > 0 && c <= calGoal
  }).length

  return {
    avgCal: Math.round(allLogs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0) / daysWithFood),
    avgProtein: Math.round(allLogs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0) / daysWithFood),
    avgCarbs: Math.round(allLogs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0) / daysWithFood),
    avgFat: Math.round(allLogs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0) / daysWithFood),
    totalWorkouts: 0,
    weightChange,
    daysProteinHit,
    daysUnderCal,
    daysWithFood,
  }
}

/**
 * 0-100 score based on weighted signals. Null if no data at all.
 */
export function computeConsistencyScore(week: WeekSummary): number | null {
  if (week.daysWithFood === 0) return null
  const nutritionScore = (week.daysProteinHit / 7) * 50 + (week.daysUnderCal / 7) * 50
  const loggingScore = (week.daysWithFood / 7) * 100
  // 60% nutrition behavior, 40% just showing up and logging
  return Math.round(nutritionScore * 0.6 + loggingScore * 0.4)
}

export type InsightKind = 'good' | 'warn' | 'bad'

export interface Insight {
  kind: InsightKind
  title: string
  detail: string
}

/**
 * Generate contextual insight cards based on the week summary.
 */
export function generateInsights(
  week: WeekSummary,
  prevWeek: WeekSummary,
  proteinGoal: number,
  calGoal: number,
): Insight[] {
  const out: Insight[] = []

  if (week.daysWithFood === 0) {
    out.push({
      kind: 'warn',
      title: 'No food logged this week',
      detail: 'Start by logging a meal from the Food tab.',
    })
    return out
  }

  // Protein
  if (week.daysProteinHit >= 5) {
    out.push({
      kind: 'good',
      title: `Protein hit ${week.daysProteinHit} of ${week.daysWithFood} days`,
      detail: 'Keep it up — that is on pace for a strong week.',
    })
  } else if (week.daysProteinHit >= 3) {
    out.push({
      kind: 'warn',
      title: `Protein hit ${week.daysProteinHit} of ${week.daysWithFood} days`,
      detail: `Aim for ${proteinGoal}g most days to hit your goal.`,
    })
  } else if (week.daysProteinHit > 0) {
    out.push({
      kind: 'bad',
      title: `Only ${week.daysProteinHit} protein day${week.daysProteinHit === 1 ? '' : 's'} this week`,
      detail: `Try logging a protein-heavy snack to reach ${proteinGoal}g.`,
    })
  }

  // Calories
  if (week.daysUnderCal >= 5) {
    out.push({
      kind: 'good',
      title: `Under calorie goal ${week.daysUnderCal} of 7 days`,
      detail: 'Steady work — consistency is the whole game.',
    })
  } else if (week.avgCal > calGoal) {
    out.push({
      kind: 'warn',
      title: `Average ${week.avgCal} cal/day this week`,
      detail: `That is ${week.avgCal - calGoal} above your ${calGoal} goal.`,
    })
  }

  // Weight change
  if (week.weightChange < -2.5) {
    out.push({
      kind: 'warn',
      title: `Lost ${Math.abs(week.weightChange).toFixed(1)} lbs this week`,
      detail: 'Above the 0.5-1 lb healthy range. Watch fatigue.',
    })
  } else if (week.weightChange < 0) {
    out.push({
      kind: 'good',
      title: `Lost ${Math.abs(week.weightChange).toFixed(1)} lbs this week`,
      detail: 'Right in the healthy sustainable range.',
    })
  } else if (week.weightChange > 2) {
    out.push({
      kind: 'bad',
      title: `Gained ${week.weightChange.toFixed(1)} lbs this week`,
      detail: 'Check if calories crept up or if it is water weight.',
    })
  }

  // Trend vs last week
  if (prevWeek.daysWithFood > 0 && week.avgProtein > prevWeek.avgProtein + 10) {
    out.push({
      kind: 'good',
      title: `Protein up ${week.avgProtein - prevWeek.avgProtein}g vs last week`,
      detail: 'Great momentum on your protein intake.',
    })
  }

  return out
}

/**
 * All-time stats from weight history.
 */
export interface AllTimeStats {
  start?: WeightEntry
  current?: WeightEntry
  heaviest?: WeightEntry
  lightest?: WeightEntry
  lost: number
  avgPerWeek: number
  avgPerMonth: number
  avgOverall: number
}

export function computeAllTimeStats(entries: WeightEntry[]): AllTimeStats {
  if (entries.length === 0) {
    return { lost: 0, avgPerWeek: 0, avgPerMonth: 0, avgOverall: 0 }
  }

  const sorted = [...entries].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const start = sorted[0]
  const current = sorted[sorted.length - 1]
  const heaviest = sorted.reduce((max, e) => e.weight > max.weight ? e : max, sorted[0])
  const lightest = sorted.reduce((min, e) => e.weight < min.weight ? e : min, sorted[0])

  const totalDays = Math.max(
    1,
    (new Date(current.date).getTime() - new Date(start.date).getTime()) / 86400000
  )
  const weeks = totalDays / 7
  const months = totalDays / 30
  const lost = start.weight - current.weight

  return {
    start,
    current,
    heaviest,
    lightest,
    lost,
    avgPerWeek: weeks > 0 ? lost / weeks : 0,
    avgPerMonth: months > 0 ? lost / months : 0,
    avgOverall: sorted.reduce((s, e) => s + e.weight, 0) / sorted.length,
  }
}

/**
 * Find the weight entry closest to a target date.
 * Returns null if none within `windowDays` of the target.
 */
export function findWeightNearDate(
  entries: WeightEntry[],
  target: Date,
  windowDays: number = 3,
): WeightEntry | null {
  if (entries.length === 0) return null
  const targetMs = target.getTime()
  const windowMs = windowDays * 86400000

  let best: WeightEntry | null = null
  let bestDist = Infinity
  for (const e of entries) {
    const dist = Math.abs(new Date(e.date + 'T00:00:00').getTime() - targetMs)
    if (dist < bestDist && dist <= windowMs) {
      bestDist = dist
      best = e
    }
  }
  return best
}