-- ============================================================================
-- ORBIT HEALTH — ASTRONAUT TELEMETRY & MEDICAL PLATFORM
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project and navigate to the "SQL Editor" in the left sidebar.
-- 3. Paste the contents of this file and click "Run".
-- 4. Navigate to Project Settings > API to copy:
--    - Project URL -> Set as EXPO_PUBLIC_SUPABASE_URL in .env
--    - anon public key -> Set as EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Astronaut Profiles Table
-- Linked 1:1 with Supabase Authentication users (auth.users)
CREATE TABLE IF NOT EXISTS public.astronaut_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  astronaut_id TEXT,
  mission_name TEXT DEFAULT 'Artemis Gateway Alpha',
  mission_start_date TEXT,
  role TEXT DEFAULT 'COMMANDER',
  preferred_language TEXT DEFAULT 'en',
  avatar_id TEXT DEFAULT 'commander',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Astronaut Health Telemetry Table
-- Stores physiological telemetry, biometrics, sleep, exercise, and vitals
CREATE TABLE IF NOT EXISTS public.astronaut_health_telemetry (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  heart_rate REAL NOT NULL,
  blood_oxygen REAL NOT NULL,
  blood_pressure_sys REAL NOT NULL,
  blood_pressure_dia REAL NOT NULL,
  body_temperature REAL NOT NULL,
  sleep_hours REAL NOT NULL,
  sleep_quality TEXT NOT NULL,
  fatigue_level INTEGER NOT NULL,
  stress_level TEXT NOT NULL,
  mood_wellbeing TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  exercise_duration INTEGER NOT NULL,
  is_manual INTEGER DEFAULT 0,
  station_origin TEXT DEFAULT 'Artemis Gateway Alpha',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for Query Performance & Astronaut Data Separation
CREATE INDEX IF NOT EXISTS idx_telemetry_user_time 
  ON public.astronaut_health_telemetry (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.astronaut_profiles (email);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Astronaut Data Isolation: One astronaut CANNOT view another astronaut's data!
-- ============================================================================

-- Enable RLS on Profiles
ALTER TABLE public.astronaut_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Astronauts can only view their own profile
CREATE POLICY "Astronauts can view own profile"
  ON public.astronaut_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Astronauts can insert their own profile
CREATE POLICY "Astronauts can insert own profile"
  ON public.astronaut_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Astronauts can update their own profile
CREATE POLICY "Astronauts can update own profile"
  ON public.astronaut_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Enable RLS on Health Telemetry
ALTER TABLE public.astronaut_health_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Astronauts can only view their own health records
CREATE POLICY "Astronauts can view own health telemetry"
  ON public.astronaut_health_telemetry
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Astronauts can only insert telemetry under their own ID
CREATE POLICY "Astronauts can insert own health telemetry"
  ON public.astronaut_health_telemetry
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Astronauts can only update their own telemetry
CREATE POLICY "Astronauts can update own health telemetry"
  ON public.astronaut_health_telemetry
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Astronauts can delete only their own telemetry
CREATE POLICY "Astronauts can delete own health telemetry"
  ON public.astronaut_health_telemetry
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Trigger: Automatically create astronaut_profiles on auth.users sign-up
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_astronaut()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.astronaut_profiles (
    id,
    email,
    full_name,
    astronaut_id,
    mission_name,
    preferred_language
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Astronaut Crew Member'),
    COALESCE(new.raw_user_meta_data->>'astronaut_id', 'ASTRO-' || SUBSTRING(new.id::text FROM 1 FOR 6)),
    COALESCE(new.raw_user_meta_data->>'mission_name', 'Artemis Gateway Alpha'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_astronaut();
