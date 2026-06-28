import { supabase } from './supabase';
import { getExerciseById } from './exercise-service';
import type { Exercise, MuscleGroup } from '@/types/exercises';
import type {
  TrainingSplit,
  SplitDay,
  SplitDayExercise,
  SplitType,
  CreateSplitInput,
} from '@/types/splits';

// ─── Raw DB shapes ─────────────────────────────────────────────

type RawMGJoin = {
  muscle_group: MuscleGroup | null;
};

type RawExMGRow = {
  role: 'primary' | 'secondary';
  muscle_group: MuscleGroup | null;
};

type RawExercise = {
  id: string;
  name: string;
  is_custom: boolean;
  user_id: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  exercise_muscle_groups: RawExMGRow[];
};

type RawSplitDayExercise = {
  id: string;
  split_day_id: string;
  exercise_id: string;
  exercise_order: number;
  default_sets: number;
  default_reps: number;
  created_at: string;
  updated_at: string;
  exercise: RawExercise | null;
};

type RawSplitDay = {
  id: string;
  split_id: string;
  name: string;
  day_order: number;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  split_day_muscle_groups: RawMGJoin[];
  split_day_exercises: RawSplitDayExercise[];
};

type RawTrainingSplit = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  workouts_per_week: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  split_days: RawSplitDay[];
};

// ─── Select strings ────────────────────────────────────────────

const EXERCISE_JOIN =
  'exercise:exercises(id,name,is_custom,user_id,category_id,created_at,updated_at,category:exercise_categories(id,name,slug),exercise_muscle_groups(role,muscle_group:muscle_groups(id,name,slug)))';

const DAY_WITH_EXERCISES =
  `id,split_id,name,day_order,estimated_duration_minutes,created_at,updated_at,split_day_muscle_groups(muscle_group:muscle_groups(id,name,slug)),split_day_exercises(id,split_day_id,exercise_id,exercise_order,default_sets,default_reps,created_at,updated_at,${EXERCISE_JOIN})`;

const DAY_WITHOUT_EXERCISES =
  'id,split_id,name,day_order,estimated_duration_minutes,created_at,updated_at,split_day_muscle_groups(muscle_group:muscle_groups(id,name,slug)),split_day_exercises(id,split_day_id,exercise_id,exercise_order,default_sets,default_reps,created_at,updated_at)';

// ─── Transforms ────────────────────────────────────────────────

function rawExerciseToExercise(raw: RawExercise): Exercise {
  return {
    id: raw.id,
    name: raw.name,
    isCustom: raw.is_custom,
    category: raw.category ?? null,
    primaryMuscleGroup:
      raw.exercise_muscle_groups.find(r => r.role === 'primary')?.muscle_group ?? null,
    secondaryMuscleGroups: raw.exercise_muscle_groups
      .filter(r => r.role === 'secondary')
      .map(r => r.muscle_group)
      .filter((mg): mg is MuscleGroup => mg !== null),
  };
}

function rawToSplitDay(raw: RawSplitDay): SplitDay {
  return {
    id: raw.id,
    splitId: raw.split_id,
    name: raw.name,
    dayOrder: raw.day_order,
    estimatedDurationMinutes: raw.estimated_duration_minutes,
    muscleGroups: raw.split_day_muscle_groups
      .map(r => r.muscle_group)
      .filter((mg): mg is MuscleGroup => mg !== null),
    exercises: (raw.split_day_exercises ?? [])
      .sort((a, b) => a.exercise_order - b.exercise_order)
      .map(e => ({
        id: e.id,
        splitDayId: e.split_day_id,
        exerciseId: e.exercise_id,
        exercise: e.exercise ? rawExerciseToExercise(e.exercise) : null,
        exerciseOrder: e.exercise_order,
        defaultSets: e.default_sets,
        defaultReps: e.default_reps,
      })),
  };
}

function rawToSplit(raw: RawTrainingSplit): TrainingSplit {
  return {
    id: raw.id,
    userId: raw.user_id,
    name: raw.name,
    type: raw.type as SplitType,
    workoutsPerWeek: raw.workouts_per_week,
    isActive: raw.is_active,
    days: (raw.split_days ?? [])
      .sort((a, b) => a.day_order - b.day_order)
      .map(rawToSplitDay),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─── Default days per split type ───────────────────────────────

const DEFAULT_DAYS: Record<SplitType, { name: string; order: number }[]> = {
  push_pull_legs: [
    { name: 'Push Day', order: 0 },
    { name: 'Pull Day', order: 1 },
    { name: 'Leg Day', order: 2 },
  ],
  upper_lower: [
    { name: 'Upper Day', order: 0 },
    { name: 'Lower Day', order: 1 },
  ],
  full_body: [{ name: 'Full Body Day', order: 0 }],
  custom: [],
};

// ─── Public API ────────────────────────────────────────────────

export async function getActiveSplit(userId: string): Promise<TrainingSplit | null> {
  const { data, error } = await supabase
    .from('training_splits')
    .select(`*, split_days(${DAY_WITHOUT_EXERCISES})`)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data ? rawToSplit(data as RawTrainingSplit) : null;
}

export async function getUserSplits(userId: string): Promise<TrainingSplit[]> {
  const { data, error } = await supabase
    .from('training_splits')
    .select(`*, split_days(${DAY_WITHOUT_EXERCISES})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as RawTrainingSplit[]).map(rawToSplit);
}

export async function getSplitById(splitId: string): Promise<TrainingSplit | null> {
  const { data, error } = await supabase
    .from('training_splits')
    .select(`*, split_days(${DAY_WITH_EXERCISES})`)
    .eq('id', splitId)
    .maybeSingle();

  if (error) throw error;
  return data ? rawToSplit(data as RawTrainingSplit) : null;
}

export async function createSplit(
  userId: string,
  input: CreateSplitInput
): Promise<TrainingSplit> {
  const { data: splitRow, error: e1 } = await supabase
    .from('training_splits')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      type: input.type,
      workouts_per_week: input.workoutsPerWeek,
      is_active: false,
    })
    .select('id')
    .single();

  if (e1) throw e1;
  const splitId = (splitRow as { id: string }).id;

  const defaultDays = DEFAULT_DAYS[input.type];
  if (defaultDays.length > 0) {
    const { error: e2 } = await supabase.from('split_days').insert(
      defaultDays.map(d => ({
        split_id: splitId,
        name: d.name,
        day_order: d.order,
      }))
    );
    if (e2) throw e2;
  }

  const result = await getSplitById(splitId);
  if (!result) throw new Error('Split not found after creation');
  return result;
}

export async function setActiveSplit(userId: string, splitId: string): Promise<void> {
  const { error: e1 } = await supabase
    .from('training_splits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('training_splits')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', splitId);
  if (e2) throw e2;
}

export async function updateSplit(
  splitId: string,
  updates: Partial<Pick<CreateSplitInput, 'name' | 'workoutsPerWeek'>>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.workoutsPerWeek !== undefined) patch.workouts_per_week = updates.workoutsPerWeek;

  const { error } = await supabase.from('training_splits').update(patch).eq('id', splitId);
  if (error) throw error;
}

export async function deleteSplit(splitId: string): Promise<void> {
  const { error } = await supabase.from('training_splits').delete().eq('id', splitId);
  if (error) throw error;
}

export async function addSplitDay(
  splitId: string,
  name: string,
  dayOrder: number
): Promise<SplitDay> {
  const { data, error } = await supabase
    .from('split_days')
    .insert({ split_id: splitId, name: name.trim(), day_order: dayOrder })
    .select('id,split_id,name,day_order,estimated_duration_minutes,created_at,updated_at')
    .single();

  if (error) throw error;
  const row = data as Omit<RawSplitDay, 'split_day_muscle_groups' | 'split_day_exercises'>;
  return {
    id: row.id,
    splitId: row.split_id,
    name: row.name,
    dayOrder: row.day_order,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    muscleGroups: [],
    exercises: [],
  };
}

export async function updateSplitDay(
  dayId: string,
  updates: { name?: string; estimatedDurationMinutes?: number }
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.estimatedDurationMinutes !== undefined)
    patch.estimated_duration_minutes = updates.estimatedDurationMinutes;

  const { error } = await supabase.from('split_days').update(patch).eq('id', dayId);
  if (error) throw error;
}

export async function removeSplitDay(dayId: string): Promise<void> {
  const { error } = await supabase.from('split_days').delete().eq('id', dayId);
  if (error) throw error;
}

export async function addMuscleGroupToDay(
  dayId: string,
  muscleGroupId: string
): Promise<void> {
  const { error } = await supabase
    .from('split_day_muscle_groups')
    .insert({ split_day_id: dayId, muscle_group_id: muscleGroupId });
  if (error) throw error;
}

export async function removeMuscleGroupFromDay(
  dayId: string,
  muscleGroupId: string
): Promise<void> {
  const { error } = await supabase
    .from('split_day_muscle_groups')
    .delete()
    .eq('split_day_id', dayId)
    .eq('muscle_group_id', muscleGroupId);
  if (error) throw error;
}

export async function addExerciseToDay(
  dayId: string,
  exerciseId: string,
  order: number
): Promise<SplitDayExercise> {
  const { data, error } = await supabase
    .from('split_day_exercises')
    .insert({
      split_day_id: dayId,
      exercise_id: exerciseId,
      exercise_order: order,
      default_sets: 3,
      default_reps: 10,
    })
    .select('id,split_day_id,exercise_id,exercise_order,default_sets,default_reps,created_at,updated_at')
    .single();

  if (error) throw error;
  const row = data as {
    id: string;
    split_day_id: string;
    exercise_id: string;
    exercise_order: number;
    default_sets: number;
    default_reps: number;
  };

  const exercise = await getExerciseById(exerciseId);
  return {
    id: row.id,
    splitDayId: row.split_day_id,
    exerciseId: row.exercise_id,
    exercise,
    exerciseOrder: row.exercise_order,
    defaultSets: row.default_sets,
    defaultReps: row.default_reps,
  };
}

export async function removeExerciseFromDay(splitDayExerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('split_day_exercises')
    .delete()
    .eq('id', splitDayExerciseId);
  if (error) throw error;
}
