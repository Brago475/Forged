import type { WeightEntry, FoodLog, WorkoutLog } from '../../types'

export interface WeekRange {
  start: Date
  end: Date
  label: string
  /** Short label for the picker pills. "This week", "Apr 6", etc. */
  shortLabel: string
  /** Offset from current week. 0 = this week, 1 = last week, etc. */
  offset: number
}

/**
 * Generate week ranges going back `count` weeks from today.
 * Weeks are Monday-Sunday. Index 0 is the current week.
 */
export function generateWeekRanges(count: number = 12): WeekRange[] {
  const ranges: WeekRange[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = 0; i < count; i++) {
    const start = new Date(now)
    const dayOfWeek = (start.getDay() + 6) % 7 // Mon=0, Sun=6
    start.setDate(start.getDate() - dayOfWeek - (i * 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const label = startMonth === endMonth
      ? `${startMonth} ${start.getDate()} — ${end.getDate()}`
      : `${startMonth} ${start.getDate()} — ${endMonth} ${end.getDate()}`

    const shortLabel = i === 0 ? 'This week'
      : i === 1 ? 'Last week'
      : `${startMonth} ${start.getDate()}`

    ranges.push({ start, end, label, shortLabel, offset: i })
  }
  return ranges
}

export interface WeekData {
  foodByDay: FoodLog[][]  // index 0 = Monday, 6 = Sunday
  weights: WeightEntry[]
  workouts: WorkoutLog[]
}

export interface DayScore {
  date: Date
  dayLabel: string // "Mon", "Tue"
  score: number   // 0-100
  meals: number
  workoutDone: boolean
  calories: number
}

export interface WeeklyRecap {
  range: WeekRange
  avgCal: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  totalMeals: number
  daysLogged: number
  workoutsCompleted: number
  weightChange: number
  startWeight?: number
  endWeight?: number
  daysProteinHit: number
  daysUnderCal: number
  bestDay?: DayScore
  slowestDay?: DayScore
  dayScores: DayScore[]
  headline: { title: string; subtitle: string; tone: 'great' | 'good' | 'okay' | 'slow' }
  wins: Array<{ title: string; detail: string }>
  focus: { title: string; detail: string } | null
}

/**
 * Compute everything the recap page shows for one week of raw data.
 */
export function computeWeeklyRecap(
  range: WeekRange,
  data: WeekData,
  calGoal: number,
  proteinGoal: number,
): WeeklyRecap {
  const { foodByDay, weights, workouts } = data

  // Daily scores
  const dayScores: DayScore[] = foodByDay.map((day, i) => {
    const date = new Date(range.start)
    date.setDate(date.getDate() + i)
    const cals = day.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
    const protein = day.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
    const workoutDone = workouts.some(w => {
      const wDate = new Date(w.date + 'T00:00:00')
      return wDate.toDateString() === date.toDateString() && w.completed
    })

    let score = 0
    if (day.length > 0) score += 25
    if (cals > 0 && cals <= calGoal) score += 30
    if (protein >= proteinGoal) score += 25
    if (workoutDone) score += 20

    return {
      date,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      score,
      meals: day.length,
      workoutDone,
      calories: Math.round(cals),
    }
  })

  // Averages
  const daysLogged = foodByDay.filter(d => d.length > 0).length
  const divisor = Math.max(daysLogged, 1)
  const allLogs = foodByDay.flat()
  const avgCal = Math.round(allLogs.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0) / divisor)
  const avgProtein = Math.round(allLogs.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0) / divisor)
  const avgCarbs = Math.round(allLogs.reduce((s, l) => s + (l.food?.carbs ?? 0) * l.servings, 0) / divisor)
  const avgFat = Math.round(allLogs.reduce((s, l) => s + (l.food?.fat ?? 0) * l.servings, 0) / divisor)
  const totalMeals = allLogs.length

  // Weight change across the week
  const inRange = weights
    .filter(w => {
      const d = new Date(w.date + 'T00:00:00')
      return d >= range.start && d <= range.end
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const startWeight = inRange[0]?.weight
  const endWeight = inRange[inRange.length - 1]?.weight
  const weightChange = (startWeight != null && endWeight != null && inRange.length >= 2)
    ? endWeight - startWeight
    : 0

  const workoutsCompleted = workouts.filter(w => {
    const d = new Date(w.date + 'T00:00:00')
    return d >= range.start && d <= range.end && w.completed
  }).length

  const daysProteinHit = foodByDay.filter(d => {
    const p = d.reduce((s, l) => s + (l.food?.protein ?? 0) * l.servings, 0)
    return p >= proteinGoal
  }).length

  const daysUnderCal = foodByDay.filter(d => {
    const c = d.reduce((s, l) => s + (l.food?.calories ?? 0) * l.servings, 0)
    return c > 0 && c <= calGoal
  }).length

  // Best / slowest days
  const scoredDays = [...dayScores].filter(d => d.score > 0)
  const bestDay = scoredDays.length > 0
    ? scoredDays.reduce((best, d) => d.score > best.score ? d : best)
    : undefined

  const lowestOrZero = dayScores.length > 0
    ? dayScores.reduce((worst, d) => {
        if (worst.meals === 0) return worst // keep zero-meal day as the slowest
        if (d.meals === 0) return d
        return d.score < worst.score ? d : worst
      })
    : undefined
  const slowestDay = (lowestOrZero && bestDay && lowestOrZero.date.toDateString() !== bestDay.date.toDateString())
    ? lowestOrZero
    : undefined

  // Headline
  const headline = computeHeadline({
    daysLogged, workoutsCompleted, weightChange,
    daysProteinHit, daysUnderCal,
  })

  // Wins
  const wins = computeWins({
    weightChange, workoutsCompleted, daysProteinHit, daysUnderCal, totalMeals, daysLogged,
  })

  // Focus
  const focus = computeFocus({
    slowestDay, daysLogged, daysProteinHit, daysUnderCal, workoutsCompleted,
  })

  return {
    range,
    avgCal, avgProtein, avgCarbs, avgFat,
    totalMeals, daysLogged, workoutsCompleted,
    weightChange, startWeight, endWeight,
    daysProteinHit, daysUnderCal,
    bestDay, slowestDay, dayScores,
    headline, wins, focus,
  }
}

function computeHeadline(ctx: {
  daysLogged: number; workoutsCompleted: number; weightChange: number
  daysProteinHit: number; daysUnderCal: number
}): WeeklyRecap['headline'] {
  const { daysLogged, workoutsCompleted, weightChange, daysProteinHit, daysUnderCal } = ctx

  if (daysLogged === 0) {
    return {
      title: 'No data this week',
      subtitle: 'Start logging a meal or workout to see your weekly story.',
      tone: 'slow',
    }
  }

  let score = 0
  if (daysLogged >= 6) score += 2
  else if (daysLogged >= 4) score += 1
  if (workoutsCompleted >= 4) score += 2
  else if (workoutsCompleted >= 2) score += 1
  if (daysProteinHit >= 5) score += 2
  else if (daysProteinHit >= 3) score += 1
  if (daysUnderCal >= 5) score += 2
  else if (daysUnderCal >= 3) score += 1
  if (weightChange < 0 && weightChange > -2.5) score += 2

  if (score >= 8) return {
    title: 'You had a great week',
    subtitle: `${workoutsCompleted} workouts, ${daysLogged} days logged, protein on point. This is the kind of week that compounds.`,
    tone: 'great',
  }
  if (score >= 5) return {
    title: 'You had a strong week',
    subtitle: `Solid consistency across nutrition and training. Keep the momentum into next week.`,
    tone: 'good',
  }
  if (score >= 3) return {
    title: 'Mixed week',
    subtitle: `Some good days, some rough ones. Pick one thing to lock in next week.`,
    tone: 'okay',
  }
  return {
    title: 'Slow week',
    subtitle: `Life happens. Reset on Monday — one meal logged and you're back on track.`,
    tone: 'slow',
  }
}

function computeWins(ctx: {
  weightChange: number; workoutsCompleted: number; daysProteinHit: number
  daysUnderCal: number; totalMeals: number; daysLogged: number
}): WeeklyRecap['wins'] {
  const wins: WeeklyRecap['wins'] = []

  if (ctx.weightChange < 0 && ctx.weightChange > -2.5) {
    wins.push({
      title: `Lost ${Math.abs(ctx.weightChange).toFixed(1)} lbs`,
      detail: 'Right in the healthy range',
    })
  } else if (ctx.weightChange <= -2.5) {
    wins.push({
      title: `Lost ${Math.abs(ctx.weightChange).toFixed(1)} lbs`,
      detail: 'Big drop, watch fatigue next week',
    })
  }

  if (ctx.workoutsCompleted >= 4) {
    wins.push({
      title: `${ctx.workoutsCompleted} workouts completed`,
      detail: 'Strong training volume',
    })
  } else if (ctx.workoutsCompleted >= 2) {
    wins.push({
      title: `${ctx.workoutsCompleted} workouts completed`,
      detail: 'Consistency pays off',
    })
  }

  if (ctx.daysProteinHit >= 5) {
    wins.push({
      title: `Protein goal hit ${ctx.daysProteinHit} of 7 days`,
      detail: 'Your muscles thank you',
    })
  } else if (ctx.daysProteinHit >= 3) {
    wins.push({
      title: `Protein hit ${ctx.daysProteinHit} days`,
      detail: 'Getting there',
    })
  }

  if (ctx.daysUnderCal >= 5) {
    wins.push({
      title: `Under calorie goal ${ctx.daysUnderCal} days`,
      detail: 'Discipline is a skill',
    })
  }

  if (ctx.daysLogged >= 6) {
    wins.push({
      title: `Logged ${ctx.daysLogged} of 7 days`,
      detail: 'Near-perfect tracking',
    })
  }

  if (ctx.totalMeals >= 20) {
    wins.push({
      title: `${ctx.totalMeals} meals tracked`,
      detail: 'Every bite counts',
    })
  }

  return wins.slice(0, 4)
}

function computeFocus(ctx: {
  slowestDay?: DayScore; daysLogged: number; daysProteinHit: number
  daysUnderCal: number; workoutsCompleted: number
}): WeeklyRecap['focus'] {
  if (ctx.slowestDay && ctx.slowestDay.meals === 0) {
    return {
      title: `${ctx.slowestDay.dayLabel} was your weak spot`,
      detail: `You logged zero meals. Try pre-planning one meal for next ${ctx.slowestDay.dayLabel} — even a protein shake counts.`,
    }
  }
  if (ctx.daysLogged < 4) {
    return {
      title: 'Tracking consistency',
      detail: `You logged ${ctx.daysLogged} days this week. Aim for 5 next week — tracking is 80% of the game.`,
    }
  }
  if (ctx.daysProteinHit < 3) {
    return {
      title: 'Protein needs attention',
      detail: `You only hit your protein goal ${ctx.daysProteinHit} times. Try adding a high-protein snack or shake.`,
    }
  }
  if (ctx.workoutsCompleted < 3) {
    return {
      title: 'Training frequency',
      detail: `${ctx.workoutsCompleted} workouts this week. Aim for at least 3 next week to stay on track.`,
    }
  }
  if (ctx.daysUnderCal < 3) {
    return {
      title: 'Calorie control',
      detail: 'Calories ran over most days. Pre-logging breakfast in the morning anchors the rest of your day.',
    }
  }
  return {
    title: 'Keep the streak going',
    detail: 'Nothing to fix — just keep showing up.',
  }
}