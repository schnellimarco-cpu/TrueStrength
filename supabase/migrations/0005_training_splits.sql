CREATE TABLE training_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom'
    CHECK (type IN ('push_pull_legs', 'upper_lower', 'full_body', 'custom')),
  workouts_per_week INTEGER NOT NULL DEFAULT 3 CHECK (workouts_per_week BETWEEN 1 AND 7),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE split_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES training_splits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_order INTEGER NOT NULL DEFAULT 0,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE split_day_muscle_groups (
  split_day_id UUID NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
  muscle_group_id UUID NOT NULL REFERENCES muscle_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (split_day_id, muscle_group_id)
);

CREATE TABLE split_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_day_id UUID NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL DEFAULT 0,
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE training_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_day_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_day_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own splits"
  ON training_splits FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own split days"
  ON split_days FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_splits WHERE id = split_days.split_id AND user_id = auth.uid()
  ));

CREATE POLICY "users manage own split day muscle groups"
  ON split_day_muscle_groups FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM split_days sd
    JOIN training_splits ts ON ts.id = sd.split_id
    WHERE sd.id = split_day_muscle_groups.split_day_id AND ts.user_id = auth.uid()
  ));

CREATE POLICY "users manage own split day exercises"
  ON split_day_exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM split_days sd
    JOIN training_splits ts ON ts.id = sd.split_id
    WHERE sd.id = split_day_exercises.split_day_id AND ts.user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_training_splits_user ON training_splits(user_id);
CREATE INDEX idx_training_splits_active ON training_splits(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_split_days_split ON split_days(split_id, day_order);
