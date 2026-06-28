-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE workouts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_entries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodyweight_entries    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- workouts (user_id column)
-- ============================================================
CREATE POLICY "workouts_insert" ON workouts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_select" ON workouts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "workouts_update" ON workouts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_delete" ON workouts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- workout_exercises (no user_id — join to workouts)
-- ============================================================
CREATE POLICY "workout_exercises_insert" ON workout_exercises FOR INSERT TO authenticated
  WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_exercises_select" ON workout_exercises FOR SELECT TO authenticated
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_exercises_update" ON workout_exercises FOR UPDATE TO authenticated
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_exercises_delete" ON workout_exercises FOR DELETE TO authenticated
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- ============================================================
-- set_entries (no user_id — join through workout_exercises → workouts)
-- ============================================================
CREATE POLICY "set_entries_insert" ON set_entries FOR INSERT TO authenticated
  WITH CHECK (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "set_entries_select" ON set_entries FOR SELECT TO authenticated
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "set_entries_update" ON set_entries FOR UPDATE TO authenticated
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "set_entries_delete" ON set_entries FOR DELETE TO authenticated
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

-- ============================================================
-- user_profiles (id IS auth.uid — no user_id column)
-- ============================================================
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- exercises (user_id nullable — NULL = global library)
-- ============================================================
CREATE POLICY "exercises_select" ON exercises FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "exercises_insert" ON exercises FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_update" ON exercises FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_delete" ON exercises FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- bodyweight_entries (user_id column)
-- ============================================================
CREATE POLICY "bodyweight_insert" ON bodyweight_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bodyweight_select" ON bodyweight_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bodyweight_update" ON bodyweight_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bodyweight_delete" ON bodyweight_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
