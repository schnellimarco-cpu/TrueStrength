-- =============================================================
-- 0003_exercise_library.sql
-- Exercise categories, muscle groups, many-to-many links,
-- updated exercises table, RLS, and seed data.
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. New lookup tables
-- ─────────────────────────────────────────────

CREATE TABLE exercise_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE muscle_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exercise_muscle_groups (
  exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group_id UUID NOT NULL REFERENCES muscle_groups(id),
  role            TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
  PRIMARY KEY (exercise_id, muscle_group_id)
);

-- ─────────────────────────────────────────────
-- 2. Alter exercises table
-- ─────────────────────────────────────────────

ALTER TABLE exercises
  ADD COLUMN category_id UUID REFERENCES exercise_categories(id),
  ADD COLUMN updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE exercises DROP COLUMN muscle_group;

-- ─────────────────────────────────────────────
-- 3. Row-Level Security for new tables
-- ─────────────────────────────────────────────

ALTER TABLE exercise_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscle_groups ENABLE ROW LEVEL SECURITY;

-- Categories: authenticated users can read
CREATE POLICY "exercise_categories_select" ON exercise_categories
  FOR SELECT TO authenticated USING (true);

-- Muscle groups: authenticated users can read
CREATE POLICY "muscle_groups_select" ON muscle_groups
  FOR SELECT TO authenticated USING (true);

-- exercise_muscle_groups: read global exercises or own custom
CREATE POLICY "emg_select" ON exercise_muscle_groups
  FOR SELECT TO authenticated
  USING (
    exercise_id IN (
      SELECT id FROM exercises WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- exercise_muscle_groups: write only for own custom exercises
CREATE POLICY "emg_insert" ON exercise_muscle_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    exercise_id IN (
      SELECT id FROM exercises WHERE user_id = auth.uid() AND is_custom = TRUE
    )
  );

CREATE POLICY "emg_update" ON exercise_muscle_groups
  FOR UPDATE TO authenticated
  USING (
    exercise_id IN (
      SELECT id FROM exercises WHERE user_id = auth.uid() AND is_custom = TRUE
    )
  );

CREATE POLICY "emg_delete" ON exercise_muscle_groups
  FOR DELETE TO authenticated
  USING (
    exercise_id IN (
      SELECT id FROM exercises WHERE user_id = auth.uid() AND is_custom = TRUE
    )
  );

-- Tighten exercises INSERT: users can only create custom exercises
DROP POLICY IF EXISTS "exercises_insert" ON exercises;
CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

-- ─────────────────────────────────────────────
-- 4. Seed: exercise categories
-- ─────────────────────────────────────────────

INSERT INTO exercise_categories (name, slug) VALUES
  ('Barbell',       'barbell'),
  ('Dumbbell',      'dumbbell'),
  ('Machine',       'machine'),
  ('Cable',         'cable'),
  ('Bodyweight',    'bodyweight'),
  ('Smith Machine', 'smith-machine'),
  ('Other',         'other');

-- ─────────────────────────────────────────────
-- 5. Seed: muscle groups
-- ─────────────────────────────────────────────

INSERT INTO muscle_groups (name, slug) VALUES
  ('Chest',      'chest'),
  ('Back',       'back'),
  ('Shoulders',  'shoulders'),
  ('Biceps',     'biceps'),
  ('Triceps',    'triceps'),
  ('Quads',      'quads'),
  ('Hamstrings', 'hamstrings'),
  ('Glutes',     'glutes'),
  ('Calves',     'calves'),
  ('Core',       'core');

-- ─────────────────────────────────────────────
-- 6. Seed: global exercises (user_id = null, is_custom = false)
-- ─────────────────────────────────────────────

INSERT INTO exercises (name, category_id, user_id, is_custom) VALUES
  ('Bench Press',         (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Incline Bench Press', (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Overhead Press',      (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Squat',               (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Deadlift',            (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Romanian Deadlift',   (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Pull Up',             (SELECT id FROM exercise_categories WHERE slug = 'bodyweight'), NULL, FALSE),
  ('Lat Pulldown',        (SELECT id FROM exercise_categories WHERE slug = 'cable'),      NULL, FALSE),
  ('Barbell Row',         (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Cable Row',           (SELECT id FROM exercise_categories WHERE slug = 'cable'),      NULL, FALSE),
  ('Dumbbell Row',        (SELECT id FROM exercise_categories WHERE slug = 'dumbbell'),   NULL, FALSE),
  ('Chest Fly',           (SELECT id FROM exercise_categories WHERE slug = 'dumbbell'),   NULL, FALSE),
  ('Lateral Raise',       (SELECT id FROM exercise_categories WHERE slug = 'dumbbell'),   NULL, FALSE),
  ('Rear Delt Fly',       (SELECT id FROM exercise_categories WHERE slug = 'dumbbell'),   NULL, FALSE),
  ('Bicep Curl',          (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Hammer Curl',         (SELECT id FROM exercise_categories WHERE slug = 'dumbbell'),   NULL, FALSE),
  ('Tricep Pushdown',     (SELECT id FROM exercise_categories WHERE slug = 'cable'),      NULL, FALSE),
  ('Skull Crusher',       (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Leg Press',           (SELECT id FROM exercise_categories WHERE slug = 'machine'),    NULL, FALSE),
  ('Leg Extension',       (SELECT id FROM exercise_categories WHERE slug = 'machine'),    NULL, FALSE),
  ('Leg Curl',            (SELECT id FROM exercise_categories WHERE slug = 'machine'),    NULL, FALSE),
  ('Hip Thrust',          (SELECT id FROM exercise_categories WHERE slug = 'barbell'),    NULL, FALSE),
  ('Calf Raise',          (SELECT id FROM exercise_categories WHERE slug = 'machine'),    NULL, FALSE);

-- ─────────────────────────────────────────────
-- 7. Seed: exercise muscle group links
-- Subqueries resolve IDs by name/slug — fully atomic single statement
-- ─────────────────────────────────────────────

INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, role) VALUES
  -- Bench Press
  ((SELECT id FROM exercises WHERE name = 'Bench Press'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'chest'),      'primary'),
  ((SELECT id FROM exercises WHERE name = 'Bench Press'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'triceps'),    'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Bench Press'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'secondary'),
  -- Incline Bench Press
  ((SELECT id FROM exercises WHERE name = 'Incline Bench Press' AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'chest'),      'primary'),
  ((SELECT id FROM exercises WHERE name = 'Incline Bench Press' AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Incline Bench Press' AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'triceps'),    'secondary'),
  -- Overhead Press
  ((SELECT id FROM exercises WHERE name = 'Overhead Press'      AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'primary'),
  ((SELECT id FROM exercises WHERE name = 'Overhead Press'      AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'triceps'),    'secondary'),
  -- Squat
  ((SELECT id FROM exercises WHERE name = 'Squat'               AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'quads'),      'primary'),
  ((SELECT id FROM exercises WHERE name = 'Squat'               AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'glutes'),     'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Squat'               AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Squat'               AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'core'),       'secondary'),
  -- Deadlift
  ((SELECT id FROM exercises WHERE name = 'Deadlift'            AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Deadlift'            AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Deadlift'            AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'glutes'),     'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Deadlift'            AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'core'),       'secondary'),
  -- Romanian Deadlift
  ((SELECT id FROM exercises WHERE name = 'Romanian Deadlift'   AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'primary'),
  ((SELECT id FROM exercises WHERE name = 'Romanian Deadlift'   AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'glutes'),     'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Romanian Deadlift'   AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'secondary'),
  -- Pull Up
  ((SELECT id FROM exercises WHERE name = 'Pull Up'             AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Pull Up'             AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'secondary'),
  -- Lat Pulldown
  ((SELECT id FROM exercises WHERE name = 'Lat Pulldown'        AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Lat Pulldown'        AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'secondary'),
  -- Barbell Row
  ((SELECT id FROM exercises WHERE name = 'Barbell Row'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Barbell Row'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'secondary'),
  -- Cable Row
  ((SELECT id FROM exercises WHERE name = 'Cable Row'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Cable Row'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'secondary'),
  -- Dumbbell Row
  ((SELECT id FROM exercises WHERE name = 'Dumbbell Row'        AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'primary'),
  ((SELECT id FROM exercises WHERE name = 'Dumbbell Row'        AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'secondary'),
  -- Chest Fly
  ((SELECT id FROM exercises WHERE name = 'Chest Fly'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'chest'),      'primary'),
  ((SELECT id FROM exercises WHERE name = 'Chest Fly'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'secondary'),
  -- Lateral Raise
  ((SELECT id FROM exercises WHERE name = 'Lateral Raise'       AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'primary'),
  -- Rear Delt Fly
  ((SELECT id FROM exercises WHERE name = 'Rear Delt Fly'       AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'),  'primary'),
  ((SELECT id FROM exercises WHERE name = 'Rear Delt Fly'       AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'back'),       'secondary'),
  -- Bicep Curl
  ((SELECT id FROM exercises WHERE name = 'Bicep Curl'          AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'primary'),
  -- Hammer Curl
  ((SELECT id FROM exercises WHERE name = 'Hammer Curl'         AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'biceps'),     'primary'),
  -- Tricep Pushdown
  ((SELECT id FROM exercises WHERE name = 'Tricep Pushdown'     AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'triceps'),    'primary'),
  -- Skull Crusher
  ((SELECT id FROM exercises WHERE name = 'Skull Crusher'       AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'triceps'),    'primary'),
  -- Leg Press
  ((SELECT id FROM exercises WHERE name = 'Leg Press'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'quads'),      'primary'),
  ((SELECT id FROM exercises WHERE name = 'Leg Press'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'glutes'),     'secondary'),
  ((SELECT id FROM exercises WHERE name = 'Leg Press'           AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'secondary'),
  -- Leg Extension
  ((SELECT id FROM exercises WHERE name = 'Leg Extension'       AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'quads'),      'primary'),
  -- Leg Curl
  ((SELECT id FROM exercises WHERE name = 'Leg Curl'            AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'primary'),
  -- Hip Thrust
  ((SELECT id FROM exercises WHERE name = 'Hip Thrust'          AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'glutes'),     'primary'),
  ((SELECT id FROM exercises WHERE name = 'Hip Thrust'          AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'secondary'),
  -- Calf Raise
  ((SELECT id FROM exercises WHERE name = 'Calf Raise'          AND user_id IS NULL), (SELECT id FROM muscle_groups WHERE slug = 'calves'),     'primary');
