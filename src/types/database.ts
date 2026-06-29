export type SyncStatus = 'local' | 'synced' | 'pending_delete' | 'conflict';

export type DbUserProfile = {
  id: string;
  display_name: string | null;
  unit_system: 'metric' | 'imperial';
  is_premium: boolean;
  created_at: string;
  updated_at: string;
};

export type DbExercise = {
  id: string;
  user_id: string | null;
  name: string;
  category_id: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
};

export type DbExerciseCategory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type DbMuscleGroup = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type ExerciseMuscleGroupRole = 'primary' | 'secondary';

export type DbExerciseMuscleGroup = {
  exercise_id: string;
  muscle_group_id: string;
  role: ExerciseMuscleGroupRole;
};

export type WorkoutStatus = 'active' | 'completed' | 'discarded';

export type DbWorkout = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: WorkoutStatus;
  started_at: string | null;
  completed_at: string | null;
  date: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DbWorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  exercise_name: string;
  muscle_group: string;
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
};

export type DbSetEntry = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  set_type: 'warmup' | 'working' | 'failed';
  weight_kg: number;
  reps: number;
  estimated_1rm: number | null;
  completed: boolean;
  sync_status: SyncStatus;
  created_at: string;
};

export type DbBodyweightEntry = {
  id: string;
  user_id: string;
  weight_kg: number;
  unit: 'kg' | 'lbs';
  date: string;
  measured_at: string;
  source: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
};

export type DbSplitType = 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom';

export type DbTrainingSplit = {
  id: string;
  user_id: string;
  name: string;
  type: DbSplitType;
  workouts_per_week: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbSplitDay = {
  id: string;
  split_id: string;
  name: string;
  day_order: number;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type DbSplitDayMuscleGroup = {
  split_day_id: string;
  muscle_group_id: string;
};

export type DbSplitDayExercise = {
  id: string;
  split_day_id: string;
  exercise_id: string;
  exercise_order: number;
  default_sets: number;
  default_reps: number;
  created_at: string;
  updated_at: string;
};
