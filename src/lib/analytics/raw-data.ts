import { supabase } from '../supabase';
import { getWeightHistory } from '../bodyweight-service';
import { getActiveSplit } from '../split-service';
import type {
  AnalyticsRawData,
  AnalyticsRawWorkout,
  AnalyticsRawExercise,
  AnalyticsRawSet,
} from '@/types/analytics';

type DbSet = {
  weight_kg: number;
  reps: number;
  completed: boolean;
  estimated_1rm: number | null;
  set_type: string;
};

type DbExercise = {
  exercise_name: string;
  muscle_group: string | null;
  set_entries: DbSet[];
};

type DbWorkout = {
  id: string;
  date: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  split_id: string | null;
  split_day_id: string | null;
  workout_exercises: DbExercise[];
};

function normalizeSet(s: DbSet): AnalyticsRawSet {
  return {
    weightKg: s.weight_kg ?? 0,
    reps: s.reps ?? 0,
    completed: s.completed ?? false,
    estimated1RM: s.estimated_1rm ?? null,
    setType: (s.set_type as AnalyticsRawSet['setType']) ?? 'working',
  };
}

function normalizeExercise(e: DbExercise): AnalyticsRawExercise {
  return {
    exerciseName: e.exercise_name ?? '',
    muscleGroup: e.muscle_group ?? null,
    sets: (e.set_entries ?? []).map(normalizeSet),
  };
}

function normalizeWorkout(w: DbWorkout): AnalyticsRawWorkout {
  return {
    id: w.id,
    date: w.date ?? null,
    completedAt: w.completed_at ?? null,
    durationSeconds: w.duration_seconds ?? null,
    splitId: w.split_id ?? null,
    splitDayId: w.split_day_id ?? null,
    exercises: (w.workout_exercises ?? []).map(normalizeExercise),
  };
}

export async function fetchAnalyticsRawData(userId: string): Promise<AnalyticsRawData> {
  const [workoutsResult, bodyweightHistory, activeSplit] = await Promise.all([
    supabase
      .from('workouts')
      .select(`
        id, date, completed_at, duration_seconds, split_id, split_day_id,
        workout_exercises(
          exercise_name, muscle_group,
          set_entries(weight_kg, reps, completed, estimated_1rm, set_type)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false }),
    getWeightHistory(userId),
    getActiveSplit(userId),
  ]);

  if (workoutsResult.error) throw workoutsResult.error;

  return {
    workouts: ((workoutsResult.data ?? []) as DbWorkout[]).map(normalizeWorkout),
    bodyweightHistory,
    activeSplitWorkoutsPerWeek: activeSplit?.workoutsPerWeek ?? null,
  };
}
