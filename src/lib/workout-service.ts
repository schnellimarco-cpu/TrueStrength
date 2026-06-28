import { supabase } from './supabase';
import { getOrCreateSession } from './auth';
import type { WorkoutExercise } from '@/components/workout/types';

export type DebugInfo = {
  urlLoaded: boolean;
  keyLoaded: boolean;
  userId: string | null;
  authError?: string;
  step?: string;
  dbError?: string;
  dbCode?: string;
  dbDetails?: string;
  dbHint?: string;
};

export type SaveResult =
  | { success: true; workoutId: string }
  | { success: false; error: string; debug: DebugInfo };

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function computeE1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  const base =
    reps <= 10
      ? weightKg / (1.0278 - 0.0278 * reps)  // Brzycki
      : weightKg * (1 + reps / 30);           // Epley
  return reps > 15 ? base * 0.85 : base;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dbFail(debug: DebugInfo, step: string, e: { message?: string; code?: string; details?: string; hint?: string }): SaveResult {
  const info: DebugInfo = {
    ...debug,
    step,
    dbError: e.message,
    dbCode: e.code,
    dbDetails: e.details ?? undefined,
    dbHint: e.hint ?? undefined,
  };
  console.error('[save] FAILED at step:', step, JSON.stringify(info, null, 2));
  return { success: false, error: e.message ?? 'Unknown error', debug: info };
}

export async function saveWorkout(
  title: string,
  exercises: WorkoutExercise[]
): Promise<SaveResult> {
  const urlLoaded = !!(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const keyLoaded = !!(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  console.log('[save] url loaded:', urlLoaded, '| key loaded:', keyLoaded);

  const debug: DebugInfo = { urlLoaded, keyLoaded, userId: null };

  if (!urlLoaded || !keyLoaded) {
    debug.step = 'env-check';
    return { success: false, error: 'Supabase URL or key not loaded from environment.', debug };
  }

  let userId: string | null;
  try {
    userId = await getOrCreateSession();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    debug.authError = msg;
    debug.step = 'auth';
    console.error('[save] auth threw:', msg);
    return { success: false, error: `Auth error: ${msg}`, debug };
  }

  debug.userId = userId;
  console.log('[save] userId:', userId);

  if (!userId) {
    debug.step = 'auth';
    debug.authError = 'signInAnonymously returned no user';
    return { success: false, error: 'Authentication failed — no user ID returned.', debug };
  }

  const now = new Date().toISOString();
  const workoutId = generateId();

  console.log('[save] inserting workout id:', workoutId);
  const { error: workoutError } = await supabase.from('workouts').insert({
    id: workoutId,
    user_id: userId,
    title,
    date: todayIso(),
    completed_at: now,
    sync_status: 'synced',
    created_at: now,
    updated_at: now,
  });

  if (workoutError) return dbFail(debug, 'insert-workout', workoutError);

  const exercisesWithCompletedSets = exercises.filter(ex =>
    ex.sets.some(s => s.completed)
  );

  for (let i = 0; i < exercisesWithCompletedSets.length; i++) {
    const ex = exercisesWithCompletedSets[i];
    const workoutExerciseId = generateId();

    console.log('[save] inserting exercise:', ex.name);
    const { error: exError } = await supabase.from('workout_exercises').insert({
      id: workoutExerciseId,
      workout_id: workoutId,
      exercise_id: ex.exerciseId ?? null,
      exercise_name: ex.name,
      muscle_group: ex.muscleGroup,
      sort_order: i,
      sync_status: 'synced',
      created_at: now,
    });

    if (exError) return dbFail(debug, `insert-exercise:${ex.name}`, exError);

    const completedSets = ex.sets.filter(s => s.completed);
    let setNumber = 0;

    for (const set of completedSets) {
      setNumber += 1;
      const weightKg = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps, 10) || 0;

      console.log(`[save] inserting set ${setNumber} for ${ex.name}: ${weightKg}kg × ${reps}`);
      const { error: setError } = await supabase.from('set_entries').insert({
        id: generateId(),
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        set_type: set.type,
        weight_kg: weightKg,
        reps,
        estimated_1rm: computeE1RM(weightKg, reps) || null,
        completed: true,
        sync_status: 'synced',
        created_at: now,
      });

      if (setError) return dbFail(debug, `insert-set:${ex.name}:${setNumber}`, setError);
    }
  }

  console.log('[save] SUCCESS workoutId:', workoutId);
  return { success: true, workoutId };
}
