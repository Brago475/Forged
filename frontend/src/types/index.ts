export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  heightInches?: number
  startingWeight?: number
  goalWeight?: number
  createdAt?: string

}

export interface WeightEntry {
  id: string
  weight: number
  date: string
  notes?: string
}

export interface WorkoutLog {
  id: string
  date: string
  planType?: string
  dayName?: string
  durationMinutes?: number
  notes?: string
  completed: boolean
  exercises: ExerciseLog[]
}

export interface ExerciseLog {
  id: string
  exerciseName: string
  setsCompleted?: number
  repsCompleted?: string
  weightUsed?: number
  completed: boolean
  notes?: string
}

export interface HomeWorkoutLog {
  id: string
  date: string
  exercisesCompleted: number
  totalExercises: number
}

export interface JournalEntry {
  id: string
  date: string
  content: string
  mood?: string
}

export interface Food {
  id: string
  name: string
  brand?: string
  servingSize?: number
  servingUnit?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface FoodLog {
  id: string
  date: string
  mealType: string
  servings: number
  foodWeightGrams?: number
  food: Food
}

export interface FoodDaySummary {
  date: string
  totalCalories: number
  meals: string[]
}

export interface FastingLog {
  id: string
  startTime: string
  endTime?: string
  targetHours: number
  completed: boolean
  notes?: string
}

export interface Goal {
  id: string
  goalType: string
  targetValue?: number
  targetUnit?: string
  deadline?: string
  status: string
}

export interface DashboardStats {
  currentWeight: number
  weightLost: number
  totalWorkouts: number
  currentStreak: number
  recentWeights: WeightEntry[]
}