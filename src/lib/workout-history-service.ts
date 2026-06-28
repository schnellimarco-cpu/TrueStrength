import { supabase } from './supabase';
import type {
  CompletedWorkoutSummary,
  CompletedWorkoutDetail,
  CompletedWorkoutExercise,
  CompletedWorkoutSet,
} from '@/types/workout-history';

export async function getCompletedWorkouts(
  userId: string,
  limit = 20
): Promise<CompletedWorkoutSummary[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id, title, completed_at, date, duration_seconds, split_id, split_day_id,
      workout_exercises(
        id,
        exercise_name,
        set_entries(weight_kg, reps, completed)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map(row => {
    const exercises = (row.workout_exercises ?? []) as Array<{
      id: string;
      exercise_name: string;
      set_entries: Array<{ weight_kg: number; reps: number; completed: boolean }>;
    }>;

    let setCount = 0;
    let totalVolume = 0;

    for (const ex of exercises) {
      for (const s of ex.set_entries ?? []) {
        if (s.completed) {
          setCount++;
          totalVolume += (s.weight_kg ?? 0) * (s.reps ?? 0);
        }
      }
    }

    return {
      id: row.id,
      title: row.title,
      completedAt: row.completed_at ?? '',
      date: row.date ?? '',
      durationSeconds: row.duration_seconds ?? null,
      exerciseCount: exercises.length,
      setCount,
      totalVolume,
      splitId: row.split_id ?? null,
      splitDayId: row.split_day_id ?? null,
      splitDayName: null,
    };
  });
}

export async function getWorkoutDetail(
  workoutId: string
): Promise<CompletedWorkoutDetail | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id, title, completed_at, date, duration_seconds, split_id, split_day_id,
      workout_exercises(
        id, exercise_name, muscle_group, sort_order,
        set_entries(id, set_number, set_type, weight_kg, reps, completed, estimated_1rm)
      )
    `)
    .eq('id', workoutId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const exercises = ((data.workout_exercises ?? []) as Array<{
    id: string;
    exercise_name: string;
    muscle_group: string;
    sort_order: number;
    set_entries: Array<{
      id: string;
      set_number: number;
      set_type: string;
      weight_kg: number;
      reps: number;
      completed: boolean;
      estimated_1rm: number | null;
    }>;
  }>)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ex): CompletedWorkoutExercise => ({
      id: ex.id,
      exerciseName: ex.exercise_name,
      muscleGroup: ex.muscle_group,
      sets: (ex.set_entries ?? [])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s): CompletedWorkoutSet => ({
          id: s.id,
          setNumber: s.set_number,
          setType: s.set_type as 'warmup' | 'working' | 'failed',
          weightKg: s.weight_kg,
          reps: s.reps,
          completed: s.completed,
          estimatedOneRM: s.estimated_1rm,
          volume: s.completed ? s.weight_kg * s.reps : 0,
        })),
    }));

  let setCount = 0;
  let totalVolume = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (s.completed) { setCount++; totalVolume += s.volume; }
    }
  }

  return {
    id: data.id,
    title: data.title,
    completedAt: data.completed_at ?? '',
    date: data.date ?? '',
    durationSeconds: data.duration_seconds ?? null,
    exerciseCount: exercises.length,
    setCount,
    totalVolume,
    splitId: data.split_id ?? null,
    splitDayId: data.split_day_id ?? null,
    splitDayName: null,
    exercises,
  };
}
