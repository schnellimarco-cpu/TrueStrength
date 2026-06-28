-- Add status column to workouts table to support active/resumable sessions
-- started_at already exists; no RLS changes needed (existing policies cover this column)

ALTER TABLE workouts
  ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('active', 'completed', 'discarded'));

-- Index for fast active-session lookups per user
CREATE INDEX idx_workouts_user_status
  ON workouts(user_id, status)
  WHERE status = 'active';
