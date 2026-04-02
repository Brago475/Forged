-- FORGED Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    height_inches DECIMAL(4,1),
    starting_weight DECIMAL(5,1),
    goal_weight DECIMAL(5,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight entries
CREATE TABLE IF NOT EXISTS weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,1) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Workout logs (one entry per gym session)
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plan_type VARCHAR(20),
    day_name VARCHAR(50),
    duration_minutes INTEGER,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise logs (individual exercises within a workout)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    sets_completed INTEGER,
    reps_completed VARCHAR(50),
    weight_used DECIMAL(5,1),
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Home workout logs (daily bodyweight circuit)
CREATE TABLE IF NOT EXISTS home_workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    exercises_completed INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Journal entries (notes on how you feel)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_user_date ON workout_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_home_user_date ON home_workout_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, date DESC);

-- ══════════════════════════════════
-- NUTRITION & FOOD TRACKING
-- ══════════════════════════════════

-- Food items (your personal food database)
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    serving_size DECIMAL(7,1),
    serving_unit VARCHAR(20),
    calories DECIMAL(7,1),
    protein DECIMAL(6,1),
    carbs DECIMAL(6,1),
    fat DECIMAL(6,1),
    fiber DECIMAL(6,1),
    sugar DECIMAL(6,1),
    sodium DECIMAL(7,1),
    cholesterol DECIMAL(6,1),
    saturated_fat DECIMAL(6,1),
    trans_fat DECIMAL(6,1),
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food diary (what you ate each day)
CREATE TABLE IF NOT EXISTS food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    servings DECIMAL(5,2) DEFAULT 1.0,
    food_weight_grams DECIMAL(7,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes (custom recipes with ingredients)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    servings INTEGER DEFAULT 1,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    amount DECIMAL(7,2) NOT NULL,
    unit VARCHAR(20)
);

-- Meal plans (weekly templates)
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plan entries
CREATE TABLE IF NOT EXISTS meal_plan_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    servings DECIMAL(5,2) DEFAULT 1.0
);

-- Grocery lists
CREATE TABLE IF NOT EXISTS grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery list items
CREATE TABLE IF NOT EXISTS grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(7,2),
    unit VARCHAR(20),
    checked BOOLEAN DEFAULT FALSE
);

-- Fasting tracker
CREATE TABLE IF NOT EXISTS fasting_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    target_hours INTEGER DEFAULT 16,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- ══════════════════════════════════
-- GOALS & PROGRESS
-- ══════════════════════════════════

-- User goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(30) NOT NULL,
    target_value DECIMAL(7,1),
    target_unit VARCHAR(20),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout routines (saved templates)
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20),
    days_per_week INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routine days
CREATE TABLE IF NOT EXISTS routine_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL,
    day_label VARCHAR(100) NOT NULL,
    day_order INTEGER NOT NULL
);

-- Routine exercises
CREATE TABLE IF NOT EXISTS routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    sets VARCHAR(10),
    reps VARCHAR(50),
    notes TEXT,
    exercise_order INTEGER NOT NULL
);

-- Nutrition indexes
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_user ON fasting_logs(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id, status);