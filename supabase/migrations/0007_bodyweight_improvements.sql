-- Drop unique-per-day constraint so multiple entries per day are allowed
-- and history is never blocked or overwritten
ALTER TABLE bodyweight_entries
  DROP CONSTRAINT IF EXISTS bodyweight_entries_user_id_date_key;

-- Unit for display (kg or lbs)
ALTER TABLE bodyweight_entries
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'kg'
    CHECK (unit IN ('kg', 'lbs'));

-- Precise timestamp for ordering; backfill from existing date column
ALTER TABLE bodyweight_entries
  ADD COLUMN IF NOT EXISTS measured_at TIMESTAMPTZ;

UPDATE bodyweight_entries
  SET measured_at = (date::TEXT || 'T12:00:00Z')::TIMESTAMPTZ
  WHERE measured_at IS NULL;

ALTER TABLE bodyweight_entries
  ALTER COLUMN measured_at SET NOT NULL;

-- Mutation tracking
ALTER TABLE bodyweight_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Replace date-based index with measured_at-based
DROP INDEX IF EXISTS idx_bodyweight_user_date;
CREATE INDEX IF NOT EXISTS idx_bodyweight_user_measured
  ON bodyweight_entries(user_id, measured_at DESC);
