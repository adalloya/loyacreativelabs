-- ========================================================================
-- APEX HYPERTROPHY OS - SUPABASE DATABASE SCHEMA
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER BIOMETRIC PROFILE & PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
    age INT NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    body_fat_pct NUMERIC(4,2), -- Opcional (activa Katch-McArdle)
    skeletal_muscle_pct NUMERIC(4,2), -- Opcional
    training_days_per_week INT CHECK (training_days_per_week BETWEEN 2 AND 7) DEFAULT 5,
    session_duration_mins INT DEFAULT 60,
    intensity_level TEXT CHECK (intensity_level IN ('hypertrophy_focus', 'strength_hypertrophy', 'high_intensity_hit')) DEFAULT 'hypertrophy_focus',
    preferred_cardio TEXT CHECK (preferred_cardio IN ('incline_treadmill', 'stairmaster', 'stationary_bike', 'none')) DEFAULT 'incline_treadmill',
    cardio_duration_mins INT DEFAULT 20,
    specialized_muscle TEXT, -- Músculo priorizado en ciclo
    caloric_deficit_pct INT DEFAULT 15,
    calculated_tdee INT,
    target_calories INT,
    target_protein_g INT,
    target_carbs_g INT,
    target_fats_g INT,
    preferred_music_genres TEXT[] DEFAULT ARRAY['Techno', 'Hip-Hop', 'Rock', 'Electronic'],
    spotify_connected BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXERCISES BIOMECHANICAL CATALOG
CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_muscle TEXT NOT NULL, -- 'chest', 'lats', 'upper_back', 'quads', 'hamstrings', 'delts', 'biceps', 'triceps', 'calves', 'glutes', 'core'
    anatomical_subdivision TEXT NOT NULL, -- 'clavicular_head', 'lateral_head', etc.
    secondary_muscles TEXT[],
    equipment TEXT CHECK (equipment IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight')) NOT NULL,
    movement_pattern TEXT NOT NULL, -- 'horizontal_push', 'incline_push', 'vertical_pull', 'horizontal_pull', 'knee_dominant', 'hip_hinge', 'isolation'
    resistance_profile TEXT CHECK (resistance_profile IN ('lengthened_bias', 'mid_range_overload', 'shortened_peak')) DEFAULT 'mid_range_overload',
    hypertrophy_tier TEXT CHECK (hypertrophy_tier IN ('S', 'A', 'B')) DEFAULT 'A',
    biomechanical_cue TEXT,
    animation_url TEXT,
    instructions TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_muscle_target_selector ON public.exercises (primary_muscle, hypertrophy_tier, equipment);

-- 3. WEEKLY ROUTINES & VOLUME REBALANCING
CREATE TABLE IF NOT EXISTS public.weekly_routines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL,
    environment_mode TEXT CHECK (environment_mode IN ('full_gym', 'hotel_gym', 'bodyweight')) DEFAULT 'full_gym',
    readiness_state TEXT CHECK (readiness_state IN ('optimal', 'normal', 'fatigued')) DEFAULT 'optimal',
    is_completed BOOLEAN DEFAULT FALSE,
    planned_exercises JSONB NOT NULL,
    extra_volume_added BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REAL EXERCISE LOGS (PROGRESSIVE OVERLOAD MEMORY)
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    exercise_id TEXT REFERENCES public.exercises(id),
    workout_date DATE DEFAULT CURRENT_DATE,
    set_number INT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    reps_completed INT NOT NULL,
    rir_perceived INT CHECK (rir_perceived BETWEEN 0 AND 5),
    estimated_1rm NUMERIC(6,2) GENERATED ALWAYS AS (weight_kg * (1 + (reps_completed::NUMERIC / 30.0))) STORED,
    mean_velocity_ms NUMERIC(4,2), -- Velocidad concéntrica media en m/s (VBT opcional)
    is_extra_set BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_exercise_history ON public.exercise_logs (user_id, exercise_id, created_at DESC);

-- 5. MONTHLY 30-DAY DIET PLANS (GEMINI API)
CREATE TABLE IF NOT EXISTS public.monthly_diet_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    calories_target INT NOT NULL,
    macros_target JSONB NOT NULL,
    days_plan JSONB NOT NULL,
    supplements_stack JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DAILY TELEMETRY LOGS (FOOD, WEIGHT, APPLE HEALTH)
CREATE TABLE IF NOT EXISTS public.daily_telemetry_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE,
    current_weight_kg NUMERIC(5,2),
    calories_consumed INT DEFAULT 0,
    protein_consumed_g INT DEFAULT 0,
    carbs_consumed_g INT DEFAULT 0,
    fats_consumed_g INT DEFAULT 0,
    water_ml INT DEFAULT 0,
    logged_meals JSONB DEFAULT '[]'::jsonb,
    sleep_hours NUMERIC(3,1),
    resting_hr INT,
    hrv_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_telemetry_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users own routines" ON public.weekly_routines FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users own logs" ON public.exercise_logs FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users own diets" ON public.monthly_diet_plans FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users own telemetry" ON public.daily_telemetry_logs FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
