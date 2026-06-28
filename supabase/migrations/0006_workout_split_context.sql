-- TrueStrength — Workout Split Context
-- Run this in: Supabase Dashboard → SQL Editor

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS split_id         UUID REFERENCES training_splits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS split_day_id     UUID REFERENCES split_days(id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_workouts_split
  ON workouts(split_id) WHERE split_id IS NOT NULL;
