-- TrueStrength — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. User profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY,
  display_name TEXT,
  unit_system  TEXT NOT NULL DEFAULT 'metric'
                 CHECK (unit_system IN ('metric', 'imperial')),
  is_premium   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Exercises (global library when user_id IS NULL, user-defined otherwise)
CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  name         TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workouts (one row per training session)
CREATE TABLE IF NOT EXISTS workouts (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL,
  title        TEXT NOT NULL,
  notes        TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  sync_status  TEXT NOT NULL DEFAULT 'local'
                 CHECK (sync_status IN ('local', 'synced', 'pending_delete', 'conflict')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- 4. Workout exercises (exercises within a session)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id            UUID PRIMARY KEY,
  workout_id    UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id   UUID REFERENCES exercises(id),  -- nullable: populated when library is seeded
  exercise_name TEXT NOT NULL,                  -- denormalized for display without join
  muscle_group  TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  sync_status   TEXT NOT NULL DEFAULT 'local',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Set entries (individual sets within an exercise)
CREATE TABLE IF NOT EXISTS set_entries (
  id                  UUID PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number          INTEGER NOT NULL,
  set_type            TEXT NOT NULL DEFAULT 'working'
                        CHECK (set_type IN ('warmup', 'working', 'failed')),
  weight_kg           FLOAT8 NOT NULL CHECK (weight_kg >= 0),
  reps                INTEGER NOT NULL CHECK (reps >= 0),
  estimated_1rm       FLOAT8,   -- pre-computed on save; feeds strength score algorithm
  completed           BOOLEAN NOT NULL DEFAULT TRUE,
  sync_status         TEXT NOT NULL DEFAULT 'local',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bodyweight entries
CREATE TABLE IF NOT EXISTS bodyweight_entries (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL,
  weight_kg   FLOAT8 NOT NULL CHECK (weight_kg > 0),
  date        DATE NOT NULL,
  source      TEXT NOT NULL DEFAULT 'manual',
  sync_status TEXT NOT NULL DEFAULT 'local',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workouts_user_date
  ON workouts(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
  ON workout_exercises(workout_id);

CREATE INDEX IF NOT EXISTS idx_set_entries_workout_exercise
  ON set_entries(workout_exercise_id);

CREATE INDEX IF NOT EXISTS idx_bodyweight_user_date
  ON bodyweight_entries(user_id, date DESC);

-- ─────────────────────────────────────────────────────────────────
-- TODO: Enable Row Level Security after adding real auth
-- ─────────────────────────────────────────────────────────────────
-- ALTER TABLE workouts           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_exercises  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE set_entries        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bodyweight_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "users own their workouts"
--   ON workouts FOR ALL USING (auth.uid() = user_id);
--
-- CREATE POLICY "users own their workout exercises"
--   ON workout_exercises FOR ALL
--   USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));
--
-- CREATE POLICY "users own their set entries"
--   ON set_entries FOR ALL
--   USING (workout_exercise_id IN (
--     SELECT we.id FROM workout_exercises we
--     JOIN workouts w ON we.workout_id = w.id
--     WHERE w.user_id = auth.uid()
--   ));
--
-- CREATE POLICY "users own their bodyweight"
--   ON bodyweight_entries FOR ALL USING (auth.uid() = user_id);
--
-- CREATE POLICY "users own their profile"
--   ON user_profiles FOR ALL USING (auth.uid() = id);
-- ─────────────────────────────────────────────────────────────────
