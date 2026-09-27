-- ==============================================================================
-- Fit360 — Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================
-- Versión: 1.1.0
-- Fecha: 26 de septiembre de 2026
-- Descripción: Estructura de base de datos con Row Level Security (RLS)
--              para sincronización segura de usuarios de Fit360 en la nube.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: user_profiles (Perfil, objetivos y preferencias del usuario)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Usuario',
    weight DECIMAL(5,2),             -- kg
    height DECIMAL(5,2),             -- cm
    sex TEXT CHECK (sex IN ('male', 'female', 'other')),
    birth_date DATE,
    goals JSONB DEFAULT '{
        "kcal": 2350,
        "protein": 165,
        "carbs": 265,
        "fat": 65,
        "appleMoveKcal": 650,
        "appleExerciseMin": 30,
        "appleStandHours": 12,
        "water": 2500
    }'::JSONB,
    preferences JSONB DEFAULT '{
        "dashboardWidgets": {
            "order": ["calories", "appleFitness", "weight", "workouts", "weeklyChart"],
            "hidden": []
        },
        "theme": "dark",
        "units": "metric"
    }'::JSONB,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA: daily_logs (Registros diarios de nutrición, agua y notas)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    nutrition JSONB DEFAULT '{
        "desayuno": [],
        "almuerzo": [],
        "merienda": [],
        "cena": [],
        "snacks": []
    }'::JSONB,
    water_ml INTEGER DEFAULT 0,
    health_sync JSONB DEFAULT NULL,   -- Snapshot informativo de actividad (pasos, kcal)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_daily_log UNIQUE (user_id, log_date)
);

-- 4. TABLA: weight_logs (Histórico de pesajes y % de grasa corporal)
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    fat_percentage DECIMAL(4,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABLA: workout_sessions (Sesiones completadas de Gimnasio o Cardio)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    workout_type TEXT CHECK (workout_type IN ('gym', 'cardio')) NOT NULL,
    name TEXT NOT NULL,
    duration_min INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    data JSONB NOT NULL,              -- Para gym: lista de ejercicios y series. Para cardio: distancia, ritmo, bpm.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABLA: custom_exercises (Ejercicios creados por el usuario)
CREATE TABLE IF NOT EXISTS public.custom_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. TABLA: custom_routines (Rutinas de entrenamiento personalizadas)
CREATE TABLE IF NOT EXISTS public.custom_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    muscle_groups TEXT[] DEFAULT '{}',
    exercises JSONB DEFAULT '[]'::JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. TABLA: custom_recipes (Recetas creadas por el usuario)
CREATE TABLE IF NOT EXISTS public.custom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    servings INTEGER DEFAULT 1,
    ingredients JSONB DEFAULT '[]'::JSONB,
    total_macros JSONB DEFAULT '{"kcal":0,"protein":0,"carbs":0,"fat":0}'::JSONB,
    per_serving_macros JSONB DEFAULT '{"kcal":0,"protein":0,"carbs":0,"fat":0}'::JSONB,
    instructions TEXT,
    prep_time_min INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. TABLA: favorite_foods (Alimentos favoritos para acceso rápido)
CREATE TABLE IF NOT EXISTS public.favorite_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_routines_user ON public.custom_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_recipes_user ON public.custom_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_user ON public.favorite_foods(user_id);

-- ==============================================================================
-- TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER trigger_daily_logs_updated_at
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_custom_routines_updated_at ON public.custom_routines;
CREATE TRIGGER trigger_custom_routines_updated_at
    BEFORE UPDATE ON public.custom_routines
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_custom_recipes_updated_at ON public.custom_recipes;
CREATE TRIGGER trigger_custom_recipes_updated_at
    BEFORE UPDATE ON public.custom_recipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- TRIGGER PARA AUTO-CREACIÓN DE PERFIL AL REGISTRARSE (Sign in with Apple / Email)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario Fit360')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Todos los datos quedan blindados y aislados por usuario.
-- ==============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles (la clave primaria es el ID de usuario)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Macro de políticas para tablas hijas (user_id = auth.uid())
-- 1. daily_logs
DROP POLICY IF EXISTS "Users manage own daily_logs" ON public.daily_logs;
CREATE POLICY "Users manage own daily_logs"
    ON public.daily_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. weight_logs
DROP POLICY IF EXISTS "Users manage own weight_logs" ON public.weight_logs;
CREATE POLICY "Users manage own weight_logs"
    ON public.weight_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. workout_sessions
DROP POLICY IF EXISTS "Users manage own workout_sessions" ON public.workout_sessions;
CREATE POLICY "Users manage own workout_sessions"
    ON public.workout_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. custom_exercises
DROP POLICY IF EXISTS "Users manage own custom_exercises" ON public.custom_exercises;
CREATE POLICY "Users manage own custom_exercises"
    ON public.custom_exercises FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. custom_routines
DROP POLICY IF EXISTS "Users manage own custom_routines" ON public.custom_routines;
CREATE POLICY "Users manage own custom_routines"
    ON public.custom_routines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. custom_recipes
DROP POLICY IF EXISTS "Users manage own custom_recipes" ON public.custom_recipes;
CREATE POLICY "Users manage own custom_recipes"
    ON public.custom_recipes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. favorite_foods
DROP POLICY IF EXISTS "Users manage own favorite_foods" ON public.favorite_foods;
CREATE POLICY "Users manage own favorite_foods"
    ON public.favorite_foods FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- FUNCIÓN RPC: ELIMINACIÓN TOTAL DE CUENTA (GDPR / DERECHO AL OLVIDO)
-- Permite al usuario borrar todos sus registros y su cuenta desde la app.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'No autorizado. Debe haber una sesión activa.';
    END IF;

    -- Al eliminar el registro de user_profiles, la cascada limpiará todo
    DELETE FROM public.user_profiles WHERE id = current_uid;
    -- Eliminar el usuario de auth
    DELETE FROM auth.users WHERE id = current_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
