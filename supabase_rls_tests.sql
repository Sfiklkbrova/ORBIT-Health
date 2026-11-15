-- ============================================================================
-- ORBIT HEALTH: Supabase Row Level Security (RLS) Isolation Verification Suite
-- Demonstrates and proves that User A can NEVER read or tamper with User B's data.
-- ============================================================================

BEGIN;

-- 1. Setup Test Fixture Astronauts
DO $$
DECLARE
  user_a UUID := '11111111-1111-1111-1111-111111111111';
  user_b UUID := '22222222-2222-2222-2222-222222222222';
  rec_b_id TEXT := 'TELEMETRY-B-001';
  read_count_by_a INTEGER;
BEGIN
  RAISE NOTICE 'Starting ORBIT Health RLS Data Isolation Tests...';

  -- Simulate Insertions as System/Admin
  INSERT INTO public.astronaut_profiles (id, email, full_name, astronaut_id, role)
  VALUES 
    (user_a, 'alex.vance@nasa.gov', 'Commander Alex Vance', 'CDR-VANCE', 'COMMANDER'),
    (user_b, 'elena.rostova@nasa.gov', 'Dr. Elena Rostova', 'SURGEON-ROSTOVA', 'FLIGHT_SURGEON')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.astronaut_health_telemetry (
    id, user_id, timestamp, heart_rate, blood_oxygen, blood_pressure_sys, blood_pressure_dia,
    body_temperature, sleep_hours, sleep_quality, fatigue_level, stress_level,
    mood_wellbeing, exercise_type, exercise_duration
  ) VALUES (
    rec_b_id, user_b, NOW(), 74.0, 99.0, 118.0, 76.0, 36.6, 7.8, 'Optimal', 2, 'Low',
    'Focused', 'ARED Resistive Exercise', 90
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. TEST CASE 1: Impersonate User A (auth.uid() = user_a)
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Attempt to read User B's telemetry
  SELECT COUNT(*) INTO read_count_by_a
  FROM public.astronaut_health_telemetry
  WHERE user_id = user_b;

  IF read_count_by_a = 0 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: User A cannot read User B telemetry (0 rows returned via RLS).';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: User A read % rows belonging to User B!', read_count_by_a;
  END IF;

  -- 3. TEST CASE 2: Impersonate User A attempting to tamper/insert as User B
  BEGIN
    INSERT INTO public.astronaut_health_telemetry (
      id, user_id, timestamp, heart_rate, blood_oxygen, blood_pressure_sys, blood_pressure_dia,
      body_temperature, sleep_hours, sleep_quality, fatigue_level, stress_level,
      mood_wellbeing, exercise_type, exercise_duration
    ) VALUES (
      'MALICIOUS-INSERT-BY-A', user_b, NOW(), 180.0, 80.0, 200.0, 120.0, 39.0, 2.0, 'Disrupted', 9, 'High',
      'Strained', 'None / Rest Day', 0
    );
    RAISE EXCEPTION '❌ TEST 2 FAILED: User A was able to insert telemetry under User B user_id!';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE '✅ TEST 2 PASSED: RLS blocked User A from inserting records with user_id = User B.';
  END;

  -- 4. TEST CASE 3: Profile Confidentiality Test
  SELECT COUNT(*) INTO read_count_by_a
  FROM public.astronaut_profiles
  WHERE id = user_b;

  IF read_count_by_a = 0 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: User A cannot view User B astronaut profile (0 rows returned).';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: User A accessed User B profile!';
  END IF;

  RAISE NOTICE '🎉 ALL ORBIT HEALTH RLS SECURITY POLICIES VERIFIED.';
END $$;

ROLLBACK;
