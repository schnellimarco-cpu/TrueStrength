import { supabase } from './supabase';
import type { Exercise } from '@/types/exercises';
import type { ActiveSession } from '@/types/session';
import type { WorkoutExercise, WorkoutSet } from '@/components/workout/types';
import type { SplitDayExercise } from '@/types/splits';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeE1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  const base =
    reps <= 10
      ? weightKg / (1.0278 - 0.0278 * reps)
      : weightKg * (1 + reps / 30);
  return reps > 15 ? base * 0.85 : base;
}

export async function startSession(
  userId: string,
  title: string,
  splitId?: string,
  splitDayId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const id = generateId();
  const { error } = await supabase.from('workouts').insert({
    id,
    user_id: userId,
    title,
    status: 'active',
    date: todayIso(),
    started_at: now,
    completed_at: null,
    split_id: splitId ?? null,
    split_day_id: splitDayId ?? null,
    sync_status: 'synced',
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return id;
}

export async function prefillExercisesFromSplitDay(
  sessionId: string,
  exercises: SplitDayExercise[]
): Promise<void> {
  const now = new Date().toISOString();

  for (let i = 0; i < exercises.length; i++) {
    const entry = exercises[i];
    if (!entry.exercise) continue;

    const workoutExerciseId = generateId();
    const { error: exError } = await supabase.from('workout_exercises').insert({
      id: workoutExerciseId,
      workout_id: sessionId,
      exercise_id: entry.exerciseId,
      exercise_name: entry.exercise.name,
      muscle_group: entry.exercise.primaryMuscleGroup?.name ?? '',
      sort_order: i,
      sync_status: 'synced',
      created_at: now,
    });
    if (exError) throw exError;

    const setCount = entry.defaultSets > 0 ? entry.defaultSets : 3;
    const setInserts = Array.from({ length: setCount }, (_, si) => ({
      id: generateId(),
      workout_exercise_id: workoutExerciseId,
      set_number: si + 1,
      set_type: 'working',
      weight_kg: 0,
      reps: 0,
      estimated_1rm: null,
      completed: false,
      sync_status: 'synced',
      created_at: now,
    }));

    const { error: setError } = await supabase.from('set_entries').insert(setInserts);
    if (setError) throw setError;
  }
}

export async function getActiveSession(userId: string): Promise<ActiveSession | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, title, started_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, title: data.title, startedAt: data.started_at };
}

export async function loadSessionExercises(sessionId: string): Promise<WorkoutExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*, set_entries(*)')
    .eq('workout_id', sessionId)
    .order('sort_order');
  if (error) throw error;

  return (data ?? []).map((row): WorkoutExercise => ({
    id: row.id,
    exerciseId: row.exercise_id ?? null,
    name: row.exercise_name,
    muscleGroup: row.muscle_group,
    previousBest: '',
    sets: ((row.set_entries ?? []) as Array<{
      id: string; set_number: number; set_type: string;
      weight_kg: number; reps: number; completed: boolean;
    }>)
      .sort((a, b) => a.set_number - b.set_number)
      .map((s): WorkoutSet => ({
        id: s.id,
        type: s.set_type as 'warmup' | 'working',
        weight: s.weight_kg > 0 ? String(s.weight_kg) : '',
        reps: s.reps > 0 ? String(s.reps) : '',
        completed: s.completed,
      })),
  }));
}

export async function addExerciseToSession(
  sessionId: string,
  exercise: Exercise,
  sortOrder: number
): Promise<{ workoutExerciseId: string; setId: string }> {
  const now = new Date().toISOString();
  const workoutExerciseId = generateId();
  const setId = generateId();

  const { error: exError } = await supabase.from('workout_exercises').insert({
    id: workoutExerciseId,
    workout_id: sessionId,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    muscle_group: exercise.primaryMuscleGroup?.name ?? '',
    sort_order: sortOrder,
    sync_status: 'synced',
    created_at: now,
  });
  if (exError) throw exError;

  const { error: setError } = await supabase.from('set_entries').insert({
    id: setId,
    workout_exercise_id: workoutExerciseId,
    set_number: 1,
    set_type: 'working',
    weight_kg: 0,
    reps: 0,
    estimated_1rm: null,
    completed: false,
    sync_status: 'synced',
    created_at: now,
  });
  if (setError) throw setError;

  return { workoutExerciseId, setId };
}

export async function addSetToSession(
  workoutExerciseId: string,
  setNumber: number,
  lastSet?: WorkoutSet
): Promise<string> {
  const now = new Date().toISOString();
  const setId = generateId();
  const weightKg = lastSet ? (parseFloat(lastSet.weight) || 0) : 0;
  const reps = lastSet ? (parseInt(lastSet.reps, 10) || 0) : 0;

  const { error } = await supabase.from('set_entries').insert({
    id: setId,
    workout_exercise_id: workoutExerciseId,
    set_number: setNumber,
    set_type: 'working',
    weight_kg: weightKg,
    reps,
    estimated_1rm: null,
    completed: false,
    sync_status: 'synced',
    created_at: now,
  });
  if (error) throw error;
  return setId;
}

export async function updateSetField(
  setId: string,
  field: 'weight_kg' | 'reps',
  value: number
): Promise<void> {
  const { error } = await supabase
    .from('set_entries')
    .update({ [field]: value })
    .eq('id', setId);
  if (error) throw error;
}

export async function toggleSetComplete(
  setId: string,
  completed: boolean,
  weightKg: number,
  reps: number
): Promise<void> {
  const estimated1rm = completed ? computeE1RM(weightKg, reps) || null : null;
  const { error } = await supabase
    .from('set_entries')
    .update({ completed, estimated_1rm: estimated1rm })
    .eq('id', setId);
  if (error) throw error;
}

export async function finishSession(sessionId: string): Promise<void> {
  const now = new Date().toISOString();

  const { data: row } = await supabase
    .from('workouts')
    .select('started_at')
    .eq('id', sessionId)
    .maybeSingle();

  const durationSeconds =
    row?.started_at
      ? Math.round((Date.now() - new Date(row.started_at).getTime()) / 1000)
      : null;

  const { error } = await supabase
    .from('workouts')
    .update({
      status: 'completed',
      completed_at: now,
      duration_seconds: durationSeconds,
      updated_at: now,
    })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function discardSession(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('workouts')
    .update({ status: 'discarded', updated_at: now })
    .eq('id', sessionId);
  if (error) throw error;
}
